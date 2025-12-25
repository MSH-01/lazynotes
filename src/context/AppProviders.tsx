import React, { ReactNode, useCallback, useRef, useEffect } from 'react';
import { UIProvider, useUIContext, type UIContextValue } from './UIContext';
import { SearchProvider, useSearchContext, type SearchContextValue } from './SearchContext';
import { SelectionProvider, useSelectionContext, type SelectionContextValue } from './SelectionContext';
import { FileSystemProvider, useFileSystemContext, type FileSystemContextValue } from './FileSystemContext';
import { TodoProvider, useTodoContext, type TodoContextValue } from './TodoContext';
import { readFileContent } from '../utils/fs';
import type { FileTreeNode, TodoListItem, TabType } from '../types';

interface AppProvidersProps {
  children: ReactNode;
  notesDirectory: string | null;
}

/**
 * Coordinates cross-context effects (visual mode exit, preview loading, etc.)
 */
function ContextCoordinator({ children }: { children: ReactNode }) {
  const { state: uiState, actions: uiActions } = useUIContext();
  const { state: searchState, actions: searchActions } = useSearchContext();
  const { state: selectionState, actions: selectionActions } = useSelectionContext();
  const { state: fsState, actions: fsActions } = useFileSystemContext();
  const { state: todoState } = useTodoContext();

  // Track previous values for effect comparisons
  const prevFocusedPanel = useRef(uiState.focusedPanel);
  const prevActiveTab = useRef(uiState.activeTab);
  const prevFileIndex = useRef(selectionState.fileSelectedIndex);

  // Exit visual mode when switching panels or tabs
  useEffect(() => {
    if (
      prevFocusedPanel.current !== uiState.focusedPanel ||
      prevActiveTab.current !== uiState.activeTab
    ) {
      if (selectionState.visualMode.active) {
        selectionActions.exitVisualMode();
      }
    }
    prevFocusedPanel.current = uiState.focusedPanel;
    prevActiveTab.current = uiState.activeTab;
  }, [uiState.focusedPanel, uiState.activeTab, selectionState.visualMode.active, selectionActions]);

  // Reset selection when search is confirmed
  useEffect(() => {
    if (searchState.searchFilter && searchState.searchFilter.length > 0) {
      selectionActions.setFileSelectedIndex(0);
      selectionActions.setFileScrollOffset(0);
      selectionActions.setTodoSelectedIndex(0);
      selectionActions.setTodoScrollOffset(0);
    }
  }, [searchState.searchFilter, selectionActions]);

  // Load preview content when file selection changes
  useEffect(() => {
    if (prevFileIndex.current !== selectionState.fileSelectedIndex) {
      const list = searchState.filteredFileList || fsState.flatList;
      const selectedItem = list[selectionState.fileSelectedIndex];
      if (selectedItem && selectedItem.type === 'file') {
        fsActions.reloadPreview();
      }
    }
    prevFileIndex.current = selectionState.fileSelectedIndex;
  }, [selectionState.fileSelectedIndex, searchState.filteredFileList, fsState.flatList, fsActions]);

  return <>{children}</>;
}

/**
 * Wraps SelectionProvider with access to UIContext for getActiveTab callback
 */
function SelectionProviderWrapper({ children }: { children: ReactNode }) {
  const { state: uiState } = useUIContext();
  const getActiveTab = useCallback((): TabType => uiState.activeTab, [uiState.activeTab]);

  return (
    <SelectionProvider getActiveTab={getActiveTab}>
      {children}
    </SelectionProvider>
  );
}

/**
 * Inner providers that need SelectionContext to be available
 */
function DataProviders({
  children,
  notesDirectory,
}: {
  children: ReactNode;
  notesDirectory: string | null;
}) {
  const { actions: uiActions } = useUIContext();
  const { state: selectionState } = useSelectionContext();

  // Callbacks for FileSystemProvider
  const getFileSelectedIndex = useCallback(
    () => selectionState.fileSelectedIndex,
    [selectionState.fileSelectedIndex]
  );

  // Callbacks for TodoProvider
  const getTodoSelectedIndex = useCallback(
    () => selectionState.todoSelectedIndex,
    [selectionState.todoSelectedIndex]
  );

  return (
    <FileSystemProvider
      notesDirectory={notesDirectory}
      getSelectedIndex={getFileSelectedIndex}
      logCommand={uiActions.logCommand}
    >
      <TodoProvider
        getSelectedIndex={getTodoSelectedIndex}
        logCommand={uiActions.logCommand}
      >
        <ContextCoordinator>{children}</ContextCoordinator>
      </TodoProvider>
    </FileSystemProvider>
  );
}

/**
 * Main provider wrapper that sets up all contexts in the correct order
 */
export function AppProviders({ children, notesDirectory }: AppProvidersProps) {
  return (
    <UIProvider>
      <SearchProvider>
        <SelectionProviderWrapper>
          <DataProviders notesDirectory={notesDirectory}>{children}</DataProviders>
        </SelectionProviderWrapper>
      </SearchProvider>
    </UIProvider>
  );
}

/**
 * Combined hook for components that need access to multiple contexts
 * Provides a similar API to the old useAppContext
 */
export function useApp() {
  const ui = useUIContext();
  const search = useSearchContext();
  const selection = useSelectionContext();
  const fileSystem = useFileSystemContext();
  const todos = useTodoContext();

  return {
    ui,
    search,
    selection,
    fileSystem,
    todos,
    // Convenience getters for the combined state shape similar to old AppContext
    state: {
      // UI
      focusedPanel: ui.state.focusedPanel,
      modal: ui.state.modal,
      activeTab: ui.state.activeTab,
      commandLog: ui.state.commandLog,
      // Search
      isSearching: search.state.isSearching,
      searchQuery: search.state.searchQuery,
      searchFilter: search.state.searchFilter,
      filteredFileList: search.state.filteredFileList,
      filteredTodoList: search.state.filteredTodoList,
      // Selection
      selectedIndex: selection.state.fileSelectedIndex,
      fileTreeScrollOffset: selection.state.fileScrollOffset,
      previewScrollOffset: selection.state.previewScrollOffset,
      visualMode: selection.state.visualMode,
      // File system
      notesDirectory: fileSystem.state.notesDirectory,
      fileTree: fileSystem.state.fileTree,
      flatList: fileSystem.state.flatList,
      expandedDirs: fileSystem.state.expandedDirs,
      previewContent: fileSystem.state.previewContent,
      previewError: fileSystem.state.previewError,
      // Todos (nested to match old structure)
      todos: {
        categories: todos.state.categories,
        items: todos.state.items,
        selectedIndex: selection.state.todoSelectedIndex,
        expandedCategories: todos.state.expandedCategories,
        flatList: todos.state.flatList,
        scrollOffset: selection.state.todoScrollOffset,
      },
    },
    // Combined actions
    actions: {
      // UI
      setFocusedPanel: ui.actions.setFocusedPanel,
      setModal: ui.actions.setModal,
      setActiveTab: ui.actions.setActiveTab,
      logCommand: ui.actions.logCommand,
      // Search
      startSearch: search.actions.startSearch,
      setSearchQuery: search.actions.setSearchQuery,
      confirmSearch: search.actions.confirmSearch,
      clearSearch: search.actions.clearSearch,
      setFilteredFileList: search.actions.setFilteredFileList,
      setFilteredTodoList: search.actions.setFilteredTodoList,
      // Selection - files
      moveSelection: (delta: number) => {
        const list = search.state.filteredFileList || fileSystem.state.flatList;
        const maxIndex = list.length - 1;
        const newIndex = Math.max(0, Math.min(maxIndex, selection.state.fileSelectedIndex + delta));
        selection.actions.setFileSelectedIndex(newIndex);
      },
      selectFirst: () => selection.actions.setFileSelectedIndex(0),
      selectLast: () => {
        const list = search.state.filteredFileList || fileSystem.state.flatList;
        selection.actions.setFileSelectedIndex(Math.max(0, list.length - 1));
      },
      setFileTreeScroll: selection.actions.setFileScrollOffset,
      setPreviewScroll: selection.actions.setPreviewScrollOffset,
      // Selection - todos
      moveTodoSelection: (delta: number) => {
        const list = search.state.filteredTodoList || todos.state.flatList;
        const maxIndex = list.length - 1;
        const newIndex = Math.max(0, Math.min(maxIndex, selection.state.todoSelectedIndex + delta));
        selection.actions.setTodoSelectedIndex(newIndex);
      },
      selectFirstTodo: () => selection.actions.setTodoSelectedIndex(0),
      selectLastTodo: () => {
        const list = search.state.filteredTodoList || todos.state.flatList;
        selection.actions.setTodoSelectedIndex(Math.max(0, list.length - 1));
      },
      setTodoScroll: selection.actions.setTodoScrollOffset,
      // Visual mode
      enterVisualMode: selection.actions.enterVisualMode,
      exitVisualMode: selection.actions.exitVisualMode,
      getVisualSelection: (): (FileTreeNode | TodoListItem)[] => {
        if (!selection.state.visualMode.active || selection.state.visualMode.startIndex === null) {
          return [];
        }
        if (ui.state.activeTab === 'todos') {
          const list = search.state.filteredTodoList || todos.state.flatList;
          const start = Math.min(selection.state.visualMode.startIndex, selection.state.todoSelectedIndex);
          const end = Math.max(selection.state.visualMode.startIndex, selection.state.todoSelectedIndex);
          return list.slice(start, end + 1);
        } else {
          const list = search.state.filteredFileList || fileSystem.state.flatList;
          const start = Math.min(selection.state.visualMode.startIndex, selection.state.fileSelectedIndex);
          const end = Math.max(selection.state.visualMode.startIndex, selection.state.fileSelectedIndex);
          return list.slice(start, end + 1);
        }
      },
      // File system
      loadTree: fileSystem.actions.loadTree,
      toggleExpandDir: fileSystem.actions.toggleExpandDir,
      toggleExpandSelected: fileSystem.actions.toggleExpandSelected,
      collapseSelected: fileSystem.actions.collapseSelected,
      createFile: fileSystem.actions.createFile,
      createDirectory: fileSystem.actions.createDirectory,
      renameItem: fileSystem.actions.renameItem,
      deleteItem: fileSystem.actions.deleteItem,
      batchDeleteFiles: fileSystem.actions.batchDeleteFiles,
      reloadPreview: fileSystem.actions.reloadPreview,
      // Todos
      createTodo: todos.actions.createTodo,
      updateTodo: todos.actions.updateTodo,
      deleteTodo: todos.actions.deleteTodo,
      toggleTodoComplete: todos.actions.toggleTodoComplete,
      createCategory: todos.actions.createCategory,
      deleteCategory: todos.actions.deleteCategory,
      toggleExpandCategory: todos.actions.toggleExpandCategory,
      batchToggleTodoComplete: todos.actions.batchToggleTodoComplete,
      batchDeleteTodos: todos.actions.batchDeleteTodos,
      batchUpdateTodos: todos.actions.batchUpdateTodos,
      getSelectedTodo: todos.actions.getSelectedTodo,
      getSelectedCategory: todos.actions.getSelectedCategory,
    },
  };
}
