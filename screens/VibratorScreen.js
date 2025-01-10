import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Vibration, Alert } from 'react-native';
import { accelerometer, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VibratorScreen = () => {
  const [data, setData] = useState({ x: 0, y: 0, z: 0 });
  const [testStarted, setTestStarted] = useState(false);
  const [canCheckForChange, setCanCheckForChange] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const threshold = 0.03;


  console.log('VibratorScreen rendered');

  useEffect(() => {
    let subscription;
    if (testStarted) {
      setUpdateIntervalForType(SensorTypes.accelerometer, 500); // Set accelerometer update interval

      // Delay the real test start (checking for changes) by 2 seconds
      const checkStartTimeout = setTimeout(() => {
        setCanCheckForChange(true);
      }, 2000);

      // Start accelerometer subscription immediately
      subscription = accelerometer.subscribe({
        next: (values) => {
          // Store data for all readings, but only evaluate changes after the 2-second delay
          setData(values);
          if (canCheckForChange && testResult === null) {
            checkForSignificantChange(values);
          }
        },
        error: console.error,
      });

      // Stop the accelerometer subscription 10 seconds after the test starts
      const stopSubscriptionTimeout = setTimeout(() => {
        if (subscription) {
          subscription.unsubscribe();
          setTestStarted(false); // Ensure the test is marked as stopped
          setCanCheckForChange(false); // Prevent further change checks
          if (testResult === null) {
            setTestResult('Fail'); // Automatically fail the test if no result is set
          }
        }
      }, 10000);

      return () => {
        clearTimeout(checkStartTimeout);
        clearTimeout(stopSubscriptionTimeout);
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    }
  }, [testStarted, canCheckForChange, testResult]);

  const triggerVibration = () => {
    if (!testStarted) {
      setData({ x: 0, y: 0, z: 0 });
      setTestResult(null);
      setCanCheckForChange(false);
      setTestStarted(true);

      // Trigger vibration pattern
      const pattern = [2500, 3500, 200, 3500, 3000];
      Vibration.vibrate(pattern, false);
    }
  };

  const checkForSignificantChange = ({ x, y, z }) => {
    const delta = {
      x: Math.abs(x - data.x),
      y: Math.abs(y - data.y),
      z: Math.abs(z - data.z),
    };

    if (delta.x > threshold || delta.y > threshold || delta.z > threshold) {
      setTestResult('Pass');
      // Optionally stop the test immediately upon passing
      // If you add code to stop the test here, ensure you unsubscribe from the accelerometer
    }
  };

  const logResult = async (result) => {
    const serialNumber = await AsyncStorage.getItem('serialNumber');
    const fileName = `${serialNumber}_VibrationLog.txt`;
    const path = `${RNFS.DownloadDirectoryPath}/${fileName}`;
    // Get current UTC date and time
    const now = new Date();
    // Getting a locale-specific format which inherently reflects the device's timezone
    const timestamp = now.toLocaleString().replace(',', ''); // Some locales may include commas
    const logEntry = `${timestamp}, ${result}\n`;
    try {
      const fileExists = await RNFS.exists(path);
      if (!fileExists) {
        await RNFS.writeFile(path, 'Date, Result\n', 'utf8');
      }
      await RNFS.appendFile(path, logEntry, 'utf8');
    } catch (error) {
      console.error('Failed to log Vibration result:', error);
    }
  };
  

  useEffect(() => {
    if (testResult !== null) {
      logResult(testResult); // Log the result once it's set
    }
  }, [testResult]
  // Depend on testResult to trigger the logging
  ); 
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Vibrator & Accelerometer Test</Text>
      <View style={styles.buttonContainer}>
        <Button title="Start Test" onPress={triggerVibration} disabled={testStarted} />
      </View>
      <Text>Accelerometer Data:</Text>
      <Text>x: {data.x?.toFixed(3) ?? 'N/A'}, y: {data.y?.toFixed(3) ?? 'N/A'}, z: {data.z?.toFixed(3) ?? 'N/A'}</Text>
      {testResult && <Text>Test Result: {testResult}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  buttonContainer: {
    marginVertical: 10,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default VibratorScreen;