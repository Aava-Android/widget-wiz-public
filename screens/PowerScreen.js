// PowerScreen.js
import React, { useState } from 'react';
import { View, Text, Button, ScrollView, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { usePowerMetrics } from '../testlogic/usePowerMetrics';  // Import the hook

const PowerScreen = () => {
  const { output, metrics, fetchMetrics } = usePowerMetrics();  // Use the hook
  const [modalVisible, setModalVisible] = useState(false);  // State for modal visibility

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Add some spacing between buttons */}
      <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={fetchMetrics}>
            <Text style={styles.buttonText}>Get Power Metrics</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
            <Text style={styles.buttonText}>FAQ</Text>
          </TouchableOpacity>
        </View>
    {/*  <Text style={styles.header}>Power Metrics</Text> */}

      <View style={styles.grid}>
        {/* Display various metrics */}
        <View style={styles.row}>
          <Text style={styles.label}>Battery Present:</Text>
          <Text style={styles.value}>{metrics.batteryPresent}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Battery Status:</Text>
          <Text style={styles.value}>{metrics.batteryStatus}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Battery Health:</Text>
          <Text style={styles.value}>{metrics.batteryHealth}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Battery Temp:</Text>
          <Text style={styles.value}>{metrics.batteryTemp} °C</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Battery Voltage:</Text>
          <Text style={styles.value}>{metrics.batteryVoltage} V</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Battery Charge:</Text>
          <Text style={styles.value}>{metrics.batteryCharge} mAh</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Battery Charging Current:</Text>
          <Text style={styles.value}>{metrics.batteryChargingCurrent} A</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Battery Capacity:</Text>
          <Text style={styles.value}>{metrics.batteryCapacity} %</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Plug Type:</Text>
          <Text style={styles.value}>{metrics.plugType}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Charging Type:</Text>
          <Text style={styles.value}>{metrics.chargingType}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Max Charging Current:</Text>
          <Text style={styles.value}>{metrics.maxChargingCurrent} A</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Max Charging Voltage:</Text>
          <Text style={styles.value}>{metrics.maxChargingVoltage} V</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Max Charging Power:</Text>
          <Text style={styles.value}>{metrics.wattage} W</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Real-Time Power Usage:</Text>
          <Text style={styles.value}>{metrics.power} W</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>PUI (Power Usage Indicator):</Text>
          <Text style={styles.value}>{metrics.pui} W/%</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>URI (Voltage-Current Ratio):</Text>
          <Text style={styles.value}>{metrics.uri} V/A</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Charger Skin Temp:</Text>
          <Text style={styles.value}>{metrics.chargerSkinTemp} °C</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>USB Connection Temp:</Text>
          <Text style={styles.value}>{metrics.usbConnTemp} °C</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>VBUS Voltage:</Text>
          <Text style={styles.value}>{metrics.vbusVoltage} V</Text>
        </View>

        

        <Text style={styles.output}>Output: {output}</Text>

        {/* Modal for FAQ */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>FAQ - Measured Features</Text>
            <ScrollView>
              <Text style={styles.modalText}>1. **Battery Present** - Indicates whether the battery is present in the device or not.</Text>
              <Text style={styles.modalText}>2. **Battery Status** - Shows if the battery is charging, discharging, full, or not charging.</Text>
              <Text style={styles.modalText}>3. **Battery Health** - Indicates the condition of the battery: Good, Overheat, Dead, Over voltage, or Cold.</Text>
              <Text style={styles.modalText}>4. **Battery Temperature** - Displays the current temperature of the battery in degrees Celsius.</Text>
              <Text style={styles.modalText}>5. **Battery Voltage** - Represents the voltage of the battery at the current time.</Text>
              <Text style={styles.modalText}>6. **Battery Charge** - Represents the current charge of the battery in mAh (milliampere-hours).</Text>
              <Text style={styles.modalText}>7. **Battery Charging Current** - Shows the current flowing into (positive) or out of (negative) the battery in real-time.</Text>
              <Text style={styles.modalText}>8. **Battery Capacity** - Indicates the remaining battery charge as a percentage.</Text>
              <Text style={styles.modalText}>9. **Plug Type** - Identifies the type of charger connected: AC Charger, USB Port Charging, Wireless Charger, USB Fast Charger (9V), or Charging Dock (12V).</Text>
              <Text style={styles.modalText}>10. **Charging Type** - Describes whether the device is charging normally, fast charging (15W or more), or using a Charging Dock.</Text>
              <Text style={styles.modalText}>11. **Max Charging Current** - Maximum current the charger can provide to the battery, measured in amps (A).</Text>
              <Text style={styles.modalText}>12. **Max Charging Voltage** - Maximum voltage supplied by the charger, measured in volts (V).</Text>
              <Text style={styles.modalText}>13. **Max Charging Power** - Calculated as the product of Max Charging Current and Max Charging Voltage, represents the potential charging power in watts (W).</Text>
              <Text style={styles.modalText}>14. **Real-Time Power Usage** - Shows the instantaneous power being consumed or supplied to the battery, calculated using battery voltage and current.</Text>

              <Text style={styles.modalText}>15. **PUI (Power Usage Indicator)** - Efficiency of battery power usage, calculated by dividing real-time power usage by battery capacity.</Text>
                <Text style={styles.modalText}>   • **Below 0.1 W/%**: Indicates efficient power usage, typical during low-power or idle modes.</Text>
                <Text style={styles.modalText}>   • **Between 0.1 and 0.5 W/%**: Represents moderate power usage, common for regular activities like browsing or light app usage.</Text>
                <Text style={styles.modalText}>   • **Above 0.5 W/%**: Shows higher power consumption, likely during resource-intensive tasks such as gaming or video streaming.</Text>
                <Text style={styles.modalText}>   • **Above 1.0 W/%**: Indicates significant power drain, often during performance-heavy activities, leading to faster battery depletion.</Text>

              <Text style={styles.modalText}>16. **URI (Voltage-Current Ratio)** - The ratio of battery voltage to charging current, providing insight into charging behavior and efficiency.</Text>
                <Text style={styles.modalText}>   • **Below 5 V/A**: Suggests fast charging with a high current relative to the voltage, typical during low battery or fast charging modes.</Text>
                <Text style={styles.modalText}>   • **Between 5 and 15 V/A**: Represents normal charging behavior, common when the battery is partially charged.</Text>
                <Text style={styles.modalText}>   • **Above 15 V/A**: Indicates low current flow, typical during trickle charging or when the battery is nearly full.</Text>
                <Text style={styles.modalText}>   • **Above 25 V/A**: Suggests very low current flow, likely when the battery is full or there’s a possible issue with the charging setup.</Text>

              <Text style={styles.modalText}>17. **Charger Skin Temperature** - The temperature of the charging components inside the device, measured in degrees Celsius.</Text>
              <Text style={styles.modalText}>18. **USB Connection Temperature** - Represents the temperature at the USB connection port.</Text>
              <Text style={styles.modalText}>19. **VBUS Voltage** - Voltage provided by the USB connection during charging.</Text>


            </ScrollView>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
};

// Add spacing between buttons in the style
const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  grid: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontWeight: 'bold',
    flex: 1,
  },
  value: {
    flex: 1,
    textAlign: 'right',
  },
  output: {
    marginTop: 20,
    color: 'black',
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 0,
    marginBottom: 20,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxHeight: '90%',
  },
  modalTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginVertical: 5,
    marginBottom: 10,
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

export default PowerScreen;
