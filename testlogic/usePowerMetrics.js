// usePowerMetrics.js
import { useState } from 'react';
import { NativeModules } from 'react-native';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper function to map battery status
const getBatteryStatusText = (status) => {
  switch (status) {
    case '1': return 'Unknown';
    case '2': return 'Charging';
    case '3': return 'Discharging';
    case '4': return 'Not Charging';
    case '5': return 'Full';
    default: return 'N/A';
  }
};

// Helper function to map battery health
const getBatteryHealthText = (health) => {
  switch (health) {
    case '1': return 'Unknown';
    case '2': return 'Good';
    case '3': return 'Overheat';
    case '4': return 'Dead';
    case '5': return 'Over voltage';
    case '6': return 'Unspecified failure';
    case '7': return 'Cold';
    default: return 'N/A';
  }
};

// Helper function to get the current timestamp
const getTimestamp = () => {
  const now = new Date();
  return now.toLocaleString();
};

// Hook for fetching power metrics
export const usePowerMetrics = () => {
  const [output, setOutput] = useState('');
  const [metrics, setMetrics] = useState({
    batteryPresent: 'N/A',
    batteryStatus: 'N/A',
    batteryHealth: 'N/A',
    batteryTemp: 'N/A',
    batteryVoltage: 'N/A',
    batteryCharge: 'N/A',
    batteryChargingCurrent: 'N/A', // Added batteryChargingCurrent
    batteryCapacity: 'N/A',
    plugType: 'Not Connected',
    chargingType: 'Not Connected',
    maxChargingCurrent: 'N/A',
    maxChargingVoltage: 'N/A',
    wattage: 'N/A',
    chargerSkinTemp: 'N/A',
    usbConnTemp: 'N/A',
    vbusVoltage: 'N/A',
    power: 'N/A',
    pui: 'N/A',
    uri: 'N/A',
  });

  const logMetricsToFile = async (passFailStatus) => {
    const serialNumber = await AsyncStorage.getItem('serialNumber');
    const fileName = `${serialNumber}_PowerMetricsLog.txt`;
    const path = `${RNFS.DownloadDirectoryPath}/${fileName}`;

    const timestamp = new Date().toLocaleString().replace(',', '');
    const header = 'Date, Result\n';
    const summaryLine = `${timestamp}, ${passFailStatus}\n`;

    const logEntry = `
Timestamp: ${getTimestamp()}
Battery Present: ${metrics.batteryPresent}
Battery Status: ${metrics.batteryStatus}
Battery Health: ${metrics.batteryHealth}
Battery Temp: ${metrics.batteryTemp} °C
Battery Voltage: ${metrics.batteryVoltage} V
Battery Charge: ${metrics.batteryCharge} mAh
Battery Charging Current: ${metrics.batteryChargingCurrent} A
Battery Capacity: ${metrics.batteryCapacity} %
Plug Type: ${metrics.plugType}
Charging Type: ${metrics.chargingType}
Max Charging Current: ${metrics.maxChargingCurrent} A
Max Charging Voltage: ${metrics.maxChargingVoltage} V
Max Charging Power: ${metrics.wattage} W
Real-Time Power Usage: ${metrics.power} W
PUI (Power Usage Indicator): ${metrics.pui} W/%
URI (Voltage-Current Ratio): ${metrics.uri} V/A
Charger Skin Temp: ${metrics.chargerSkinTemp} °C
USB Connection Temp: ${metrics.usbConnTemp} °C
VBUS Voltage: ${metrics.vbusVoltage} V
--------------------------------------------------------
`;

    try {
      const fileExists = await RNFS.exists(path);

      if (!fileExists) {
        // Create the file with a header if it doesn't exist
        await RNFS.writeFile(path, header, 'utf8');
      }

      // Read current content
      let currentContent = await RNFS.readFile(path, 'utf8');

      // Append the summary line and then the detailed log
      const newContent = currentContent + summaryLine + logEntry;

      await RNFS.writeFile(path, newContent, 'utf8');
      console.log('Metrics logged to file:', path);
    } catch (error) {
      console.error('Failed to log metrics to file:', error);
    }
  };

  const fetchMetrics = async () => {
    setOutput('Fetching power metrics...');
    try {
      const batteryInfo = await NativeModules.RootCommandModule.runAsRoot('dumpsys battery');

    // Fetch battery present status (supports both boolean and numerical values)
    const batteryPresentMatch = batteryInfo.match(/present: (\w+)/);
    const batteryPresent = batteryPresentMatch ? 
      (batteryPresentMatch[1] === 'true' || batteryPresentMatch[1] === '1' ? 'Yes' : 'No') : 'N/A';

    const batteryStatusMatch = batteryInfo.match(/status: (\d+)/);
    const batteryStatus = batteryStatusMatch ? getBatteryStatusText(batteryStatusMatch[1]) : 'Unknown';

    const batteryHealthMatch = batteryInfo.match(/health: (\d+)/);
    const batteryHealth = batteryHealthMatch ? getBatteryHealthText(batteryHealthMatch[1]) : 'Unknown';


      // Fetch the actual battery voltage
      const batteryVoltageResult = await NativeModules.RootCommandModule.runAsRoot('cat /sys/class/power_supply/battery/voltage_now');
      const batteryVoltage = batteryVoltageResult ? (parseInt(batteryVoltageResult) / 1000000).toFixed(3) : 'N/A';

      // Fetch the battery charge counter
      const batteryChargeResult = await NativeModules.RootCommandModule.runAsRoot('cat /sys/class/power_supply/battery/charge_counter');
      const batteryCharge = batteryChargeResult ? (parseInt(batteryChargeResult) / 1000).toFixed(2) : 'N/A';  // Convert uAh to mAh

      // Fetch the charger voltage (max charging voltage)
      const maxVoltageMatch = batteryInfo.match(/Max charging voltage: (\d+)/);
      const maxChargingVoltage = maxVoltageMatch ? (parseInt(maxVoltageMatch[1]) / 1000000).toFixed(3) : 'N/A';

      // Fetch the plug type based on charger voltage and dumpsys flags
      let plugType = 'Not Connected';
      let chargingType = 'Not Connected';

      // Check if any charger is connected
      if (batteryInfo.includes('AC powered: true') || batteryInfo.includes('USB powered: true') || batteryInfo.includes('Wireless powered: true')) {
        if (maxChargingVoltage === '12.000') {
          plugType = 'Charging Dock';
        } else if (maxChargingVoltage === '9.000') {
          plugType = 'USB Fast Charger';  // USB Fast Charger when voltage is 9V
        } else if (batteryInfo.includes('AC powered: true') || (maxChargingCurrent !== 'N/A' && parseFloat(maxChargingCurrent) >= 2)) {
          plugType = 'AC Charger';
        } else if (batteryInfo.includes('USB powered: true') || (maxChargingCurrent !== 'N/A' && parseFloat(maxChargingCurrent) <= 1.5)) {
          plugType = 'USB Port Charging';
        } else if (batteryInfo.includes('Wireless powered: true')) {
          plugType = 'Wireless Charger';
        }
      }

      // Fetch the max charging current
      const maxCurrentMatch = batteryInfo.match(/Max charging current: (\d+)/);
      const maxChargingCurrent = maxCurrentMatch ? (parseInt(maxCurrentMatch[1]) / 1000000).toFixed(3) : 'N/A';

      // Calculate Wattage (Power) from Max Charging Current and Max Charging Voltage
      const wattage = (maxChargingVoltage !== 'N/A' && maxChargingCurrent !== 'N/A')
        ? (maxChargingVoltage * maxChargingCurrent).toFixed(3)
        : 'N/A';

      // Determine charging type based on wattage or voltage
      if (batteryStatus === 'Charging' || batteryStatus === 'Full') {  
        if (maxChargingVoltage === '12.000') {
          chargingType = 'Charging Dock';
        } else if (wattage !== 'N/A' && parseFloat(wattage) >= 15) {
          chargingType = 'Fast Charging';  // Fast Charging for wattage >= 15W
        } else if (maxChargingVoltage === '9.000') {
          chargingType = 'USB Fast Charging';
        } else {
          chargingType = 'Normal Charging';
        }
      }

      const batteryTempResult = await NativeModules.RootCommandModule.runAsRoot('cat /sys/class/power_supply/battery/temp');
      const batteryTemp = batteryTempResult ? (parseInt(batteryTempResult) / 10).toFixed(1) : 'N/A';

      const currentResult = await NativeModules.RootCommandModule.runAsRoot('cat /sys/class/power_supply/battery/current_now');
      const batteryChargingCurrent = currentResult ? (parseInt(currentResult) / 1000000).toFixed(3) : 'N/A';

      const batteryCapacityResult = await NativeModules.RootCommandModule.runAsRoot('cat /sys/class/power_supply/battery/capacity');
      const batteryCapacity = batteryCapacityResult ? batteryCapacityResult.trim() : 'N/A';

      const chargerSkinTempResult = await NativeModules.RootCommandModule.runAsRoot('cat /sys/class/thermal/thermal_zone84/temp');
      const chargerSkinTemp = chargerSkinTempResult ? (parseInt(chargerSkinTempResult) / 1000).toFixed(1) : 'N/A';

      const usbConnTempResult = await NativeModules.RootCommandModule.runAsRoot('cat /sys/class/power_supply/usb/temp');
      const usbConnTemp = usbConnTempResult ? (parseInt(usbConnTempResult) / 10).toFixed(1) : 'N/A';

      const vbusVoltageResult = await NativeModules.RootCommandModule.runAsRoot('cat /sys/class/power_supply/usb/voltage_now');
      let vbusVoltage = vbusVoltageResult ? (parseInt(vbusVoltageResult) / 1000000).toFixed(3) : 'N/A';

      if (vbusVoltage < 3 || vbusVoltage > 20) {
        vbusVoltage = 'Invalid';
      }

      const power = (batteryVoltage !== 'N/A' && batteryChargingCurrent !== 'N/A')
        ? (batteryVoltage * batteryChargingCurrent).toFixed(3)
        : 'N/A';

      const pui = (power !== 'N/A' && batteryCapacity !== 'N/A' && batteryCapacity > 0)
        ? (power / batteryCapacity).toFixed(3)
        : 'N/A';

      const uri = (batteryVoltage !== 'N/A' && batteryChargingCurrent !== 'N/A' && batteryChargingCurrent > 0)
        ? (batteryVoltage / batteryChargingCurrent).toFixed(3)
        : 'N/A';

      setMetrics({
        batteryPresent,
        batteryStatus,
        batteryHealth,
        batteryTemp,
        batteryVoltage,
        batteryCharge,
        batteryChargingCurrent,
        batteryCapacity,
        plugType,
        chargingType,
        maxChargingCurrent,
        maxChargingVoltage,
        wattage,
        chargerSkinTemp,
        usbConnTemp,
        vbusVoltage,
        power,
        pui,
        uri,
      });

      await logMetricsToFile('PASS');
      setOutput('Power metrics fetched successfully.');
      return Promise.resolve();
    } catch (error) {
      await logMetricsToFile('FAIL');
      setOutput('Error fetching metrics: ' + error.message);
      return Promise.reject(error);
    }
  };

  return { output, metrics, fetchMetrics };
};
