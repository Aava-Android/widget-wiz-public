import React, { useState, useEffect, useContext } from 'react';
import { Text, Button, View, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CooldownProvider } from './contexts/CooldownContext';
import { TestProvider } from './contexts/TestContext';
import { AudioTestProvider } from './contexts/AudioTestContext_NOT_IN_USE';
import HomeScreen from './screens/HomeScreen';
import NfcScreen from './screens/NfcScreen';
import BluetoothScreen from './screens/BluetoothScreen';
import WlanScreen from './screens/WlanScreen';
import GpsScreen from './screens/GpsScreen';
import VibratorScreen from './screens/VibratorScreen';
import BacklightScreen from './screens/BacklightScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceIdInput from './contexts/DeviceIdInput';
import DeviceIdContext from './contexts/DeviceIdContext';
import AudioTestScreen from './screens/AudioScreen';
import AudioScreen from './screens/AudioScreen';
import MainCameraScreen from './screens/MainCameraScreen';
import SecondaryCameraScreen from './screens/SecondaryCameraScreen';
import ManualScreen from './screens/ManualScreen';
import CustomHeader from './CustomHeader';
import SettingsMenu from './screens/SettingsMenu'; // Import the new screen
import LogScreen from './screens/LogScreen';
import AdbScreen from './screens/AdbScreen'; // Import the new screen
import PowerScreen from './screens/PowerScreen';
import AdbWidgetsScreen from './screens/AdbWidgets';
import ThermalServiceScreen from './screens/ThermalService';
import { BackupDirectoryProvider } from './contexts/BackupDirectoryContext';
import USBScreen from './screens/USBScreen';
import CellularScreen from './screens/CellularScreen';
import TouchScreen from './screens/TouchScreen';
import SensorService from './screens/SensorService';
import useAccessoryTest from './testlogic/useAccessoryTest';
import AccessoryScreen from './screens/AccessoryScreen';
import CPINScreen from './screens/CPINScreen';
import PermissionContext, { PermissionProvider } from './contexts/PermissionContext';
import 'react-native-url-polyfill/auto';
import { Buffer } from 'buffer';
global.Buffer = Buffer;


const Stack = createNativeStackNavigator();

function AppContent() {
  const { permissionsGranted, setPermissionsGranted, refreshPermissions } = useContext(PermissionContext);

  useEffect(() => {
    if (!permissionsGranted) {
      const interval = setInterval(() => {
        refreshPermissions(); // Refresh permissions every 1 seconds
      }, 1000);

      return () => clearInterval(interval); // Cleanup interval on unmount
    }
  }, [permissionsGranted, refreshPermissions]);

  if (!permissionsGranted) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Some permissions are missing.</Text>
        <Text style={styles.loadingText}>
          Please grant them to proceed.
        </Text>
        <Text style={styles.loadingText}>
          After permissions, you will be redirected to App Info. From there,
          please enable modification of system settings (last line when
          scrolling down).
        </Text>
        <Text style={styles.loadingText}>
          When redirected, please allow the app Super User Rights when asked.
          You will only have 10 seconds to do so. Otherwise, you will need to
          reinstall the app.
        </Text>
        <Button title="Refresh Permissions" onPress={refreshPermissions} />
      </View>
    );
  }

  return (
    <NavigationContainer>
            <Stack.Navigator
                initialRouteName={HomeScreen}
                screenOptions={({ navigation }) => ({
                  // Use CustomHeader for the header layout
                  headerTitle: () => <CustomHeader navigation={navigation} />,
                  unmountOnBlur: true, // Unmount screens when they are blurred
                })}
              >
              {/* Home Screen - Show the header */}
                      <Stack.Screen 
                        name="Home" 
                        component={HomeScreen} 
                        options={{ headerShown: true, title: 'Widget Wiz'}} 
                      />
                      <Stack.Screen 
                        name="NFC" 
                        component={NfcScreen} 
                        options={{ headerShown: false }} 
                      />
                      <Stack.Screen 
                        name="Bluetooth" 
                        component={BluetoothScreen} 
                        options={{ headerShown: false }} 
                      />
                      <Stack.Screen 
                        name="WLAN" 
                        component={WlanScreen} 
                        options={{ headerShown: false }} 
                      />
                      <Stack.Screen 
                        name="GPS" 
                        component={GpsScreen} 
                        options={{ headerShown: false }} 
                      />
                      <Stack.Screen 
                        name="Vibrator" 
                        component={VibratorScreen} 
                        options={{ headerShown: false }} 
                      />
                      <Stack.Screen 
                        name="Backlight" 
                        component={BacklightScreen} 
                        options={{ headerShown: false }} 
                      />
                      <Stack.Screen 
                        name="Audio" 
                        component={AudioScreen} 
                        options={{ headerShown: false }} 
                      />
                      <Stack.Screen 
                        name="Main Camera" 
                        component={MainCameraScreen} 
                        options={{ headerShown: false }} 
                      />
                      <Stack.Screen 
                        name="Secondary Camera" 
                        component={SecondaryCameraScreen} 
                        options={{ headerShown: false }} 
                      />
                      <Stack.Screen 
                        name="Manual" 
                        component={ManualScreen} 
                        options={{ headerShown: true, title: 'App Manual'}}
                      />
                      <Stack.Screen
                        name="SettingsMenu"
                        component={SettingsMenu}
                        options={{ headerShown: true }}
                      />
                      <Stack.Screen
                        name="Log"
                        component={LogScreen}
                        options={{ headerShown: true, title: 'Log Screen' }}
                        style={styles.headerContainer}
                      />
                        <Stack.Screen
                        name="AdbCommand"
                        component={AdbScreen}
                        options={{ headerShown: true, title: 'ADB Command'}}
                      />
                      <Stack.Screen
                        name="PowerScreen"
                        component={PowerScreen}
                        options={{ headerShown: true, title: 'Power Screen'}}
                      />
                      <Stack.Screen
                        name="AdbWidgets"
                        component={AdbWidgetsScreen}
                        options={{ headerShown: true, title: 'ADB Widgets'}}
                      />
                      <Stack.Screen
                        name="ThermalService"
                        component={ThermalServiceScreen}
                        options={{ headerShown: true, title: 'Thermal Service'}}
                      />
                      <Stack.Screen
                      name="USB"
                      component={USBScreen}
                      options={{ headerShown: true, title: 'USB Test' }}
                    />
                    <Stack.Screen
                      name="Cellular"
                      component={CellularScreen}
                      options={{ headerShown: true, title: 'Cellular Test' }}
                    />
                    <Stack.Screen
                      name="Touch"
                      component={TouchScreen}
                      options={{ headerShown: true, title: 'Touch Test' }}
                    />
                    <Stack.Screen
                      name="SensorService"
                      component={SensorService}
                      options={{ headerShown: true, title: 'Sensor Service' }}  
                    />
                    <Stack.Screen
                      name="Accessory"
                      component={AccessoryScreen}
                      options={{ headerShown: true, title: 'Accessory Test' }}
                    />
                    <Stack.Screen
                      name="CPIN"
                      component={CPINScreen}
                      options={{ headerShown: true, title: 'CPIN Test' }}
                    />
              </Stack.Navigator>
            </NavigationContainer>
  );
}

export default function App() {
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      const savedDeviceId = await AsyncStorage.getItem('deviceId');
      if (savedDeviceId) {
        setDeviceId(savedDeviceId);
      }
    };

    fetchInitialData();
  }, []);

  return (
    <DeviceIdContext.Provider value={{ deviceId, setDeviceId }}>
      <BackupDirectoryProvider>
        <TestProvider>
          <PermissionProvider>
            <CooldownProvider>
              <AppContent />
            </CooldownProvider>
          </PermissionProvider>
        </TestProvider>
      </BackupDirectoryProvider>
    </DeviceIdContext.Provider>
  );
}

// Styles for the custom header
const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
    backgroundColor: 'black',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    //alignContent: 'center',
    textAlign: 'center',
    //justifyContent: 'center',
    //alignItems: 'center',
    padding: 10,
    marginTop: 0,
    marginBottom: 10,
    fontSize: 18,
    color: '#333',
  },
  manualButton: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: 'blue',
    alignItems: 'flex-start',
    borderWidth: 2,
    borderColor: 'black',
    padding: 5,
    borderRadius: 5,
    backgroundColor: 'lightblue',
  },
  deviceIdContainer: {
    marginRight: '5%',
    flex: 1,
    alignItems: 'flex-end',
  },
});
