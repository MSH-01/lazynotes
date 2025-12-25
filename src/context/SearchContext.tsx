import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import type { SearchState, SearchActions, FileTreeNode, TodoListItem } from '../types';

// ============================================================================
// State & Reducer
// ============================================================================

const initialState: SearchState = {
  isSearching: false,
  searchQuery: '',
  searchFilter: '',
  filteredFileList: null,
  filteredTodoList: null,
};

type SearchAction =
  | { type: 'START_SEARCH' }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'CONFIRM_SEARCH' }
  | { type: 'CLEAR_SEARCH' }
  | { type: 'SET_FILTERED_FILE_LIST'; payload: FileTreeNode[] | null }
  | { type: 'SET_FILTERED_TODO_LIST'; payload: TodoListItem[] | null };

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'START_SEARCH':
      return { ...state, isSearching: true, searchQuery: '', searchFilter: '' };

    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };

    case 'CONFIRM_SEARCH':
      return {
        ...state,
        isSearching: false,
        searchFilter: state.searchQuery,
      };

    case 'CLEAR_SEARCH':
      return {
        ...state,
        isSearching: false,
        searchQuery: '',
        searchFilter: '',
        filteredFileList: null,
        filteredTodoList: null,
      };

    case 'SET_FILTERED_FILE_LIST':
      // Avoid unnecessary re-renders when setting to same value
      if (action.payload === null && state.filteredFileList === null) return state;
      return { ...state, filteredFileList: action.payload };

    case 'SET_FILTERED_TODO_LIST':
      // Avoid unnecessary re-renders when setting to same value
      if (action.payload === null && state.filteredTodoList === null) return state;
      return { ...state, filteredTodoList: action.payload };

    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================

export interface SearchContextValue {
  state: SearchState;
  actions: SearchActions;
}

const SearchContext = createContext<SearchContextValue | null>(null);

interface SearchProviderProps {
  children: ReactNode;
}

export function SearchProvider({ children }: SearchProviderProps) {
  const [state, dispatch] = useReducer(searchReducer, initialState);

  const actions: SearchActions = {
    startSearch: useCallback(() => {
      dispatch({ type: 'START_SEARCH' });
    }, []),

    setSearchQuery: useCallback((query: string) => {
      dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
    }, []),

    confirmSearch: useCallback(() => {
      dispatch({ type: 'CONFIRM_SEARCH' });
    }, []),

    clearSearch: useCallback(() => {
      dispatch({ type: 'CLEAR_SEARCH' });
    }, []),

    setFilteredFileList: useCallback((list: FileTreeNode[] | null) => {
      dispatch({ type: 'SET_FILTERED_FILE_LIST', payload: list });
    }, []),

    setFilteredTodoList: useCallback((list: TodoListItem[] | null) => {
      dispatch({ type: 'SET_FILTERED_TODO_LIST', payload: list });
    }, []),
  };

  return <SearchContext.Provider value={{ state, actions }}>{children}</SearchContext.Provider>;
}

export function useSearchContext(): SearchContextValue {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearchContext must be used within SearchProvider');
  }
  return context;
}
