import { useState } from 'react';
import DocumentPicker from 'react-native-document-picker';
import {DocumentFile} from 'react-native-document-picker';
import { NativeModules } from 'react-native';
import RNFS from 'react-native-fs'; // Import file system module for logging
import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { ContentResolverModule } = NativeModules;

// Example helper function:
const getCleanDeviceName = (uri) => {
  if (!uri) return 'Unknown Device';

  // 1) Split on slash to get the last segment
  const segments = uri.split('/');
  let last = segments[segments.length - 1] || 'Unknown Device';

  // 2) Decode any URL-encoded characters (e.g. %3A -> :)
  last = decodeURIComponent(last);

  // 3) If there's a colon, remove everything from the colon onwards
  //    e.g. "9E8B-92C3:" -> "9E8B-92C3"
  const colonIndex = last.indexOf(':');
  if (colonIndex !== -1) {
    last = last.substring(0, colonIndex);
  }

  // 4) Return the final cleaned string
  return last;
};

const useUSBTest = () => {
  const [testStatus, setTestStatus] = useState('');
  const [usbUri, setUsbUri] = useState(null); // State to store selected USB directory
  const [deviceName, setDeviceName] = useState('Unknown Device');

  // Function to log USB test results, with optional error message logging
  const logUsbTestResult = async (status, errorMessage = null, deviceName = null) => {

    const serialNumber = await AsyncStorage.getItem('serialNumber');
    const fileName = `${serialNumber}_UsbLog.txt`;
    const path = `${RNFS.DownloadDirectoryPath}/${fileName}`;
    const now = new Date();
    const timestamp = now.toLocaleString().replace(',', ''); // Formatting timestamp
    const deviceNameText = deviceName ? `, DeviceName: ${deviceName}` : '';

    // If there's an error message, log it with the status
    const logEntry = errorMessage 
      ? `${timestamp}, ${status}${deviceNameText}, Error: ${errorMessage}\n`
      : `${timestamp}, ${status}${deviceNameText}\n`;

    try {
      const fileExists = await RNFS.exists(path);
      if (!fileExists) {
        await RNFS.writeFile(path, 'Date, Result, DeviceName, Details\n', 'utf8');
      }
      await RNFS.appendFile(path, logEntry, 'utf8');
    } catch (error) {
      console.error('Failed to log USB test result:', error);
    }
  };

  // Allow the user to select a directory (likely the USB drive)
  const checkUSBPresence = async () => {
    try {
      const res = await DocumentPicker.pickDirectory();
      if (res && res.uri) {
        console.log('Selected USB URI:', res.uri);
        setUsbUri(res.uri); // Save the selected URI to state
        // Derive a simple name from the URI
        const name = getCleanDeviceName(res.uri);
        setDeviceName(name); // Save the device name to state
        return res.uri; // Return the USB drive URI
      }
      return null;
    } catch (error) {
      console.error('USB selection error:', error);
      return null;
    }
  };

  const performReadWriteTest = async (uri) => {
    if (!uri) {
      // Stop if no valid URI is provided (USB drive not detected)
      return Promise.reject('No valid URI provided.');
    }
  
    const testFileName = 'USBTestFile.txt';
    const testFileContent = 'Test Content';
  
    try {
      // Write the file
      await ContentResolverModule.saveTxtFile(uri, testFileName, testFileContent);
      console.log('File written successfully.');
  
      // Read the file content back
      await ContentResolverModule.readTxtFile(uri, testFileName);
      console.log('File read successfully.');
  
      // Log and return a pass status with device name
      await logUsbTestResult('PASS', null, deviceName);
      return 'Test completed successfully.';
    } catch (error) {
      console.error('Read/Write error:', error);
      // Log and return a fail status with error message and device name
      await logUsbTestResult('FAIL', error.message, deviceName);
      return Promise.reject('Error: ' + error.message);
    }
  };

  // Function to delete the test file from the USB drive
  const deleteTestFile = async (uri) => {
    const testFileName = 'USBTestFile.txt';

    try {
      await ContentResolverModule.deleteFile(uri, testFileName);
      console.log('File deleted successfully.');
      return 'File deleted successfully.';
    } catch (error) {
    //  console.error('Delete error:', error);
    //  return `Error: ${error.message}`;
      return Promise.reject('Error: ' + error.message);
    }
  };

  // Start the USB test
const startUSBTest = async () => {
  setTestStatus('Starting test...');

  // Check if USB URI is already selected, otherwise ask the user
  let uri = usbUri;
  if (!usbUri) {
    uri = await checkUSBPresence();
  }

  if (uri) {
    setTestStatus('USB drive found, performing test...');
    const status = await performReadWriteTest(uri); // Pass the URI to the test
    setTestStatus(status);

    // After the test, attempt to delete the file
    const deleteStatus = await deleteTestFile(uri);
    setTestStatus(prevStatus => `${prevStatus}\n${deleteStatus}`); // Append delete status to the test status
    return Promise.resolve(status);
  } else {
    setTestStatus('No USB drive detected.');
    await logUsbTestResult('FAIL - No USB drive detected');
    return Promise.reject('No USB drive detected.');
  }
};

return { testStatus, startUSBTest, usbUri, checkUSBPresence };
};

export default useUSBTest;