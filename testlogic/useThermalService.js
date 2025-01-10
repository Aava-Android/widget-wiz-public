import React, { useState } from 'react';
import { NativeModules, Alert } from 'react-native';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Function to handle IBAT and VBAT formatting
const formatIbatVbat = (name, value) => {
  if (name === 'ibat') {
    // Handle IBAT (current in mA)
    return `IBAT (Current): ${value} mA`;
  } else if (name === 'vbat') {
    // Handle VBAT (voltage in V)
    return `VBAT (Voltage): ${value} V`;
  } else {
    // For other temperature readings, retain Celsius
    return `${name}: ${value}°C`;
  }
};

// Function to parse the thermal data from the dumpsys output
const parseThermalData = (data) => {
  const parsedData = {
    cachedTemperatures: [],
    halTemperatures: [],
    coolingDevices: [],
  };
  const lines = data.split('\n');

  let currentSection = '';

  lines.forEach(line => {
    line = line.trim();

    if (line.includes('Cached temperatures:')) {
      currentSection = 'cached';
    } else if (line.includes('Current temperatures from HAL:')) {
      currentSection = 'hal';
    } else if (line.includes('Current cooling devices from HAL:')) {
      currentSection = 'cooling';
    } else if (line.startsWith('Temperature') && currentSection) {
      const tempMatch = line.match(/Temperature\{mValue=(.*?), mType=(.*?), mName=(.*?), mStatus=(.*?)\}/);
      if (tempMatch) {
        const [_, value, type, name] = tempMatch;
        parsedData[`${currentSection}Temperatures`].push({ value: parseFloat(value).toFixed(1), type, name });
      }
    } else if (line.startsWith('CoolingDevice') && currentSection === 'cooling') {
      const coolingMatch = line.match(/CoolingDevice\{mValue=(.*?), mType=(.*?), mName=(.*?)\}/);
      if (coolingMatch) {
        const [_, value, type, name] = coolingMatch;
        parsedData.coolingDevices.push({ value, type, name });
      }
    }
  });

  return parsedData;
};

// Function to format the thermal data for logging
const formatDataForLogging = (data) => {
  let logContent = `\n\n====== Thermal Data Log ======\n${new Date().toLocaleString()}\n\n`;

  logContent += 'Cached Temperatures:\n';
  data.cachedTemperatures.forEach((temp) => {
    logContent += `${formatIbatVbat(temp.name, temp.value)}\n`;
  });

  logContent += '\nCurrent HAL Temperatures:\n';
  data.halTemperatures.forEach((temp) => {
    logContent += `${formatIbatVbat(temp.name, temp.value)}\n`;
  });

  logContent += '\nCooling Devices:\n';
  data.coolingDevices.forEach((device) => {
    logContent += `${device.name} (Type ${device.type}): ${device.value}\n`;
  });

  return logContent;
};

const useThermalService = () => {
  const [parsedOutput, setParsedOutput] = useState(null);

  const logToFile = async (data, passFailStatus) => {
    const serialNumber = await AsyncStorage.getItem('serialNumber');
    const fileName = `${serialNumber}_ThermalLog.txt`;
    const path = `${RNFS.DownloadDirectoryPath}/${fileName}`;

    const timestamp = new Date().toLocaleString().replace(',', '');
    const header = 'Date, Result\n';
    const summaryLine = `${timestamp}, ${passFailStatus}\n`;

    const logEntry = formatDataForLogging(data);

    try {
      const fileExists = await RNFS.exists(path);
      if (!fileExists) {
        // If the file doesn't exist, create it with the header line
        await RNFS.writeFile(path, header, 'utf8');
      }

      const currentContent = await RNFS.readFile(path, 'utf8');

      // Append the summary line and the detailed log entry
      const newContent = currentContent + summaryLine + logEntry;
      await RNFS.writeFile(path, newContent, 'utf8');

      console.log('Thermals logged to file:', path);
    } catch (error) {
      console.error('Failed to log thermals to file:', error);
    }
  };

  // Function to run the dumpsys thermalservice command
  const runThermalCommand = async () => {
    try {
      const result = await NativeModules.RootCommandModule.runAsRoot('dumpsys thermalservice');
      const parsedData = parseThermalData(result);
      setParsedOutput(parsedData);
      console.log('Thermal data:', parsedData);

      // If we got here without an error, it's a PASS
      await logToFile(parsedData, 'PASS');
      return Promise.resolve(parsedData);
    } catch (error) {
      console.log('Error:', error);
      // On error, log FAIL
      await logToFile({}, 'FAIL');
      return Promise.reject(error);
    }
  };

  return { parsedOutput, runThermalCommand };
};

export default useThermalService;
