import * as React from 'react';
import { List } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

const Menu: React.FC = () => {
  const navigation = useNavigation();

  return (
    <List.Section>
      <List.Subheader>MailerKit</List.Subheader>
      <List.Item
        title="Mail"
        left={() => <List.Icon icon="message" />}
        onPress={() => navigation.navigate('Mail')} // Navigue vers l'écran Home
      />
      <List.Item
        title="Campaign"
        left={() => <List.Icon icon="account" />}
        onPress={() => navigation.navigate('Campaign')} // Navigue vers l'écran Settings
      />
      <List.Item
        title="Template"
        left={() => <List.Icon icon="image" />}
        onPress={() => navigation.navigate('Template')} // Navigue vers l'écran Settings
      />
      <List.Item
        title="Configuration"
        left={() => <List.Icon icon="tools" />}
        onPress={() => navigation.navigate('Settings')} // Navigue vers l'écran Settings
      />
      <List.Item
        title="Mailbox"
        left={() => <List.Icon icon="box" />}
        onPress={() => navigation.navigate('Mailbox')} // Navigue vers l'écran Settings
      />  
    </List.Section>
  );
};

export default Menu;