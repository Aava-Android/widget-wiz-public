import { useState } from 'react';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import RNFS from 'react-native-fs';
import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useNFCTest = () => {
  const [outputMessage, setOutputMessage] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  // Function to log NFC results
  const logNfcResult = async (status, details = null) => {
    const serialNumber = await AsyncStorage.getItem("serialNumber");
    const fileName = `${serialNumber}_NfcLog.txt`;
    const path = `${RNFS.DownloadDirectoryPath}/${fileName}`;
    const now = new Date();
    const timestamp = now.toLocaleString().replace(',', '');
    const logEntry = details
      ? `${timestamp}, ${status}, Payload: ${details}\n`
      : `${timestamp}, ${status}\n`;

    try {
      const fileExists = await RNFS.exists(path);
      if (!fileExists) {
        await RNFS.writeFile(path, 'Date, Result, Payload\n', 'utf8');
      }
      await RNFS.appendFile(path, logEntry, 'utf8');
    } catch (error) {
      console.error('Failed to log NFC result:', error);
    }
  };

  const runAdbCommand = async (cmd) => {
    try {
      console.log('Running ADB command:', cmd);
      const result = await NativeModules.RootCommandModule.runAsRoot(cmd);
      console.log('Command result:', result);
      return result;
    } catch (error) {
      console.error('ADB Command Error:', error);
      throw new Error('Failed to execute ADB command');
    }
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const startNFCTest = () => {
    return new Promise(async (resolve, reject) => {
      if (isRunning) {
        const warningMessage = 'A test is already running.';
        console.warn(warningMessage);
        reject(new Error(warningMessage)); // Reject the promise if already running
        return;
      }

      setIsRunning(true);
      setOutputMessage('Starting NFC Scan...');

      const timeoutId = setTimeout(async () => {
        try {
          await NfcManager.cancelTechnologyRequest(); // Cancel NFC request
          const timeoutMessage = 'FAIL: NFC scan timed out.';
          setOutputMessage(timeoutMessage);
          await logNfcResult('FAIL', 'Timed out');
          setIsRunning(false);
          reject(new Error(timeoutMessage));
        } catch (error) {
          console.error('Error during timeout cleanup:', error);
        }
      }, 15000); // 15 seconds timeout

      try {
        // Step 1: Disable NFC via ADB to reset any previous NFC activity
        await runAdbCommand('svc nfc disable');
        await delay(2000); // Wait for 2 seconds

        // Step 2: Enable NFC via ADB and start scanning immediately
        await runAdbCommand('svc nfc enable');
        console.log('NFC Enabled. Starting scan...');
        await NfcManager.requestTechnology(NfcTech.Ndef);

        // Step 3: Attempt to get tag and process it
        const tag = await NfcManager.getTag();
        console.log('Tag discovered:', tag);

        clearTimeout(timeoutId); // Clear timeout when tag is discovered

        if (tag && tag.ndefMessage && tag.ndefMessage.length > 0) {
          const payload = tag.ndefMessage[0]?.payload;
          const text = payload ? String.fromCharCode.apply(null, payload.slice(3)) : null;

          //Desired payload to match
          if (text === 'AAVA1234') {
            const successMessage = 'PASS: Payload matches:' + text;
            setOutputMessage(successMessage);
            await logNfcResult('PASS', text);
            resolve(successMessage); // Resolve with the success message
          } else {
            const failureMessage = 'FAIL: Payload mismatch';
            setOutputMessage(failureMessage);
            await logNfcResult('FAIL', text);
            reject(new Error(failureMessage)); // Reject with the failure message
          }
        } else {
          const failureMessage = 'FAIL: No valid NDEF message found.';
          setOutputMessage(failureMessage);
          await logNfcResult('FAIL', 'No valid NDEF message found.');
          reject(new Error(failureMessage)); // Reject with the failure message
        }
      } catch (error) {
        clearTimeout(timeoutId); // Clear timeout on error
        const errorMessage = `FAIL: ${error.message || 'Unknown error'}`;
        setOutputMessage(errorMessage);
        console.warn('NFC Error:', error);
        await logNfcResult('FAIL', error.message);
        reject(error); // Reject with the error
      } finally {
        await NfcManager.cancelTechnologyRequest();
        await runAdbCommand('svc nfc disable'); // Disable NFC after the scan
        setIsRunning(false);
      }
    });
  };

  return {
    startNFCTest,
    outputMessage,
    isRunning,
  };
};

export default useNFCTest;
