import React, { createContext, useContext, useState, useCallback } from 'react';

const SystemContext = createContext(null);

export const SystemProvider = ({ children }) => {
  const [activeSystem, setActiveSystemState] = useState(() => {
    return localStorage.getItem('stock_active_system') || null;
  });

  const selectSystem = useCallback((system) => {
    const normalized = String(system).toLowerCase();
    if (normalized === 'electrical' || normalized === 'hardware') {
      setActiveSystemState(normalized);
      localStorage.setItem('stock_active_system', normalized);
      return normalized;
    }
    return null;
  }, []);

  const clearSystem = useCallback(() => {
    setActiveSystemState(null);
    localStorage.removeItem('stock_active_system');
  }, []);

  return (
    <SystemContext.Provider
      value={{
        activeSystem,
        selectSystem,
        clearSystem,
        isElectrical: activeSystem === 'electrical',
        isHardware: activeSystem === 'hardware'
      }}
    >
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) {
    const fallbackSystem = (typeof localStorage !== 'undefined' && localStorage.getItem('stock_active_system')) || 'hardware';
    return {
      activeSystem: fallbackSystem,
      selectSystem: () => {},
      clearSystem: () => {},
      isElectrical: fallbackSystem === 'electrical',
      isHardware: fallbackSystem === 'hardware'
    };
  }
  return context;
};

export default SystemContext;
