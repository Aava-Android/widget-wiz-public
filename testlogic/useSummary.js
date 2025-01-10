import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';

const useSummary = () => {
    const summarizeLogs = async () => {
        try {
        const serialNumber = await AsyncStorage.getItem('serialNumber');
        const paths = [
            { path: `${RNFS.DownloadDirectoryPath}/${serialNumber}_AudioLog.txt`, type: 'audio' },
            { path: `${RNFS.DownloadDirectoryPath}/${serialNumber}_BacklightLog.txt`, type: 'backlight' },
            { path: `${RNFS.DownloadDirectoryPath}/${serialNumber}_BluetoothLog.txt`, type: 'bluetooth' },
            { path: `${RNFS.DownloadDirectoryPath}/${serialNumber}_CellularLog.txt`, type: 'cellular' },
            { path: `${RNFS.DownloadDirectoryPath}/${serialNumber}_MainCameraLog.txt`, type: 'maincamera' },
            { path: `${RNFS.DownloadDirectoryPath}/${serialNumber}_SecCameraLog.txt`, type: 'secondarycamera' },
            { path: `${RNFS.DownloadDirectoryPath}/${serialNumber}_GpsLog.txt`, type: 'gps' },
            { path: `${RNFS.DownloadDirectoryPath}/${serialNumber}_NfcLog.txt`, type: 'nfc' },
            { path: `${RNFS.DownloadDirectoryPath}/${serialNumber}_PowerMetricsLog.txt`, type: 'powermetrics' },
            { path: `${RNFS.DownloadDirectoryPath}/${serialNumber}_ThermalLog.txt`, type: 'thermal' },
            { path: `${RNFS.DownloadDirectoryPath}/${serialNumber}_UsbLog.txt`, type: 'usb' },
            { path: `${RNFS.DownloadDirectoryPath}/${serialNumber}_VibrationLog.txt`, type: 'vibration' },
            { path: `${RNFS.DownloadDirectoryPath}/${serialNumber}_WiFiLog.txt`, type: 'wlan' },
            { path: `${RNFS.DownloadDirectoryPath}/${serialNumber}_HardwareLog.txt`, type: 'hardware' },
            { path: `${RNFS.DownloadDirectoryPath}/${serialNumber}_TouchLog.txt`, type: 'touch' },
            { path: `${RNFS.DownloadDirectoryPath}/${serialNumber}_SensorLog.txt`, type: 'sensor' },
            { path: `${RNFS.DownloadDirectoryPath}/${serialNumber}_AccessoryLog.txt`, type: 'accessory' },
        ];

        let entries = [];  // Ensure this is always an array

        for (const { path, type } of paths) {
            if (await RNFS.exists(path)) {
            const logContent = await RNFS.readFile(path, 'utf8');
            const logEntries = parseLogEntries(logContent, type);
            entries = entries.concat(logEntries);  // Safely concatenate arrays
            } else {
            console.log(`${type} log does not exist.`);
            }
        }

        if (entries.length > 0) {
            const combinedEntries = aggregateLogs(entries);
            await writeSummaryLog(combinedEntries);
            console.log('Summary log created successfully.');
        //    Alert.alert('Summary log created successfully.');
        } else {
            console.log('No log files found or all log files are empty.');
        //    Alert.alert('No log files found or all log files are empty.');
        }
        } catch (error) {
        console.error('Failed to summarize logs:', error);
        // Alert.alert('Failed to summarize logs:', error.message || 'Unknown error');
        }
    };

    const parseLogEntries = (logContent, type) => {
        return logContent.trim().split('\n').map(line => {
        const [timestamp, result] = line.split(', ');
        return { timestamp: new Date().toLocaleString().replace(',', ''), result, type };
        });
    };

    const aggregateLogs = (entries) => {
        const summaryTimestamp = new Date().toLocaleString();
        const counters = {
        audio: { PASS: 0, FAIL: 0, 'N/A': 0 },
        backlight: { PASS: 0, FAIL: 0, 'N/A': 0 },
        bluetooth: { PASS: 0, FAIL: 0, 'N/A': 0 },
        cellular: { PASS: 0, FAIL: 0, 'N/A': 0 },
        maincamera: { PASS: 0, FAIL: 0, 'N/A': 0 },
        secondarycamera: { PASS: 0, FAIL: 0, 'N/A': 0 },
        gps: { PASS: 0, FAIL: 0, 'N/A': 0 },
        nfc: { PASS: 0, FAIL: 0, 'N/A': 0 },
        powermetrics: { PASS: 0, FAIL: 0, 'N/A': 0 },
        thermal: { PASS: 0, FAIL: 0, 'N/A': 0 },
        usb: { PASS: 0, FAIL: 0, 'N/A': 0 },
        vibration: { PASS: 0, FAIL: 0, 'N/A': 0 },
        wlan: { PASS: 0, FAIL: 0, 'N/A': 0 },
        hardware: { PASS: 0, FAIL: 0, 'N/A': 0 },
        touch: { PASS: 0, FAIL: 0, 'N/A': 0 },
        sensor: { PASS: 0, FAIL: 0, 'N/A': 0 },
        accessory: { PASS: 0, FAIL: 0, 'N/A': 0 },
        };

        entries.forEach(entry => {
        const { type, result } = entry;
        counters[type][result] = counters[type][result] ? counters[type][result] + 1 : 1;
        });

        const summaryStrings = Object.entries(counters).map(([testType, results]) => {
        return `${testType.toUpperCase()}:\n  PASS: ${results.PASS || 0}\n  FAIL: ${results.FAIL || 0}\n  N/A: ${results['N/A'] || 0}`;
        });

        return `\n${summaryTimestamp}\n` + summaryStrings.join('\n');
    };

    const writeSummaryLog = async (summaryEntries) => {
        const serialNumber = await AsyncStorage.getItem('serialNumber');
        const fileName = `${serialNumber}_SummaryLog.txt`;
        const path = `${RNFS.DownloadDirectoryPath}/${fileName}`;
        const header = 'Device ID:' + serialNumber + ', Test: PASS, FAIL, N/A\n';
    
        try {
        const fileExists = await RNFS.exists(path);
        if (fileExists) {
            // If the file exists, read the existing content
            const existingContent = await RNFS.readFile(path, 'utf8');
            
            // Identify where to insert the new content (just after the header)
            const headerEndIndex = existingContent.indexOf('\n') + 1; // Assuming header is a single line followed by a newline character
            const beforeHeader = existingContent.substring(0, headerEndIndex);
            const afterHeader = existingContent.substring(headerEndIndex);
            
            // Since summaryEntries is already a string, directly append/prepend it without .join()
            const combinedContent = beforeHeader + summaryEntries + '\n\n' + afterHeader;
    
            // Write the combined content back to the file
            await RNFS.writeFile(path, combinedContent, 'utf8');
            console.log('Summary log updated with new content at the top, below the header.');
        } else {
            // If the file does not exist, create it with the header and new content
            // Note that summaryEntries is directly used without .join()
            const fileContent = header + summaryEntries;
            await RNFS.writeFile(path, fileContent, 'utf8');
            console.log('Summary log created successfully.');
        }
        } catch (error) {
        console.error('Failed to write/append summary log:', error);
        }
    };

    return { summarizeLogs };
};

export default useSummary;