import React from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import useNFCTest from '../testlogic/useNFCTest';

function NfcScreen() {
  const { startNFCTest, outputMessage, isRunning } = useNFCTest();

  return (
    <View style={styles.container}>
      <Text>Welcome to the NFC Reader Screen</Text>
      <Button
        onPress={startNFCTest}
        title="Start NFC Scan"
        disabled={isRunning}
      />
      {isRunning && <ActivityIndicator size="large" color="#0000ff" />}
      <Text style={styles.outputText}>{outputMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  outputText: {
    marginTop: 20,
    fontSize: 18,
    color: 'black',
    textAlign: 'center',
  },
});

export default NfcScreen;