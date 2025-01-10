// AccessoryScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Button, Alert, FlatList, TouchableOpacity } from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useAccessoryTest from "../testlogic/useAccessoryTest";
import { useFocusEffect } from "@react-navigation/native";

//Main function
const AccessoryScreen = () => {
  const {
    devices,
    fetchUsbDevices,
    verifyStoredDevice,
    loading,
    error,
  } = useAccessoryTest();

  const [selectedDevice, setSelectedDevice] = useState(null);
  const [storedDevices, setStoredDevices] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      fetchUsbDevices();
    }, [])
  );

  /*
  // Load stored devices from AsyncStorage on component mount
  useEffect(() => {
    const loadStoredDevices = async () => {
      try {
        const savedDevices = await AsyncStorage.getItem("@stored_usb_devices");
        if (savedDevices) {
          setStoredDevices(JSON.parse(savedDevices));
          console.log("Stored devices loaded:", JSON.parse(savedDevices));
        }
      } catch (error) {
        console.error("Error loading stored devices:", error);
      }
    };

    loadStoredDevices();
    fetchUsbDevices();
  }, [fetchUsbDevices]);
  */
  /*
  // Function to save stored devices to AsyncStorage
  const saveStoredDevices = async (devicesToSave) => {
    try {
      await AsyncStorage.setItem("@stored_usb_devices", JSON.stringify(devicesToSave));
    } catch (error) {
      Alert.alert("Error", "Failed to save the stored devices.");
      console.error("Error saving stored devices:", error);
    }
  };
  */

  // Function to handle device selection and storing
  const handleDeviceSelection = async () => {
    if (!selectedDevice) {
      Alert.alert("No Device Selected", "Please select a device to continue.");
    } else {
      // Check if the device is already stored
      const isAlreadyStored = storedDevices.some(
        (device) => device.name === selectedDevice.name
      );
      if (isAlreadyStored) {
        Alert.alert("Device Already Stored", "This device is already stored.");
        return;
      }

      const updatedStoredDevices = [...storedDevices, selectedDevice];
      setStoredDevices(updatedStoredDevices);
    //  await saveStoredDevices(updatedStoredDevices);
      Alert.alert("Device Stored", `You have stored: ${selectedDevice.name}`);
    }
  };

  // Function to verify a specific stored device
  const handleVerifyStoredDevice = async (device) => {
    try {
      const isConnected = await verifyStoredDevice(device);
      Alert.alert(
        isConnected ? "Device Found" : "Device Missing",
        `The device (${device.name}) is ${
          isConnected ? "still connected." : "no longer connected."
        }`
      );
    } catch {
      Alert.alert(
        "Verification Failed",
        `The device (${device.name}) could not be verified as connected.`
      );
    }
  };

  // Function to remove a stored device
  const handleRemoveStoredDevice = async (deviceToRemove) => {
    const updatedStoredDevices = storedDevices.filter(
      (device) => device.name !== deviceToRemove.name
    );
    setStoredDevices(updatedStoredDevices);
  //  await saveStoredDevices(updatedStoredDevices);
    Alert.alert("Device Removed", `You have removed: ${deviceToRemove.name}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select USB Device</Text>
      {loading ? (
        <Text style={styles.loading}>Loading devices...</Text>
      ) : (
        <Picker
          selectedValue={selectedDevice}
          onValueChange={(itemValue) => setSelectedDevice(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Select a device" value={null} />
          {devices.map((device, index) => (
            <Picker.Item key={index} label={device.name} value={device} />
          ))}
        </Picker>
      )}
      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.buttonContainer}>
        <View style={styles.buttonWrapper}>
          <Button title="Confirm Selection" onPress={handleDeviceSelection} />
        </View>
        <View style={styles.buttonWrapper}>
          <Button title="Scan Again" onPress={fetchUsbDevices} />
        </View>
      </View>

      <Text style={styles.storedDevicesTitle}>Stored Devices:</Text>
      {storedDevices.length === 0 ? (
        <Text style={styles.noStoredDevices}>No devices stored.</Text>
      ) : (
        <FlatList
          data={storedDevices}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <View style={styles.storedDeviceItem}>
              <Text style={styles.deviceName}>{item.name}</Text>
              <View style={styles.deviceButtons}>
                <TouchableOpacity
                  style={styles.verifyButton}
                  onPress={() => handleVerifyStoredDevice(item)}
                >
                  <Text style={styles.buttonText}>Verify</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveStoredDevice(item)}
                >
                  <Text style={styles.buttonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  loading: {
    textAlign: "center",
    marginBottom: 20,
  },
  picker: {
    marginBottom: 20,
    height: 50,
    width: "100%",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  buttonWrapper: {
    flex: 1,
    marginHorizontal: 5,
  },
  storedDevicesTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  noStoredDevices: {
    textAlign: "center",
    color: "gray",
    marginBottom: 20,
  },
  storedDeviceItem: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "600",
  },
  deviceButtons: {
    flexDirection: "row",
  },
  verifyButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  removeButton: {
    backgroundColor: "#F44336",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  error: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
});

export default AccessoryScreen;
