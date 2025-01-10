import React, { createContext, useContext, useState, useEffect } from 'react';

const CooldownContext = createContext();

export const useCooldown = () => useContext(CooldownContext);

export const CooldownProvider = ({ children }) => {
  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);

  useEffect(() => {
    if (isCooldown && cooldownTime > 0) {
      const interval = setInterval(() => {
        setCooldownTime((prevTime) => prevTime - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (cooldownTime <= 0) {
      setIsCooldown(false);
    }
  }, [isCooldown, cooldownTime]);

  const startCooldown = (time = 30) => {
    setCooldownTime(time);
    setIsCooldown(true);
  };

  return (
    <CooldownContext.Provider value={{ isCooldown, cooldownTime, startCooldown }}>
      {children}
    </CooldownContext.Provider>
  );
};
