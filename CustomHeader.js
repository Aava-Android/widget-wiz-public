import React, { useState, useEffect, useContext, useRef } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Modal, Button, Alert, Dimensions, Switch } from 'react-native';
import { Icon } from 'react-native-elements';
import { useTest } from './contexts/TestContext'; // Access test context
import useGPSTest from './testlogic/useGPSTest'; // Access individual test logic hooks
import useWlanScan from './testlogic/useWlanScan';
import useBluetoothScan from './testlogic/useBluetoothScan';
import useVibrationTest from './testlogic/useVibrationTest';
import { changeBacklight } from './screens/BacklightScreen';
import { ProgressBar } from 'react-native-paper'; // Using react-native-paper ProgressBar
import RNFS from 'react-native-fs'; // Import file system
import { TestContext } from './contexts/TestContext';
import RNFetchBlob from 'rn-fetch-blob';
import { NativeModules } from 'react-native';
import { BackupDirectoryContext } from './contexts/BackupDirectoryContext';
import DocumentPicker from 'react-native-document-picker';
import { usePowerMetrics } from './testlogic/usePowerMetrics';  // Import the hook
import useThermalService from './testlogic/useThermalService';
import useAdbHardware from './testlogic/useAdbHardware';
import { ScreenWidth } from 'react-native-elements/dist/helpers';
import useUSBTest from './testlogic/useUSBTest';
import useCellularService from './testlogic/useCellularService';
import useSensorService from './testlogic/useSensorService';
import { useTouchTest } from './testlogic/useTouchTest';
import useMinimalAudioTest from './testlogic/useMinimalAudioTest';
import useAccessoryTest from './testlogic/useAccessoryTest';
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from './supaBaseClient';
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import useNFCTest from './testlogic/useNFCTest';
import useSummary from './testlogic/useSummary';
import useCPIN from './testlogic/useCPIN';

const CustomHeader = ({ navigation }) => {
  const {
          selectedTests,
          setSelectedTests,
          isAnyTestEnabled,
          setIsAnyTestEnabled,
          testResults,
          setTestResults,
          isTestOn,
          setIsTestOn,
          stopCalled,
          setStopCalled,
          isCountdownOn,
          setIsCountdownOn,
          setDisableButton,
          setShowMainCamera,
          setScannedMainCode,
       //   scannedMainCode,
          setShowSecondaryCamera,
          setScannedSecondaryCode,
       //   scannedSecondaryCode,
          selectedDevice1,
          selectedDevice2,
          selectedDevice3,
          setSelectedDevice1,
          setSelectedDevice2,
          setSelectedDevice3,
        } = useTest(); // Get test context

  const [hasAnyTestFailed, setHasAnyTestFailed] = useState(null);
  const [hasFailedOnce, setHasFailedOnce] = useState(false); // Persistent failure state across rounds

  const { scannedMainCode, scannedSecondaryCode } = useContext(TestContext);

  const { metrics, fetchMetrics } = usePowerMetrics();  // Use the hook
  const { parsedOutput, runThermalCommand } = useThermalService(); // Use the custom hook
  const { runHardwareCheck } = useAdbHardware();
  const { touchLog, isMonitoring, toggleMonitoring, handleTouch } = useTouchTest();
  const { startNFCTest, outputMessage, isRunning } = useNFCTest();

  const scannedMainCodeRef = useRef(scannedMainCode); // Create a ref to track the latest value of scannedMainCode
  const scannedSecondaryCodeRef = useRef(scannedSecondaryCode); // Create a ref to track the latest value of scannedSecondaryCode

  const [isModalVisible, setModalVisible] = useState(false); // Modal state
  const [timerIndex, setTimerIndex] = useState(1); // State to store selected interval index
  const [longPressTimeoutId, setLongPressTimeoutId] = useState(null); // Long press handling
  const [timer, setTimer] = useState(null); // Timer for test cycles
  const [completedTests, setCompletedTests] = useState(0); // Track completed tests

  const currentRoute = navigation.getState()?.routes[navigation.getState().index]?.name; // Get current route name
  const shouldShowSettingsIcon = currentRoute == 'Home'; // Don't show if current route is SettingsMenu

  // Duration options in seconds
  const timerDurations = [60, 180, 300, 600, 1200, 1800, 3600]; // Corresponds to 1, 3, 5, 10, 20, 30, 60 minutes

  // Test hooks
  const { startLocationFetch } = useGPSTest();
  const { startScan } = useWlanScan();
  const { startScan: startBluetoothScan } = useBluetoothScan();
  const { triggerVibration } = useVibrationTest();
  const { runMinimalAudioTest } = useMinimalAudioTest();
  const { startUSBTest, checkUSBPresence, usbUri } = useUSBTest();
  const { parsedOutput: cellularData, runCellularCommand } = useCellularService(); // Use the custom hook
  const { sensorData, fetchSensorInfo, loading: sensorLoading, error: sensorError } = useSensorService();
  const { devices, loading, error, fetchUsbDevices, verifyStoredDevice, verifyAllDevices } = useAccessoryTest(); // Use the custom hook
  const { summarizeLogs } = useSummary(); // Use the custom hook
  const { logCPINData } = useCPIN(); // Access the hook

  const [isPickerModalVisible, setIsPickerModalVisible] = useState(false);

  // Determine whether to show the play icon or stop icon based on ongoing tests
  const iconName = (isTestOn && isAnyTestEnabled) ? 'stop' : (selectedTests.length > 0 ? 'play-arrow' : 'settings');
  const iconAction = isAnyTestEnabled ? null : ((selectedTests.length > 0) ? () =>setModalVisible(true) : () => navigation.navigate('SettingsMenu'));

  const screenWidth = Dimensions.get('window').width;
  const iconWidth = 48; // Adjust based on your icon's actual width
  const iconLeftPosition = (screenWidth / 2) - (iconWidth / 1.25);

  const [totalPassedTests, setTotalPassedTests] = useState(0);
  const [totalFailedTests, setTotalFailedTests] = useState(0);

  // UseRef to track the length of results already processed
  const previousResultsLength = useRef(0);

  useEffect(() => {
    // Process only new results
    const newResults = testResults.slice(previousResultsLength.current);

    // Update the totals based on the new results
    const newPassedCount = newResults.filter((result) => result.result === true).length;
    const newFailedCount = newResults.filter((result) => result.result === false).length;

    setTotalPassedTests((prev) => prev + newPassedCount);
    setTotalFailedTests((prev) => prev + newFailedCount);

    // Update the length of results processed
    previousResultsLength.current = testResults.length;
  }, [testResults]);

  // Function to reset the total passed and failed tests
  const resetTotals = () => {
    setTotalPassedTests(0);
    setTotalFailedTests(0);
    previousResultsLength.current = 0; // Reset the tracking when tests are restarted
  };

//----------------------------------------------------------------------------------------------------------------
//------------------------------------CAMERA LOGGING--------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------

  useEffect(() => {
    if (scannedMainCode !== scannedMainCodeRef.current) {
        scannedMainCodeRef.current = scannedMainCode;
    }
    if (scannedSecondaryCode !== scannedSecondaryCodeRef.current) {
        scannedSecondaryCodeRef.current = scannedSecondaryCode;
    }
  }, [scannedMainCode, scannedSecondaryCode]);

  // Logging scanned code result to file
  const logMainScanResult = async (status, code = null) => {
    const serialNumber = await AsyncStorage.getItem('serialNumber');
    const fileName = `${serialNumber}_MainCameraLog.txt`;
    const path = `${RNFS.DownloadDirectoryPath}/${fileName}`;
    const now = new Date();
    const timestamp = now.toLocaleString().replace(',', ''); // Formatting timestamp
    const logEntry = code !== null
        ? `${timestamp}, ${status}, Code: ${code}\n`
        : `${timestamp}, ${status}\n`;

    try {
        const fileExists = await RNFS.exists(path);
        if (!fileExists) {
            await RNFS.writeFile(path, 'Date, Result, Scanned Code\n', 'utf8');
        }
        await RNFS.appendFile(path, logEntry, 'utf8');
    } catch (error) {
        console.error('Failed to log scan result:', error);
    }
  };

  // Logging scanned code result to file
  const logSecondaryScanResult = async (status, code = null) => {
    const serialNumber = await AsyncStorage.getItem('serialNumber');
    const fileName = `${serialNumber}_SecCameraLog.txt`;
    const path = `${RNFS.DownloadDirectoryPath}/${fileName}`;
    const now = new Date();
    const timestamp = now.toLocaleString().replace(',', ''); // Formatting timestamp
    const logEntry = code !== null
        ? `${timestamp}, ${status}, Code: ${code}\n`
        : `${timestamp}, ${status}\n`;

    try {
        const fileExists = await RNFS.exists(path);
        if (!fileExists) {
            await RNFS.writeFile(path, 'Date, Result, Scanned Code\n', 'utf8');
        }
        await RNFS.appendFile(path, logEntry, 'utf8');
    } catch (error) {
        console.error('Failed to log scan result:', error);
    }
  };

//----------------------------------------------------------------------------------------------------------------
//------------------------------------BACKUP LOGGING--------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------

const { ContentResolverModule } = NativeModules;
const { backupDirectoryUri, backupStatus, setBackupDirectoryUri, updateBackupStatus } = useContext(BackupDirectoryContext);
const [cloudBackupStatus, setCloudBackupStatus] = useState('notSelected'); // 'normal', 'failed', 'notSelected'
const [cloudUploading, setCloudUploading] = useState(false); // Track if currently uploading to cloud
const [isBlinkOn, setIsBlinkOn] = useState(false);

// Determine icon color based on backupStatus
let iconColor;
switch (backupStatus) {
  case 'normal':
    iconColor = '#00B294';  // Green
    break;
  case 'notSelected':
    iconColor = '#FFD700';  // Yellow
    break;
  case 'failed':
    iconColor = '#F44336';  // Red
    break;
  default:
    iconColor = 'gray';
    break;
}

// Determine icon color for cloud backup
let cloudIconColor;
if (cloudUploading) {
  // While uploading, choose two colors to blink between:
  cloudIconColor = isBlinkOn ? '#00B294' : '#FFD700';
} else {
  switch (cloudBackupStatus) {
    case 'normal':
      cloudIconColor = '#00B294';  // Green
      break;
    case 'notSelected':
      cloudIconColor = '#FFD700';  // Yellow
      break;
    case 'failed':
      cloudIconColor = '#F44336';  // Red
      break;
    default:
      cloudIconColor = 'gray';
      break;
  }
}

// Update backupStatus when backupDirectoryUri changes
useEffect(() => {
  if (!backupDirectoryUri) {
    updateBackupStatus('notSelected');
  }
}, [backupDirectoryUri]);

// Use effect to handle blinking when cloudUploading is true
useEffect(() => {
  let interval;
  if (cloudUploading) {
    interval = setInterval(() => {
      setIsBlinkOn(prev => !prev);
    }, 500); // Blink every 500ms
  } else {
    // Ensure blink is off when not uploading
    setIsBlinkOn(false);
  }

  return () => {
    if (interval) clearInterval(interval);
  };
}, [cloudUploading]);

const pickBackupDirectory = async () => {
  try {
    const res = await DocumentPicker.pickDirectory();
    console.log('Selected directory URI: ', res.uri);

    // Store the selected URI in the context
    setBackupDirectoryUri(res.uri);
    updateBackupStatus('normal'); // Update status when directory is selected
  } catch (err) {
    if (DocumentPicker.isCancel(err)) {
      console.log('User canceled the picker');
    } else {
      console.error('Error picking directory:', err);
      updateBackupStatus('failed'); // Update status if directory selection fails
    }
  }
};

const backupTxtFilesToSDCard = async () => {
  try {
    if (!backupDirectoryUri) {
      console.warn('No backup directory selected.');
      updateBackupStatus('notSelected');
      return;
    }

    // Get the Downloads directory path using RNFetchBlob
    const downloadsPath = RNFetchBlob.fs.dirs.DownloadDir;

    // List all files in the Downloads directory
    const files = await RNFetchBlob.fs.ls(downloadsPath);

    // Filter out only .txt files
    const txtFiles = files.filter(file => file.endsWith('.txt'));

    if (txtFiles.length === 0) {
      console.warn('No .txt files found in the Downloads directory.');
      updateBackupStatus('failed'); // No files to backup
      return;
    }

    // Loop through each .txt file and copy it to the selected directory
    for (const fileName of txtFiles) {
      const sourcePath = `${downloadsPath}/${fileName}`;

      // Read the content of each .txt file
      const fileContent = await RNFetchBlob.fs.readFile(sourcePath, 'utf8');

      // Save the .txt file to the selected directory using the ContentResolverModule
      await ContentResolverModule.saveTxtFile(backupDirectoryUri, fileName, fileContent);
      console.log(`File ${fileName} backed up successfully to the backup directory.`);
    }

    console.log('All .txt files have been backed up successfully!');
    updateBackupStatus('normal'); // Backup was successful
  } catch (error) {
    console.error('Failed to back up .txt files to the SD card:', error);
    updateBackupStatus('failed'); // Backup failed
  }
};

const backupTxtFilesToSupabase = async () => {
//  await summarizeLogs(); // Summarize the logs before backup
  try {
    setCloudUploading(true); // Start blinking when uploading begins
    const serialNumber = await AsyncStorage.getItem('serialNumber');
    const downloadsPath = RNFS.DownloadDirectoryPath;
    const files = await RNFS.readDir(downloadsPath);

    // Filter for .txt files and exclude .trashed files
    const txtFiles = files.filter(
      (file) => file.name.endsWith('.txt') && !file.name.includes('.trashed')
    );

    if (txtFiles.length === 0) {
      console.warn('No .txt files found in the Downloads directory.');
      setCloudBackupStatus('failed'); // No files to backup to Supabase
      return;
    }

    for (const file of txtFiles) {
      const { path, name } = file;
      try {
        // Read file as Base64
        const base64Data = await RNFS.readFile(`file://${path}`, 'base64');
        if (!base64Data) {
          console.error(`Failed to create Base64 content for file: ${name}`);
          setCloudBackupStatus('failed');
          continue;
        }

        console.log(`Uploading file ${name} to folder ${serialNumber}...`);

        // Convert Base64 to Buffer and upload to Supabase
        const fileBuffer = Buffer.from(base64Data, 'base64');
        const { data, error } = await supabase.storage
          .from('backup') // Replace with your bucket name
          .upload(`${serialNumber}/${name}`, fileBuffer, {
            contentType: 'text/plain', // Ensure correct content type
            upsert: true, // Allow overwrites
          });

        if (error) {
          console.error(`Failed to upload file ${name}:`, error.message);
          setCloudBackupStatus('failed');
          return Promise.reject(error);
        } else {
          console.info(`File ${name} uploaded successfully to Supabase.`);
        }
      } catch (fileError) {
        console.error(`Error reading or uploading file ${name}:`, fileError);
        setCloudBackupStatus('failed');
        return Promise.reject(fileError);
      }
    }
    // If all uploads succeeded
    setCloudBackupStatus('normal');
  } catch (error) {
    console.error('Error during file backup to Supabase:', error);
    setCloudBackupStatus('failed');
    return Promise.reject(error);
  } finally {
    // Stop blinking once done (success or fail)
    setCloudUploading(false);
  }
};

//----------------------------------------------------------------------------------------------------------------
//------------------------------------TEST FUNCTIONS--------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------


  // Proceed with tests after device selection
  const handleDeviceSelection = async () => {
    if (!selectedDevice1 && !selectedDevice2 && !selectedDevice3) {
      Alert.alert("No Device Selected", "Please select a device.");
      return;
    }
    try {
  //    await verifyStoredDevice(selectedDevice); // Verify the selected device
      setIsPickerModalVisible(false); // Close the modal
  //    startSelectedTests(); // Proceed with the tests
    } catch (error) {
      Alert.alert("Verification Failed", "Selected device verification failed.");
    }
  };
  
  useEffect(() => {
    if (selectedTests.includes("Accessory Test")) {
      fetchUsbDevices();
    }
  }, [selectedTests, fetchUsbDevices]);

  // Function to start all selected tests
  const startSelectedTestsWithCheck = async () => {
    resetTotals(); // Reset the totals before starting tests

    if (selectedTests.includes("Accessory Test") && !selectedDevice1 && !selectedDevice2 && !selectedDevice3) {
      // Show modal for device selection
      setIsPickerModalVisible(true);
      return; // Wait for user interaction
    }
    
    if (!usbUri && selectedTests.includes('USB Test')) {
      // USB directory is not selected, ask the user to select it
      Alert.alert(
        'Select USB Test Directory',
        'Please select a USB test directory before starting the tests.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Choose USB Test Directory',
            onPress: async () => {
              await checkUSBPresence();  // Let the user pick the USB directory
              if (usbUri) {
                startSelectedTests();  // Proceed with tests if USB directory is set
              }
            }
          }
        ],
        { cancelable: true }
      );
      return;  // Stop further execution until the directory is chosen
    }

    if (!backupDirectoryUri) {
      // Backup directory is not selected, ask the user to select it
      Alert.alert(
        'Select Local Backup Directory',
        'Please select a local backup directory before starting the tests.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Proceed without Local Backup',  // The third option
            onPress: () => {
              startSelectedTests();  // Proceed with tests without setting a backup directory
            },
            style: 'destructive'  // Optional: You can make this red or another style
          },
          {
            text: 'Choose Directory',
            onPress: async () => {
              await pickBackupDirectory();  // Let the user pick the backup directory
              if (backupDirectoryUri) {
                startSelectedTests();  // Proceed with tests if backup directory is set
              }
            }
          }
        ],
        { cancelable: true }
      );
      return;  // Stop further execution until the directory is chosen
    }
    startSelectedTests();  // Proceed if backup directory is already set
  };

  // Function that proceeds with the tests after the directory is selected
  const startSelectedTests = async () => {
    setModalVisible(false);
  //  setIsCountdownOn(false);
    setDisableButton(true);
    setIsTestOn(true);
    setIsAnyTestEnabled(true);
    setScannedMainCode([]); // Clear any previous scanned code
    setScannedSecondaryCode([]); // Clear any previous scanned code
    setTestResults([]);
    setCompletedTests(0);
    setTimer(null);

    console.group('TESTS BEGIN:');

    const incrementProgress = () => setCompletedTests((prev) => prev + 1);

    // Start Touch Test
    if (selectedTests.includes('Touch Test')) {
      console.info('Starting Touch Test...');
    //  toggleMonitoring(); // Start monitoring touch events
      incrementProgress();
    }

    // Audio Test
    if (selectedTests.includes('Audio Test')) {
      console.info('Starting Audio test...');
      try {
        await runMinimalAudioTest();
        setTestResults(prev => [...prev, { name: "Audio Test", result: true }]);
        console.info('Audio test completed successfully.');
      } catch (error) {
        setTestResults(prev => [...prev, { name: "Audio Test", result: false }]);
        console.warn('Audio test failed:', error.message);
      }
      incrementProgress();
    }

    // Backlight Test
    if (selectedTests.includes('Backlight Test')) {
      console.info('Starting Backlight test...');
      try {
        await changeBacklight();
        setTestResults(prev => [...prev, { name: "Backlight Test", result: true }]);
        console.info('Backlight test completed successfully.');
      } catch (error) {
        setTestResults(prev => [...prev, { name: "Backlight Test", result: false }]);
        console.warn('Backlight test failed:', error.message);
      }
      incrementProgress();
    }

    // Bluetooth Test
    if (selectedTests.includes('Bluetooth Test')) {
      console.info('Starting Bluetooth test...');
      try {
        await startBluetoothScan();
        setTestResults(prev => [...prev, { name: "Bluetooth Test", result: true }]);
        console.info('Bluetooth test completed successfully.');
      } catch (error) {
        setTestResults(prev => [...prev, { name: "Bluetooth Test", result: false }]);
        console.warn('Bluetooth test failed:', error.message);
      }
      incrementProgress();
    }

    // Cellular Test
    if (selectedTests.includes('Cellular Test')) {
      console.info('Starting Cellular test...');
      try {
        await runCellularCommand();
        setTestResults(prev => [...prev, { name: "Cellular Test", result: true }]);
        console.info('Cellular test completed successfully.');
      } catch (error) {
        setTestResults(prev => [...prev, { name: "Cellular Test", result: false }]);
        console.warn('Cellular test failed:', error.message);
      }
      incrementProgress();
    }

    // Main Camera Test
    if (selectedTests.includes('Main Camera Test')) {
      console.info('Starting Main Camera test...');
      setShowMainCamera(true); // Show the main camera view

      try {
        // Wait for code to be scanned or timeout after 10 seconds
        const code = await new Promise((resolve, reject) => {
          const startTime = Date.now();
          const interval = setInterval(() => {
              if (testResults[{ name: 'Main Camera Test', result: true }]) {
                  // If the test results are true, resolve the promise with scannedMainCode
                  clearInterval(interval);
                  resolve(scannedMainCodeRef.current); // Use the ref to get the latest value of scannedMainCode
                  console.log('Main Camera test: resolve scannedMainCode:', scannedMainCodeRef.current);
              } else if ((Date.now() - startTime >= 10000) && (scannedMainCodeRef.current.length === 0)) {
                  // If 10 seconds have passed, check if scannedMainCode is empty
                  clearInterval(interval);
                  reject(new Error('Timeout waiting for code scan'));
                  logMainScanResult('FAIL', 'Timeout waiting for code scan');
                  console.log('CUSTOMHEADER: Main Camera Test: FAIL', scannedMainCodeRef.current);
              } else if ((Date.now() - startTime >= 10000) && (scannedMainCodeRef.current.length > 0)) {
                  // If 10 seconds have passed and scannedMainCode is not empty, resolve with scannedMainCode
                  clearInterval(interval);
                  resolve(scannedMainCodeRef.current);
                  logMainScanResult('PASS', scannedMainCodeRef.current);
                  console.log('CUSTOMHEADER: Main Camera Test: PASS', scannedMainCodeRef.current);
              }
          }, 100); // Check every 100ms
      });

      setTestResults((prev) => [...prev, { name: 'Main Camera Test', result: true }]);
      console.info('Main Camera test completed successfully. Code:', code);
    } catch (error) {
      setTestResults((prev) => [...prev, { name: 'Main Camera Test', result: false }]);
      console.warn('Main Camera test failed:', error.message);
    }
      setShowMainCamera(false); // Hide the main camera view
      setScannedMainCode([]); // Clear the scanned code
      incrementProgress();
    }

    // Secondary Camera Test
    if (selectedTests.includes('Secondary Camera Test')) {
      console.info('Starting Secondary Camera test...');
      setShowSecondaryCamera(true); // Show the secondary camera view

      try {
        // Wait for code to be scanned or timeout after 10 seconds
        const code = await new Promise((resolve, reject) => {
          const startTime = Date.now();
          const interval = setInterval(() => {
              if (testResults[{ name: 'Secondary Camera Test', result: true }]) {
                  // If the test results are true, resolve the promise with scannedSecondaryCode
                  clearInterval(interval);
                  resolve(scannedSecondaryCodeRef.current); // Use the ref to get the latest value of scannedSecondaryCode
                  console.log('Secondary Camera test: resolve scannedSecondaryCode:', scannedSecondaryCodeRef.current);
              } else if ((Date.now() - startTime >= 10000) && (scannedSecondaryCodeRef.current.length === 0)) {
                  // If 10 seconds have passed, check if scannedSecondaryCode is empty
                  clearInterval(interval);
                  reject(new Error('Timeout waiting for code scan'));
                  logSecondaryScanResult('FAIL', 'Timeout waiting for code scan');
                  console.log('CUSTOMHEADER: Secondary Camera Test: FAIL', scannedSecondaryCodeRef.current);
              } else if ((Date.now() - startTime >= 10000) && (scannedSecondaryCodeRef.current.length > 0)) {
                  // If 10 seconds have passed and scannedSecondaryCode is not empty, resolve with scannedSecondaryCode
                  clearInterval(interval);
                  resolve(scannedSecondaryCodeRef.current);
                  logSecondaryScanResult('PASS', scannedSecondaryCodeRef.current);
                  console.log('CUSTOMHEADER: Secondary Camera Test: PASS', scannedSecondaryCodeRef.current);
              }
          }, 100); // Check every 100ms
      });

      setTestResults((prev) => [...prev, { name: 'Secondary Camera Test', result: true }]);
      console.info('Secondary Camera test completed successfully. Code:', code);
    } catch (error) {
      setTestResults((prev) => [...prev, { name: 'Secondary Camera Test', result: false }]);
      console.warn('Secondary Camera test failed:', error.message);
    }
      setShowSecondaryCamera(false); // Hide the secondary camera view
      setScannedSecondaryCode([]); // Clear the scanned code
      incrementProgress();
    }

    // GPS Test
    if (selectedTests.includes('GPS Test')) {
      console.info('Starting GPS test...');
      try {
        await startLocationFetch();
        setTestResults(prev => [...prev, { name: "GPS Test", result: true }]);
        console.info('GPS test completed successfully.');
      } catch (error) {
        setTestResults(prev => [...prev, { name: "GPS Test", result: false }]);
        console.warn('GPS test failed:', error.message);
      }
      incrementProgress();
    }

    // NFC Test
    if (selectedTests.includes('NFC Test')) {
      console.info('Starting NFC test...');
      try {
        await startNFCTest();
        setTestResults(prev => [...prev, { name: "NFC Test", result: true }]);
        console.info('NFC test completed successfully.');
      } catch (error) {
        setTestResults(prev => [...prev, { name: "NFC Test", result: false }]);
        console.warn('NFC test failed:', error.message);
      }
      incrementProgress();
    }

    // Power Metrics
    if(selectedTests.includes('Power Metrics')) {
      console.info('Starting Power Metrics fetch...');
      try {
        await fetchMetrics();
        setTestResults(prev => [...prev, { name: "Power Metrics", result: true }]);
        console.info('Power Metrics fetch completed successfully.');
      } catch (error) {
        setTestResults(prev => [...prev, { name: "Power Metrics", result: false }]);
        console.warn('Power Metrics fetch failed:', error.message);
      }
      incrementProgress();
    }

    // Thermal Service
    if(selectedTests.includes('ThermalService')) {
      console.info('Starting Thermal Service fetch...');
      try {
        await runThermalCommand();
        setTestResults(prev => [...prev, { name: "ThermalService", result: true }]);
        console.info('Thermal Service fetch completed successfully.');
      } catch (error) {
        setTestResults(prev => [...prev, { name: "ThermalService", result: false }]);
        console.warn('Thermal Service fetch failed:', error.message);
      }
      incrementProgress();
    }

    // USB Test
    if (selectedTests.includes('USB Test')) {
      console.info('Starting USB test...');
      try {
        await startUSBTest();
        setTestResults(prev => [...prev, { name: "USB Test", result: true }]);
        console.info('USB test completed successfully.');
      } catch (error) {
        setTestResults(prev => [...prev, { name: "USB Test", result: false }]);
        console.warn('USB test failed:', error.message);
      }
      incrementProgress();
    }

    // Vibration Test
    if (selectedTests.includes('Vibration Test')) {
      console.info('Starting Vibration test...');
      try {
        await triggerVibration();
        setTestResults(prev => [...prev, { name: "Vibration Test", result: true }]);
        console.info('Vibration test completed successfully.');
      } catch (error) {
        setTestResults(prev => [...prev, { name: "Vibration Test", result: false }]);
        console.warn('Vibration test failed:', error.message);
      }
      incrementProgress();
    }

    // WLAN Test
    if (selectedTests.includes('WLAN Test')) {
      console.info('Starting WLAN test...');
      try {
        await startScan();
        setTestResults(prev => [...prev, { name: "WLAN Test", result: true }]);
        console.info('WLAN test completed successfully.');
      } catch (error) {
        setTestResults(prev => [...prev, { name: "WLAN Test", result: false }]);
        console.warn('WLAN test failed:', error.message);
      }
      incrementProgress();
    }

    // ADB Hardware Test
    if (selectedTests.includes('AdbCommand')) {
      console.info('Starting ADB Hardware test...');
      try {
        await runHardwareCheck();
        setTestResults(prev => [...prev, { name: "AdbCommand", result: true }]);
        console.info('ADB Hardware test completed successfully.');
      } catch (error) {
        setTestResults(prev => [...prev, { name: "AdbCommand", result: false }]);
        console.warn('ADB Hardware test failed:', error.message);
      }
      incrementProgress();
    }
    
    // Sensor Service Test
    if (selectedTests.includes('Sensor Service Test')) {
      console.info('Starting Sensor Service test...');
      try {
        await fetchSensorInfo();
        setTestResults((prev) => [...prev, { name: "Sensor Service Test", result: true }]);
        console.info('Sensor Service test completed successfully.');
      } catch (error) {
        setTestResults((prev) => [...prev, { name: "Sensor Service Test", result: false }]);
        console.warn('Sensor Service test failed:', error.message);
      }
      incrementProgress();
    }

    // Accessory Test
    if (selectedTests.includes('Accessory Test')) {
      console.info('Starting Accessory test...');

      // Handle selectedDevice1
      if (selectedDevice1) {
        try {
          await verifyStoredDevice(selectedDevice1);
          setTestResults((prev) => [
            ...prev,
            { name: `Accessory Test - ${selectedDevice1.name}`, result: true },
          ]);
          console.info(`Accessory Test - ${selectedDevice1.name} completed successfully.`);
        } catch (error) {
          const deviceName = error?.deviceName || selectedDevice1.name || "Unknown Device";
          const errorMessage = error?.message || "An unknown error occurred.";
          setTestResults((prev) => [
            ...prev,
            { name: `Accessory Test - ${deviceName}`, result: false },
          ]);
          console.warn(`Accessory Test - ${deviceName} failed:`, errorMessage);
        }
      }

      // Handle selectedDevice2
      if (selectedDevice2) {
        try {
          await verifyStoredDevice(selectedDevice2);
          setTestResults((prev) => [
            ...prev,
            { name: `Accessory Test - ${selectedDevice2.name}`, result: true },
          ]);
          console.info(`Accessory Test - ${selectedDevice2.name} completed successfully.`);
        } catch (error) {
          const deviceName = error?.deviceName || selectedDevice2.name || "Unknown Device";
          const errorMessage = error?.message || "An unknown error occurred.";
          setTestResults((prev) => [
            ...prev,
            { name: `Accessory Test - ${deviceName}`, result: false },
          ]);
          console.warn(`Accessory Test - ${deviceName} failed:`, errorMessage);
        }
      }

      // Handle selectedDevice3
      if (selectedDevice3) {
        try {
          await verifyStoredDevice(selectedDevice3);
          setTestResults((prev) => [
            ...prev,
            { name: `Accessory Test - ${selectedDevice3.name}`, result: true },
          ]);
          console.info(`Accessory Test - ${selectedDevice3.name} completed successfully.`);
        } catch (error) {
          const deviceName = error?.deviceName || selectedDevice3.name || "Unknown Device";
          const errorMessage = error?.message || "An unknown error occurred.";
          setTestResults((prev) => [
            ...prev,
            { name: `Accessory Test - ${deviceName}`, result: false },
          ]);
          console.warn(`Accessory Test - ${deviceName} failed:`, errorMessage);
        }
      }

      console.info('Accessory test completed.');
      incrementProgress();
    }

    // CPIN Test
    if (selectedTests.includes('CPIN Test')) {
      console.info('Starting CPIN test...');
      try {
        await logCPINData();
        setTestResults(prev => [...prev, { name: "CPIN Test", result: true }]);
        console.info('CPIN test completed successfully.');
      } catch (error) {
        setTestResults(prev => [...prev, { name: "CPIN Test", result: false }]);
        console.warn('CPIN test failed:', error.message);
      }
      incrementProgress();
    }
    await summarizeLogs(); // Summarize the logs before backup
    startCountdown(); // Start the countdown after tests are completed
    setDisableButton(false); // Enable buttons after tests are completed
    setTimeout(() => setIsAnyTestEnabled(false), 1000); // Delay group end for better readability
    try {
      // Backup .txt files to Supabase after tests are completed
      console.info('Backing up .txt files to Supabase...');
      await backupTxtFilesToSupabase();
      console.info('Backup to Supabase completed successfully.');
    } catch (error) {
      console.error('Failed to back up files to Supabase:', error);
      backupTxtFilesToSDCard(); // Backup .txt files to SD card after tests are completed
      console.log('Starting backup to SD card...');
    }
    console.info('TESTS END.');
    console.groupEnd();
  };

//----------------------------------------------------------------------------------------------------------------
//------------------------------------TESTS END-------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------

  // Function to handle stopping the tests
  const handleStopTests = () => {
    Alert.alert('Tests Stopping', 'The ongoing tests will stop at round end.');
    setTimeout(() =>
   //   setIsAnyTestEnabled(false),
      setStopCalled(true),
      setIsTestOn(false),
      1000); // Stop after delay
  //  setTestResults([]); // Clear test results
  //  setCompletedTests(0); // Reset completed tests count
  //  setSelectedTests([]); // Clear selected tests
  //  setTimer(null); // Clear any existing timer
  };

  // Handle long press start (for stopping tests)
  const handleLongPressStart = () => {
    const timeoutId = setTimeout(() => {
      handleStopTests(); // Stop the tests after a long press
    }, 1500); // Long press duration (1.5 seconds)
    setLongPressTimeoutId(timeoutId);
  };

  // Handle long press end (for stopping tests)
  const handleLongPressEnd = () => {
    if (longPressTimeoutId) {
      clearTimeout(longPressTimeoutId); // Clear timeout if the button is released early
      setLongPressTimeoutId(null);
    }
  };

  // Timer logic to schedule test rounds
  const startCountdown = () => {
    if (selectedTests.length > 0) {
      setIsCountdownOn(true); // Mark that countdown is running
      setTimer(timerDurations[timerIndex]); // Start the countdown
    } else {
      setIsCountdownOn(false); // Ensure countdown is marked as off
      setTimer(null);
    }
  };

  useEffect(() => {
    let interval;
    if (timer !== null && selectedTests.length > 0) {
      interval = setInterval(() => {
        setTimer(prevTimer => {
          if (prevTimer - 1 <= 0) {
            clearInterval(interval);
            if (isTestOn && selectedTests.length > 0) {
            startSelectedTests(); // Restart tests after countdown
            }
            setIsCountdownOn(false); // Mark that countdown is finished
            return null;
          }
          return prevTimer - 1;
        });
      }, 1000);
    } else {
      // Clear any existing interval if the timer is null
      clearInterval(interval);
      setTimer(null);
    }

    return () => clearInterval(interval);
  }, [timer]);

  // Display the timer on the screen
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Calculate the progress percentage
  const progress = completedTests / selectedTests.length;

//----------------------------------------------------------------------------------------------------------------
//------------------------------------RENDER COMPONENT------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------

return (
  <View style={styles.headerContainer}>
    {/* Title or progress bar on the left */}
    <View style={styles.titleContainer}>
      {isAnyTestEnabled ? (
        <ProgressBar progress={progress} color="gray" style={styles.progressBar} />
      ) : (
        <Text style={styles.headerTitle}>
          {timer !== null ? formatTime(timer) : 'WidgetWiz'}
        </Text>
      )}
    </View>
    {shouldShowSettingsIcon && (
      <View style={[styles.iconContainer, { left: iconLeftPosition }]}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={isAnyTestEnabled ? null : iconAction}
          onLongPress={isTestOn && isAnyTestEnabled ? handleLongPressStart : null}
          onPressOut={isTestOn && isAnyTestEnabled ? handleLongPressEnd : null}
        >
          <Icon name={iconName} reverse size={20} color="#0078D7" />
        </TouchableOpacity>
      </View>
    )}

    {/* Right: Status Icon */}
    <View style={styles.statusIconContainer}>
    <TouchableOpacity
          onPress={pickBackupDirectory}
          disabled={isAnyTestEnabled}
        >
      <Icon name="drive-folder-upload"
            reverse
            size={14}
            color={iconColor}
      />
    </TouchableOpacity>
    {/* Cloud backup icon */}
    <Icon
        name="cloud-upload"
        reverse
        size={14}
        color={cloudIconColor} // Cloud backup icon color
      />
    {shouldShowSettingsIcon && (
      <View style={styles.testCountContainer}>
        <Text style={[styles.testCountText, { color: 'green', fontWeight: 'bold' }]}>{totalPassedTests}</Text>
        <Text style={[styles.testCountText, { color: 'red', fontWeight: 'bold' }]}>{totalFailedTests}</Text>
      </View>
    )}
      {/*
      <Icon
        name="check-circle"
        reverse
        size={14}
        color={statusIconColor}
      />
      */}
    </View>
    {/*
    <View style={styles.deviceIdContainer}>
        <DeviceIdInput disabled={isAnyTestEnabled} />
      </View>
    */}

    {/* Modal for selecting interval */}
    <Modal
      visible={isModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Interval Between Tests</Text>
          {timerDurations.map((duration, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.timerOption, timerIndex === index && styles.selectedOption]}
              onPress={() => setTimerIndex(index)}
            >
              <Text style={styles.timerText}>{duration / 60} min</Text>
            </TouchableOpacity>
          ))}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.startButton}
              onPress={startSelectedTestsWithCheck}
            >
              <Text style={styles.startText}>Start Tests</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    <Modal
        visible={isPickerModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsPickerModalVisible(false)}
      >
        <View style={styles.pickerModalContainer}>
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Accessories</Text>
            <Picker
              selectedValue={selectedDevice1}
              onValueChange={(itemValue) => setSelectedDevice1(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select device 1" value={null} color='white' />
              {devices.map((device, index) => (
                <Picker.Item key={index} label={device.name} value={device} />
              ))}
            </Picker>
            <Picker
              selectedValue={selectedDevice2}
              onValueChange={(itemValue) => setSelectedDevice2(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select device 2" value={null} color='white' />
              {devices.map((device, index) => (
                <Picker.Item key={index} label={device.name} value={device} />
              ))}
            </Picker>
            <Picker
              selectedValue={selectedDevice3}
              onValueChange={(itemValue) => setSelectedDevice3(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select device 3" value={null} color='white' />
              {devices.map((device, index) => (
                <Picker.Item key={index} label={device.name} value={device} />
              ))}
            </Picker>
            <View style={styles.pickerModalButtons}>
              <Button
                title="Cancel"
                onPress={() => setIsPickerModalVisible(false)}
                color="red"
              />
              <Button
                title="Select Device"
                onPress={handleDeviceSelection}
                color="green"
              />
            </View>
          </View>
        </View>
      </Modal>
  </View>
);
};

export default CustomHeader;

//----------------------------------------------------------------------------------------------------------------
//------------------------------------STYLESHEET------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------

// Styles for the custom header and modal
const styles = StyleSheet.create({
headerContainer: {
  position: 'relative',
  flexDirection: 'row',
  alignItems: 'center',
  width: '100%',
  height: 60,
  backgroundColor: 'white',
},
titleContainer: {
  flex: 1,
  justifyContent: 'center',
  paddingLeft: 10,
},
headerTitle: {
  fontSize: 24,
  fontWeight: 'bold',
  color: 'black',
},
iconContainer: {
  position: 'absolute',
  top: 0,
  height: '100%',
  justifyContent: 'center',
  alignItems: 'center',
},

iconAndDeviceIdContainer: {
  position: 'absolute', // Make it absolutely positioned
  right: ScreenWidth * 0.2, // Position 5% from the right
  flexDirection: 'row', // Display the icon and device ID in a row
  alignItems: 'center',
},
iconButton: {
  marginRight: (ScreenWidth / 2) - 150, // Add margin to the right
},
/*
deviceIdContainer: {
  flex: 1, // Take up equal space with the title and icon
  justifyContent: 'center', // Center the device ID input vertically
  alignItems: 'flex-end', // Align the device ID input to the right
  paddingRight: 125, // Add right padding
},
*/
statusIconContainer: {
  flex: 1,
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'flex-end',
  paddingRight: '15%',
  paddingLeft: '15%',
  marginRight: 10,
},
testCountContainer: {
  marginRight: -40,
  flexDirection: 'column',
  alignSelf: 'center',
},
progressBar: {
  height: 10,
  borderRadius: 5,
  width: '100%',
},
modalContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.7)', // Semi-transparent background
},
modalContent: {
  backgroundColor: '#1c1c1c',
  padding: 20,
  borderRadius: 10,
  alignItems: 'center',
  width: '80%', // Set width for modal content
  borderWidth: 1,
  borderColor: 'gray',
},
modalTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 20,
  color: 'white',
},
pickerModalContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.7)', // Semi-transparent background
},
pickerModalContent: {
  backgroundColor: 'gray',
  padding: 20,
  borderRadius: 10,
  alignItems: 'center',
  width: '80%', // Set width for modal content
  borderWidth: 1,
  borderColor: 'lightgray',
},
pickerModalTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 20,
  color: 'white',
},
picker: {
  width: '100%',
  color: 'white',
},
pickerModalButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  width: '100%',
  marginTop: 20,
},
timerOption: {
  padding: 10,
  borderWidth: 2,
  borderColor: '#0078D7',
  borderRadius: 5,
  marginBottom: 10,
  width: '100%',
  alignItems: 'center',
  backgroundColor: 'gray',
  color: 'white',
},
timerText: {
  color: 'white',
  fontSize: 16,
  fontWeight: 'bold',
},
selectedOption: {
  backgroundColor: '#0078D7',
},
buttonContainer: {
  flexDirection: 'row', // Arrange buttons in a row
  justifyContent: 'space-between', // Space between buttons
  width: '100%', // Full width for the container
  marginTop: 20, // Add margin to the top
},
startButton: {
  backgroundColor: '#00B294',
  padding: 10,
  borderRadius: 5,
  flex: 1, // Equal width for the start button
  alignItems: 'center',
  marginLeft: 10, // Add space between the buttons
},
startText: {
  color: 'white',
  fontSize: 18,
  fontWeight: 'bold',
},
cancelButton: {
  backgroundColor: '#FFF176',
  padding: 10,
  borderRadius: 5,
  flex: 1, // Equal width for the cancel button
  alignItems: 'center',
  marginRight: 10, // Add space between the buttons
},
cancelText: {
  color: 'gray',
  fontSize: 18,
  fontWeight: 'bold',
},
});

