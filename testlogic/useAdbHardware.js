import { useState } from 'react';
import { NativeModules } from 'react-native';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useAdbHardware = () => {
  const [output, setOutput] = useState('');

  // Function to run ADB commands sequentially, filter output, format the output, and log it
  const runHardwareCheck = async () => {
    try {
      const commands = [
        { cmd: 'uptime', header: 'System Uptime and Load Average' },
        { cmd: 'cat /proc/meminfo', header: 'Memory Information' },
        { cmd: 'dumpsys cpuinfo', header: 'CPU Utilization' },
        { cmd: 'cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_cur_freq', header: 'CPU Frequencies' },
        { cmd: 'df -h', header: 'Disk Usage' },
      ];

      let fullOutput = '';

      // Run each command, prepend header, and collect results
      for (const { cmd, header } of commands) {
        const result = await NativeModules.RootCommandModule.runAsRoot(cmd);
        const filteredResult = filterCommandOutput(cmd, result);
        fullOutput += `\n===== ${header} =====\n${filteredResult.trim()}\n`;
      }

      // Set the formatted output for display
      setOutput(fullOutput);

      // Log the output
      await logToFile('PASS', fullOutput);
      return Promise.resolve();
    } catch (error) {
      console.log('Error:', error);
      setOutput('Error: ' + error.message);

      // Log failure
      await logToFile('FAIL', '');
      return Promise.reject(error);
    }
  };

  // Function to write the output to a log file including PASS/FAIL line
  const logToFile = async (passFailStatus, data) => {
    const serialNumber = await AsyncStorage.getItem('serialNumber');
    const fileName = `${serialNumber}_HardwareLog.txt`;
    const path = `${RNFS.DownloadDirectoryPath}/${fileName}`;

    const timestamp = new Date().toLocaleString().replace(',', '');
    const header = 'Date, Result\n';
    const summaryLine = `${timestamp}, ${passFailStatus}\n`;

    const logEntry = `\n\n====== Hardware Info Log ======\n${new Date().toLocaleString()}\n${data}`;

    try {
      const fileExists = await RNFS.exists(path);

      if (!fileExists) {
        // Create the file with the header line if it doesn't exist
        await RNFS.writeFile(path, header, 'utf8');
      }

      let currentContent = await RNFS.readFile(path, 'utf8');

      // Append the summary line and the detailed log
      const newContent = currentContent + summaryLine + logEntry;

      await RNFS.writeFile(path, newContent, 'utf8');
      console.log('Hardware info logged to file:', path);
    } catch (error) {
      console.error('Failed to log hardware info to file:', error);
    }
  };

  // Function to filter excessive or irrelevant data from commands
  const filterCommandOutput = (command, result) => {
    if (!result) {
      console.warn(`Command "${command}" returned no output.`);
      return 'No output available.';
    }
  
    if (command === 'cat /proc/meminfo') {
      const memoryLines = result.split('\n');
      const filteredMemory = memoryLines.filter(line =>
        line.startsWith('MemTotal:') ||
        line.startsWith('MemFree:') ||
        line.startsWith('MemAvailable:') ||
        line.startsWith('SwapTotal:') ||
        line.startsWith('SwapFree:')
      );
      return filteredMemory.join('\n');
    }
  
    if (command === 'dumpsys cpuinfo') {
      // Return the original result without filtering or formatting
      return result;
    }
  
    if (command === 'df -h') {
      const diskLines = result.split('\n');
      const filteredDisks = diskLines
        .filter(line => !line.includes('tmpfs') && line.trim() !== '')
        .map(line => {
          const parts = line.split(/\s+/);
          return { usage: parseInt(parts[4]?.replace('%', '') || '0', 10), line };
        })
        .sort((a, b) => b.usage - a.usage)
        .slice(0, 5)
        .map(entry => entry.line);
      return filteredDisks.join('\n');
    }
  
    const MAX_LINES = 100;
    const lines = result.split('\n');
    return lines.slice(0, MAX_LINES).join('\n');
  };
  
  
  
  

  return { output, runHardwareCheck };
};

export default useAdbHardware;
