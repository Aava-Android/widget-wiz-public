//Audio test logic for the test screen.

import { useState, useEffect, useRef } from 'react';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import RNFS from 'react-native-fs';
import { Buffer } from 'buffer';
import Sound from 'react-native-sound';
import AudioRecord from 'react-native-audio-record';
import AsyncStorage from '@react-native-async-storage/async-storage';

Sound.setCategory('Playback');
const RECORD_FILE_PATH = `${RNFS.DownloadDirectoryPath}/recording.wav`;

export default function useAudioTest() {
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState([]);
  const [alarmBuffer, setAlarmBuffer] = useState([]);
  const [disableStart, setDisableStart] = useState(true);
  const [passTest, setPassTest] = useState(null);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [averageAmplitude, setAverageAmplitude] = useState(0);

  // Filter settings state
  const [windowSize, setWindowSize] = useState(1);
  const [alpha, setAlpha] = useState(0.14);
  const [matchedBuffer, setMatchedBuffer] = useState([]); // Buffer for the "matched" waveform

  const soundRef = useRef(null);

  const requestMicrophonePermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'This app needs access to your microphone to record audio.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Microphone permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };
  
  // Call this function before starting the recording
  useEffect(() => {
    requestMicrophonePermission();
  }, []);

  useEffect(() => {
    loadAlarmAudio();
  }, []);

  useEffect(() => {
    if (audioBuffer.length) {
      // updateMatchedBuffer();
    }
  }, [audioBuffer, alarmBuffer, windowSize, alpha]);

  // Logging function similar to logGpsResult
  const logAudioResult = async (status, details = '') => {
    const serialNumber = await AsyncStorage.getItem('serialNumber');
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

  const loadAlarmAudio = () => {
    return new Promise(async (resolve, reject) => {
      try {
        const path =
          Platform.OS === 'android'
            ? 'android.resource://com.ww/raw/alarm'
            : `${RNFS.MainBundlePath}/alarm.wav`;

        const base64Audio = await RNFS.readFile(path, 'base64');
        const buffer = Buffer.from(base64Audio, 'base64');

        const expectedLength = Math.floor(buffer.length / 2);
        const alarmBuffer = new Float32Array(expectedLength);

        for (let i = 0; i < buffer.length && i < expectedLength * 2; i += 2) {
          const int16 = buffer.readInt16LE(i);
          alarmBuffer[i / 2] = int16 / 32768;
        }
        setAlarmBuffer(alarmBuffer);
        setDisableStart(false);
        resolve();
      } catch (error) {
        console.error('Error loading alarm audio:', error);
        Alert.alert('Error loading alarm audio:', error.message);
        reject(error);
      }
    });
  };

  const playAudio = () => {
    setDisableStart(true); // Disable the start button while searching
    return new Promise((resolve, reject) => {
      setOffset(0);
      setWindowSize(1);
      setAlpha(0.14);
      setAudioBuffer([]);
      setMatchedBuffer([]);
      setPassTest(null);
      setAverageAmplitude(0);
  
      const path = Platform.OS === 'android' ? 'alarm' : 'alarm.wav';
  
      soundRef.current = new Sound(path, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.error('Failed to load sound', error);
          Alert.alert('Failed to load sound');
          reject(error);
          return;
        }
  
        console.log('Sound loaded successfully');
        console.log('Duration:', soundRef.current.getDuration());
        console.log('Channels:', soundRef.current.getNumberOfChannels());
  
        setIsPlaying(true);
  
        startRecording()
          .then(() => {
            soundRef.current.play((success) => {
              if (success) {
                console.log('Successfully finished playing');
              } else {
                console.error('Playback failed due to audio decoding errors');
                // Optionally handle playback failure
              }
  
              stopRecording()
                .then((passTestValue) => {
                  console.log('Pass Test Value after recording:', passTestValue);
                  setIsPlaying(false);
  
                  if (soundRef.current) {
                    soundRef.current.release();
                    soundRef.current = null;
                    console.log('Sound object released');
                  }
  
                  findBestOffsetAndFilters()
                    .then((result) => {
                      console.log('findBestOffsetAndFilters result:', result);
                      // Decide to resolve or reject based on passTestValue
                      if (passTestValue) {
                        resolve(result); // Test passed
                      } else {
                        const errorMessage = 'Audio test failed due to insufficient average amplitude.';
                        console.error(errorMessage);
                        reject(new Error(errorMessage)); // Reject with an Error object
                      }
                    })
                    .catch((error) => {
                      console.error('Error during findBestOffsetAndFilters:', error);
                      reject(error);
                    });
                })
                .catch((error) => {
                  console.error('Error during stopRecording:', error);
                  reject(error);
                });
            });
          })
          .catch((error) => {
            console.error('Error during startRecording:', error);
            reject(error);
          });
      });
    });
  };

  const startRecording = () => {
    return new Promise(async (resolve, reject) => {
      try {
        const options = {
          sampleRate: 16000, // Sample rate in Hz
          channels: 1, // Mono
          bitsPerSample: 16, // 16-bit samples
          audioSource: 6, // Android only (VOICE_RECOGNITION)
          wavFile: 'recording.wav',
        };

        AudioRecord.init(options);
        AudioRecord.start();
        setIsRecording(true);
        console.log('Recording started');
        resolve();
      } catch (error) {
        console.error('Error starting recording:', error);
        Alert.alert('Error starting recording:', error.message);
        reject(error);
      }
    });
  };

  const stopRecording = async () => {
    try {
      const audioFile = await AudioRecord.stop();
      setIsRecording(false);
      console.log('Recording stopped. File saved at:', audioFile);
      const passTestValue = await analyzeRecordedAudio(audioFile);
      return passTestValue; // Return the test result
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error stopping recording:', error.message);
      throw error; // Re-throw the error to propagate
    }
  };

  const applySilenceThreshold = (data, threshold = 0.99) => {
    return data.map((value) => (Math.abs(value) < threshold ? 0 : value));
  };

  const analyzeRecordedAudio = (filePath) => {
    return new Promise(async (resolve, reject) => {
      try {
        setAudioBuffer([]);
        const fileInfo = await RNFS.stat(filePath);
        if (fileInfo.size === 0) {
          throw new Error('Recorded file is empty. Please try recording again.');
        }

        const base64Audio = await RNFS.readFile(filePath, 'base64');
        const buffer = Buffer.from(base64Audio, 'base64');

        const expectedLength = Math.floor(buffer.length / 2);
        let audioBuffer = new Float32Array(expectedLength);

        for (let i = 0; i < buffer.length && i < expectedLength * 2; i += 2) {
          const int16 = buffer.readInt16LE(i);
          audioBuffer[i / 2] = int16 / 32768;
        }

        // Apply silence threshold before other filters
        audioBuffer = applySilenceThreshold(audioBuffer);

        // Apply filters with the current settings
        audioBuffer = applyMovingAverage(audioBuffer, windowSize);
        audioBuffer = applyLowPassFilter(audioBuffer, alpha);

        setAudioBuffer(audioBuffer);

        const averageAmplitude =
          audioBuffer.reduce((sum, value) => sum + Math.abs(value), 0) / audioBuffer.length;
        setAverageAmplitude(averageAmplitude);
        console.log('Average Amplitude:', averageAmplitude);

        // Set passTest based on averageAmplitude
        //Change the threshold value to adjust the test sensitivity
        const passTestValue = averageAmplitude > 0.01;
        setPassTest(passTestValue);

        // Log the result
        const status = passTestValue ? 'PASS' : 'FAIL';
        const details = `Average Amplitude: ${averageAmplitude}`;
        await logAudioResult(status, details);
        console.log('Audio test result:', status, details);

        // Resolve the Promise with passTestValue
        resolve(passTestValue);
      } catch (error) {
        console.error('Error analyzing recorded audio:', error);
        Alert.alert('Error analyzing recorded audio:', error.message);
        // Reject the Promise with the error
        reject(error);
      }
    });
  };

  const applyMovingAverage = (data, windowSize) => {
    const smoothedData = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      let sum = 0;
      let count = 0;
      for (let j = i - windowSize; j <= i + windowSize; j++) {
        if (j >= 0 && j < data.length) {
          sum += data[j];
          count++;
        }
      }
      smoothedData[i] = sum / count;
    }
    return smoothedData;
  };

  const applyLowPassFilter = (data, alpha) => {
    const filteredData = new Float32Array(data.length);
    filteredData[0] = data[0];
    for (let i = 1; i < data.length; i++) {
      filteredData[i] = alpha * data[i] + (1 - alpha) * filteredData[i - 1];
    }
    return filteredData;
  };

  const updateMatchedBuffer = () => {
    let filteredBuffer = applyMovingAverage(audioBuffer, windowSize);
    filteredBuffer = applyLowPassFilter(filteredBuffer, alpha);
    // setMatchedBuffer(filteredBuffer);
  };

  const calculateError = (bufferA, bufferB, offset) => {
    const length = Math.min(
      bufferA.length,
      offset < 0 ? bufferB.length + offset : bufferB.length - offset
    );
    let errorSum = 0;

    for (let i = 0; i < length; i++) {
      const indexB = offset < 0 ? i - offset : i + offset;
      const diff = bufferA[i] - bufferB[indexB];
      errorSum += diff ** 2;
    }

    return errorSum / length;
  };

  const findBestOffsetAndFilters = () => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('Starting findBestOffsetAndFilters');
        setIsLoading(true); // Set loading state for UI feedback
        setDisableStart(true); // Disable the start button while searching

        const minOffset = 0;
        const maxOffset = 10;
        const maxWindowSize = 1;
        const minAlpha = 0.4;
        const maxAlpha = 0.4;
        const alphaStep = 0.01;
        const offsetStep = 1;
        const targetErrorThreshold = 0.025; // Define a threshold for early stopping

        let minError = Infinity;
        let bestOffset = 0;
        let bestWindowSize = windowSize;
        let bestAlpha = alpha;
        let bestMatchedBuffer = [];

        outerLoop: for (
          let currentOffset = minOffset;
          currentOffset <= maxOffset;
          currentOffset += offsetStep
        ) {
          // Yield execution to allow the UI to update
          await new Promise((resolve) => setTimeout(resolve, 0));
          for (let w = 1; w <= maxWindowSize; w++) {
            for (let a = minAlpha; a <= maxAlpha; a += alphaStep) {
              // Apply current windowSize and alpha to filter the audio buffer
              let filteredBuffer = applyMovingAverage(audioBuffer, w);
              filteredBuffer = applyLowPassFilter(filteredBuffer, a);

              // Calculate error between the filtered buffer and the alarm buffer with offset
              const error = calculateError(alarmBuffer, filteredBuffer, currentOffset);

              // Update if this is the lowest error found
              if (error < minError) {
                minError = error;
                bestOffset = currentOffset;
                bestWindowSize = w;
                bestAlpha = a;
                bestMatchedBuffer = filteredBuffer;

                console.log(
                  `New best parameters found: Offset=${bestOffset}, Window Size=${bestWindowSize}, Alpha=${bestAlpha.toFixed(
                    2
                  )}, Error=${minError}`
                );

                // Stop further checking if the error is within the acceptable range
                if (minError <= targetErrorThreshold) {
                  console.log('Target error threshold met. Stopping search.');
                  break outerLoop;
                }
              }
            }
          }
        }

        // Apply the best parameters and matched buffer
        setOffset(bestOffset);
        setWindowSize(bestWindowSize);
        setAlpha(bestAlpha);
        setMatchedBuffer(bestMatchedBuffer); // Update matchedBuffer for rendering
        setIsLoading(false); // End loading state

        console.log(
          `Best matching parameters: Offset=${bestOffset}, Window Size=${bestWindowSize}, Alpha=${bestAlpha.toFixed(
            2
          )}, Final Error=${minError}`
        );

        setDisableStart(false); // Re-enable the start button

        resolve({ minError, bestOffset, bestWindowSize, bestAlpha });
      } catch (error) {
        console.error('Error in findBestOffsetAndFilters:', error);
        reject(error);
      }
    });
  };

  const renderWaveform = (buffer, color, strokeWidth = 1) => {
    const width = 300;
    const height = 100;
    const step = Math.floor(buffer.length / width);

    let pathData = `M 0 ${height / 2}`;
    for (let i = 0; i < width; i++) {
      const sample = buffer[i * step] || 0;
      const y = (1 - sample) * (height / 2);
      pathData += ` L ${i} ${y}`;
    }

    return { pathData, color, strokeWidth };
  };

  const renderCombinedWaveform = (recordedBuffer, originalBuffer, offset = 0) => {
    const width = 300;
    const height = 100;
    const originalStep = Math.floor(originalBuffer.length / width);
    const recordedStep = Math.floor(recordedBuffer.length / width);

    // Original waveform path
    let pathData = `M 0 ${height / 2}`;
    for (let i = 0; i < width; i++) {
      const sample = originalBuffer[i * originalStep] || 0;
      const y = (1 - sample) * (height / 2);
      pathData += ` L ${i} ${y}`;
    }

    // Recorded waveform path with offset
    let pathData2 = `M 0 ${height / 2}`;
    for (let i = 0; i < width; i++) {
      // Calculate the sample index, adding offset and clamping to buffer bounds
      const sampleIndex = i * recordedStep + offset * recordedStep;
      const sample =
        recordedBuffer[Math.max(0, Math.min(recordedBuffer.length - 1, sampleIndex))] || 0;
      const y = (1 - sample) * (height / 2);
      pathData2 += ` L ${i} ${y}`;
    }

    return { pathData, pathData2, width, height };
  };

  return {
    isPlaying,
    isRecording,
    audioBuffer,
    alarmBuffer,
    disableStart,
    passTest,
    offset,
    isLoading,
    averageAmplitude,
    windowSize,
    alpha,
    matchedBuffer,
    playAudio,
    setOffset,
    renderWaveform,
    renderCombinedWaveform,
  };

}