import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import RNFS from 'react-native-fs';
import { NativeModules } from 'react-native';
import { BackupDirectoryContext } from '../contexts/BackupDirectoryContext';
import PermissionContext from '../contexts/PermissionContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsMenu = ({ navigation }) => {
  const { ContentResolverModule } = NativeModules;
  const { backupDirectoryUri, setBackupDirectoryUri } = useContext(BackupDirectoryContext);
  const [serialNumber, setSerialNumber] = useState('');
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const [output, setOutput] = useState('');
  const [command, setCommand] = useState('');

  const runCommand = async (cmd) => {
    try {
      console.log('Running command:', cmd);
      const result = await NativeModules.RootCommandModule.runAsRoot(cmd);
      console.log('Command result:', result);
      setOutput(result); // Still update the state for UI purposes
      return result; // Return the result so it can be used
    } catch (error) {
      console.log('Error:', error);
      setOutput('Error: ' + error.message);
      throw error; // Re-throw the error for proper handling
    }
  };

  const sanitizeFileName = (name) => {
    return name.replace(/[^a-zA-Z0-9_-]/g, ""); // Replace invalid characters with ""
  };
  
  const saveSerialNumber = async (serial) => {
    try {
      const sanitizedSerial = sanitizeFileName(serial); // Sanitize the input
      await AsyncStorage.setItem('serialNumber', sanitizedSerial); // Save sanitized value
      console.log('Sanitized serial number saved:', sanitizedSerial);
    } catch (error) {
      console.error('Error saving serial number:', error);
    }
  };

  const runInitialCommands = async () => {
    
    try {
      // Set screen timeout
      await runCommand('settings put system screen_off_timeout 999999999');
      console.log('Screen timeout set to max.');

      await delay(3000);
    
      // Set media volume
      await runCommand('cmd media_session volume --set 15');
      console.log('Media volume set to max.');
    
      await delay(3000);

      // Get serial number
      const serial = await runCommand('getprop ro.serialno');
      setSerialNumber(serial);
      saveSerialNumber(serial);
      console.log(`Device Serial Number: ${serial}`);

      await delay(3000);

      await runCommand('pm disable-user --user 0 com.android.nfc');
      console.log('Android NFC disabled.');

    } catch (error) {
      console.error('Error running commands:', error);
    }
  };

  const deleteAllBackupFiles = async () => {
    try {
      if (!backupDirectoryUri) {
        Alert.alert('No backup directory selected.');
        console.warn('No backup directory selected.');
        return;
      }

      // List all files in the backup directory
      const files = await ContentResolverModule.listFiles(backupDirectoryUri);

      if (!files || files.length === 0) {
        Alert.alert('No files to delete in the backup directory.');
        console.log('No files to delete in the backup directory.');
        return;
      }

      // Optional: Confirm deletion with the user
      const userConfirmed = await confirmBackupDeletion(files.length);
      if (!userConfirmed) {
        return;
      }

      // Delete each file (this will try to delete .trashed if it's listed)
      for (const file of files) {
        // If you know `.trashed` is a special directory/file, you might add a condition:
        // if (file.name.endsWith('.txt') || file.name === '.trashed') {
        await ContentResolverModule.deleteFile(backupDirectoryUri, file.name);
        console.log(`Deleted file: ${file.name}`);
      }

      Alert.alert('Success', 'Tried to delete all backup files. Please check the backup directory for confirmation.');
      console.log('All files have been deleted from the backup directory.');
    } catch (error) {
      console.error('Failed to delete files from the backup directory:', error);
    }
  };

  const confirmBackupDeletion = (fileCount) => {
    return new Promise((resolve) => {
      Alert.alert(
        'Delete Local Backup Files',
        `Are you sure you want to delete ${fileCount} file(s) from the backup directory?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
        ],
        { cancelable: true }
      );
    });
  };

  const deleteTxtAndTrashedFiles = async () => {
    try {
      const files = await RNFS.readDir(RNFS.DownloadDirectoryPath); // Get all files in the directory
      // Filter out .txt files and the .trashed directory/file
      const filesToDelete = files.filter(file => file.name.endsWith('.txt') || file.name.startsWith('.trashed'));

      for (const file of filesToDelete) {
        await RNFS.unlink(file.path); // Delete each .txt file or the .trashed directory/file
        console.log(`Deleted: ${file.path}`);
      }

      Alert.alert('Success', 'Tried to delete all .txt/.trashed files. Please check the Downloads directory for confirmation.');
    } catch (error) {
      console.error('Failed to delete .txt/.trashed files:', error);
      Alert.alert('Error', 'Failed to delete .txt/.trashed files: ' + error.message);
    }
  };

  // Function to show confirmation dialog before deleting
  const confirmDeletion = () => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete all .txt/.trashed files from the Downloads directory?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes, Delete", style: 'destructive', onPress: deleteTxtAndTrashedFiles }
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView>
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Manual')}>
        <Text style={styles.buttonText}>Manual</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('AdbWidgets')}>
        <Text style={styles.summaryButtonText}>Adb Widgets</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Log')}>
        <Text style={styles.buttonText}>Logs</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteButton} onPress={confirmDeletion}>
        <Text style={styles.deleteButtonText}>Delete Local Log Files</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteButton} onPress={deleteAllBackupFiles}>
        <Text style={styles.deleteBackupButtonText}>Delete Local Backup Files</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={runInitialCommands}>
        <Text style={styles.initialButtonText}>Run Initial ADB Commands</Text>
      </TouchableOpacity>
    </View>
    </ScrollView>
  );
};

export default SettingsMenu;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center', 
    padding: 20,
    backgroundColor: 'black',
  },
  button: {
    backgroundColor: '#0078D7',
    justifyContent: 'center',
    padding: 5,
    marginBottom: 20,
    borderRadius: 5,
    width: '80%',
    height: 75,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    justifyContent: 'center',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
    width: '80%',
    height: 70,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  summaryButtonText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  deleteBackupButtonText: {
    justifyContent: 'center',
    alignContent: 'center',
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  initialButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
