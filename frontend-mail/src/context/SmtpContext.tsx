import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Updated interface to include IMAP settings
interface SmtpContextProps {
  // Existing SMTP settings
  smtpServer: string;
  smtpPort: string;
  user: string;
  password: string;
  isTLS: boolean;
  // New IMAP settings
  imapServer: string;
  imapPort: string;
  useImapTLS: boolean;
  updateSettings: (newSettings: Partial<SmtpContextProps>) => void;
}

// Création du contexte
export const SmtpContext = createContext<SmtpContextProps | null>(null);

// Provider du contexte
export const SmtpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Existing SMTP states
  const [smtpServer, setSmtpServer] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [isTLS, setIsTLS] = useState(true);
  
  // New IMAP states
  const [imapServer, setImapServer] = useState('');
  const [imapPort, setImapPort] = useState('');
  const [useImapTLS, setUseImapTLS] = useState(true);

  // ✅ Charger les paramètres au démarrage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load existing SMTP settings
        const storedServer = await AsyncStorage.getItem('smtpServer');
        const storedPort = await AsyncStorage.getItem('smtpPort');
        const storedUser = await AsyncStorage.getItem('user');
        const storedPassword = await AsyncStorage.getItem('password');
        const storedTLS = await AsyncStorage.getItem('isTLS');

        // Load IMAP settings
        const storedImapServer = await AsyncStorage.getItem('imapServer');
        const storedImapPort = await AsyncStorage.getItem('imapPort');
        const storedImapTLS = await AsyncStorage.getItem('useImapTLS');

        // Set SMTP states
        if (storedServer) setSmtpServer(storedServer);
        if (storedPort) setSmtpPort(storedPort);
        if (storedUser) setUser(storedUser);
        if (storedPassword) setPassword(storedPassword);
        if (storedTLS !== null) setIsTLS(storedTLS === 'true');

        // Set IMAP states
        if (storedImapServer) setImapServer(storedImapServer);
        if (storedImapPort) setImapPort(storedImapPort);
        if (storedImapTLS !== null) setUseImapTLS(storedImapTLS === 'true');
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
      }
    };

    loadSettings();
  }, []);

  // ✅ Sauvegarder les paramètres dans AsyncStorage
  const updateSettings = async (newSettings: Partial<SmtpContextProps>) => {
    try {
      // Update SMTP settings
      if (newSettings.smtpServer !== undefined) {
        setSmtpServer(newSettings.smtpServer);
        await AsyncStorage.setItem('smtpServer', newSettings.smtpServer);
      }
      if (newSettings.smtpPort !== undefined) {
        setSmtpPort(newSettings.smtpPort);
        await AsyncStorage.setItem('smtpPort', newSettings.smtpPort);
      }
      if (newSettings.user !== undefined) {
        setUser(newSettings.user);
        await AsyncStorage.setItem('user', newSettings.user);
      }
      if (newSettings.password !== undefined) {
        setPassword(newSettings.password);
        await AsyncStorage.setItem('password', newSettings.password);
      }
      if (newSettings.isTLS !== undefined) {
        setIsTLS(newSettings.isTLS);
        await AsyncStorage.setItem('isTLS', newSettings.isTLS.toString());
      }

      // Update IMAP settings
      if (newSettings.imapServer !== undefined) {
        setImapServer(newSettings.imapServer);
        await AsyncStorage.setItem('imapServer', newSettings.imapServer);
      }
      if (newSettings.imapPort !== undefined) {
        setImapPort(newSettings.imapPort);
        await AsyncStorage.setItem('imapPort', newSettings.imapPort);
      }
      if (newSettings.useImapTLS !== undefined) {
        setUseImapTLS(newSettings.useImapTLS);
        await AsyncStorage.setItem('useImapTLS', newSettings.useImapTLS.toString());
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  return (
    <SmtpContext.Provider value={{ 
      smtpServer, 
      smtpPort, 
      user, 
      password, 
      isTLS,
      imapServer,
      imapPort,
      useImapTLS, 
      updateSettings 
    }}>
      {children}
    </SmtpContext.Provider>
  );
};
