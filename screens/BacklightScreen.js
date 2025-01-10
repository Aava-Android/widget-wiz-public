import React from 'react';
import { View, Button, StyleSheet, Alert, Linking, Platform, BackHandler } from 'react-native';
import ScreenBrightness from 'react-native-screen-brightness';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BacklightScreen = () => {

    const openWriteSettings = () => {
        if (Platform.OS === 'android') {
          const packageName = 'com.ww';
          const intentURL = `package:${packageName}`;
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

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <Button title="Change Backlight" onPress={changeBacklight} />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Enable Write System Settings" onPress={openWriteSettings} />
      </View>
    </View>
  );
};

export default BacklightScreen;

export const changeBacklight = async () => {
  return new Promise(async (resolve, reject) => {

    const logBacklightResult = async (status) => {
      const serialNumber = await AsyncStorage.getItem('serialNumber');
      const fileName = `${serialNumber}_BacklightLog.txt`;
      const path = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      const now = new Date();
      // Getting a locale-specific format which inherently reflects the device's timezone
      const timestamp = now.toLocaleString().replace(',', ''); // Some locales may include commas
      const logEntry = `${timestamp}, ${status}\n`;

      try {
        const fileExists = await RNFS.exists(path);
        if (!fileExists) {
          await RNFS.writeFile(path, 'Date, Result\n', 'utf8');
        }
        await RNFS.appendFile(path, logEntry, 'utf8');
      } catch (error) {
        console.error('Failed to log Backlight result:', error);
      }
    };

  try {
    // Save the current brightness level
    const currentBrightness = await ScreenBrightness.getBrightness();

    // Handle back press during the backlight change process
  const onBackPress = () => {
    console.log('Back press disabled during backlight change');
    return true;  // Return true to prevent default behavior
  };

  BackHandler.addEventListener('hardwareBackPress', onBackPress);

    // Define a function that toggles brightness
    const toggleBrightness = (bright, count) => {
      // If count is zero, reset to original brightness and return
      if (count === 0) {
     //   ScreenBrightness.setBrightness(currentBrightness);
        ScreenBrightness.setBrightness(0.1);
        return;
      }
      // Set brightness to bright or dim
      ScreenBrightness.setBrightness(bright ? 1 : 0.2);
      // Toggle the brightness after 1 second
      setTimeout(() => toggleBrightness(!bright, count - 1), 1000);
    };

    // Start toggling, repeat 10 times (5 cycles of dim to bright and back to dim)
    toggleBrightness(true, 10);

    if (Platform.OS === 'android') {
      // Check if the app has permission to write system settings
      const hasPermission = await ScreenBrightness.hasPermission();
      if (!hasPermission) {
        // If not, request the permission
        const permissionGranted = await ScreenBrightness.requestPermission();
        if (!permissionGranted) {
          // If permission is denied, show an alert
          reject('Permission denied');
          logBacklightResult('FAIL: Permission denied');
          Alert.alert('Error', 'Failed to change backlight setting. Make sure the app has the required permissions.');
          return;
        }
      }
    }

    // resolve if toggling was successful, after 10 seconds
    setTimeout(() => {
      resolve()
      BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, 10000);
    logBacklightResult('PASS');

  } catch (error) {
    console.error(error);
    reject(error);
    logBacklightResult('FAIL');
    Alert.alert('Error', 'Failed to change backlight setting. Make sure the app has the required permissions.');
  }
});
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    marginVertical: 10,
  },
});

