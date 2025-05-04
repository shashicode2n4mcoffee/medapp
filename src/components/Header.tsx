import React from 'react';
import { View, Image, StyleSheet, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/Colors';

const Header = () => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.backgroundLight} />
      <View style={styles.container}>
        <Image 
          source={require('../assets/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.backgroundLight,
  },
  container: {
    height: 56,
    backgroundColor: Colors.backgroundLight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'flex-start'
  },
  logo: {
    width: 100,
    height: 24,
  }
});

export default Header;