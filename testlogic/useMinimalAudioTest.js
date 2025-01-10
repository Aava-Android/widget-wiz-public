// Description: This file contains the logic for the minimal audio test used with the automated test system. The test involves playing a sound and recording the audio to check the amplitude level. If the average amplitude is above a certain threshold, the test is considered successful. Otherwise, it is marked as a failure. The test results are logged to a file for reference.

import { useRef } from 'react';
import { Alert, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { Buffer } from 'buffer';
import Sound from 'react-native-sound';
import AudioRecord from 'react-native-audio-record';
import AsyncStorage from '@react-native-async-storage/async-storage';

Sound.setCategory('Playback');

const RECORD_FILE_PATH = `${RNFS.DownloadDirectoryPath}/recording_minimal.wav`;

export default function useMinimalAudioTest() {
  const soundRef = useRef(null);

  // Logging function
  const logAudioResult = async (status, details = '') => {
    const serialNumber = await AsyncStorage.getItem('serialNumber');
    console.log('Serial Number:', serialNumber);
    const fileName = `${serialNumber}_AudioLog.txt`;
    const path = `${RNFS.DownloadDirectoryPath}/${fileName}`;
    const now = new Date();
    const timestamp = now.toLocaleString().replace(',', ''); // Remove commas for consistency
    const logEntry = `${timestamp}, ${status}${details ? ', ' + details : ''}\n`;

    try {
      const fileExists = await RNFS.exists(path);
      if (!fileExists) {
        await RNFS.writeFile(path, 'Date, Result, Details\n', 'utf8');
      }
      await RNFS.appendFile(path, logEntry, 'utf8');
      console.log('Audio result logged successfully.');
    } catch (error) {
      console.error('Failed to log audio result:', error);
    }
  };

  // Apply silence threshold to audio data
  const applySilenceThreshold = (data, threshold = 0.99) => {
    return data.map((value) => (Math.abs(value) < threshold ? 0 : value));
  };

  const runMinimalAudioTest = () => {
    return new Promise(async (resolve, reject) => {
      try {
        const path = Platform.OS === 'android' ? 'alarm' : 'alarm.wav';

        // Load and play the sound
        const sound = new Sound(path, Sound.MAIN_BUNDLE, (error) => {
          if (error) {
            console.error('Failed to load sound', error);
            logAudioResult('FAIL', 'Failed to load sound');
            reject(new Error('Failed to load sound'));
            return;
          }

          // Start recording
          const options = {
            sampleRate: 16000,
            channels: 1,
            bitsPerSample: 16,
            audioSource: 6, // Android only (VOICE_RECOGNITION)
            wavFile: 'recording.wav',
          };

          AudioRecord.init(options);
          AudioRecord.start();
          console.log('Recording started.');

          // Play the sound
          sound.play(async (success) => {
            if (success) {
              console.log('Audio playback completed successfully.');

              // Stop recording after playback completes
              setTimeout(async () => {
                try {
                  const audioFile = await AudioRecord.stop();
                  console.log('Recording stopped. File saved at:', audioFile);

                  // Analyze the recorded audio
                  const base64Audio = await RNFS.readFile(audioFile, 'base64');
                  const buffer = Buffer.from(base64Audio, 'base64');
                  const expectedLength = Math.floor(buffer.length / 2);
                  let audioBuffer = new Float32Array(expectedLength);

                  for (let i = 0; i < buffer.length && i < expectedLength * 2; i += 2) {
                    const int16 = buffer.readInt16LE(i);
                    audioBuffer[i / 2] = int16 / 32768;
                  }

                  // Apply silence threshold
                  audioBuffer = applySilenceThreshold(audioBuffer);

                  const averageAmplitude =
                    audioBuffer.reduce((sum, value) => sum + Math.abs(value), 0) / audioBuffer.length;

                  console.log('Average Amplitude:', averageAmplitude);

                  if (averageAmplitude > 0.01) {
                    console.log('Audio test passed.');
                    await logAudioResult('PASS', `Average Amplitude: ${averageAmplitude}`);
                    resolve(true);
                  } else {
                    console.log('Audio test failed: Amplitude too low.');
                    await logAudioResult('FAIL', `Average Amplitude: ${averageAmplitude}`);
                    reject(new Error('Audio test failed: Amplitude too low.'));
                  }
                } catch (error) {
                  console.error('Error analyzing recorded audio:', error);
                  await logAudioResult('FAIL', 'Error analyzing recorded audio');
                  reject(new Error('Error analyzing recorded audio'));
                } finally {
                  sound.release();
                }
              }, 3000); // Record for 3 seconds
            } else {
              console.error('Audio playback failed.');
              await logAudioResult('FAIL', 'Audio playback failed');
              sound.release();
              reject(new Error('Audio playback failed.'));
            }
          });
        });
      } catch (error) {
        console.error('Error in runMinimalAudioTest:', error);
        await logAudioResult('FAIL', 'Unexpected error in minimal audio test');
        reject(new Error('Unexpected error in minimal audio test'));
      }
    });
  };

  return {
    runMinimalAudioTest,
  };
}
