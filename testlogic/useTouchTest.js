import { useState } from 'react';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useTouchTest = () => {
  const [touchLog, setTouchLog] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Function to log touch test results with optional details
  const logTouchTestResult = async (status, details = null) => {
    const serialNumber = await AsyncStorage.getItem('serialNumber');
    const logFilePath = `${RNFS.DownloadDirectoryPath}/${serialNumber}_TouchLog.txt`;
    const now = new Date();
    const timestamp = now.toLocaleString().replace(',', ''); // Formatting timestamp

    // Determine result based on the status
    let result = 'N/A';
    if (status === 'Touch Detected') {
      result = 'FAIL';
    }

    // Log entry format: Date, Result, Details
    const logEntry = details
      ? `${timestamp}, ${result}, ${details}\n`
      : `${timestamp}, ${result}\n`;

    try {
      const fileExists = await RNFS.exists(logFilePath);
      if (!fileExists) {
        // Create the file with a header if it doesn't exist
        await RNFS.writeFile(logFilePath, 'Date, Result, Details\n', 'utf8');
      }
      await RNFS.appendFile(logFilePath, logEntry, 'utf8'); // Append the log entry
      console.log('Touch test logged:', logEntry);
    } catch (error) {
      console.error('Failed to log touch test result:', error);
    }
  };

  // Handles touch events and logs them as FAIL
  const handleTouch = (type, e) => {
    const touch = e.nativeEvent;
    const timestamp = new Date().toISOString();
    const touchEvent = {
      type,
      timestamp,
      x: touch.locationX,
      y: touch.locationY,
      force: touch.force || 0,
    };

    // Add to in-memory log
    setTouchLog((prevLog) => [...prevLog, touchEvent]);

    // Log the touch event details with FAIL
    const details = `Type: ${type}, X: ${touchEvent.x}, Y: ${touchEvent.y}, Force: ${touchEvent.force}`;
    logTouchTestResult('Touch Detected', details);
  };

  const startMonitoring = async () => {
    try {
      console.log('Monitoring started');
      // "Monitoring Started" logs as N/A
      await logTouchTestResult('Monitoring Started');
      setIsMonitoring(true);
    } catch (error) {
      console.error('Error starting monitoring:', error);
      await logTouchTestResult('Monitoring Failed', error.message);
    }
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    console.log('Monitoring stopped');
    // "Monitoring Stopped" logs as N/A
    logTouchTestResult('Monitoring Stopped');
  };

  const toggleMonitoring = () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
  };

  return {
    touchLog,
    setTouchLog,
    isMonitoring,
    toggleMonitoring,
    handleTouch,
  };
};
