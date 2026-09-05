'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type PrivacyContextType = {
  isConcealed: boolean;
  togglePrivacy: () => void;
};

const PrivacyContext = createContext<PrivacyContextType>({
  isConcealed: false,
  togglePrivacy: () => {},
});

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [isConcealed, setIsConcealed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('mindfinance_privacy');
    if (saved === 'true') {
      setIsConcealed(true);
    }
  }, []);

  const togglePrivacy = () => {
    setIsConcealed((prev) => {
      const newState = !prev;
      localStorage.setItem('mindfinance_privacy', String(newState));
      return newState;
    });
  };

  return (
    <PrivacyContext.Provider value={{ isConcealed, togglePrivacy }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export const usePrivacy = () => useContext(PrivacyContext);

