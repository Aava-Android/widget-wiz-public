import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView, Dimensions, Touchable } from 'react-native';
import { useTest } from '../contexts/TestContext';
import useMainCameraScan from '../testlogic/useMainCameraScan';
import useSecondaryCameraScan from '../testlogic/useSecondaryCameraScan';
import { Camera } from 'react-native-vision-camera';
import { useTouchTest } from '../testlogic/useTouchTest';
import AsyncStorage from '@react-native-async-storage/async-storage';

function HomeScreen({ navigation }) {
  const {
    isTestOn,
    testResults,
    stopCalled,
    setStopCalled,
    isAnyTestEnabled,
    selectedTests,
    setSelectedTests,
    disableButton,
    showMainCamera,
    showSecondaryCamera,
    selectedDevice1,
    selectedDevice2,
    selectedDevice3,
    setSelectedDevice1,
    setSelectedDevice2,
    setSelectedDevice3,
  } = useTest();
  const { mainCameraRef, backDevice, mainCodeScanner } = useMainCameraScan();
  const { secondaryCameraRef, frontDevice, secondaryCodeScanner } = useSecondaryCameraScan();
  const { touchLog, setTouchLog, isMonitoring, toggleMonitoring, handleTouch } = useTouchTest();

  // Get screen dimensions
  const [numColumns, setNumColumns] = useState(4); // Default number of buttons per row
  const [buttonWidth, setButtonWidth] = useState(0); // Store button width for dynamic font sizing
  const [touchTestStatus, setTouchTestStatus] = useState('pending'); // 'pass', 'fail', 'pending'

  useEffect(() => {
    const updateLayout = () => {
      const { width } = Dimensions.get('window');
      // Adjust the number of buttons per row based on width
      if (width > 800) {
        setNumColumns(6); // Tablet in landscape
      } else {
        setNumColumns(4); // Phone in portrait
      }
    };

    // Initial layout setup
    updateLayout();

    // Listen for orientation changes
    Dimensions.addEventListener('change', updateLayout);

    // Clean up event listener on component unmount
    /*
    return () => {
      Dimensions.removeEventListener('change', updateLayout);
    };
    */
  }, []);

  useEffect(() => {
    const loadTests = async () => {
      const loadedTests = await loadTestsFromStorage();
      setSelectedTests(loadedTests);
      console.log('Loaded tests:', loadedTests);
      if(loadedTests.includes('Touch Test')) {
        handleTouchTestToggle();
      };
    }
    loadTests();
  }, []);

  
  useEffect(() => {
    if (stopCalled && !isAnyTestEnabled && !isTestOn && selectedTests.length > 0) {
      // Function to untoggle tests sequentially
      const untoggleTestsSequentially = async () => {
        for (const test of selectedTests) {
          // Simulate the time taken to untoggle each test
          console.log(`Untoggling test: ${test}`);
          await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay for simulation
          setSelectedTests((prevTests) => prevTests.filter((t) => t !== test)); // Remove the test
          handleTouchTestToggle(); // Turn off touch test if enabled
          
        }
      };
  
      untoggleTestsSequentially();
      saveTestsToStorage([]); // Clear the tests from storage
      setStopCalled(false); // Reset the stopCalled state
    }
  }, [stopCalled, isAnyTestEnabled, isTestOn, selectedTests]);
  
  

  // Update touch test status dynamically
  useEffect(() => {
    if (isMonitoring) {
      if (touchLog.length > 0) {
        setTouchTestStatus('fail'); // Touch detected
      } else {
        setTouchTestStatus('pass'); // No touch detected
      }
    } else {
      setTouchTestStatus('pending'); // Monitoring not started
    }
  }, [touchLog, isMonitoring]);

  // Function to save array to AsyncStorage
  const saveTestsToStorage = async (tests) => {
    try {
      const jsonValue = JSON.stringify(tests);
      await AsyncStorage.setItem('@tests', jsonValue);
      console.log('Saved tests to storage:', jsonValue);
    } catch (e) {
      console.error('Failed to save tests to storage:', e);
    }
  };

  // Function to load array from AsyncStorage
  const loadTestsFromStorage = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('@tests');
    //  console.log('Loaded tests from storage:', jsonValue);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error('Failed to load tests from storage:', e);
      return [];
    }
  };

  const resetTouchTest = () => {
    setTouchLog([]); // Clear touch logs
    setTouchTestStatus('pending'); // Reset the status
  };
  
  const handleTouchTestToggle = () => {
    if (isMonitoring) {
      toggleMonitoring(); // Turn off monitoring
      resetTouchTest(); // Reset the touch test state
    } else {
      toggleMonitoring(); // Turn on monitoring
    }
  };

  const buttonWidthPercentage = `${100 / numColumns - 2}%`; // Calculate width per button

  const toggleTestSelection = (testName) => {
    const updatedTests = selectedTests.includes(testName)
      ? selectedTests.filter(test => test !== testName)
      : [...selectedTests, testName];
    setSelectedTests(updatedTests);
    saveTestsToStorage(updatedTests);
  };

  // Function to calculate button width and dynamically adjust the font size
  const handleLayout = (event) => {
    const { width } = event.nativeEvent.layout;
    setButtonWidth(width);
  };

  // Dynamic font size based on button width
  const dynamicFontSize = buttonWidth * 0.2; // Adjust the multiplier to fine-tune font size


  const getButtonStyle = (testName) => {
    if (testName === 'Touch Test') {
      if (touchTestStatus === 'fail') {
        return [styles.button, { width: buttonWidthPercentage }, styles.failButton]; // Red
      }
      if (touchTestStatus === 'pass') {
        return [styles.button, { width: buttonWidthPercentage }, styles.selectedButton]; // Yellow
      }
      return [styles.button, { width: buttonWidthPercentage }];
    }

    /*
    // Handle Accessory Test
    if (testName === 'Accessory Test') {
      if (selectedTests.includes('Accessory Test')) {
        return [styles.button, { width: buttonWidthPercentage }, styles.selectedButton];
      }
      return [styles.button, { width: buttonWidthPercentage }];
    }
    */

    if (!isAnyTestEnabled && !selectedTests.includes(testName)) {
      return [styles.button, { width: buttonWidthPercentage }];
    }
    const result = testResults.find(test => test.name === testName);
    if (selectedTests.includes(testName) && !result) {
      return [styles.button, { width: buttonWidthPercentage }, styles.selectedButton];
    }
    if (result?.result) {
      return [styles.button, { width: buttonWidthPercentage }, styles.passButton];
    } else if (result?.result === false) {
      return [styles.button, { width: buttonWidthPercentage }, styles.failButton];
    }
    return [styles.button, { width: buttonWidthPercentage }];
  };

  const getButtonTextStyle = (testName) => {
    if (testName === 'Touch Test') {
      if (touchTestStatus === 'fail') {
        return [styles.buttonText, { fontSize: dynamicFontSize }, styles.failText];
      }
      if (touchTestStatus === 'pass') {
        return [styles.buttonText, { fontSize: dynamicFontSize }, styles.grayText];
      }
      return [styles.buttonText, { fontSize: dynamicFontSize }];
    }

    if (testName === 'Accessory Test') {
      // Determine the button color based on accessory test results
   //   const allPassed = accessoryDevices.every((device) => device.result === true);
      const anyPassed = accessoryDevices.some((device) => device.result === true);
  
      if (selectedTests.includes('Accessory Test')) {
        /*
        if (allPassed) {
          // Green button
          console.log('Accessory Test: allPassed');
          return [styles.buttonText, { fontSize: dynamicFontSize, color: 'white' }];
        } else 
         */
        if (anyPassed) {
          // Red or green button
          console.log('Accessory Test: anyPassed');
          return [styles.buttonText, { fontSize: dynamicFontSize }];
        } else {
          // Yellow button (pending or no results)
          console.log('Accessory Test: pending');
          return [styles.buttonText, { fontSize: dynamicFontSize, color: 'gray' }];
        }
      }
    }

    if (selectedTests.includes(testName) && !testResults.find(test => test.name === testName)) {
      return [styles.buttonText, { fontSize: dynamicFontSize }, styles.grayText];
    }
    return [styles.buttonText, { fontSize: dynamicFontSize }];
  };

  const handlers = isMonitoring
    ? {
        onResponderGrant: (e) => handleTouch('onTouchStart', e),
        onResponderMove: (e) => handleTouch('onTouchMove', e),
        onResponderRelease: (e) => handleTouch('onTouchEnd', e),
      }
    : {};

  // Extract Accessory Test results per device
  const accessoryTestResults = testResults.filter(test => test.name.startsWith('Accessory Test'));

  const accessoryDevices = [
    { device: selectedDevice1, result: null },
    { device: selectedDevice2, result: null },
    { device: selectedDevice3, result: null },
  ].filter(item => item.device !== null);

  accessoryDevices.forEach((item, index) => {
    const testResult = accessoryTestResults.find(test => test.name === `Accessory Test - ${item.device.name}`);
    if (testResult) {
      accessoryDevices[index].result = testResult.result;
    }
  });

  // Function to determine the color for each device's test result
  const getAccessorySectionStyle = (result) => {
    if (result === true) {
      return styles.passSection;
    } else if (result === false) {
      return styles.failSection;
    } else {
      return styles.pendingSection;
    }
  };

  const clearAsyncStorage = async () => {
    try {
      saveTestsToStorage([]);
      console.log('Cleared AsyncStorage', selectedTests);
  } catch (e) {
      console.error('Failed to clear AsyncStorage:', e);
    }
  };


//------------------------------------------------------------------------------------------------
//------------------------------------RENDER COMPONENT--------------------------------------------
//------------------------------------------------------------------------------------------------

return (
    <ScrollView
      {...handlers}
      contentContainerStyle={styles.container}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}

    >
    <View
      {...handlers}
      style={styles.buttonRow}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      
    >
      <TouchableOpacity
        style={getButtonStyle('Audio Test')}
        onLayout={handleLayout}
        onLongPress={() => navigation.navigate('Audio')}
        onPress={() => toggleTestSelection('Audio Test')}
        disabled={disableButton}
      >
        <Text style={getButtonTextStyle('Audio Test')}>Audio</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={getButtonStyle('Backlight Test')}
        onLayout={handleLayout}
        onLongPress={() => navigation.navigate('Backlight')}
        onPress={() => toggleTestSelection('Backlight Test')}
        disabled={disableButton}
      >
        <Text style={getButtonTextStyle('Backlight Test')}>Backlight</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={getButtonStyle('Bluetooth Test')}
        onLayout={handleLayout}
        onLongPress={() => navigation.navigate('Bluetooth')}
        onPress={() => toggleTestSelection('Bluetooth Test')}
        disabled={disableButton}
      >
        <Text style={getButtonTextStyle('Bluetooth Test')}>Bluetooth</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={getButtonStyle('Cellular Test')}
        onLayout={handleLayout}
        onLongPress={() => navigation.navigate('Cellular')}
        onPress={() => toggleTestSelection('Cellular Test')}
        disabled={disableButton}
      >
        <Text style={getButtonTextStyle('Cellular Test')}>Cellular</Text>
      </TouchableOpacity>
    
      <TouchableOpacity
        style={[getButtonStyle('Main Camera Test'), showMainCamera ? styles.cameraActive : {}]}
        onLayout={handleLayout}
        onLongPress={() => navigation.navigate('Main Camera')}
        onPress={() => toggleTestSelection('Main Camera Test')}
        disabled={disableButton}
      >
        {showMainCamera && backDevice ? (
          <Camera
            ref={mainCameraRef}
            style={styles.cameraPreview}
            device={backDevice}
            isActive={showMainCamera}
            codeScanner={mainCodeScanner}
          />
        ) : (
          <Text style={getButtonTextStyle('Main Camera Test')}>Camera Main</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[getButtonStyle('Secondary Camera Test'), showSecondaryCamera ? styles.cameraActive : {}]}
        onLayout={handleLayout}
        onLongPress={() => navigation.navigate('Secondary Camera')}
        onPress={() => toggleTestSelection('Secondary Camera Test')}
        disabled={disableButton}
      >
        {showSecondaryCamera && frontDevice ? (
          <Camera
            ref={secondaryCameraRef}
            style={styles.cameraPreview}
            device={frontDevice}
            isActive={showSecondaryCamera}
            codeScanner={secondaryCodeScanner}
          />
        ) : (
          <Text style={getButtonTextStyle('Secondary Camera Test')}>Camera Secondary</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={getButtonStyle('GPS Test')}
        onLayout={handleLayout}
        onLongPress={() => navigation.navigate('GPS')}
        onPress={() => toggleTestSelection('GPS Test')}
        disabled={disableButton}
      >
        <Text style={getButtonTextStyle('GPS Test')}>GPS</Text>
      </TouchableOpacity>
    
      <TouchableOpacity
        style={getButtonStyle('NFC Test')}
        onLayout={handleLayout}
        onLongPress={() => navigation.navigate('NFC')}
        onPress={() => toggleTestSelection('NFC Test')}
        disabled={disableButton}
      >
        <Text style={getButtonTextStyle('NFC Test')}>NFC</Text>
      </TouchableOpacity>

{/*
      <TouchableOpacity
        style={getButtonStyle('Ping Test')}
        onLayout={handleLayout}
        onLongPress={() => navigation.navigate('Ping')}
        onPress={() => toggleTestSelection('Ping Test')}
        disabled={disableButton}
      >
        <Text style={getButtonTextStyle('Ping Test')}>Ping</Text>
      </TouchableOpacity>
*/}
      
      <TouchableOpacity
        style={getButtonStyle('Power Metrics')}
        onLayout={handleLayout}
        onLongPress={() => navigation.navigate('PowerScreen')}
        onPress={() => toggleTestSelection('Power Metrics')}
        disabled={disableButton}
      >
        <Text style={getButtonTextStyle('Power Metrics')}>Power Metrics</Text>
      </TouchableOpacity>

    
    <TouchableOpacity
          style={getButtonStyle('ThermalService')}
          onLayout={handleLayout}
          onLongPress={() => navigation.navigate('ThermalService')}
          onPress={() => toggleTestSelection('ThermalService')}
          disabled={disableButton}
        >
          <Text style={getButtonTextStyle('ThermalService')}>Thermal Service</Text>
      </TouchableOpacity>

      {/* USB Test Button */}
      <TouchableOpacity
          style={getButtonStyle('USB Test')}
          onLayout={handleLayout}
          onLongPress={() => navigation.navigate('USB')}
          onPress={() => toggleTestSelection('USB Test')}
          disabled={disableButton}
        >
          <Text style={getButtonTextStyle('USB Test')}>USB</Text>
        </TouchableOpacity>

      <TouchableOpacity
          style={getButtonStyle('Vibration Test')}
          onLayout={handleLayout}
          onLongPress={() => navigation.navigate('Vibrator')}
          onPress={() => toggleTestSelection('Vibration Test')}
          disabled={disableButton}
        >
          <Text style={getButtonTextStyle('Vibration Test')}>Vibrator</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={getButtonStyle('WLAN Test')}
        onLayout={handleLayout}
        onLongPress={() => navigation.navigate('WLAN')}
        onPress={() => toggleTestSelection('WLAN Test')}
        disabled={disableButton}
      >
        <Text style={getButtonTextStyle('WLAN Test')}>WLAN</Text>
      </TouchableOpacity>

    <TouchableOpacity
        style={getButtonStyle('AdbCommand')}
        onLayout={handleLayout}
        onLongPress={() => navigation.navigate('AdbCommand')}
        onPress={() => toggleTestSelection('AdbCommand')}
        disabled={disableButton}
      >
        <Text style={getButtonTextStyle('AdbCommand')}>Hardware Info</Text>
      </TouchableOpacity>

      {/*
      <TouchableOpacity
          style={getButtonStyle('AdbWidgets')}
          onLayout={handleLayout}
          onLongPress={() => navigation.navigate('AdbWidgets')}
          disabled={disableButton}
        >
          <Text style={getButtonTextStyle('AdbWidgets')}>Adb Widgets</Text>
      </TouchableOpacity>
      */}

      <TouchableOpacity
        style={getButtonStyle('Touch Test')}
        onLayout={handleLayout}
        onLongPress={() => navigation.navigate('Touch')}
        onPress={() => { toggleTestSelection('Touch Test'); handleTouchTestToggle(); }}
        disabled={disableButton}
      >
        <Text style={getButtonTextStyle('Touch Test')}>Touch</Text>
        {isMonitoring && (
          <Text style={[styles.buttonText, { fontSize: dynamicFontSize, marginTop: 5 }]}>
            {touchLog.length}
          </Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={getButtonStyle('Sensor Service Test')}
        onLayout={handleLayout}
        onLongPress={() => navigation.navigate('SensorService')}
        onPress={() => toggleTestSelection('Sensor Service Test')}
        disabled={disableButton}
      >
        <Text style={getButtonTextStyle('Sensor Service Test')}>Sensor</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={getButtonStyle('Accessory Test')}
        onLayout={handleLayout}
        onLongPress={() => navigation.navigate('Accessory')}
        onPress={() => {
          if (selectedTests.includes('Accessory Test')) {
            // Reset accessory sections when unselected
            accessoryDevices.forEach((device) => (device.result = null));
            setSelectedDevice1(null);
            setSelectedDevice2(null);
            setSelectedDevice3(null);
          }
          toggleTestSelection('Accessory Test');
        }}
        disabled={disableButton}
      >
        {/* Sections for Accessory Test */}
        <View style={styles.accessoryButtonContainer}>
          {accessoryDevices.length > 0
            ? accessoryDevices.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.accessorySection,
                    getAccessorySectionStyle(item.result),
                  ]}
                />
              ))
            : null}
        </View>

        {/* Ensure "Accessory" Text is Always Visible */}
        <Text style={[getButtonTextStyle('Accessory Test'), styles.accessoryLabel]}>Accessory</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={getButtonStyle('CPIN Test')}
        onLayout={handleLayout}
        onLongPress={() => navigation.navigate('CPIN')}
        onPress={() => toggleTestSelection('CPIN Test')}
        disabled={disableButton}
      >
        <Text style={getButtonTextStyle('CPIN Test')}>CPIN</Text>
      </TouchableOpacity>

{/*
      <TouchableOpacity
        style={getButtonStyle('Clear AsyncStorage')}
        onLayout={handleLayout}
        onPress={() => clearAsyncStorage()}
        disabled={disableButton}
      >
        <Text style={getButtonTextStyle('Clear AsyncStorage')}>Clear AsyncStorage</Text>
      </TouchableOpacity>
*/}

    </View>
  </ScrollView>
);
}


//------------------------------------------------------------------------------------------------
//------------------------------------STYLESHEET--------------------------------------------------
//------------------------------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, // Allow the ScrollView to take up the entire screen
    paddingVertical: 10, // Adds vertical padding to the ScrollView
    alignItems: 'center',
    backgroundColor: 'black',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow buttons to wrap to the next row
    justifyContent: 'flex-start',
    width: '100%',
    paddingHorizontal: '2%', // Add horizontal padding to center the buttons
  //  marginBottom: '2%', // More space between rows for bigger buttons
  },
  button: {
    backgroundColor: 'gray', // Default blue color for buttons
    width: '31%', // Button width in percentage to fit two in a row
    height: '31%', // Height for the buttons
    aspectRatio: 1, // Maintain aspect ratio for square buttons
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 1, // Remove border radius for a square/rectangular look
    marginHorizontal: '1%', // Add margin between buttons
    marginVertical: '1%', // Add margin between rows
    elevation: 5, // Add shadow for Android
  },
  accessoryButtonContainer: {
    flexDirection: 'row', // Align sections in a row
    width: '100%',        // Full width of the button
    height: '100%',        // Occupy 60% of the button's height
    justifyContent: 'space-between', // Evenly distribute sections
    alignItems: 'center', // Center vertically
  },
  accessorySection: {
    flex: 1,               // Each section takes equal space
    marginHorizontal: 0,   // Add spacing between sections
    height: '100%',        // Full height of the container
    borderRadius: 0,       // Rounded corners for sections
    borderWidth: 1,        // Add border for better visibility
    borderColor: 'gray',  // White border for contrast
  },
  accessoryLabel: {
  position: 'absolute',    // Overlay the text at the center
  // text color should change dynamically based on the result
  
  //position at 50% of the button height
//  top: 'button.height / 3', // Adjust for the button height
//  fontSize: 16,            // Adjust font size for readability
//  color: 'white',          // Ensure visibility over sections
//  fontWeight: 'bold',      // Bold text for better emphasis
},
  passSection: {
    backgroundColor: '#00B294', // Green for PASS
  },
  failSection: {
    backgroundColor: '#F44336', // Red for FAIL
  },
  pendingSection: {
    backgroundColor: '#FFF176', // Yellow for PENDING or no result
  },
  cameraActive: {
    borderWidth: 2,
    borderColor: '#FFF176',  // Indicate active camera
  },
  cameraPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  selectedButton: {
    backgroundColor: '#FFF176', // Yellow color for selected tests
  },
  passButton: {
    backgroundColor: '#00B294', // Lighter green for passed tests
  },
  failButton: {
    backgroundColor: '#F44336', // Red for failed tests
  },
  buttonText: {
  //  position: 'absolute', // Overlay the text at the center
    color: 'white',
    fontSize: 20, // Bigger font for bold, Metro style
    fontWeight: 'bold',
    textAlign: 'center',
  },
  grayText: {
    color: 'gray', // Black text for buttons with yellow background
  },
});

export default HomeScreen;
