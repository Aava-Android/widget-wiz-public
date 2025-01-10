/*import React from 'react';
import { View, Text, Button, FlatList, StyleSheet, ActivityIndicator, BackHandler } from 'react-native';
import useUSBTest from '../testlogic/useUSBTest';
import { useFocusEffect } from '@react-navigation/native';

const USBScreen = () => {
  const { files, isChecking, testStatus, startUSBTest, isCooldown, cooldownTime } = useUSBTest();

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (isChecking) {
          return true;
        }
        return false;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [isChecking])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.status}>{testStatus}</Text>
      <Text style={styles.cooldown}>{isCooldown ? `Ready to test in: ${cooldownTime}s` : ''}</Text>
      <Button title="Test USB Drive" onPress={startUSBTest} disabled={isCooldown} />
      {isChecking && <ActivityIndicator size="large" color="#0000ff" />}
      <FlatList
        style={styles.list}
        data={files}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => <Text>{item.name}</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5FCFF',
  },
  status: {
    fontSize: 20,
    marginBottom: 20,
  },
  cooldown: {
    fontSize: 14,
    marginBottom: 10,
  },
  list: {
    marginTop: 20,
  },
});

export default USBScreen;*/

import React from 'react';
import { View, Text, Button, FlatList, StyleSheet, ActivityIndicator, BackHandler } from 'react-native';
import useUSBTest from '../testlogic/useUSBTest'; // Import the updated hook
import { useFocusEffect } from '@react-navigation/native';

const USBScreen = () => {
  const { files, isChecking, testStatus, startUSBTest } = useUSBTest();

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (isChecking) {
          return true;
        }
        return false;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [isChecking])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.status}>{testStatus}</Text>
      <Button title="Test USB Drive" onPress={startUSBTest} />
      {isChecking && <ActivityIndicator size="large" color="#0000ff" />}
      <FlatList
        style={styles.list}
        data={files}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => <Text>{item.name}</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5FCFF',
  },
  status: {
    fontSize: 20,
    marginBottom: 20,
  },
  list: {
    marginTop: 20,
  },
});

export default USBScreen;