import React, { createContext, useContext, useState, useEffect } from 'react';

export const TestContext = createContext();

export const TestProvider = ({ children }) => {
  const [isGpsTestEnabled, setIsGpsTestEnabled] = useState(false);
  const [isNetworkTestEnabled, setIsNetworkTestEnabled] = useState(false);
  const [isBluetoothTestEnabled, setIsBluetoothTestEnabled] = useState(false);
  const [isVibratorTestEnabled, setIsVibratorTestEnabled] = useState(false);
  const [isPingTestEnabled, setIsPingTestEnabled] = useState(false); // Added for Ping Test
  const [isBacklightTestEnabled, setIsBacklightTestEnabled] = useState(false);
  const [isScreenTouchTestEnabled, setIsScreenTouchTestEnabled] = useState(false);

  const [isBackCameraTestEnabled, setIsBackCameraTestEnabled] = useState(false); // Added for Back Camera Test
  const [isBackCameraTestResolved, setIsBackCameraTestResolved] = useState(undefined); // Added for Back Camera Test
  const [isBackCameraTestRejected, setIsBackCameraTestRejected] = useState(undefined); // Added for Back Camera Test

  const [isFrontCameraTestEnabled, setIsFrontCameraTestEnabled] = useState(false); // Added for Front Camera Test
  const [isFrontCameraTestResolved, setIsFrontCameraTestResolved] = useState(undefined); // Added for Front Camera Test
  const [isFrontCameraTestRejected, setIsFrontCameraTestRejected] = useState(undefined); // Added for Front Camera Test

  const [isBatteryInfoEnabled, setIsBatteryInfoEnabled] = useState(false); // Added for Battery Info [BatteryScreen.js
  const [isAudioTestEnabled, setIsAudioTestEnabled] = useState(false); // Added for Audio Test
  const [isAnyTestEnabled, setIsAnyTestEnabled] = useState(false);
  const [testResults, setTestResults] = useState([]);

  // Add selected tests state
  const [selectedTests, setSelectedTests] = useState([]); // List of selected tests
  const [isTestOn, setIsTestOn] = useState(false); //
  const [isCountdownOn, setIsCountdownOn] = useState(false); // Added for countdown timer
  const [disableButton, setDisableButton] = useState(false); // Added for disabling buttons
  const [stopCalled, setStopCalled] = useState(false); // Track if stop was called
  const [showMainCamera, setShowMainCamera] = useState(false);
  const [showSecondaryCamera, setShowSecondaryCamera] = useState(false);
  const [scannedMainCode, setScannedMainCode] = useState([]);
  //console.log('TESTCONTEXT: scannedMainCode:', scannedMainCode);
  const [scannedSecondaryCode, setScannedSecondaryCode] = useState([]);
  //console.log('TESTCONTEXT: scannedSecondaryCode:', scannedSecondaryCode);

  const [selectedDevice1, setSelectedDevice1] = useState(null);
  const [selectedDevice2, setSelectedDevice2] = useState(null);
  const [selectedDevice3, setSelectedDevice3] = useState(null);

  return (
    <TestContext.Provider value={{
      isGpsTestEnabled, setIsGpsTestEnabled,
      isNetworkTestEnabled, setIsNetworkTestEnabled,
      isBluetoothTestEnabled, setIsBluetoothTestEnabled,
      isVibratorTestEnabled, setIsVibratorTestEnabled,
      isPingTestEnabled, setIsPingTestEnabled,
      isBacklightTestEnabled, setIsBacklightTestEnabled,
      isScreenTouchTestEnabled, setIsScreenTouchTestEnabled,

      isBackCameraTestEnabled, setIsBackCameraTestEnabled,
      isBackCameraTestResolved, setIsBackCameraTestResolved,
      isBackCameraTestRejected, setIsBackCameraTestRejected,

      isFrontCameraTestEnabled, setIsFrontCameraTestEnabled,
      isFrontCameraTestResolved, setIsFrontCameraTestResolved,
      isFrontCameraTestRejected, setIsFrontCameraTestRejected,

      isAudioTestEnabled, setIsAudioTestEnabled,
      isBatteryInfoEnabled, setIsBatteryInfoEnabled,
      isAnyTestEnabled, setIsAnyTestEnabled,
      testResults, setTestResults,

      selectedTests, setSelectedTests, // Provide selected tests and setter
      isTestOn, setIsTestOn, // Provide test on/off state
      isCountdownOn, setIsCountdownOn, // Provide countdown
      disableButton, setDisableButton, // Provide button disabling

      showMainCamera, setShowMainCamera,
      showSecondaryCamera, setShowSecondaryCamera,
      scannedMainCode, setScannedMainCode,
      scannedSecondaryCode, setScannedSecondaryCode,

      selectedDevice1, setSelectedDevice1,
      selectedDevice2, setSelectedDevice2,
      selectedDevice3, setSelectedDevice3,

      stopCalled, setStopCalled,
    }}>
      {children}
    </TestContext.Provider>
  );
};

export const useTest = () => useContext(TestContext);
