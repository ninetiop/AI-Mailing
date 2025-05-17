import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { View, StyleSheet } from "react-native";
import MailScreen from "./page/Mail";
import TemplateScreen from "./page/Template";
import SettingsScreen from "./page/Configuration";
import CampaignMailScreen from "./page/CampaignMail";
import Auth222 from "./page/Auth2.0Azure";
import { ActivityIndicator } from "react-native";
import { useAuthProvider } from "./auth/AuthProvider";
import MailboxScreen from "./page/Mailbox";

const Stack = createStackNavigator();

const Route: React.FC = () => {
  const { isAuthenticated } = useAuthProvider();

  if (isAuthenticated === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NavigationContainer>
        {isAuthenticated ? (
          <Stack.Navigator initialRouteName="Campaign">
            <Stack.Screen name="Mail" component={MailScreen} options={{ title: "Mail" }} />
            <Stack.Screen name="Template" component={TemplateScreen} options={{ title: "Template" }} />
            <Stack.Screen name="Campaign" component={CampaignMailScreen} options={{ title: "Campaign" }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
            <Stack.Screen name="Mailbox" component={MailboxScreen} options={{ title: "Mailbox" }} />
          </Stack.Navigator>
        ) : (
          <Stack.Navigator initialRouteName="Authentification2">
            <Stack.Screen name="Authentification2" component={Auth222} options={{ title: "Authentification2" }} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Route;
