// useGPSTest.js
import { useState, useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import RNFS from 'react-native-fs';
import { useCooldown } from '../contexts/CooldownContext'; // Assuming this context provides cooldown logic
import AsyncStorage from '@react-native-async-storage/async-storage';

const useGPSTest = () => {
  const [location, setLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const { isCooldown, cooldownTime, startCooldown } = useCooldown();


  useEffect(() => {
    const requestLocationPermissions = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 23) {
        try {
          const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.warn("Location permission denied");
            return false;
          }
          return true;
        } catch (err) {
          console.warn(err);
          return false;
        }
      }
      return true;
    };
    requestLocationPermissions();
  }, []);

  const logGpsResult = async (status, coords = null) => {
    const serialNumber = await AsyncStorage.getItem('serialNumber');
    const fileName = `${serialNumber}_GpsLog.txt`;
    const path = `${RNFS.DownloadDirectoryPath}/${fileName}`;
    const now = new Date();
    // Getting a locale-specific format which inherently reflects the device's timezone
    const timestamp = now.toLocaleString().replace(',', ''); // Some locales may include commas
    const logEntry = coords
      ? `${timestamp}, ${status}, Latitude: ${coords.latitude}, Longitude: ${coords.longitude}\n`
      : `${timestamp}, ${status}\n`;

    try {
      const fileExists = await RNFS.exists(path);
      if (!fileExists) {
        await RNFS.writeFile(path, 'Date, Result, Details\n', 'utf8');
      }
      await RNFS.appendFile(path, logEntry, 'utf8');
    } catch (error) {
      console.error('Failed to log GPS result:', error);
    }
  };

  const startLocationFetch = () => {
    if (isCooldown) {
      console.warn(`Cooldown in effect. Please wait for ${cooldownTime} seconds.`);
      return Promise.reject(new Error("Cooldown in effect."));
    }
    return new Promise((resolve, reject) => {
      startCooldown();
      setIsLocating(true);
      setLocationStatus('Locating...');
      setLocation(null);
      console.info('Fetching GPS location...');

      Geolocation.getCurrentPosition(
        (position) => {
          setLocation(position);
          setLocationStatus('PASS');
          setIsLocating(false);
          logGpsResult('PASS', position.coords);
          console.log('PASS: GPS location found:', position.coords.latitude, position.coords.longitude);
          resolve(); // Resolve the promise on success
        },
        (error) => {
          setLocation(null);
          setLocationStatus('FAIL');
          setIsLocating(false);
          logGpsResult('FAIL', error.message);
          console.warn('FAIL: Failed to get GPS location:', error.message);
          reject(error); // Reject the promise on error
        },
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 30000 }, // 30-second timeout and cache age limit of 30 seconds  
      );
    });
  };

  return { location, isLocating, locationStatus, startLocationFetch, isCooldown, cooldownTime};
};

export default useGPSTest;
