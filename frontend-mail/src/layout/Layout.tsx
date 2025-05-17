import * as React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Menu from './Menu';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <View style={styles.container}>
      <View style={styles.menu}>
        <Menu />
      </View>

      <View style={styles.contentContainer}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    height: '100vh',
    overflow: 'hidden',
  },
  menu: {
    width: '11%',
    borderRightWidth: 1,
    borderColor: '#ccc',
    padding: 16,
    backgroundColor: 'white',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'white',
    overflow: 'auto',
  },
});

const globalStyles = `
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #6200ea #f5f5f5;
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f5f5f5;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #6200ea;
    border-radius: 4px;
    border: 2px solid #f5f5f5;
  }
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = globalStyles;
  document.head.appendChild(style);
}

export default Layout;