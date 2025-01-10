// useWlanScan.js
import { useState, useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import WifiManager from 'react-native-wifi-reborn';
import { useCooldown } from '../contexts/CooldownContext'; // Assuming this context provides cooldown logic
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useWlanScan = () => {
  const [networks, setNetworks] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const { isCooldown, cooldownTime, startCooldown } = useCooldown();

    const requestWifiPermissions = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 23) {
        try {
          const permissions = [
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          ];
          const granted = await PermissionsAndroid.requestMultiple(permissions);
          const permissionsGranted = Object.values(granted).every((result) => result === PermissionsAndroid.RESULTS.GRANTED);
          if (!permissionsGranted) {
            console.warn("Required permissions not granted");
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

    const logWifiResult = async (status, networks = []) => {
      const serialNumber = await AsyncStorage.getItem('serialNumber');
      const fileName = `${serialNumber}_WiFiLog.txt`;
      const path = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      const now = new Date();
      // Getting a locale-specific format which inherently reflects the device's timezone
      const timestamp = now.toLocaleString().replace(',', ''); // Some locales may include commas
      const logEntry = networks.length > 0
        ? `${timestamp}, ${status}, ${networks.length} networks found\n`
        : `${timestamp}, ${status}\n`;

      try {
        const fileExists = await RNFS.exists(path);
        if (!fileExists) {
          await RNFS.writeFile(path, 'Date, Result, Details\n', 'utf8');
        }
        await RNFS.appendFile(path, logEntry, 'utf8');
      } catch (error) {
        console.error('Failed to log WiFi result:', error);
      }
    };

    const startScan = async () => {
      if (isCooldown) {
        console.warn(`Cooldown in effect. Please wait for ${cooldownTime} seconds.`);
        return Promise.reject(new Error("Cooldown in effect."));
      }

      const hasPermissions = await requestWifiPermissions();
      if (!hasPermissions) {
        console.error("FAIL: Required permissions not granted");
        setScanStatus('FAIL: Required permissions not granted');
        logWifiResult('FAIL: Required permissions not granted');
        setIsScanning(false);
        return Promise.reject(new Error("FAIL: Required permissions not granted"));
      }

      // Start the cooldown right before initiating the scan, assuming all checks have passed
      startCooldown();
      setIsScanning(true);
      setScanStatus('Scanning for WiFi networks...');
      console.info('Scanning for WiFi networks...');

      try {
        let availableNetworks = await WifiManager.reScanAndLoadWifiList();
        availableNetworks = availableNetworks.filter(network => network.SSID && network.SSID.trim() !== '');
        setNetworks(availableNetworks);
        const statusMessage = availableNetworks.length > 0 ? 'PASS' : 'FAIL';
        setScanStatus(statusMessage);
        logWifiResult(statusMessage, availableNetworks);
        console.log(statusMessage === 'PASS' ? 'PASS: WiFi networks found' : 'FAIL: No WiFi networks found', availableNetworks.length);
        return Promise.resolve(statusMessage);
      } catch (error) {
        console.error("FAIL: Error scanning for WiFi networks:", error.message);
        setScanStatus('FAIL', error);
        logWifiResult('FAIL: Error scanning for WiFi networks');
        return Promise.reject(new Error("FAIL: Error scanning for WiFi networks"));
      } finally {
        setIsScanning(false);
      }

    //  return Promise.resolve(scanStatus);
    };

  return { networks, isScanning, scanStatus, startScan, isCooldown, cooldownTime };
};

export default useWlanScan;
