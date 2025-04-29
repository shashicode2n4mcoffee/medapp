/**
 * AIApp - Main Application
 */

import React from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import {store} from './src/redux/store'; // Adjust the import path as necessary
import { StatusBar, useColorScheme, View, StyleSheet } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { Colors } from './src/theme/Colors';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <Provider store={store}>
    <View style={styles.container}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={isDarkMode ? Colors.dark : Colors.light}
        />
        <AppNavigator />
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
