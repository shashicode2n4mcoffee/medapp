/**
 * AIApp - Main Application
 */

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './src/redux/store';
import { StatusBar, useColorScheme, View, StyleSheet } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { Colors } from './src/theme/Colors';
import { setupInterceptors } from './src/axios';
import { APP } from './src/utils/literals/appliterals';
import { SidebarProvider } from './src/context/SidebarContext';
import { OnboardingProvider } from './src/context/OnboardingContext';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  // Initialize axios interceptors
  useEffect(() => {
    setupInterceptors();
  }, []);

  return (
    <Provider store={store}>
      <View style={styles.container}>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <OnboardingProvider>
            <SidebarProvider>
              <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor={isDarkMode ? Colors.dark : Colors.light}
              />
              <AppNavigator />
            </SidebarProvider>
          </OnboardingProvider>
        </SafeAreaProvider>
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
