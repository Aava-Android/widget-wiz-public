// WlanScreen.js
import React from 'react';
import { View, Text, Button, FlatList, StyleSheet, ActivityIndicator, BackHandler } from 'react-native';
import useWlanScan from '../testlogic/useWlanScan'; // Adjust the import path as necessary
import { useFocusEffect } from '@react-navigation/native';

const WlanScreen = () => {
  console.log('WlanScreen rendered');
  const { networks, isScanning, scanStatus, startScan, isCooldown, cooldownTime } = useWlanScan();

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
      <Button title="Scan for WiFi Networks" onPress={startScan} disabled={isCooldown}/>
      {isScanning && <ActivityIndicator size="large" color="#0000ff" />}
      <FlatList
        style={styles.list}
        data={networks}
        keyExtractor={(item, index) => item.BSSID || index.toString()}
        renderItem={({ item }) => <Text style={styles.networkText}>{item.SSID}</Text>}
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
  networkText: {
    fontSize: 18,
  },
  list: {
    marginTop: 20,
  },
});

export default WlanScreen;
