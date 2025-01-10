import { useState, useEffect } from 'react';
import { Vibration } from 'react-native';
import { accelerometer, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useVibrationTest = () => {
  const [data, setData] = useState({ x: 0, y: 0, z: 0 });
  const [testStarted, setTestStarted] = useState(false);
  const [baseline, setBaseline] = useState(null);
  const [firstRunSkipped, setFirstRunSkipped] = useState(false); // New state to track the first run
  const threshold = 0.015; // Threshold for significant change detection in accelerometer data. Lower values are more sensitive.

  const calibrate = () => {
    return new Promise((resolve) => {
      console.log("Starting calibration...");
      const calibrationData = [];
      const calibrationDuration = 2000; // 2 seconds for calibration
      const calibrationEndTime = Date.now() + calibrationDuration;

      const subscription = accelerometer.subscribe({
        next: (values) => {
          if (Date.now() < calibrationEndTime) {
            calibrationData.push(values);
            console.log("Collecting calibration data:", values);
          } else {
            const avgBaseline = calculateAverage(calibrationData);
            setBaseline(avgBaseline);
            console.log("Calibration complete. Baseline set:", avgBaseline);
            subscription.unsubscribe();
            resolve();
          }
        },
        error: (error) => {
          console.error('Calibration error:', error);
          subscription.unsubscribe();
          resolve(); // Resolve anyway to allow the test to proceed
        },
      });
    });
  };

  const triggerVibration = async () => {
    console.log("Triggering vibration test...");
    if (testStarted) {
      console.warn("Test is already running");
      return Promise.reject("Test already running");
    }
  
    setTestStarted(true);
    setBaseline(null); // Clear baseline before each test
  
    try {
      // Perform calibration
      await calibrate();
  
      const pattern = [2500, 3500, 200, 3500, 3000];
      Vibration.vibrate(pattern, false);
      console.log("Vibration pattern started.");
  
      if (!firstRunSkipped) {
        console.log("Skipping testing for the first run.");
        setFirstRunSkipped(true);
        setTestStarted(false);
        return Promise.resolve('SKIPPED'); // Resolve the first test with "SKIPPED"
      }
  
      return new Promise((resolve, reject) => {
        let significantChangeDetected = false;
        const testDuration = 10000; // 10 seconds for the test duration
        const testEndTime = Date.now() + testDuration;
  
        setUpdateIntervalForType(SensorTypes.accelerometer, 500);
        const subscription = accelerometer.subscribe({
          next: (values) => {
            setData(values);
            if (Date.now() > testEndTime) {
              subscription.unsubscribe();
              setTestStarted(false);
              if (significantChangeDetected) {
                console.log("Test passed with significant change detected.");
                logResult('PASS').then(() => resolve('PASS')).catch((err) => reject(`LOGGING ERROR: ${err}`));
              } else {
                console.log("Test failed due to no significant change detected.");
                logResult('FAIL').then(() => reject('FAIL')).catch((err) => reject(`LOGGING ERROR: ${err}`));
              }
            } else if (checkForSignificantChange(values)) {
              console.log("Significant change detected during test.");
              significantChangeDetected = true;
            }
          },
          error: (error) => {
            console.error('Test error:', error);
            subscription.unsubscribe();
            setTestStarted(false);
            reject(`Test error: ${error}`);
          },
        });
      });
    } catch (error) {
      setTestStarted(false);
      console.error("Trigger vibration error:", error);
      return Promise.reject(error);
    }
  };
  

  const checkForSignificantChange = ({ x, y, z }) => {
    if (!baseline) return false;
    const delta = {
      x: Math.abs(x - baseline.x),
      y: Math.abs(y - baseline.y),
      z: Math.abs(z - baseline.z),
    };
    const significant = delta.x > threshold || delta.y > threshold || delta.z > threshold;
    console.log("Delta values:", delta, "Significant change:", significant);
    return significant;
  };

  const calculateAverage = (dataPoints) => {
    const sum = dataPoints.reduce(
      (acc, point) => ({
        x: acc.x + point.x,
        y: acc.y + point.y,
        z: acc.z + point.z,
      }),
      { x: 0, y: 0, z: 0 }
    );
    return {
      x: sum.x / dataPoints.length,
      y: sum.y / dataPoints.length,
      z: sum.z / dataPoints.length,
    };
  };

  const logResult = async (result) => {
    const serialNumber = await AsyncStorage.getItem('serialNumber');
    const fileName = `${serialNumber}_VibrationLog.txt`;
    const path = `${RNFS.DownloadDirectoryPath}/${fileName}`;
    const now = new Date();
    const timestamp = now.toLocaleString().replace(',', '');
    const logEntry = `${timestamp}, ${result}\n`;
    try {
      const fileExists = await RNFS.exists(path);
      if (!fileExists) {
        await RNFS.writeFile(path, 'Date, Result\n', 'utf8');
      }
      await RNFS.appendFile(path, logEntry, 'utf8');
      console.log(`Logged result: ${result}`);
    } catch (error) {
      console.error('Failed to log Vibration result:', error);
      throw new Error("Logging error");
    }
  };

  return { testStarted, triggerVibration };
};

export default useVibrationTest;
