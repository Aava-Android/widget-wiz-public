// BackupDirectoryContext.js

import React, { createContext, useState } from 'react';

export const BackupDirectoryContext = createContext();

export const BackupDirectoryProvider = ({ children }) => {
  const [backupDirectoryUri, setBackupDirectoryUri] = useState(null);
  const [backupStatus, setBackupStatus] = useState('notSelected'); // 'normal', 'notSelected', 'failed'

  const updateBackupStatus = (status) => {
    setBackupStatus(status);
  };

  return (
    <BackupDirectoryContext.Provider
      value={{
        backupDirectoryUri,
        setBackupDirectoryUri,
        backupStatus,
        updateBackupStatus,
      }}
    >
      {children}
    </BackupDirectoryContext.Provider>
  );
};
