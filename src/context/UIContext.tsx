import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import type { UIState, UIActions, PanelType, ModalType, TabType, CommandLogEntry } from '../types';

// ============================================================================
// State & Reducer
// ============================================================================

const initialState: UIState = {
  focusedPanel: 'fileTree',
  modal: null,
  activeTab: 'files',
  commandLog: [],
};

type UIAction =
  | { type: 'SET_FOCUSED_PANEL'; payload: PanelType }
  | { type: 'SET_MODAL'; payload: ModalType }
  | { type: 'SET_ACTIVE_TAB'; payload: TabType }
  | { type: 'LOG_COMMAND'; payload: string };

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'SET_FOCUSED_PANEL':
      return { ...state, focusedPanel: action.payload };

    case 'SET_MODAL':
      return { ...state, modal: action.payload };

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };

    case 'LOG_COMMAND': {
      const entry: CommandLogEntry = {
        message: action.payload,
        timestamp: new Date(),
      };
      return {
        ...state,
        commandLog: [...state.commandLog, entry].slice(-50),
      };
    }

    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================

export interface UIContextValue {
  state: UIState;
  actions: UIActions;
}

const UIContext = createContext<UIContextValue | null>(null);

interface UIProviderProps {
  children: ReactNode;
}

export function UIProvider({ children }: UIProviderProps) {
  const [state, dispatch] = useReducer(uiReducer, initialState);

  const actions: UIActions = {
    setFocusedPanel: useCallback((panel: PanelType) => {
      dispatch({ type: 'SET_FOCUSED_PANEL', payload: panel });
    }, []),

    setModal: useCallback((modal: ModalType) => {
      dispatch({ type: 'SET_MODAL', payload: modal });
    }, []),

    setActiveTab: useCallback((tab: TabType) => {
      dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
    }, []),

    logCommand: useCallback((message: string) => {
      dispatch({ type: 'LOG_COMMAND', payload: message });
    }, []),
  };

  return <UIContext.Provider value={{ state, actions }}>{children}</UIContext.Provider>;
}

export function useUIContext(): UIContextValue {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUIContext must be used within UIProvider');
  }
  return context;
}
