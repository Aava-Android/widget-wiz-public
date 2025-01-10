import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import useCPIN from '../testlogic/useCPIN'; // Import the custom hook

const CPINScreen = () => {
  const { logCPINData } = useCPIN(); // Access the hook's function
  const [isLoading, setIsLoading] = useState(false); // State to handle loading indicator
  const [logMessage, setLogMessage] = useState(''); // State to display status messages

  // Function to handle the CPIN process
  const handleCPIN = async () => {
    setIsLoading(true);
    setLogMessage('Starting CPIN process...');
    try {
      await logCPINData();
      setLogMessage('CPIN process completed successfully. Check logs for details.');
      Alert.alert('Success', 'CPIN process completed. Logs have been updated.');
    } catch (error) {
      setLogMessage(`CPIN process failed: ${error.message}`);
      Alert.alert('Error', 'CPIN process failed. Check output or logs for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CPIN Query</Text>

      <TouchableOpacity
        style={[styles.button, isLoading ? styles.disabledButton : {}]}
        onPress={handleCPIN}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>{isLoading ? 'Processing...' : 'Run CPIN Query'}</Text>
      </TouchableOpacity>

      {isLoading && <ActivityIndicator size="large" color="#0078D7" style={styles.spinner} />}

      <Text style={styles.log}>{logMessage}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#0078D7',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 20,
    width: '80%',
  },
  disabledButton: {
    backgroundColor: '#aaa',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  spinner: {
    marginVertical: 20,
  },
  log: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: '#555',
  },
});

export default CPINScreen;
