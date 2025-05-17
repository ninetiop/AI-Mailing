import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  Platform,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMsal } from '@azure/msal-react';  // Pour le web
import { authorize } from 'react-native-app-auth';  // Pour mobile (Android/iOS)
import { mobileAuthConfig } from './authConfig';  // Configuration d'auth pour mobile
import { useAuthProvider } from '../auth/AuthProvider';

const Auth222: React.FC = () => {
  const navigation = useNavigation<any>();
  const { instance } = useMsal();  // Utilisation de MSAL pour web
  const { setIsAuthenticated } = useAuthProvider();
  const [checkingLogin, setCheckingLogin] = useState(true);
  const [activeAccount, setActiveAccount] = useState<any>(null);

  useEffect(() => {
    const checkLogin = async () => {
      if (Platform.OS === 'web') {
        // Vérifie la connexion avec MSAL.js sur le Web
        const account = instance?.getActiveAccount();
        if (account) {
          setActiveAccount(account);
        } else {
          // Gère la redirection après login sur le web
          const result = await instance.handleRedirectPromise();
          if (result && result.account) {
            instance.setActiveAccount(result.account);
            setActiveAccount(result.account);
            setIsAuthenticated(true); // ← C'est cette ligne qui va débloquer tout
          }
        }
        setCheckingLogin(false);
      } else {
        // Sur mobile, on suppose qu'on ne vérifie pas le login ici
        setCheckingLogin(false);  // On pourrait ajouter un stockage persistant pour mobile
      }
    };

    checkLogin();
  }, [instance, navigation]);

  const handleLogin = () => {
    if (Platform.OS === 'web') {
      // Sur le Web, on utilise MSAL pour la connexion
      instance.loginRedirect({
        scopes: ['openid', 'profile', 'User.Read'],
        prompt: 'select_account',
      }).catch((error) => {
        console.error('Erreur de connexion (Web):', error);
        alert("Erreur de connexion. Veuillez réessayer.");
      });
    } else {
      // Sur mobile, on utilise react-native-app-auth pour la connexion
      authorize(mobileAuthConfig)
        .then((result) => {
          setActiveAccount(result);
          // Navigation vers la page principale après la connexion réussie
          navigation.replace('Mail');  // Assurez-vous que 'Mail' est bien défini dans votre stack
        })
        .catch((error) => {
          console.error('Erreur de connexion (Mobile):', error);
          alert("Erreur de connexion mobile.");
        });
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // Sur le Web, se déconnecter avec MSAL.js
      instance.logoutRedirect({
        postLogoutRedirectUri: '/',  // Redirection après déconnexion
      });
    } else {
      // Sur mobile, réinitialiser l'état
      setActiveAccount(null);
      alert("Déconnecté (mobile)");
    }
  };

  if (checkingLogin) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>AI Mailer</Text>
        <Text style={styles.welcomeText}>Welcome to Mail</Text>

        <TouchableOpacity 
          style={styles.googleButton} 
          onPress={handleLogin}
        >
          <Text style={styles.googleButtonText}>Continue with Microsoft</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.divider} />
        </View>

        <TextInput
          style={styles.input}
          placeholder="EMAIL"
          placeholderTextColor="#333"
        />

        <TouchableOpacity 
          style={styles.emailButton} 
          onPress={handleLogin}
        >
          <Text style={styles.emailButtonText}>Continue with email</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: Platform.OS === 'web' ? 400 : '100%',
    maxWidth: 400,
  },
  header: {
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 24,
    marginBottom: 32,
    textAlign: 'center',
  },
  googleButton: {
    width: '100%',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  googleButtonText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
  input: {
    width: '100%',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    marginBottom: 16,
    fontSize: 15,
  },
  emailButton: {
    width: '100%',
    padding: 12,
    borderRadius: 6,
    backgroundColor: '#000',
  },
  emailButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
});

export default Auth222;
