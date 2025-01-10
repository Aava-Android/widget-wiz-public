//ADB Widgets Screen in Settings Menu

import React, { useState } from 'react';
import { View, TextInput, Button, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { NativeModules } from 'react-native';

const AdbWidgetsScreen = () => {
  const [output, setOutput] = useState('');
  const [command, setCommand] = useState('');

  // Function to run a command using the RootCommandModule
  const runCommand = async (cmd) => {
    try {
      console.log('Running command:', cmd);
      const result = await NativeModules.RootCommandModule.runAsRoot(cmd);
      console.log('Command result:', result);
      setOutput(result);
    } catch (error) {
      console.log('Error:', error);
      setOutput('Error: ' + error.message);
    }
  };

  const initializeSettings = async () => {
    Alert.alert(
      'Warning',
      'This action requires rebooting your device. Do you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          onPress: async () => {
            try {
              // Set time automatically to sync with network time
              await runCommand('settings put global auto_time 1');
              // Disable automatic timezone temporarily
              await runCommand('settings put global auto_time_zone 0');
              // Set timezone to Europe/Helsinki
              await runCommand('setprop persist.sys.timezone Europe/Helsinki');
  
              // Verify timezone change
              const timezone = await NativeModules.RootCommandModule.runAsRoot('getprop persist.sys.timezone');
              if (timezone.trim() === 'Europe/Helsinki') {
                console.log('Timezone successfully set to Europe/Helsinki');
                setOutput(prev => `${prev}\nTimezone successfully set to Europe/Helsinki`);
              } else {
                console.log('Failed to set timezone to Europe/Helsinki');
                setOutput(prev => `${prev}\nFailed to set timezone to Europe/Helsinki`);
              }
  
              // Ensure 24-hour time format
              await runCommand('settings put system time_12_24 24');
              // Force a location update to refresh timezone settings
              await runCommand('pm disable com.android.location.fused');
              await runCommand('pm enable com.android.location.fused');
              // Set media volume to 50%
              await runCommand('cmd media_session volume --set 7');
              // Display the device serial number
              const serialNumber = await NativeModules.RootCommandModule.runAsRoot('getprop ro.serialno');
              setOutput(`Initialization Complete\nDevice Serial: ${serialNumber}`);
  
              // Add a delay before rebooting
              setOutput("Applying settings. Rebooting in 13 seconds...");
              await new Promise(resolve => setTimeout(resolve, 13000));  // 3-second delay
  
              // Re-enable automatic timezone if needed
              await runCommand('settings put global auto_time_zone 1');
  
              // Reboot the device
              await runCommand('reboot');
            } catch (error) {
              console.log('Error in initialization:', error);
              setOutput('Initialization Error: ' + error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter ADB Command"
        value={command}
        onChangeText={setCommand}
      />
      <Button title="Run ADB Command" onPress={() => runCommand(command)} />

      <View style={styles.buttonContainer}>
        {/*
        <View style={styles.buttonWrapper}>
          <Button title="Initialize" onPress={initializeSettings} />
        </View>
        
        <View style={styles.buttonWrapper}>
          <Button title="Get IP Address" onPress={() => runCommand('ip addr')} />
        </View>
        */}
        <View style={styles.buttonWrapper}>
          <Button title="Reboot" onPress={() => runCommand('reboot')} />
        </View>
        <View style={styles.buttonWrapper}>
          <Button title="Reboot to Fastboot" onPress={() => runCommand('reboot fastboot')} />
        </View>
        <View style={styles.buttonWrapper}>
          <Button title="Reboot to Bootloader" onPress={() => runCommand('reboot bootloader')} />
        </View>
        {/*
        <View style={styles.buttonWrapper}>
          <Button 
            title="Set Sleep Timer to 10 Minutes" 
            onPress={() => runCommand('settings put system screen_off_timeout 600000')} 
          />
        </View>
        <View style={styles.buttonWrapper}>
          <Button 
            title="Display Sleep Off" 
            onPress={() => runCommand('settings put system screen_off_timeout 999999999')} 
          />
        </View>
        */}
      </View>

      <Text style={styles.output}>Output: {output}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    width: '100%',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 20,
  },
  buttonWrapper: {
    marginVertical: 10,
    width: '70%',
    alignSelf: 'flex-start',
  },
  output: {
    marginTop: 20,
    color: 'black',
    width: '100%',
  },
});

export default AdbWidgetsScreen;