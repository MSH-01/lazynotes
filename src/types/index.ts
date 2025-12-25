/**
 * Type definitions for LazyNotes
 *
 * Re-exports all types from individual modules for convenient imports:
 * import type { TodoItem, FileTreeNode, ModalType } from '@types';
 */

// Common types
export type { CommandLogEntry, VisualModeState, AppConfig, WithDepth, Selectable } from './common';

// File system types
export type { FileItem, DirectoryItem, FileTreeNode, FileStats } from './fileSystem';
export { isFileItem, isDirectoryItem } from './fileSystem';

// Todo types
export type {
  Priority,
  TodoItem,
  CategoryItem,
  TodoListItem,
  CreateTodoInput,
  UpdateTodoInput,
  ParsedTodo,
  ParsedTodosFile,
} from './todos';
export { PRIORITIES, PRIORITY_LABELS, isTodoItem, isCategoryItem } from './todos';

// UI types
export type {
  PanelType,
  TabType,
  SingleItemModalType,
  BatchModalType,
  ModalType,
  ModalConfig,
  ModalContext,
  InputModalProps,
  ConfirmModalProps,
  SelectModalProps,
  TodoModalProps,
} from './ui';
export { isBatchModal } from './ui';

// Context types
export type {
  UIState,
  UIActions,
  SearchState,
  SearchActions,
  SelectionState,
  SelectionActions,
  FileSystemState,
  FileSystemActions,
  TodoState,
  TodoActions,
  AppState,
  AppActions,
  AppContextValue,
} from './context';
