import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { loadKarma, addKarmaEvent, getKarmaLevel, KarmaAction, KarmaData } from '../utils/karma';

export interface KarmaState {
  total: number;
  level: number;
  title: string;
}

export interface KarmaActions {
  awardKarma: (action: KarmaAction, priority?: string) => void;
}

export interface KarmaContextValue {
  state: KarmaState;
  actions: KarmaActions;
}

const KarmaContext = createContext<KarmaContextValue | null>(null);

interface KarmaProviderProps {
  children: ReactNode;
}

export function KarmaProvider({ children }: KarmaProviderProps) {
  const [karmaData, setKarmaData] = useState<KarmaData>({ total: 0, history: [] });

  // Load karma on mount
  useEffect(() => {
    const data = loadKarma();
    setKarmaData(data);
  }, []);

  const awardKarma = useCallback((action: KarmaAction, priority?: string) => {
    const newData = addKarmaEvent(action, priority);
    setKarmaData(newData);
  }, []);

  const { level, title } = getKarmaLevel(karmaData.total);

  const state: KarmaState = {
    total: karmaData.total,
    level,
    title,
  };

  const actions: KarmaActions = {
    awardKarma,
  };

  return <KarmaContext.Provider value={{ state, actions }}>{children}</KarmaContext.Provider>;
}

export function useKarma(): KarmaContextValue {
  const context = useContext(KarmaContext);
  if (!context) {
    throw new Error('useKarma must be used within KarmaProvider');
  }
  return context;
}
