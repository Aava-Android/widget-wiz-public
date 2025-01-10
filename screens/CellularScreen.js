import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import useCellularService from '../testlogic/useCellularService';
import { Button } from 'react-native-elements';

const CellularScreen = () => {
  const { parsedOutput, runCellularCommand } = useCellularService(); // Use the custom hook
  const [modalVisible, setModalVisible] = useState(false); // Modal state

  // FAQ Content for the Info Modal
  const faqContent = `
    1. **Signal Strength**: Indicates the current strength of the cellular signal.
    2. **Network Type**: Shows the type of cellular network (e.g., 5G, LTE, 3G).
    3. **Operator**: Displays the name of the cellular operator.
    4. **Data Connection Status**: Provides information on the active status of the mobile data connection.
    5. **Data Usage**: Shows the amount of data used over the cellular network.
    6. **Ping Test**: Tests connectivity to 8.8.8.8 with PASS/FAIL result and displays the round-trip time (RTT) if available.
  `;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Button container with buttons side by side */}
      <View style={styles.buttonRow}>
        <View style={styles.button}>
          <Button title="Get Cellular Data" onPress={runCellularCommand} />
        </View>
        <View style={styles.button}>
          <Button title="FAQ" onPress={() => setModalVisible(true)} />
        </View>
      </View>

      {/* Display parsed output */}
      {parsedOutput && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Signal Strength</Text>
            <Text style={styles.dataText}>Strength: {parsedOutput.signalStrength} </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Network Type</Text>
            <Text style={styles.dataText}>Type: {parsedOutput.networkType}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Operator</Text>
            <Text style={styles.dataText}>Operator: {parsedOutput.operator}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Connection Status</Text>
            <Text style={styles.dataText}>Status: {parsedOutput.connectionStatus}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Usage</Text>
            <Text style={styles.dataText}>Usage: {parsedOutput.dataUsage}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ping Test</Text>
            <Text style={styles.dataText}>Status: {parsedOutput.pingStatus}</Text>
            <Text style={styles.dataText}>RTT: {parsedOutput.pingRTT}</Text>
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
            <Text style={styles.modalTitle}>FAQ - Cellular Data</Text>
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
    backgroundColor: '#f0f0f0',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    width: '45%',
    marginHorizontal: 5,
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
  dataText: {
    fontSize: 16,
    marginVertical: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {},
  modalView: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'gray',
    justifyContent: 'center',
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

export default CellularScreen;