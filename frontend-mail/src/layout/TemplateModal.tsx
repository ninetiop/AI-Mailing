import * as React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { TextInput, Button, Dialog, Portal, Snackbar } from 'react-native-paper';
import { ItemTemplate } from '../page/Template';
import ReactQuill from 'react-quill'; // For web
import 'react-quill/dist/quill.snow.css'; // Import Quill styles

interface TemplateLayoutProps {
  template: ItemTemplate;
  visible: boolean;
  onDismiss: () => void;
  onSave: (updatedItem: ItemTemplate) => void;
}

const TemplateItemModal: React.FC<TemplateLayoutProps> = ({ template, visible, onDismiss, onSave }) => {
  const [id, setId] = React.useState(template.id);
  const [date, setDate] = React.useState(template.date_ts);
  const [template_name, setTemplateName] = React.useState(template.template_name);
  const [sender, setSender] = React.useState(template.sender);
  const [subject, setSubject] = React.useState(template.subject);
  const [from_email, setFrom] = React.useState(template.from_email);
  const [body, setBody] = React.useState(template.body);
  const [error, setError] = React.useState<string | null>(null);

  // Rich text editor modules configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  const validateForm = (): boolean => {
    if (!template_name || !subject || !sender) {
      setError('Name, Sender, and Subject are required fields.');
      return false;
    }
    
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (from_email && !emailRegex.test(from_email)) {
      setError('Please enter a valid email address.');
      return false;
    }

    setError(null);
    return true;
  };

  const handleSave = () => {
    if (validateForm()) {
      const date_ts = '';
      const updatedItem: ItemTemplate = { id, template_name, date_ts, sender, subject, from_email, body };
      onSave(updatedItem);
      onDismiss();
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>Edit Template</Dialog.Title>
        <Dialog.Content>
          {error && (
            <Snackbar visible={true} onDismiss={() => setError(null)}>
              {error}
            </Snackbar>
          )}
          
          <View style={styles.row}>
            <View style={styles.column}>
              <TextInput
                mode="outlined"
                label="Template name"
                placeholder="MyNewAwesomeTemplate"
                value={template_name}
                onChangeText={setTemplateName}
                style={styles.input}
              />
              <TextInput
                mode="outlined"
                label="Sender"
                placeholder="John Wine"
                value={sender}
                onChangeText={setSender}
                style={styles.input}
              />
            </View>
            <View style={styles.column}>
              <TextInput
                mode="outlined"
                label="From (optional)"
                placeholder="spoofmail@example.com"
                value={from_email}
                onChangeText={setFrom}
                style={styles.input}
              />
              <TextInput
                mode="outlined"
                label="Subject"
                placeholder="New event: BBQ in my garden!"
                value={subject}
                onChangeText={setSubject}
                style={styles.input}
              />
            </View>
          </View>

          {Platform.OS === 'web' ? (
            <ReactQuill
              theme="snow"
              value={body}
              onChange={setBody}
              modules={modules}
              style={styles.editor}
            />
          ) : (
            <TextInput
              mode="outlined"
              label="Message Body"
              placeholder="Enter message body here..."
              value={body}
              onChangeText={setBody}
              multiline
              numberOfLines={10}
              style={styles.mobileEditor}
            />
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button mode="contained" onPress={handleSave}>Save</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    width: Platform.OS === 'web' ? '80%' : '90%',
    alignSelf: 'center',
    maxWidth: 1000,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  column: {
    flex: 1,
  },
  input: {
    marginBottom: 12,
  },
  editor: {
    height: 300,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  mobileEditor: {
    height: 200,
    marginBottom: 16,
  },
});

export default TemplateItemModal;
