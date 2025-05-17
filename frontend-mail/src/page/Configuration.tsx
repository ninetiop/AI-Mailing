import React, { useContext, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, Checkbox, ActivityIndicator, DefaultTheme, SegmentedButtons } from 'react-native-paper';
import Layout from '../layout/Layout';
import { SmtpContext } from '../context/SmtpContext';
import { showToastError, showToastSuccess } from '../ToastMessage';

// Common email provider configurations
const EMAIL_PROVIDERS = {
  gmail: {
    name: 'Gmail',
    smtpServer: 'smtp.gmail.com',
    smtpPort: '587',
    imapServer: 'imap.gmail.com',
    imapPort: '993',
    requiresTLS: true
  },
  outlook: {
    name: 'Outlook',
    smtpServer: 'smtp.office365.com',
    smtpPort: '587',
    imapServer: 'outlook.office365.com',
    imapPort: '993',
    requiresTLS: true
  },
  yahoo: {
    name: 'Yahoo',
    smtpServer: 'smtp.mail.yahoo.com',
    smtpPort: '587',
    imapServer: 'imap.mail.yahoo.com',
    imapPort: '993',
    requiresTLS: true
  },
  custom: {
    name: 'Custom',
    smtpServer: '',
    smtpPort: '',
    imapServer: '',
    imapPort: '',
    requiresTLS: true
  }
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflowY: 'auto',
  },
  container: {
    padding: 16,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingBottom: 40,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: '100%',
    marginBottom: 16,
    gap: 30,
  },
  configGroup: {
    width: '30%',
    padding: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  configTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#444',
    borderBottomWidth: 2,
    borderBottomColor: '#6200ea',
    paddingBottom: 10,
  },
  input: {
    width: '100%',
    marginBottom: 20,
    backgroundColor: 'white',
    height: 50,
  },
  animating: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    height: 50,
  },
  providerSelector: {
    width: '30%',
    marginBottom: 24,
  },
  button: {
    marginHorizontal: 8,
  },
});

const SettingsScreen: React.FC = () => {
  const smtpContext = useContext(SmtpContext);
  const [animating, setAnimating] = useState(false);
  const [provider, setProvider] = useState('custom');

  if (!smtpContext) return null;

  const { 
    smtpServer, smtpPort, user, password, isTLS, 
    imapServer, imapPort, useImapTLS,
    updateSettings 
  } = smtpContext;

  const handleProviderChange = (value: string) => {
    setProvider(value);
    const config = EMAIL_PROVIDERS[value];
    if (config && value !== 'custom') {
      updateSettings({
        smtpServer: config.smtpServer,
        smtpPort: config.smtpPort,
        imapServer: config.imapServer,
        imapPort: config.imapPort,
        isTLS: config.requiresTLS,
        useImapTLS: config.requiresTLS
      });
    }
  };

  // ✅ Fonction testSMTPConnection définie ici (et PAS dans le contexte)
  const testSMTPConnection = async (): Promise<void> => {
    const smtpConfig = {
      smtp_server: smtpServer,         // Correspond à smtp_server dans le serializer Django
      smtp_port: parseInt(smtpPort, 10), // Correspond à smtp_port dans le serializer Django
      is_tls: isTLS,                   // Correspond à is_tls dans le serializer Django
      smtp_user: user,                 // Correspond à smtp_user dans le serializer Django
      smtp_passwd: password,           // Correspond à smtp_passwd dans le serializer Django
    };

    try {
      setAnimating(true);
      const response = await fetch('http://localhost:8000/mail/testsmtp/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(smtpConfig),
      });
      const result = await response.json();
      console.log(result);
      if (response.ok) {
        showToastSuccess("SMTP connection succeeded");
      } else {
        showToastError("Bad request: " + (result?.reason || "Unknown error"));
      }
    } catch (error) {
      showToastError("Request to API failed");
    }
    setAnimating(false);
  };

  const testImapConnection = async (): Promise<void> => {
    const imapConfig = {
      imap_server: imapServer,
      imap_port: parseInt(imapPort, 10),
      is_tls: useImapTLS,
      username: user,         // Using the same credentials as SMTP
      password: password
    };

    try {
      setAnimating(true);
      const response = await fetch('http://localhost:8000/mail/testimap/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(imapConfig),
      });
      const result = await response.json();
      if (response.ok) {
        showToastSuccess("IMAP connection succeeded");
      } else {
        showToastError("Bad request: " + (result?.reason || "Unknown error"));
      }
    } catch (error) {
      showToastError("Request to API failed");
    } finally {
      setAnimating(false);
    }
  };

  return (
    <Layout>
      <View style={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.sectionTitle}>Email Provider</Text>
          <SegmentedButtons
            value={provider}
            onValueChange={handleProviderChange}
            buttons={Object.entries(EMAIL_PROVIDERS).map(([key, value]) => ({
              value: key,
              label: value.name
            }))}
            style={styles.providerSelector}
          />

          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.configRow}>
            <View style={styles.configGroup}>
              <Text style={styles.configTitle}>Account Settings</Text>
              <TextInput
                mode="outlined"
                label="Email Address"
                value={user}
                onChangeText={(text) => updateSettings({ user: text })}
                style={styles.input}
              />
              <TextInput
                mode="outlined"
                label="Password"
                value={password}
                secureTextEntry
                onChangeText={(text) => updateSettings({ password: text })}
                style={styles.input}
              />
            </View>

            <View style={styles.configGroup}>
              <Text style={styles.configTitle}>SMTP Settings</Text>
              <TextInput
                mode="outlined"
                label="SMTP Server"
                value={smtpServer}
                onChangeText={(text) => updateSettings({ smtpServer: text })}
                style={styles.input}
              />
              <TextInput
                mode="outlined"
                label="SMTP Port"
                value={smtpPort}
                onChangeText={(text) => updateSettings({ smtpPort: text })}
                style={styles.input}
              />
              <View style={styles.checkboxContainer}>
                <Text>Use TLS</Text>
                <Checkbox
                  status={isTLS ? 'checked' : 'unchecked'}
                  onPress={() => updateSettings({ isTLS: !isTLS })}
                />
              </View>
            </View>

            <View style={styles.configGroup}>
              <Text style={styles.configTitle}>IMAP Settings</Text>
              <TextInput
                mode="outlined"
                label="IMAP Server"
                value={imapServer}
                onChangeText={(text) => updateSettings({ imapServer: text })}
                style={styles.input}
              />
              <TextInput
                mode="outlined"
                label="IMAP Port"
                value={imapPort}
                onChangeText={(text) => updateSettings({ imapPort: text })}
                style={styles.input}
              />
              <View style={styles.checkboxContainer}>
                <Text>Use TLS</Text>
                <Checkbox
                  status={useImapTLS ? 'checked' : 'unchecked'}
                  onPress={() => updateSettings({ useImapTLS: !useImapTLS })}
                />
              </View>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button icon="email-send" mode="contained" onPress={testSMTPConnection} style={styles.button}>
              Test SMTP Connection
            </Button>
            <Button icon="email-receive" mode="contained" onPress={testImapConnection} style={styles.button}>
              Test IMAP Connection
            </Button>
          </View>

          <ActivityIndicator 
            style={styles.animating}
            animating={animating}
            color={DefaultTheme.colors.primary}
          />
        </View>
      </View>
    </Layout>
  );
};


// Ajoute les styles au document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  
  document.head.appendChild(style);
}

export default SettingsScreen;
