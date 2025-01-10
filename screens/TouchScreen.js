import React from 'react';
import { View, Text, Button, ScrollView, StyleSheet } from 'react-native';
import { useTouchTest } from '../testlogic/useTouchTest';

const TouchScreen = () => {
  const { touchLog, isMonitoring, toggleMonitoring, handleTouch } = useTouchTest();

  return (
    <View
      style={styles.container}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(e) => isMonitoring && handleTouch('onTouchStart', e)}
      onResponderMove={(e) => isMonitoring && handleTouch('onTouchMove', e)}
      onResponderRelease={(e) => isMonitoring && handleTouch('onTouchEnd', e)}
    >
      <ScrollView>
        <Text style={styles.title}>Touch Event Monitor</Text>
        <Button
          title={isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          onPress={toggleMonitoring}
        />

        <View style={styles.logContainer}>
          <Text style={styles.logTitle}>Touch Log:</Text>
          {touchLog.map((entry, index) => (
            <Text key={index} style={styles.logText}>
              {JSON.stringify(entry)}
            </Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  logContainer: {
    marginTop: 20,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  logText: {
    fontSize: 14,
    color: 'black',
  },
});

export default TouchScreen;
