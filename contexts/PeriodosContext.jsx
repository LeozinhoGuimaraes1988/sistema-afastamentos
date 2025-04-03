import React, { createContext, useState } from 'react';

// Cria o contexto
export const PeriodsContext = createContext();

// Componente provedor
export const PeriodsProvider = ({ children }) => {
  const [currentPeriods, setCurrentPeriods] = useState([]);

  return (
    <PeriodsContext.Provider value={{ currentPeriods, setCurrentPeriods }}>
      {children}
    </PeriodsContext.Provider>
  );
};
