/**
 * AIApp - Main Application
 */

import React from 'react';
import { StatusBar, useColorScheme, View, StyleSheet } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { Colors } from './src/theme/Colors';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <View style={styles.container}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={isDarkMode ? Colors.dark : Colors.light}
        />
        <AppNavigator />
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
