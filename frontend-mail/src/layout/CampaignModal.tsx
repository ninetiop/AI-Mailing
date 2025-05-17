import React from 'react';
import { View, ScrollView, Text, StyleSheet, Platform, TextInput as RNTextInput } from 'react-native';
import { Button, Dialog, Portal, TextInput, Snackbar, IconButton } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import { Campaign } from '../page/CampaignMail';

interface EmailListModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (name: string, emails: string[]) => void;
  selectedItem?: Campaign;
}

const CampaignItemModal: React.FC<EmailListModalProps> = ({ 
  visible, 
  onDismiss, 
  onSave, 
  selectedItem 
}) => {
  const [name, setName] = React.useState(selectedItem?.name || '');
  const [emailText, setEmailText] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState({ total: 0, unique: 0, duplicates: 0 });

  React.useEffect(() => {
    if (selectedItem) {
      setName(selectedItem.name || '');
      
      // Handle emails from selected item
      const emails = selectedItem.emails || [];
      const emailList = emails.map(email => 
        // Handle both string and object formats
        typeof email === 'object' ? email.email : email
      );
      
      const emailText = emailList.length > 0 
        ? emailList.join('\n')
        : '';
      
      handleEmailTextUpdate(emailText);
    } else {
      setName('');
      setEmailText('');
      setStats({ total: 0, unique: 0, duplicates: 0 });
    }
  }, [selectedItem]);

  // Function to handle email text updates and filtering
  const handleEmailTextUpdate = (text: string) => {
    // Split by common separators (newline, comma, semicolon)
    const allEmails = text
      .split(/[\n,;]+/)
      .map(e => e.trim().toLowerCase()) // Normalize emails
      .filter(e => e.length > 0); // Remove empty entries

    // Get unique emails while preserving order
    const uniqueEmails = Array.from(new Set(allEmails));

    // Calculate stats
    const newStats = {
      total: allEmails.length,
      unique: uniqueEmails.length,
      duplicates: allEmails.length - uniqueEmails.length
    };

    // Update state with unique emails
    setEmailText(uniqueEmails.join('\n'));
    setStats(newStats);
  };

  const handleUpload = async () => {
    try {
      if (Platform.OS === 'web') {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.txt,.csv';

        fileInput.onchange = async (event: Event) => {
          const target = event.target as HTMLInputElement;
          const file = target.files?.[0];
          if (file) {
            const text = await file.text();
            handleEmailTextUpdate(text);
            setError(null);
          }
        };

        fileInput.click();
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'text/plain',
          copyToCacheDirectory: true,
        });

        if (result.type === 'success' && result.uri) {
          const response = await fetch(result.uri);
          const text = await response.text();
          handleEmailTextUpdate(text);
          setError(null);
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file');
    }
  };

  const handleClearEmails = () => {
    setEmailText('');
    setStats({ total: 0, unique: 0, duplicates: 0 });
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('List name is required');
      return;
    }

    const emails = emailText
      .split('\n')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    if (emails.length === 0) {
      setError('At least one email is required');
      return;
    }

    const invalidEmails = emails.filter(
      e => !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(e)
    );

    if (invalidEmails.length > 0) {
      setError(`Invalid emails: ${invalidEmails.join(', ')}`);
      return;
    }

    onSave(name, emails);
  };

  return (
    <Portal>
      <Dialog 
        visible={visible} 
        onDismiss={onDismiss} 
        style={styles.dialog}
      >
        <Dialog.Title>
          {selectedItem?.id ? 'Edit Target List' : 'New Target List'}
        </Dialog.Title>
        
        <Dialog.Content>
          {error && (
            <Snackbar 
              visible={!!error} 
              onDismiss={() => setError(null)}
              style={styles.snackbar}
            >
              {error}
            </Snackbar>
          )}

          <TextInput
            label="List Name"
            mode="outlined"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <View style={styles.emailBox}>
            <View style={styles.emailHeader}>
              <View style={styles.statsContainer}>
                <Text style={styles.emailCount}>
                  Unique Emails: {stats.unique}
                </Text>
                {stats.duplicates > 0 && (
                  <Text style={styles.duplicateCount}>
                    ({stats.duplicates} duplicates removed)
                  </Text>
                )}
              </View>
              {emailText ? (
                <IconButton 
                  icon="delete" 
                  onPress={handleClearEmails} 
                  size={20}
                />
              ) : null}
            </View>

            <RNTextInput
              style={styles.emailTextInput}
              multiline
              numberOfLines={8}
              value={emailText}
              onChangeText={handleEmailTextUpdate}
              placeholder="Enter email addresses (one per line, comma, or semicolon separated)"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textAlignVertical="top"
            />
          </View>

          <Button 
            mode="outlined" 
            onPress={handleUpload}
            icon="upload"
            style={styles.uploadButton}
          >
            Import from File
          </Button>
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={handleSave} mode="contained">
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    width: Platform.OS === 'web' ? '50%' : '90%',
    alignSelf: 'center',
    maxHeight: '80%',
  },
  input: {
    marginBottom: 16,
  },
  emailBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
  },
  emailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emailCount: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  duplicateCount: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  emailTextInput: {
    minHeight: 150,
    fontSize: 14,
    padding: 4,
  },
  uploadButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  snackbar: {
    marginBottom: 16,
  },
});

export default CampaignItemModal;