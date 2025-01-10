import React, { useState, useContext } from 'react';
import { Text, TouchableOpacity, StyleSheet, View, Modal, TextInput, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceIdContext from './DeviceIdContext'; // Assume you have this context

const DeviceIdInput = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [newDeviceId, setNewDeviceId] = useState('');
  const { deviceId, setDeviceId } = useContext(DeviceIdContext); // Assuming you're using context to manage the deviceId

  // Function to save the new device ID
  const saveDeviceId = async () => {
    if (newDeviceId.trim()) {
      await AsyncStorage.setItem('deviceId', newDeviceId);
      setDeviceId(newDeviceId); // Update state in context
      setModalVisible(false);
    }
  };

  // Function to clear AsyncStorage with confirmation
  const confirmClearAsyncStorage = () => {
    Alert.alert(
      "Confirm Clear",
      "Are you sure you want to clear Device ID?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "OK", 
          onPress: () => clearAsyncStorage()
        }
      ],
      { cancelable: true }
    );
  };

  // Function to clear AsyncStorage
  const clearAsyncStorage = async () => {
    try {
      //clear the device ID from AsyncStorage
      await AsyncStorage.removeItem('deviceId');
      setDeviceId(''); // Update the deviceId context to reflect the cleared state
      Alert.alert('Storage Cleared', 'AsyncStorage and device ID have been successfully cleared.');
      setModalVisible(false); // Close the modal after clearing
    } catch (error) {
      Alert.alert('Error', 'Failed to clear AsyncStorage: ' + error.message);
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Text style={{ marginRight: 10, color: 'black' }}>
          ID: {deviceId || 'N/A'}
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}  // Ensure the background is transparent for the dimming effect
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput
              placeholder="Enter new Device ID"
              value={newDeviceId}
              onChangeText={setNewDeviceId}
              style={styles.textInput}
              maxLength={12} // Limit the input to a maximum of 12 characters
            />
            <View style={styles.modalButtonsContainer}>
              <View style={styles.modalButton}>
                <Button
                  title="Save Device ID"
                  color='#0078D7' // Windows 8 blue
                  onPress={saveDeviceId}
                />
              </View>
              <View style={styles.modalButton}>
                <Button
                  title="Clear Device ID"
                  color='#F44336'
                  onPress={confirmClearAsyncStorage}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DeviceIdInput;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dimming effect for the background
  },
  modalContent: {
    backgroundColor: 'lightgray',
    padding: 25,
    borderRadius: 10,
    alignItems: 'center',
    width: '90%', // Adjust width as needed
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 15,
  },
  textInput: {
    backgroundColor: 'white',
    height: 40,
    width: '100%',
    marginBottom: 20,
    borderColor: 'gray',
    borderWidth: 1,
    color: 'black',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,  // Adds space between buttons
  },
});
