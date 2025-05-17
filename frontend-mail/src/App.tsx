// App.tsx
import React from 'react';
import { PaperProvider, DefaultTheme } from 'react-native-paper';
import { AuthProvider } from './auth/AuthProvider';
import { SmtpProvider } from './context/SmtpContext';
import Route from './Route';
import Toast from 'react-native-toast-message';
import { View, StyleSheet } from 'react-native';

const customTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ea',
    background: '#f5f5f5',
  },
};

const App = () => {
  return (
    <View style={styles.root}>
      <PaperProvider theme={customTheme}>
        <AuthProvider>
          <SmtpProvider>
            <Route />
            <Toast />
          </SmtpProvider>
        </AuthProvider>
      </PaperProvider>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    height: '100vh',
  },
});

export default App;
