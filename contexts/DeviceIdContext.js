// DeviceIdContext.js
import React from 'react';

const DeviceIdContext = React.createContext({
  deviceId: '',
  setDeviceId: () => {},
});

export default DeviceIdContext;
