import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Platform } from 'react-native';
import { MsalProvider, useMsal } from '@azure/msal-react';
import { PublicClientApplication, EventType, AuthenticationResult } from '@azure/msal-browser';
import { msalWebConfig, mobileAuthConfig } from '../page/authConfig';

const config = Platform.OS === 'web' ? msalWebConfig : mobileAuthConfig;

// Après :
const AuthContext = createContext<{
  isAuthenticated: boolean | null;
  setIsAuthenticated: (value: boolean) => void;
}>({
  isAuthenticated: null,
  setIsAuthenticated: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | undefined>(undefined);

  useEffect(() => {
    const initializeMsal = async () => {
      if (Platform.OS === 'web') {
        const instance = new PublicClientApplication(config);
        setMsalInstance(instance);  // Enregistrez l'instance après l'initialisation

        try {
          // Attend l'initialisation et la récupération des comptes
          await instance.initialize();

          // Gère le cas où un compte est déjà connecté
          const accounts = instance.getAllAccounts();
          if (accounts.length > 0) {
            instance.setActiveAccount(accounts[0]);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }

          // Écoute les événements de login
          const callbackId = instance.addEventCallback((event) => {
            const payload = event.payload as AuthenticationResult;
            if (event.eventType === EventType.LOGIN_SUCCESS && payload?.account) {
              instance.setActiveAccount(payload.account);
              setIsAuthenticated(true);
            }
          });

          // Gère le redirect, si nécessaire
          const res = await instance.handleRedirectPromise();
          if (res && res.account) {
            instance.setActiveAccount(res.account);
            setIsAuthenticated(true);
          }

          return () => {
            if (callbackId) instance.removeEventCallback(callbackId);
          };
        } catch (error) {
          console.error('Erreur lors de l\'initialisation de MSAL', error);
        }
      } else {
        setIsAuthenticated(false);  // Pour mobile, on suppose pas connecté
      }
    };

    initializeMsal();
  }, []);

  // Attendez que msalInstance soit défini avant de rendre MsalProvider
  if (!msalInstance) {
    return <div>Loading...</div>; // Affichez un loader ou un état par défaut
  }

  return (
    <MsalProvider instance={msalInstance}>
      <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
        {children}
      </AuthContext.Provider>
    </MsalProvider>
  );
};

export const useAuthProvider = () => useContext(AuthContext);
