import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/Colors';
import Button from '../components/Button';
import SpeechToText from '../components/SpeechToText';
import { RootStackParamList } from '../navigation/AppNavigator';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [recognizedText, setRecognizedText] = useState<string>('');
  
  const handleLogout = () => {
    navigation.replace('Login');
  };

  const handleSpeechResult = (text: string) => {
    setRecognizedText(text);
  };
  
  return (
    <SafeAreaView 
      style={[
        styles.container, 
        { backgroundColor: isDarkMode ? Colors.dark : Colors.light }
      ]}
      edges={['top', 'bottom']}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
          
          <View style={styles.speechContainer}>
            <Text style={[
              styles.sectionTitle,
              { color: isDarkMode ? Colors.textLight : Colors.textPrimary }
            ]}>
              Speech Recognition
            </Text>
            <SpeechToText 
              onSpeechResult={handleSpeechResult}
              placeholder="Tap the microphone and start speaking"
            />
            
            {recognizedText ? (
              <View style={[
                styles.transcriptContainer,
                { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
              ]}>
                <Text style={[
                  styles.transcriptTitle,
                  { color: isDarkMode ? Colors.textLight : Colors.textPrimary }
                ]}>
                  Transcript:
                </Text>
                <Text style={[
                  styles.transcriptText,
                  { color: isDarkMode ? Colors.textLight : Colors.textPrimary }
                ]}>
                  {recognizedText}
                </Text>
              </View>
            ) : null}
          </View>

          <Button
            title="Logout"
            onPress={handleLogout}
            variant="outline"
            style={styles.logoutButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  speechContainer: {
    width: '100%',
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  transcriptContainer: {
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    width: '100%',
  },
  transcriptTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  transcriptText: {
    fontSize: 16,
    lineHeight: 24,
  },
  logoutButton: {
    width: 200,
  }
});

export default HomeScreen;