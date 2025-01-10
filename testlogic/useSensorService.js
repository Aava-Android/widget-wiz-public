import { useState, useCallback } from 'react';
import { NativeModules } from 'react-native';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useSensorService = () => {
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSensorInfo = useCallback(() => {
    setLoading(true);
    setError(null);

    return new Promise(async (resolve, reject) => {
      try {
        const rawOutput = await NativeModules.RootCommandModule.runAsRoot('dumpsys sensorservice');
        console.log('Raw Sensor Output:', rawOutput);

        const sensors = Array.from(
          new Set(
            rawOutput
              .split('\n')
              .filter(line => /\) .+ Sensor/.test(line))
              .map(line => {
                const match = line.match(/\) ([^\|]+)/);
                const sensorName = match ? match[1].replace(/(Non-wakeup|Wakeup)/, '').trim() : null;

                let status = 'Inactive';
                const isInActiveSensorsList = rawOutput.includes(`${sensorName} active`);
                const hasRecentEvents = rawOutput.includes(`${sensorName}: last`) || /last \d+ events/.test(rawOutput);

                if (isInActiveSensorsList || hasRecentEvents) {
                  status = 'Alive';
                }

                return { sensorName, status };
              })
              .filter(Boolean)
          )
        );

        console.log('Parsed Sensor Data:', sensors);
        setSensorData(sensors);

        // Log Results
        await logSensorResults(sensors, 'PASS');
        resolve(sensors);
      } catch (err) {
        console.error('Error fetching sensor info:', err);
        setError(err.message);

        // On error, log FAIL
        await logSensorResults([], 'FAIL');
        reject(err);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const logSensorResults = async (sensors, passFailStatus) => {
    const serialNumber = await AsyncStorage.getItem('serialNumber');
    const fileName = `${serialNumber}_SensorLog.txt`;
    const path = `${RNFS.DownloadDirectoryPath}/${fileName}`;

    const now = new Date();
    const timestamp = now.toLocaleString('en-US', { hour12: false }).replace(',', '');

    // Build CSV-like summary for all sensors
    const header = 'Timestamp, Sensor Name 1, Status 1, Sensor Name 2, Status 2, ..., Result\n';
    const summaryFields = sensors.flatMap(({ sensorName, status }) => [sensorName, status]);

    const logSummary = `${timestamp}, ${summaryFields.join(', ')}, ${passFailStatus}\n`;

    console.log('Logging summary to file:', logSummary);

    try {
      const fileExists = await RNFS.exists(path);
      if (!fileExists) {
        console.log('File does not exist. Creating a new one with header.');
        await RNFS.writeFile(path, header, 'utf8');
      }

      const currentContent = await RNFS.readFile(path, 'utf8');
      const newContent = currentContent + logSummary;

      await RNFS.writeFile(path, newContent, 'utf8');
      console.log('Log summary successfully appended.');
    } catch (err) {
      console.error('Failed to log sensor data:', err);
    }
  };

  return {
    sensorData,
    fetchSensorInfo,
    loading,
    error,
  };
};

export default useSensorService;
