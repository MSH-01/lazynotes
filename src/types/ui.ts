/**
 * UI related types
 */

/** Panel types that can be focused */
export type PanelType = 'preview' | 'status' | 'fileTree' | 'metadata';

/** Tab types in the file tree panel */
export type TabType = 'files' | 'todos';

/** Single-item modal types */
export type SingleItemModalType =
  | 'create'
  | 'createDir'
  | 'rename'
  | 'delete'
  | 'createTodo'
  | 'editTodo'
  | 'createCategory'
  | 'deleteTodo'
  | 'deleteCategory'
  | 'setPriority'
  | 'setCategory'
  | 'setDueDate';

/** Batch operation modal types */
export type BatchModalType =
  | 'batchDeleteFiles'
  | 'batchDeleteTodos'
  | 'batchSetPriority'
  | 'batchSetCategory'
  | 'batchSetDueDate';

/** All modal types */
export type ModalType = SingleItemModalType | BatchModalType | null;

/** Check if a modal type is a batch modal */
export function isBatchModal(modal: ModalType): modal is BatchModalType {
  if (!modal) return false;
  return modal.startsWith('batch');
}

/** Modal configuration for the registry */
export interface ModalConfig<P = unknown> {
  component: React.ComponentType<P>;
  getProps: (context: ModalContext) => P;
}

/** Context passed to modal getProps */
export interface ModalContext {
  selectedFileItem: import('./fileSystem').FileTreeNode | undefined;
  selectedTodo: import('./todos').TodoItem | undefined;
  selectedTodoItem: import('./todos').TodoListItem | undefined;
  categories: string[];
  visualSelection: (import('./fileSystem').FileTreeNode | import('./todos').TodoListItem)[];
}

/** Props for InputModal */
export interface InputModalProps {
  title: string;
  placeholder?: string;
  initialValue?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

/** Props for ConfirmModal */
export interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Props for SelectModal */
export interface SelectModalProps<T = string> {
  title: string;
  options: T[];
  getLabel?: (option: T) => string;
  onSelect: (option: T) => void;
  onCancel: () => void;
}

/** Props for TodoModal */
export interface TodoModalProps {
  title: string;
  initialValue?: string;
  categories: string[];
  onSubmit: (value: string) => void;
  onCancel: () => void;
}
