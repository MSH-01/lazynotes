import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import type { SelectionState, SelectionActions, VisualModeState, TabType } from '../types';

// ============================================================================
// State & Reducer
// ============================================================================

const initialState: SelectionState = {
  // File tree selection
  fileSelectedIndex: 0,
  fileScrollOffset: 0,

  // Todo selection
  todoSelectedIndex: 0,
  todoScrollOffset: 0,

  // Preview scroll
  previewScrollOffset: 0,

  // Visual mode
  visualMode: {
    active: false,
    startIndex: null,
  },
};

type SelectionAction =
  | { type: 'SET_FILE_SELECTED_INDEX'; payload: number }
  | { type: 'SET_FILE_SCROLL_OFFSET'; payload: number }
  | { type: 'SET_TODO_SELECTED_INDEX'; payload: number }
  | { type: 'SET_TODO_SCROLL_OFFSET'; payload: number }
  | { type: 'SET_PREVIEW_SCROLL_OFFSET'; payload: number }
  | { type: 'ENTER_VISUAL_MODE'; payload: { startIndex: number } }
  | { type: 'EXIT_VISUAL_MODE' }
  | { type: 'RESET_SELECTION_ON_SEARCH' };

function selectionReducer(state: SelectionState, action: SelectionAction): SelectionState {
  switch (action.type) {
    case 'SET_FILE_SELECTED_INDEX':
      return { ...state, fileSelectedIndex: action.payload, previewScrollOffset: 0 };

    case 'SET_FILE_SCROLL_OFFSET':
      return { ...state, fileScrollOffset: action.payload };

    case 'SET_TODO_SELECTED_INDEX':
      return { ...state, todoSelectedIndex: action.payload };

    case 'SET_TODO_SCROLL_OFFSET':
      return { ...state, todoScrollOffset: action.payload };

    case 'SET_PREVIEW_SCROLL_OFFSET':
      return { ...state, previewScrollOffset: action.payload };

    case 'ENTER_VISUAL_MODE':
      return {
        ...state,
        visualMode: {
          active: true,
          startIndex: action.payload.startIndex,
        },
      };

    case 'EXIT_VISUAL_MODE':
      return {
        ...state,
        visualMode: { active: false, startIndex: null },
      };

    case 'RESET_SELECTION_ON_SEARCH':
      return {
        ...state,
        fileSelectedIndex: 0,
        fileScrollOffset: 0,
        todoSelectedIndex: 0,
        todoScrollOffset: 0,
      };

    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================

export interface SelectionContextValue {
  state: SelectionState;
  actions: SelectionActions;
}

interface SelectionProviderProps {
  children: ReactNode;
  /** Callback to get current active tab (needed for visual mode) */
  getActiveTab?: () => TabType;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function SelectionProvider({ children, getActiveTab }: SelectionProviderProps) {
  const [state, dispatch] = useReducer(selectionReducer, initialState);

  const actions: SelectionActions = {
    // File navigation
    moveFileSelection: useCallback(
      (delta: number) => {
        dispatch({
          type: 'SET_FILE_SELECTED_INDEX',
          payload: Math.max(0, state.fileSelectedIndex + delta),
        });
      },
      [state.fileSelectedIndex]
    ),

    selectFirstFile: useCallback(() => {
      dispatch({ type: 'SET_FILE_SELECTED_INDEX', payload: 0 });
    }, []),

    selectLastFile: useCallback(
      (maxIndex: number = 0) => {
        dispatch({ type: 'SET_FILE_SELECTED_INDEX', payload: maxIndex });
      },
      []
    ) as SelectionActions['selectLastFile'],

    setFileScrollOffset: useCallback((offset: number) => {
      dispatch({ type: 'SET_FILE_SCROLL_OFFSET', payload: offset });
    }, []),

    setFileSelectedIndex: useCallback((index: number) => {
      dispatch({ type: 'SET_FILE_SELECTED_INDEX', payload: index });
    }, []),

    // Todo navigation
    moveTodoSelection: useCallback(
      (delta: number) => {
        dispatch({
          type: 'SET_TODO_SELECTED_INDEX',
          payload: Math.max(0, state.todoSelectedIndex + delta),
        });
      },
      [state.todoSelectedIndex]
    ),

    selectFirstTodo: useCallback(() => {
      dispatch({ type: 'SET_TODO_SELECTED_INDEX', payload: 0 });
    }, []),

    selectLastTodo: useCallback(
      (maxIndex: number = 0) => {
        dispatch({ type: 'SET_TODO_SELECTED_INDEX', payload: maxIndex });
      },
      []
    ) as SelectionActions['selectLastTodo'],

    setTodoScrollOffset: useCallback((offset: number) => {
      dispatch({ type: 'SET_TODO_SCROLL_OFFSET', payload: offset });
    }, []),

    setTodoSelectedIndex: useCallback((index: number) => {
      dispatch({ type: 'SET_TODO_SELECTED_INDEX', payload: index });
    }, []),

    // Preview
    setPreviewScrollOffset: useCallback((offset: number) => {
      dispatch({ type: 'SET_PREVIEW_SCROLL_OFFSET', payload: offset });
    }, []),

    // Visual mode
    enterVisualMode: useCallback(() => {
      const activeTab = getActiveTab?.() ?? 'files';
      const startIndex = activeTab === 'todos' ? state.todoSelectedIndex : state.fileSelectedIndex;
      dispatch({ type: 'ENTER_VISUAL_MODE', payload: { startIndex } });
    }, [state.fileSelectedIndex, state.todoSelectedIndex, getActiveTab]),

    exitVisualMode: useCallback(() => {
      dispatch({ type: 'EXIT_VISUAL_MODE' });
    }, []),
  };

  return <SelectionContext.Provider value={{ state, actions }}>{children}</SelectionContext.Provider>;
}

export function useSelectionContext(): SelectionContextValue {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelectionContext must be used within SelectionProvider');
  }
  return context;
}
