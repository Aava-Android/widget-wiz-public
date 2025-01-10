import React, { useEffect } from 'react';
import { View, Text, Button, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import useSensorService from '../testlogic/useSensorService';

const SensorServiceScreen = () => {
  const { sensorData, fetchSensorInfo, loading, error } = useSensorService();

  useEffect(() => {
    fetchSensorInfo();
  }, [fetchSensorInfo]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Sensor Service</Text>
      {loading && <ActivityIndicator size="large" color="blue" />}
      {error && <Text style={styles.error}>Error: {error}</Text>}
      <Button title="Refresh Sensor Info" onPress={fetchSensorInfo} />
      <View style={styles.outputContainer}>
        {sensorData.map((sensor, index) => (
          <Text key={index} style={styles.outputLine}>
            - {sensor.sensorName}: {sensor.status}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  outputContainer: {
    marginTop: 20,
    alignItems: 'flex-start',
    width: '100%',
  },
  outputLine: {
    color: 'black',
    fontSize: 16,
    paddingVertical: 2,
  },
});

export default SensorServiceScreen;
