// useBluetoothScan.js
import { useState, useEffect, useRef } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import RNFS from 'react-native-fs';
import { useCooldown } from '../contexts/CooldownContext'; // Assuming this context provides cooldown logic
import AsyncStorage from '@react-native-async-storage/async-storage';

const useBluetoothScan = () => {
    const [devices, setDevices] = useState([]);
    const devicesRef = useRef([]);
    const [isScanning, setIsScanning] = useState(false);
    const [scanStatus, setScanStatus] = useState('');
    const bleManager = useRef(null);
    const scanTimeoutRef = useRef(null);
    const { isCooldown, cooldownTime, startCooldown } = useCooldown();

  
    useEffect(() => {
      bleManager.current = new BleManager();
      return () => {
   //     bleManager.current.destroy();
        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current);
        }
      };
    }, []);

    const requestBluetoothPermissions = async () => {
      if (Platform.OS === 'android') {
        const permissions = [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
  
        if (Platform.Version >= 31) { // For Android 12 (API level 31) and above
          permissions.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
          permissions.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
        }
  
        for (const permission of permissions) {
          const granted = await PermissionsAndroid.request(permission);
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            return false;
          }
        }
      }
      return true;
    };

  const logBluetoothResult = async (status, devices = []) => {
    const serialNumber = await AsyncStorage.getItem('serialNumber');
    const fileName = `${serialNumber}_BluetoothLog.txt`;
    const path = `${RNFS.DownloadDirectoryPath}/${fileName}`;
    const now = new Date();
    // Getting a locale-specific format which inherently reflects the device's timezone
    const timestamp = now.toLocaleString().replace(',', ''); // Some locales may include commas
    const logEntry = devices.length > 0
      ? `${timestamp}, ${status}, ${devices.length} devices found\n`
      : `${timestamp}, ${status}\n`;

    try {
      const fileExists = await RNFS.exists(path);
      if (!fileExists) {
        await RNFS.writeFile(path, 'Date, Result, Details\n', 'utf8');
      }
      await RNFS.appendFile(path, logEntry, 'utf8');
    } catch (error) {
      console.error('Failed to log Bluetooth result:', error);
    }
  };

  const startScan = async () => {
    if (isCooldown) {
      console.warn(`Cooldown in effect. Please wait for ${cooldownTime} seconds.`);
      return Promise.reject(new Error("Cooldown in effect."));
    }
    if (isScanning) {
      failMessageScan = 'FAIL: Scan already in progress';
      setScanStatus(failMessageScan);
      logBluetoothResult(failMessageScan);
      console.warn(failMessageScan);
      return Promise.reject(new Error(failMessageScan));
    }
    const hasPermissions = await requestBluetoothPermissions();
    if (!hasPermissions) {
      failMessagePermission = 'FAIL: Required permissions not granted';
      setScanStatus(failMessagePermission);
      logBluetoothResult(failMessagePermission);
      console.error(failMessagePermission);
      return Promise.reject(new Error(failMessagePermission));
    }
    startCooldown();
    setIsScanning(true);
    devicesRef.current = [];
    setDevices([]);
    setScanStatus('Scanning for Bluetooth devices...');

    return new Promise((resolve, reject) => {
      bleManager.current.startDeviceScan(null, null, (error, device) => {
        if (error) {
          setIsScanning(false);
          setScanStatus('FAIL: Error scanning devices');
          bleManager.current.stopDeviceScan();
          console.error('FAIL: Error scanning devices:', error);
          reject('FAIL', error);
      //    logBluetoothResult('FAIL', error.message);
      //    return;
        }

        if (device) {
          const isNewDevice = !devicesRef.current.some((d) => d.id === device.id);
          if (isNewDevice) {
            devicesRef.current.push(device);
            setDevices([...devicesRef.current]);
          }
        }
      });

      scanTimeoutRef.current = setTimeout(() => {
        bleManager.current.stopDeviceScan();
        setIsScanning(false);
        const status = devicesRef.current.length > 0 ? 'PASS' : 'FAIL';
        setScanStatus(status);
        if(status === 'PASS') {
        resolve(status);
        } else if (status === 'FAIL') {
          reject(status);
        }
        logBluetoothResult(status);
        console.log(status === 'PASS' ? 'PASS: Bluetooth devices found:' : 'FAIL: No Bluetooth devices found:', devicesRef.current.length);
      }, 15000); // Adjust scan timeout as needed
    });
  };

  return { devices, isScanning, scanStatus, startScan, isCooldown, cooldownTime};
};

export default useBluetoothScan;
