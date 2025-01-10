// BluetoothScreen.js
import React from 'react';
import { View, Text, Button, FlatList, StyleSheet, ActivityIndicator, BackHandler } from 'react-native';
import useBluetoothScan from '../testlogic/useBluetoothScan'; // Adjust the import path as necessary
import { useFocusEffect } from '@react-navigation/native';

const BluetoothScreen = () => {
  console.log('BluetoothScreen rendered');
  const { devices, isScanning, scanStatus, startScan, isCooldown, cooldownTime } = useBluetoothScan();

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (isScanning) {
          console.log('Back press disabled during scanning');
          return true;  // Return true to prevent default behavior
        }
        return false;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [isScanning])
  );

  const getStatusStyle = () => ({
    ...styles.scanStatus,
    color: scanStatus.startsWith('FAIL') ? 'red' : scanStatus.startsWith('PASS') ? 'green' : 'blue',
  });

  return (
    <View style={styles.container}>
      <Text style={getStatusStyle()}>{scanStatus}</Text>
      <Text style={styles.cooldown}>{isCooldown ? `Ready to scan in: ${cooldownTime}s` : ''}</Text>
      <Button title="Scan for Bluetooth Devices" onPress={startScan} disabled={isCooldown} />
      {isScanning && <ActivityIndicator size="large" color="#0000ff" />}
      <FlatList
        style={styles.list}
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.name || 'Unnamed Device'} - {item.id}</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5FCFF',
  },
  scanStatus: {
    textAlign: 'center',
    margin: 20,
    fontSize: 20,
    fontWeight: 'bold',
    color: 'blue',
  },
  cooldown: {
    textAlign: 'center',
    margin: 2,
    fontSize: 14,
    color: 'black',
  },
  list: {
    marginTop: 20,
  },
});

export default BluetoothScreen;