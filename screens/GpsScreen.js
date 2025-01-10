// GpsScreen.js
import React, { useCallback, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import useGPSTest from '../testlogic/useGPSTest';

const GpsScreen = () => {
  console.log('GpsScreen rendered');
  const { location, isLocating, locationStatus, startLocationFetch, isCooldown, cooldownTime } = useGPSTest();

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (isLocating) {
          console.log('Back press disabled during location fetch');
          return true;  // Return true to prevent default behavior
        }
        return false;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [isLocating])
  );

  const getStatusStyle = () => ({
    ...styles.locationStatus,
    color: locationStatus.startsWith('FAIL') ? 'red' : locationStatus.startsWith('PASS') ? 'green' : 'blue',
  });

  return (
    <View style={styles.container}>
        <Text style={getStatusStyle()}>{locationStatus}</Text>
        <Text style={styles.cooldown}>{isCooldown ? `Ready to scan in: ${cooldownTime}s` : ''}</Text>
        <Button title="Fetch GPS Location" onPress={startLocationFetch} disabled={isCooldown} />
        {isLocating && <ActivityIndicator size="large" color="#0000ff" />}
      {location && (
        <View>
          <Text style={styles.locationText}>Latitude: {location.coords.latitude}</Text>
          <Text style={styles.locationText}>Longitude: {location.coords.longitude}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'top',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5FCFF',
  },
  locationStatus: {
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
  locationText: {
    fontSize: 18,
  },
});

export default GpsScreen;
