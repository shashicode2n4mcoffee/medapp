import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import TranscribeScreen from '../screens/TranscribeScreen';
import AppointmentScreen from '../screens/AppointmentScreen';
import Header from '../components/Header';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  ForgotPassword: undefined;
  Transcribe: undefined;
  Appointments: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ForgotPassword" 
          component={ForgotPasswordScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ header: () => <Header /> }}
        />
        <Stack.Screen 
          name="Transcribe" 
          component={TranscribeScreen}
          options={{ header: () => <Header /> }} 
        />
        <Stack.Screen 
          name="Appointments" 
          component={AppointmentScreen}
          options={{ header: () => <Header /> }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;