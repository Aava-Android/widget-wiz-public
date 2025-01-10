import React from 'react';
import { NativeModules } from 'react-native';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

const terminateConflictingProcesses = async () => {
  try {
    const lsofOutput = await NativeModules.RootCommandModule.runAsRoot('lsof /dev/ttyUSB2');
    const lines = lsofOutput.split('\n');
    const pids = lines
      .filter((line) => line.includes('/dev/ttyUSB2'))
      .map((line) => line.split(/\s+/)[1]);

    if (pids.length > 0) {
      console.log('Conflicting processes found:', pids);
      for (const pid of pids) {
        await NativeModules.RootCommandModule.runAsRoot(`kill -9 ${pid}`);
        console.log(`Terminated process: ${pid}`);
      }
    } else {
      console.log('No conflicting processes found.');
    }
  } catch (error) {
    console.error('Error terminating conflicting processes:', error);
    return Promise.reject(error);
  }
};

const logCPINData = async () => {
  try {
    await terminateConflictingProcesses();

    const serialNumber = await AsyncStorage.getItem('serialNumber');
    const fileName = `${serialNumber}_CpinLog.txt`;
    const path = `${RNFS.DownloadDirectoryPath}/${fileName}`;

    let logContent = `====== CPIN Test Log ======\nTimestamp, Attempt 1 Response, Attempt 2 Response, Attempt 3 Response, Attempt 4 Response, Attempt 5 Response, Result\n`;

    let attempts = [];
    let cpinReadyFound = false;

    const timestamp = new Date().toLocaleString();

    let rilStatus;
    try {
      rilStatus = await NativeModules.RootCommandModule.runAsRoot('getprop init.svc.vendor.ril-daemon');
      const isRilRunning = rilStatus.trim() === 'running';
      if (isRilRunning) {
        console.log('Stopping RIL daemon...');
        await NativeModules.RootCommandModule.runAsRoot('stop vendor.ril-daemon');
      } else {
        console.log('RIL daemon is not running, proceeding without stopping it.');
      }
    } catch (error) {
      console.log('Unable to check or stop RIL daemon. Proceeding with CPIN queries.');
    }

    console.log('Starting CPIN queries...');

    await NativeModules.RootCommandModule.runAsRoot('echo -e "AT+CMEE=2\\r" > /dev/ttyUSB2');
    await NativeModules.RootCommandModule.runAsRoot('echo -e "ATE1\\r" > /dev/ttyUSB2');

    for (let i = 0; i < 5; i++) {
      try {
        console.log(`DEBUG - Sending CPIN query attempt ${i + 1}...`);
        const cpinResult = await NativeModules.RootCommandModule.runAsRoot(
          'timeout 5s echo -e "AT+CPIN?\\r" > /dev/ttyUSB2 && timeout 5s head -n 5 /dev/ttyUSB2'
        );

        console.log(`DEBUG - Raw CPIN result attempt ${i + 1}:`, cpinResult);

        if (cpinResult.includes('+CPIN: READY')) {
          cpinReadyFound = true;
          attempts.push(`Attempt ${i + 1}: +CPIN: READY`);
        } else if (cpinResult.trim()) {
          attempts.push(`Attempt ${i + 1}: ${cpinResult.trim()}`);
        } else {
          attempts.push(`Attempt ${i + 1}: `);
        }
      } catch (error) {
        console.error(`CPIN Attempt ${i + 1} Failed:`, error);
        attempts.push(`Attempt ${i + 1}: Error`);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    await NativeModules.RootCommandModule.runAsRoot('echo -e "ATE0\\r" > /dev/ttyUSB2');

    try {
      if (rilStatus && rilStatus.trim() === 'running') {
        await NativeModules.RootCommandModule.runAsRoot('start vendor.ril-daemon');
      }
    } catch (error) {
      console.log('Unable to restart RIL daemon. It may not have been running.');
    }

    const result = cpinReadyFound ? 'PASS' : 'FAIL';
    logContent += `${timestamp}, ${attempts.join(', ')}, ${result}\n`;

    const fileExists = await RNFS.exists(path);
    let currentContent = '';
    if (fileExists) {
      currentContent = await RNFS.readFile(path, 'utf8');
    }
    const newContent = currentContent + logContent;

    await RNFS.writeFile(path, newContent, 'utf8');
    console.log('CPIN data logged to file:', path);

    return cpinReadyFound
      ? Promise.resolve('CPIN Test Passed: +CPIN: READY was found.')
      : Promise.reject(new Error('CPIN Test Failed: +CPIN: READY not found.'));
  } catch (error) {
    console.error('Failed to log CPIN data:', error);
    return Promise.reject(error);
  }
};



export const useCPIN = () => {
  return { logCPINData };
};

export default useCPIN;
