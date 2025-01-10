import React, { useState } from 'react';
import { View, Button, Text, ScrollView, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import useThermalService from '../testlogic/useThermalService';

const ThermalServiceScreen = () => {
  const { parsedOutput, runThermalCommand } = useThermalService(); // Use the custom hook
  const [modalVisible, setModalVisible] = useState(false); // Modal state

  // FAQ Content for the Info Modal
  const faqContent = `
    1. **IBAT**: Represents the current in milliAmperes (mA) drawn from the battery.
    2. **VBAT**: Represents the battery voltage in Volts (V).
    3. **Cached Temperatures**: Temperature readings stored in memory for various system components like CPU and GPU.
    4. **HAL Temperatures**: Temperature readings obtained directly from the Hardware Abstraction Layer (HAL).
    5. **Cooling Devices**: Components or processes used to control the temperature of the system by reducing heat.
  `;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Button container with buttons side by side */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={runThermalCommand}>
          <Text style={styles.buttonText}>Get Thermal Data</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
          <Text style={styles.buttonText}>FAQ</Text>
        </TouchableOpacity>
      </View>

      {/* Display parsed output */}
      {parsedOutput && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cached Temperatures</Text>
            {parsedOutput.cachedTemperatures.map((temp, index) => (
              <Text key={index} style={styles.temperatureText}>
                {temp.name}: {temp.value}°C
              </Text>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current HAL Temperatures</Text>
            {parsedOutput.halTemperatures.map((temp, index) => (
              <Text key={index} style={styles.temperatureText}>
                {temp.name}: {temp.value}°C
              </Text>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cooling Devices</Text>
            {parsedOutput.coolingDevices.map((device, index) => (
              <Text key={index} style={styles.temperatureText}>
                {device.name} (Type {device.type}): {device.value}
              </Text>
            ))}
          </View>
        </>
      )}

      {/* FAQ Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>FAQ - Thermal Data</Text>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalText}>{faqContent}</Text>
          </ScrollView>
          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    backgroundColor: '#f0f0f0', // Light background for contrast
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20, // Space between button row and content
  },
  button: {
    backgroundColor: '#0078D7', // Blue color for buttons
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 5,
    alignItems: 'center',
  //  flex: 1, // Make the buttons take equal space
    marginHorizontal: 5, // Space between buttons
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
  },
  temperatureText: {
    fontSize: 16,
    marginVertical: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
  },
  modalView: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'gray',
    justifyContent: 'center',
   // marginHorizontal: 20,
   // marginVertical: 100,
    width: '90%',
    maxHeight: '90%',
  },
  modalTitle: {
    alignSelf: 'center',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
  },
  modalText: {
    alignSelf: 'center',
    fontSize: 18,
    lineHeight: 22,
    marginBottom: 20,
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: '#2196F3',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ThermalServiceScreen;
