import React from 'react';
import { View, Text, StyleSheet, Modal, Image, ActivityIndicator } from 'react-native';
import { Colors } from '../theme/Colors';

const transcriptLoadingIcon = require('../assets/transcript-loading.png');

interface TranscriptLoadingModalProps {
  visible: boolean;
  onRequestClose: () => void;
}

const TranscriptLoadingModal: React.FC<TranscriptLoadingModalProps> = ({
  visible,
  onRequestClose,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.robotCircle}>
            <Image 
              source={transcriptLoadingIcon}
              style={styles.robotImage}
              resizeMode="contain"
            />
          </View>
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loadingSpinner} />
          <Text style={styles.modalTitle}>Hurray!</Text>
          <Text style={styles.modalText}>
            Your recording has been successfully ended. Please wait for 30-40 secs to generate transcript
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    width: '80%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  robotCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(144, 238, 144, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#3CB371', 
  },
  robotImage: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
  },
  loadingSpinner: {
    marginVertical: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
});

export default TranscriptLoadingModal;