/**
 * Context state and action types
 */

import type { CommandLogEntry, VisualModeState } from './common';
import type { FileTreeNode } from './fileSystem';
import type { TodoItem, TodoListItem, CreateTodoInput, UpdateTodoInput } from './todos';
import type { PanelType, ModalType, TabType } from './ui';

// ============================================================================
// UI Context
// ============================================================================

export interface UIState {
  focusedPanel: PanelType;
  modal: ModalType;
  activeTab: TabType;
  commandLog: CommandLogEntry[];
}

export interface UIActions {
  setFocusedPanel: (panel: PanelType) => void;
  setModal: (modal: ModalType) => void;
  setActiveTab: (tab: TabType) => void;
  logCommand: (message: string) => void;
}

// ============================================================================
// Search Context
// ============================================================================

export interface SearchState {
  isSearching: boolean;
  searchQuery: string;
  searchFilter: string;
  filteredFileList: FileTreeNode[] | null;
  filteredTodoList: TodoListItem[] | null;
}

export interface SearchActions {
  startSearch: () => void;
  setSearchQuery: (query: string) => void;
  confirmSearch: () => void;
  clearSearch: () => void;
  setFilteredFileList: (list: FileTreeNode[] | null) => void;
  setFilteredTodoList: (list: TodoListItem[] | null) => void;
}

// ============================================================================
// Selection Context
// ============================================================================

export interface SelectionState {
  // File tree selection
  fileSelectedIndex: number;
  fileScrollOffset: number;

  // Todo selection
  todoSelectedIndex: number;
  todoScrollOffset: number;

  // Preview scroll
  previewScrollOffset: number;

  // Visual mode
  visualMode: VisualModeState;
}

export interface SelectionActions {
  // File navigation
  moveFileSelection: (delta: number) => void;
  selectFirstFile: () => void;
  selectLastFile: () => void;
  setFileScrollOffset: (offset: number) => void;
  setFileSelectedIndex: (index: number) => void;

  // Todo navigation
  moveTodoSelection: (delta: number) => void;
  selectFirstTodo: () => void;
  selectLastTodo: () => void;
  setTodoScrollOffset: (offset: number) => void;
  setTodoSelectedIndex: (index: number) => void;

  // Preview
  setPreviewScrollOffset: (offset: number) => void;

  // Visual mode
  enterVisualMode: () => void;
  exitVisualMode: () => void;

  // Search reset
  resetSelectionOnSearch: () => void;
}

// ============================================================================
// File System Context
// ============================================================================

export interface FileSystemState {
  notesDirectory: string | null;
  fileTree: FileTreeNode[];
  flatList: FileTreeNode[];
  expandedDirs: Set<string>;
  previewContent: string | null;
  previewError: string | null;
}

export interface FileSystemActions {
  loadTree: () => void;
  toggleExpandDir: (path: string) => void;
  toggleExpandSelected: () => void;
  collapseSelected: () => void;
  createFile: (name: string) => void;
  createDirectory: (name: string) => void;
  renameItem: (newName: string) => void;
  moveItem: (newParentDir: string) => void;
  deleteItem: () => void;
  batchDeleteFiles: (paths: string[]) => void;
  reloadPreview: () => void;
}

// ============================================================================
// Todo Context
// ============================================================================

export interface TodoState {
  categories: string[];
  items: TodoItem[];
  expandedCategories: Set<string>;
  flatList: TodoListItem[];
}

export interface TodoActions {
  createTodo: (input: CreateTodoInput) => void;
  updateTodo: (id: string, updates: UpdateTodoInput) => void;
  deleteTodo: (id: string) => void;
  toggleTodoComplete: (id: string) => void;
  createCategory: (name: string) => void;
  deleteCategory: (name: string) => void;
  toggleExpandCategory: (name: string) => void;

  // Batch operations
  batchToggleTodoComplete: (ids: string[]) => void;
  batchDeleteTodos: (ids: string[]) => void;
  batchUpdateTodos: (ids: string[], updates: UpdateTodoInput) => void;

  // Getters
  getSelectedTodo: () => TodoItem | null;
  getSelectedCategory: () => string | null;
}

// ============================================================================
// Combined App Context (Legacy - for migration)
// ============================================================================

export interface AppState {
  // Config
  notesDirectory: string | null;

  // File system
  fileTree: FileTreeNode[];
  flatList: FileTreeNode[];
  selectedPath: string | null;
  selectedIndex: number;
  expandedDirs: Set<string>;

  // UI
  focusedPanel: PanelType;
  modal: ModalType;
  activeTab: TabType;

  // Visual mode
  visualMode: VisualModeState;

  // Search
  isSearching: boolean;
  searchQuery: string;
  searchFilter: string;
  filteredFileList: FileTreeNode[] | null;
  filteredTodoList: TodoListItem[] | null;

  // Preview
  previewContent: string | null;
  previewError: string | null;

  // Scroll
  previewScrollOffset: number;
  fileTreeScrollOffset: number;

  // Todos
  todos: {
    categories: string[];
    items: TodoItem[];
    selectedIndex: number;
    expandedCategories: Set<string>;
    flatList: TodoListItem[];
    scrollOffset: number;
  };

  // Logging
  commandLog: CommandLogEntry[];
}

export interface AppActions extends UIActions, SearchActions, FileSystemActions, TodoActions {
  // Legacy selection (combined for both tabs)
  moveSelection: (delta: number) => void;
  selectFirst: () => void;
  selectLast: () => void;
  setPreviewScroll: (offset: number) => void;
  setFileTreeScroll: (offset: number) => void;

  // Todo selection
  moveTodoSelection: (delta: number) => void;
  selectFirstTodo: () => void;
  selectLastTodo: () => void;
  setTodoScroll: (offset: number) => void;

  // Visual mode
  enterVisualMode: () => void;
  exitVisualMode: () => void;
  getVisualSelection: () => (FileTreeNode | TodoListItem)[];
}

export interface AppContextValue {
  state: AppState;
  actions: AppActions;
}
