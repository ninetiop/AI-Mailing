import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, TextInput, ActivityIndicator, DefaultTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SmtpContext } from '../context/SmtpContext';
import { showToastError, showToastSuccess } from '../ToastMessage';
import Layout from '../layout/Layout';

const MailScreen: React.FC = () => {
  const [animating, setAnimating] = React.useState(false);
  const smtpContext = React.useContext(SmtpContext);
  if (!smtpContext) return <Text>Chargement...</Text>;
  const { smtpServer, smtpPort, user, password, isTLS } = smtpContext;

  const [recipient, setRecipient] = React.useState<string>('');
  const [sender, setSender] = React.useState<string>('');
  const [subject, setSubject] = React.useState<string>('');
  const [body, setBody] = React.useState<string>('');
  const [from, setFrom] = React.useState<string>(''); // Champ optionnel "From"

  // Charger les paramètres au montage
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSender = await AsyncStorage.getItem('sender');
        const storedRecipient = await AsyncStorage.getItem('recipient');
        const storedSubject = await AsyncStorage.getItem('subject');
        const storedBody = await AsyncStorage.getItem('body');
        const storedFrom = await AsyncStorage.getItem('from');  // Récupère la valeur de "from"
        
        if (storedSender) setSender(storedSender);
        if (storedRecipient) setRecipient(storedRecipient);
        if (storedSubject) setSubject(storedSubject);
        if (storedBody) setBody(storedBody);
        if (storedFrom) setFrom(storedFrom);  // Charge la valeur de "from"
      } catch (error) {
        console.error("Erreur lors du chargement des paramètres:", error);
      }
    };

    loadSettings();
  }, []);

  // Sauvegarder les paramètres
  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('sender', sender);
      await AsyncStorage.setItem('recipient', recipient);
      await AsyncStorage.setItem('subject', subject);
      await AsyncStorage.setItem('body', body);
      await AsyncStorage.setItem('from', from);  // Sauvegarder la valeur de "from"
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  // Validation des champs et affichage des Toasts pour les erreurs
  const validateForm = (): boolean => {
    if (!recipient) {
      showToastError('Recipient is required');
      return false;
    }
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(recipient)) {
      showToastError('Invalid email address');
      return false;
    }
    if (!subject) {
      showToastError('Subject is required');
      return false;
    }
    if (!body) {
      showToastError('Body is required');
      return false;
    }
    return true;
  };

  // Fonction d'envoi de l'email
  const sendMail = async (): Promise<void> => {
    setAnimating(true);
    if (validateForm())
    { // Si la validation échoue, ne pas envoyer le mail
      setAnimating(true);
      const mail = {
        smtp_auth: {
          smtp_server: smtpServer,
          smtp_port: parseInt(smtpPort, 10),
          is_tls: isTLS,
          smtp_user: user,
          smtp_passwd: password
        },
        recipient: recipient,
        sender: sender,
        subject: subject,
        body: body
      };
      try {
        const response = await fetch('http://localhost:8000/mail/send/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mail),
        });

        const result = await response.json();
        if (response.ok) {
          showToastSuccess('Mail sent successfully');
        } else {
          showToastError('Bad request: ' + result.detail.reason);
        }
      } catch (error) {
        showToastError('Request to API failed');
      }
      setAnimating(false);
    }
  };

  return (
    <Layout>
      <View style={styles.container}>
        <TextInput
          mode="outlined"
          label="Sender"
          placeholder="John Wine"
          value={sender}
          onChangeText={(text) => {
            setSender(text);
            saveSettings();
          }}
          style={styles.input}
        />
        
        <TextInput
          mode="outlined"
          label="From (optional)"
          placeholder="spoofmail@example.com"
          value={from}
          onChangeText={(text) => {
            setFrom(text);
            saveSettings();
          }}
          style={ styles.input }
        />

        <TextInput
          mode="outlined"
          label="Recipient"
          placeholder="johnwine@xample.com"
          value={recipient}
          onChangeText={(text) => {
            setRecipient(text);
            saveSettings();
          }}
          keyboardType="email-address"
          style={ styles.input }
        />

        <TextInput
          mode="outlined"
          label="Subject"
          placeholder="New event: BBQ in my garden !"
          value={subject}
          onChangeText={(text) => {
            setSubject(text);
            saveSettings();
          }}
          style={ styles.input }
        />

        <TextInput
          mode="outlined"
          label=""
          placeholder="Enter message body here..."
          value={body}
          onChangeText={(text) => {
            setBody(text);
            saveSettings();
          }}
          secureTextEntry={false}
          multiline={true}
          numberOfLines={10}
          style={styles.input}
        />

        <Button icon="message" mode="contained" onPress={sendMail}>
          Send mail
        </Button>
        <ActivityIndicator 
          style={styles.animating}
          animating={animating}
          color={DefaultTheme.colors.primary}
        />
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,                  // Utilise toute la hauteur disponible
    justifyContent: 'center', // Centre verticalement
    alignItems: 'center',     // Centre horizontalement
  },
  input: {
    width: '30%',             // Largeur à 80% de l'écran
    marginBottom: 16,         // Espacement entre les éléments
  },
  animating: {
    marginTop: 16
  }
});


export default MailScreen;