//ADB Hardware Information Screen

import React, { useState } from 'react';
import { View, Button, Text, ScrollView, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import useAdbHardware from '../testlogic/useAdbHardware'; // Import the custom hook

const AdbScreen = () => {
  const { output, runHardwareCheck } = useAdbHardware(); // Use the hook for ADB commands
  const [modalVisible, setModalVisible] = useState(false);

  // FAQ content
  const faqContent = `
    1. **System Uptime and Load Average**: Shows how long the system has been running since the last reboot.
    2. **Memory Information**: Provides details on memory usage.
    3. **CPU Utilization**: Displays CPU usage percentages and the top processes by CPU consumption.
    4. **CPU Frequencies**: Shows the current operating frequency of each CPU core.
    5. **Disk Usage**: Displays the used and available storage space for mounted filesystems.
    6. **System Load Averages**: Displays system load over the past 1, 5, and 15 minutes.
    7. **Active Network Interfaces**: Lists active network interfaces and their IP addresses.
    8. **Established Network Connections**: Displays only active, established TCP/UDP connections.
    9. **Total Disk I/O Operations**: Shows total read/write operations for all disk devices.
    10. **Recent Kernel Errors/Warnings**: Shows the last 10 critical errors or warnings from the kernel logs.
    11. **Top Running Processes**: Displays the top 3 processes by CPU and memory usage.
  `;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Button to Run All Hardware Check Commands */}
      <View style={styles.topSection}>
        <View style={styles.buttonContainer}>
          <Button title="Get Full Hardware Info" onPress={runHardwareCheck} />
        </View>

        {/* Button to Show FAQ */}
        <View style={styles.buttonContainer}>
          <Button title="FAQ" onPress={() => setModalVisible(true)} />
        </View>
      </View>
      {/* Display formatted output */}
      <Text style={styles.output}>{output}</Text>

      {/* FAQ Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>FAQ - Hardware Information</Text>
          
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalText}>{faqContent}</Text>
          </ScrollView>

          {/* Close Button at the bottom */}
          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topSection: {
    marginBottom: 0,
  },
  output: {
    marginTop: 20,
    color: 'black',
    width: '100%',
  },
  buttonContainer: {
    marginVertical: 10,
  },
  modalView: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
    justifyContent: 'space-between',
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: Dimensions.get('window').height * 0.1,
    marginBottom: Dimensions.get('window').height * 0.1,
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
  },
  modalContent: {
    flexGrow: 1,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#2196F3',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AdbScreen;
