import React, { useState } from 'react';
import { NativeModules } from 'react-native';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

const parseCellularData = (data) => {
  const parsedData = {
    signalStrength: 'Unavailable',
    networkType: 'No Network',
    operator: 'Unavailable',
    connectionStatus: 'Disconnected',
    dataUsage: '0.00 MB',
    pingStatus: 'N/A',
    pingRTT: 'N/A',
    pingResultDescription: 'Unknown', // New column for ping result
  };

  const lines = data.split('\n');
  let is5G = false;

  lines.forEach((line) => {
    line = line.trim();
    console.log('DEBUG - Line:', line);

    // Check for 5G indicators
    if (line.includes('mNr=CellSignalStrengthNr') || line.includes('ssRsrp')) {
      const ssRsrpMatch = line.match(/ssRsrp = (-?\d+)/);
      const ssRsrpValue = ssRsrpMatch ? parseInt(ssRsrpMatch[1], 10) : null;
      console.log('DEBUG - 5G ssRsrpValue:', ssRsrpValue);

      if (ssRsrpValue && ssRsrpValue !== 2147483647) {
        parsedData.signalStrength = `${ssRsrpValue} dBm`;
        parsedData.networkType = '5G';
        is5G = true;
      }
    }

    // LTE detection if 5G is not detected
    if (!is5G && line.includes('mSignalStrength=SignalStrength') && line.includes('rsrp=')) {
      const rsrpMatch = line.match(/rsrp=(-?\d+)/);
      const rsrpValue = rsrpMatch ? parseInt(rsrpMatch[1], 10) : null;
      console.log('DEBUG - LTE rsrpValue:', rsrpValue);

      if (rsrpValue && rsrpValue !== 2147483647) {
        parsedData.signalStrength = `${rsrpValue} dBm`;
        parsedData.networkType = 'LTE';
      }
    }

    // Operator Detection
    if (line.includes('DNA') || line.includes('elisa')) {
      const operatorMatch = line.includes('DNA') ? 'DNA' : 'elisa';
      parsedData.operator = operatorMatch;
    }

    // Data Usage
    if (line.includes('thresholdInBytes')) {
      const usageMatch = line.match(/thresholdInBytes=(\d+)/);
      parsedData.dataUsage = usageMatch ? `${(usageMatch[1] / 1e6).toFixed(2)} MB` : '0.00 MB';
    }

    // Ping Test Status
    if (line === 'Network Unreachable') {
      parsedData.pingStatus = 'FAIL';
      parsedData.pingRTT = 'N/A';
      parsedData.pingResultDescription = 'Network Unreachable';
    } else if (line.includes('time=')) {
      const rttMatch = line.match(/time=([\d.]+) ms/);
      parsedData.pingStatus = 'PASS';
      parsedData.pingRTT = rttMatch ? `${rttMatch[1]} ms` : 'Unknown';
      parsedData.pingResultDescription = 'Ping Successful';
      console.log('DEBUG - RTT from time= format:', parsedData.pingRTT);
    } else if (line.includes('rtt')) {
      const rttMatch = line.match(/rtt .*? = .*?\/([\d.]+)\/.*? ms/);
      parsedData.pingStatus = 'PASS';
      parsedData.pingRTT = rttMatch ? `${rttMatch[1]} ms` : 'N/A';
      parsedData.pingResultDescription = 'Ping Successful';
      console.log('DEBUG - RTT from rtt format:', parsedData.pingRTT);
    } else if (line === 'No Cellular Connection') {
      parsedData.pingStatus = 'FAIL';
      parsedData.pingRTT = 'N/A';
      parsedData.pingResultDescription = 'No Cellular Connection';
    }
  });

  console.log('DEBUG - Final Parsed Data:', parsedData);
  return parsedData;
};

const formatDataForLogging = (data) => {
  let logContent = `\n\n====== Cellular Data Log ======\n${new Date().toLocaleString()}\n\n`;

  logContent += `Signal Strength: ${data.signalStrength}\n`;
  logContent += `Network Type: ${data.networkType}\n`;
  logContent += `Operator: ${data.operator}\n`;
  logContent += `Connection Status: ${data.connectionStatus}\n`;
  logContent += `Data Usage: ${data.dataUsage}\n`;
  logContent += `Ping Test Status: ${data.pingStatus}\n`;
  logContent += `Ping RTT: ${data.pingRTT}\n`;
  logContent += `Ping Result Description: ${data.pingResultDescription}\n`; // New line for ping result description

  return logContent;
};

/*
const logHiddenModemData = async () => {
  try {
    const serialNumber = await AsyncStorage.getItem('serialNumber');
    const fileName = `${serialNumber}_ModemDataLog.txt`;
    const path = `${RNFS.DownloadDirectoryPath}/${fileName}`;

    const modemData = await NativeModules.RootCommandModule.runAsRoot('dumpsys telephony.registry');
    const timestamp = new Date().toLocaleString();

    const logContent = `\n\n====== Modem Data Log Entry ======\n${timestamp}\n${modemData}\n`;

    const fileExists = await RNFS.exists(path);
    let currentContent = '';
    if (fileExists) {
      currentContent = await RNFS.readFile(path, 'utf8');
    }

    const newContent = currentContent + logContent;
    await RNFS.writeFile(path, newContent, 'utf8');
    console.log('Hidden modem data logged to file:', path);
  } catch (error) {
    console.error('Failed to log hidden modem data:', error);
  }
};
*/
/*
const logCPINData = async () => {
  try {
    const serialNumber = await AsyncStorage.getItem('serialNumber');
    const fileName = `${serialNumber}_CPINLog.txt`;
    const path = `${RNFS.DownloadDirectoryPath}/${fileName}`;

    let logContent = `\n\n====== CPIN Data Log ======\n${new Date().toLocaleString()}\n`;

    await NativeModules.RootCommandModule.runAsRoot('stop vendor.ril-daemon');

    for (let i = 0; i < 5; i++) {
      try {
        const cpinResult = await NativeModules.RootCommandModule.runAsRoot(
          'echo -e "AT+CPIN?\\r" > /dev/ttyUSB2 && head -n 5 /dev/ttyUSB2'
        );

        logContent += `\n=== CPIN Attempt ${i + 1} ===\n${cpinResult}\n`;
        console.log(`CPIN Attempt ${i + 1} Result:`, cpinResult);
      } catch (error) {
        console.error(`CPIN Attempt ${i + 1} Failed:`, error);
        logContent += `\n=== CPIN Attempt ${i + 1} ===\nError: ${error.message}\n`;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    await NativeModules.RootCommandModule.runAsRoot('start vendor.ril-daemon');

    const fileExists = await RNFS.exists(path);
    let currentContent = '';
    if (fileExists) {
      currentContent = await RNFS.readFile(path, 'utf8');
    }
    const newContent = currentContent + logContent;

    await RNFS.writeFile(path, newContent, 'utf8');
    console.log('CPIN data logged to file:', path);
  } catch (error) {
    console.error('Failed to log CPIN data:', error);
  }
};
*/

const useCellularService = () => {
  const [parsedOutput, setParsedOutput] = useState(null);

  const logToFile = async (status, data) => {
    const serialNumber = await AsyncStorage.getItem('serialNumber');
    const fileName = `${serialNumber}_CellularLog.txt`;
    const path = `${RNFS.DownloadDirectoryPath}/${fileName}`;
    const header = 'Date, Result\n';
    const logEntry = formatDataForLogging(data);

    try {
      const fileExists = await RNFS.exists(path);

      let currentContent = '';
      if (!fileExists) {
        await RNFS.writeFile(path, header, 'utf8');
      }
      if (fileExists) {
        currentContent = await RNFS.readFile(path, 'utf8');
      }

      const timestamp = new Date().toLocaleString().replace(',', '');
      const summaryLine = `${timestamp}, ${status}\n`;

      const newContent = summaryLine + logEntry + currentContent;

      await RNFS.writeFile(path, newContent, 'utf8');

      console.log('Cellular data logged to file:', path);
    } catch (error) {
      console.error('Failed to log cellular data to file:', error);
    }
  };

  const runCellularCommand = async () => {
    await NativeModules.RootCommandModule.runAsRoot('svc wifi disable');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const signalStrength = await NativeModules.RootCommandModule.runAsRoot(
        'dumpsys telephony.registry | grep -i "SignalStrength"'
      );
      const networkType = await NativeModules.RootCommandModule.runAsRoot('getprop gsm.network.type');
      const operator = await NativeModules.RootCommandModule.runAsRoot('getprop gsm.operator.alpha');
      const connectionStatus = await NativeModules.RootCommandModule.runAsRoot(
        'dumpsys connectivity | grep -i "NetworkAgentInfo.*MOBILE.*connected"'
      );
      const dataUsage = await NativeModules.RootCommandModule.runAsRoot(
        'dumpsys netstats | grep -i "MOBILE.*thresholdInBytes"'
      );

      let hasInternetConnection =
        connectionStatus.includes('MOBILE') &&
        connectionStatus.includes('CONNECTED') &&
        connectionStatus.includes('extra: internet');
      let pingResult = 'No Cellular Connection';

      if (hasInternetConnection) {
        try {
          pingResult = await NativeModules.RootCommandModule.runAsRoot('ping -c 1 8.8.8.8');
        } catch (pingError) {
          pingResult = 'Network Unreachable';
        }
      }

      const result = `${signalStrength}\n${networkType}\n${operator}\n${connectionStatus}\n${dataUsage}\n${pingResult}`;
      const parsedData = parseCellularData(result);

      parsedData.connectionStatus = hasInternetConnection ? 'Connected' : 'Disconnected';

      setParsedOutput(parsedData);
      await logToFile(parsedData.pingStatus, parsedData);

  //    await logHiddenModemData();
    //  await logCPINData();

      if (parsedData.connectionStatus !== 'Connected') {
        throw new Error('No Cellular Connection');
      } else if (parsedData.pingStatus === 'FAIL') {
        throw new Error('Ping Test Failed');
      } else {
        return parsedData;
      }
    } catch (error) {
      console.error('Error:', error);
      throw error;
    } finally {
      await NativeModules.RootCommandModule.runAsRoot('svc wifi enable');
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  };

  return { parsedOutput, runCellularCommand };
};

export default useCellularService;