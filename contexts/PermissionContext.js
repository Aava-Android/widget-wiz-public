import React, { createContext, useState, useEffect } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { run } from 'jest';

const PermissionContext = createContext();

export const PermissionProvider = ({ children }) => {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [output, setOutput] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const permissions = [
 //   PERMISSIONS.ANDROID.INTERNET,
 //   PERMISSIONS.ANDROID.NFC,
 //   PERMISSIONS.ANDROID.BLUETOOTH,
 //   PERMISSIONS.ANDROID.BLUETOOTH_ADMIN,
    PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
    PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
    PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
    PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION,
 //   PERMISSIONS.ANDROID.ACCESS_WIFI_STATE,
 //   PERMISSIONS.ANDROID.CHANGE_WIFI_STATE,
 //   PERMISSIONS.ANDROID.HIGH_SAMPLING_RATE_SENSORS,
 //   PERMISSIONS.ANDROID.VIBRATE,
 //   PERMISSIONS.ANDROID.WRITE_SETTINGS,
    PERMISSIONS.ANDROID.READ_PHONE_STATE,
    PERMISSIONS.ANDROID.CAMERA,
    PERMISSIONS.ANDROID.RECORD_AUDIO,
 //   PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
 //   PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
 //   PERMISSIONS.ANDROID.MANAGE_EXTERNAL_STORAGE,
 //   PERMISSIONS.ANDROID.ACCESS_SUPERUSER,
  ];

  const runCommand = async (cmd) => {
    try {
      console.log('Running command:', cmd);
      const result = await NativeModules.RootCommandModule.runAsRoot(cmd);
      console.log('Command result:', result);
      setOutput(result); // Still update the state for UI purposes
      return result; // Return the result so it can be used
    } catch (error) {
      console.log('Error:', error);
      setOutput('Error: ' + error.message);
      throw error; // Re-throw the error for proper handling
    }
  };

  const sanitizeFileName = (name) => {
    return name.replace(/[^a-zA-Z0-9_-]/g, ""); // Replace invalid characters with ""
  };
  
  const saveSerialNumber = async (serial) => {
    try {
      const sanitizedSerial = sanitizeFileName(serial); // Sanitize the input
      await AsyncStorage.setItem('serialNumber', sanitizedSerial); // Save sanitized value
      console.log('Sanitized serial number saved:', sanitizedSerial);
    } catch (error) {
      console.error('Error saving serial number:', error);
    }
  };
  
  

  const requestAllPermissions = async () => {
    try {
      const results = await Promise.all(
        permissions.map((permission) =>
          check(permission).then((status) => {
            if (status !== RESULTS.GRANTED) {
              return request(permission);
            }
            return RESULTS.GRANTED;
          })
        )
      );

      const allGranted = results.every((result) => result === RESULTS.GRANTED);

      setPermissionsGranted(allGranted);

      if (!allGranted) {
        Alert.alert(
          'Permissions Required',
          'Some permissions were not granted. The app may not function correctly.'
        );
      }
    } catch (error) {
      console.error('Error checking/requesting permissions:', error);
    }
  };

  const openWriteSettings = () => {
    if (Platform.OS === 'android') {
      // The package name should be your app's package name
      const packageName = 'com.ww';
      // The correct intent to open the app settings screen
      const intentURL = `package:${packageName}`;
      // Open the app settings page
      Linking.openSettings(intentURL)
        .then(supported => {
          if (!supported) {
            Alert.alert('Error', 'Unable to open settings');
          }
        })
        .catch(err => console.error('An error occurred', err));
    } else {
      Alert.alert('Unavailable', 'This feature is only available on Android');
    }
  };

  const refreshPermissions = async () => {
    try {
      const notGrantedPermissions = [];
      for (const permission of permissions) {
        const status = await check(permission);
        if (status !== RESULTS.GRANTED) {
          notGrantedPermissions.push(permission);
          console.log('Permission not granted:', permission);
        }
      }

      if (notGrantedPermissions.length > 0) {
        const results = await Promise.all(
          notGrantedPermissions.map((permission) => request(permission)),
          console.log('Results:', results)
        );

        const allGranted = results.every((result) => result === RESULTS.GRANTED);
        setPermissionsGranted(allGranted);
        openWriteSettings();
        try {
          // Set screen timeout
          await runCommand('settings put system screen_off_timeout 999999999');
          console.log('Screen timeout set to max.');

          await delay(3000);
        
          // Set media volume
          await runCommand('cmd media_session volume --set 15');
          console.log('Media volume set to max.');
        
          await delay(3000);

          // Get serial number
          const serial = await runCommand('getprop ro.serialno');
          setSerialNumber(serial);
          saveSerialNumber(serial);
          console.log(`Device Serial Number: ${serial}`);

          await delay(3000);

          await runCommand('pm disable-user --user 0 com.android.nfc');
          console.log('Android NFC disabled.');

        } catch (error) {
          console.error('Error running commands:', error);
        }

        if (!allGranted) {
          Alert.alert(
            'Permissions Required',
            'Some permissions were not granted. The app may not function correctly.'
          );
        }
      } else {
        Alert.alert('All Permissions Granted', 'No additional permissions are required.');
      }
    } catch (error) {
      console.error('Error refreshing permissions:', error);
    }
  };

  useEffect(() => {
    requestAllPermissions();
  }, []);

  return (
    <PermissionContext.Provider value={{ permissionsGranted, refreshPermissions, serialNumber }}>
      {children}
    </PermissionContext.Provider>
  );
};

export default PermissionContext;