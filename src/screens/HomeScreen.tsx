import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/Colors';
import Button from '../components/Button';
import { RootStackParamList } from '../navigation/AppNavigator';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const isDarkMode = useColorScheme() === 'dark';
  
  const handleLogout = () => {
    navigation.replace('Login');
  };
  
  return (
    <SafeAreaView 
      style={[
        styles.container, 
        { backgroundColor: isDarkMode ? Colors.dark : Colors.light }
      ]}
      edges={['top', 'bottom']}
    >
      <View style={styles.content}>
        <Text style={[
          styles.title,
          { color: isDarkMode ? Colors.textLight : Colors.textPrimary }
        ]}>
          Welcome to AIApp
        </Text>
        <Text style={[
          styles.subtitle,
          { color: isDarkMode ? Colors.gray : Colors.textSecondary }
        ]}>
          You are now logged in
        </Text>
        
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  logoutButton: {
    width: 200,
  }
});

export default HomeScreen;