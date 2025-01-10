// useAccessoryTest.js
import { useState, useCallback } from "react";
import { NativeModules } from "react-native";
import RNFS from "react-native-fs";
import AsyncStorage from "@react-native-async-storage/async-storage";

const useAccessoryTest = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isTestingAllDevices, setIsTestingAllDevices] = useState(false);
  const [allTestResults, setAllTestResults] = useState([]);

  const parseUsbDevices = (usbOutput) => {
    const devicePattern = /name=(.*?)(\n|$)/g;
    const devices = [];
    let match;

    while ((match = devicePattern.exec(usbOutput)) !== null) {
      const name = match[1]?.trim() || "Unknown Name";
      if (name !== "null" && !name.startsWith("com.") && !name.startsWith("org.")) {
        devices.push({ name });
      }
    }
    return devices;
  };

  // Enhanced log function that logs PASS/FAIL line plus detailed message
  const logToFile = async (passFailStatus, message) => {
    try {
      const serialNumber = await AsyncStorage.getItem("serialNumber");
      const logFilePath = `${RNFS.DownloadDirectoryPath}/${serialNumber}_AccessoryLog.txt`;

      const timestamp = new Date().toLocaleString().replace(',', '');
      const header = 'Date, Result\n';
      const summaryLine = `${timestamp}, ${passFailStatus}\n`;
      const logEntry = `[${timestamp}] ${message}\n`;

      const fileExists = await RNFS.exists(logFilePath);

      if (!fileExists) {
        // Create file with header if it doesn't exist
        await RNFS.writeFile(logFilePath, header, 'utf8');
      }

      const currentContent = await RNFS.readFile(logFilePath, 'utf8');
      const newContent = currentContent + summaryLine + logEntry;

      await RNFS.writeFile(logFilePath, newContent, 'utf8');
    } catch (error) {
      console.error("Failed to write log entry:", error);
    }
  };

  // Fetch USB Devices
  const fetchUsbDevices = useCallback(async () => {
    setLoading(true);
    try {
      const usbOutput = await NativeModules.RootCommandModule.runAsRoot("dumpsys usb");
      const deviceList = parseUsbDevices(usbOutput);
      setDevices(deviceList);

      if (deviceList.length > 0) {
        await logToFile("PASS", `Fetched devices: ${JSON.stringify(deviceList)}`);
        setLoading(false);
        return Promise.resolve("PASS");
      } else {
        await logToFile("FAIL", "No USB devices found.");
        setLoading(false);
        return Promise.reject("FAIL");
      }
    } catch (error) {
      console.error("Error fetching USB devices:", error);
      setError("Failed to fetch USB devices.");
      await logToFile("FAIL", "Error fetching USB devices.");
      setLoading(false);
      return Promise.reject("FAIL");
    }
  }, []);

  // Verify a Stored Device
  const verifyStoredDevice = useCallback(async (storedDevice) => {
    setLoading(true);
    try {
      const usbOutput = await NativeModules.RootCommandModule.runAsRoot("dumpsys usb");
      const deviceList = parseUsbDevices(usbOutput);
      const isDeviceStillConnected = deviceList.some(
        (device) => device.name === storedDevice.name
      );

      const result = isDeviceStillConnected ? "PASS" : "FAIL";
      await logToFile(result, `Device verification result for ${storedDevice.name}: ${result}`);
      console.log("Stored device:", storedDevice);
      console.log("Device verification result:", result);

      setLoading(false);
      // Include device name in the test result
      return isDeviceStillConnected
        ? Promise.resolve({ deviceName: storedDevice.name, result: "PASS" })
        : Promise.reject({ deviceName: storedDevice.name, result: "FAIL" });
    } catch (error) {
      console.error("Error verifying stored device:", error);
      setError("Failed to verify the stored device.");
      await logToFile("FAIL", `Error verifying stored device ${storedDevice.name}.`);
      setLoading(false);
      return Promise.reject({ deviceName: storedDevice.name, result: "FAIL" });
    }
  }, []);

  /*
  const verifyAllDevices = async () => {
    if (devices.length === 0) {
      console.warn("No devices found.");
      return Promise.reject("No devices found.");
    }

    setIsTestingAllDevices(true);
    const results = [];

    for (const device of devices) {
      try {
        const result = await verifyStoredDevice(device);
        results.push({ deviceName: device.name, result: result.result });
        console.log(`Device ${device.name} verification: ${result.result}`);
      } catch (error) {
        results.push({ deviceName: device.name, result: "FAIL" });
        console.warn(`Device ${device.name} verification failed.`);
      }
    }

    setAllTestResults(results);
    setIsTestingAllDevices(false);

    // Return the results for the calling component to handle
    return Promise.resolve(results);
  };
  */

  return {
    devices,
    fetchUsbDevices,
    verifyStoredDevice,
  //  verifyAllDevices,
    loading,
    error,
  };
};

export default useAccessoryTest;
