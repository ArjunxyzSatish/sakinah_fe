import React, { createContext, useContext, useState } from 'react';

export type MascotState = 'idle' | 'loading' | 'reflecting';

interface MascotContextType {
  mascotState: MascotState;
  setMascotState: (state: MascotState) => void;
}

const MascotContext = createContext<MascotContextType | undefined>(undefined);

export function MascotProvider({ children }: { children: React.ReactNode }) {
  const [mascotState, setMascotState] = useState<MascotState>('idle');
  return (
    <MascotContext.Provider value={{ mascotState, setMascotState }}>
      {children}
    </MascotContext.Provider>
  );
}

export function useMascot() {
  const context = useContext(MascotContext);
  if (!context) throw new Error('useMascot must be used within MascotProvider');
  return context;
}
