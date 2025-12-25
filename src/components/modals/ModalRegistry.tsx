import React from 'react';
import { InputModal } from './InputModal';
import { ConfirmModal } from './ConfirmModal';
import { SelectModal } from './SelectModal';
import { TodoModal } from './TodoModal';
import type { ModalType, FileTreeNode, TodoItem, TodoListItem, Priority } from '../../types';
import { isCategoryItem } from '../../types';

// ============================================================================
// Types
// ============================================================================

interface ModalHandlers {
  onCancel: () => void;
  // File operations
  createFile: (name: string) => void;
  createDirectory: (name: string) => void;
  renameItem: (newName: string) => void;
  deleteItem: () => void;
  batchDeleteFiles: (paths: string[]) => void;
  // Todo operations
  createTodo: (input: { text: string; priority: Priority; category: string; dueDate: string | null }) => void;
  updateTodo: (id: string, updates: Partial<TodoItem>) => void;
  deleteTodo: (id: string) => void;
  createCategory: (name: string) => void;
  deleteCategory: (name: string) => void;
  // Batch operations
  batchToggleTodoComplete: (ids: string[]) => void;
  batchDeleteTodos: (ids: string[]) => void;
  batchUpdateTodos: (ids: string[], updates: Partial<TodoItem>) => void;
  // Visual mode
  exitVisualMode: () => void;
  // Logging
  logCommand: (message: string) => void;
}

interface ModalContextData {
  selectedFileItem: FileTreeNode | undefined;
  selectedTodo: TodoItem | undefined;
  selectedTodoItem: TodoListItem | undefined;
  categories: string[];
  visualSelection: (FileTreeNode | TodoListItem)[];
  isVisualModeActive: boolean;
  getDefaultCategory: () => string;
}

interface ModalRegistryProps {
  modal: ModalType;
  context: ModalContextData;
  handlers: ModalHandlers;
}

// ============================================================================
// Helper Functions
// ============================================================================

/** Type guard to check if item is a TodoItem */
function isTodoItemInSelection(item: FileTreeNode | TodoListItem): item is TodoItem {
  return 'type' in item && item.type === 'todo';
}

/** Filter visual selection to only TodoItems */
function getTodoItemsFromSelection(selection: (FileTreeNode | TodoListItem)[]): TodoItem[] {
  return selection.filter(isTodoItemInSelection);
}

// ============================================================================
// Modal Registry Component
// ============================================================================

export function ModalRegistry({ modal, context, handlers }: ModalRegistryProps): React.ReactElement | null {
  if (!modal) return null;

  const {
    selectedFileItem,
    selectedTodo,
    selectedTodoItem,
    categories,
    visualSelection,
    isVisualModeActive,
    getDefaultCategory,
  } = context;

  const {
    onCancel,
    createFile,
    createDirectory,
    renameItem,
    deleteItem,
    batchDeleteFiles,
    createTodo,
    updateTodo,
    deleteTodo,
    createCategory,
    deleteCategory,
    batchDeleteTodos,
    batchUpdateTodos,
    exitVisualMode,
    logCommand,
  } = handlers;

  // Helper to get selection counts
  const getTodoSelectionCount = (): number => {
    return getTodoItemsFromSelection(visualSelection).length;
  };

  const getFileSelectionCount = (): number => {
    return visualSelection.length;
  };

  // ============================================================================
  // File Modals
  // ============================================================================

  if (modal === 'create') {
    return (
      <InputModal
        title="Create New File"
        placeholder="filename.md"
        onSubmit={(name: string) => {
          createFile(name);
          onCancel();
        }}
        onCancel={onCancel}
      />
    );
  }

  if (modal === 'createDir') {
    return (
      <InputModal
        title="Create New Directory"
        placeholder="directory-name"
        onSubmit={(name: string) => {
          createDirectory(name);
          onCancel();
        }}
        onCancel={onCancel}
      />
    );
  }

  if (modal === 'rename' && selectedFileItem) {
    return (
      <InputModal
        title="Rename"
        placeholder="new-name"
        initialValue={selectedFileItem.name}
        onSubmit={(newName: string) => {
          renameItem(newName);
          onCancel();
        }}
        onCancel={onCancel}
      />
    );
  }

  if (modal === 'delete' && selectedFileItem) {
    return (
      <ConfirmModal
        title="Delete"
        message={`Are you sure you want to delete "${selectedFileItem.name}"?`}
        onConfirm={() => {
          deleteItem();
          onCancel();
        }}
        onCancel={onCancel}
      />
    );
  }

  // ============================================================================
  // Todo Modals
  // ============================================================================

  if (modal === 'createTodo') {
    return (
      <TodoModal
        title="Create Todo"
        categories={categories}
        defaultCategory={getDefaultCategory()}
        onSubmit={(result) => {
          createTodo(result);
          onCancel();
        }}
        onCancel={onCancel}
      />
    );
  }

  if (modal === 'editTodo' && selectedTodo) {
    const initialText = `${selectedTodo.priority}: ${selectedTodo.text}${selectedTodo.dueDate ? ` @due:${selectedTodo.dueDate}` : ''}${selectedTodo.category ? ` #${selectedTodo.category}` : ''}`;
    return (
      <TodoModal
        title="Edit Todo"
        initialText={initialText}
        categories={categories}
        onSubmit={(result) => {
          updateTodo(selectedTodo.id, result);
          onCancel();
        }}
        onCancel={onCancel}
      />
    );
  }

  if (modal === 'createCategory') {
    return (
      <InputModal
        title="Create Category"
        placeholder="category-name"
        onSubmit={(name: string) => {
          createCategory(name);
          onCancel();
        }}
        onCancel={onCancel}
      />
    );
  }

  if (modal === 'deleteTodo' && selectedTodo) {
    return (
      <ConfirmModal
        title="Delete Todo"
        message={`Delete "${selectedTodo.text}"?`}
        onConfirm={() => {
          deleteTodo(selectedTodo.id);
          onCancel();
        }}
        onCancel={onCancel}
      />
    );
  }

  if (modal === 'deleteCategory' && selectedTodoItem && isCategoryItem(selectedTodoItem)) {
    const categoryName = selectedTodoItem.fullPath || selectedTodoItem.name;
    return (
      <ConfirmModal
        title="Delete Category"
        message={`Delete "${categoryName}" and all sub-categories? Todos will be moved to Uncategorised.`}
        onConfirm={() => {
          deleteCategory(categoryName);
          onCancel();
        }}
        onCancel={onCancel}
      />
    );
  }

  if (modal === 'setPriority' && selectedTodo) {
    return (
      <SelectModal
        title="Set Priority"
        options={['P1 (Urgent)', 'P2 (High)', 'P3 (Medium)', 'P4 (Low)']}
        onSelect={(priority: string) => {
          const priorityCode = priority.split(' ')[0] as Priority;
          updateTodo(selectedTodo.id, { priority: priorityCode });
          onCancel();
        }}
        onCancel={onCancel}
      />
    );
  }

  if (modal === 'setCategory' && selectedTodo) {
    return (
      <SelectModal
        title="Set Category"
        options={['Uncategorised', ...categories]}
        onSelect={(category: string) => {
          const cat = category === 'Uncategorised' ? '' : category;
          updateTodo(selectedTodo.id, { category: cat });
          onCancel();
        }}
        onCancel={onCancel}
      />
    );
  }

  if (modal === 'setDueDate' && selectedTodo) {
    return (
      <InputModal
        title="Set Due Date"
        placeholder="YYYY-MM-DD (empty to clear)"
        initialValue={selectedTodo.dueDate || ''}
        onSubmit={(dateStr: string) => {
          const dueDate = dateStr.trim() || null;
          if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
            logCommand('Invalid date format. Use YYYY-MM-DD');
            onCancel();
            return;
          }
          updateTodo(selectedTodo.id, { dueDate });
          onCancel();
        }}
        onCancel={onCancel}
      />
    );
  }

  // ============================================================================
  // Batch Modals
  // ============================================================================

  if (modal === 'batchDeleteFiles' && isVisualModeActive) {
    return (
      <ConfirmModal
        title="Batch Delete"
        message={`Delete ${getFileSelectionCount()} selected items?`}
        onConfirm={() => {
          const paths = visualSelection
            .filter((item): item is FileTreeNode => 'path' in item)
            .map((item) => item.path);
          batchDeleteFiles(paths);
          exitVisualMode();
          onCancel();
        }}
        onCancel={onCancel}
      />
    );
  }

  if (modal === 'batchDeleteTodos' && isVisualModeActive) {
    return (
      <ConfirmModal
        title="Batch Delete Todos"
        message={`Delete ${getTodoSelectionCount()} selected todos?`}
        onConfirm={() => {
          const ids = getTodoItemsFromSelection(visualSelection).map((item) => item.id);
          batchDeleteTodos(ids);
          exitVisualMode();
          onCancel();
        }}
        onCancel={onCancel}
      />
    );
  }

  if (modal === 'batchSetPriority' && isVisualModeActive) {
    return (
      <SelectModal
        title={`Set Priority (${getTodoSelectionCount()} items)`}
        options={['P1 (Urgent)', 'P2 (High)', 'P3 (Medium)', 'P4 (Low)']}
        onSelect={(priority: string) => {
          const ids = getTodoItemsFromSelection(visualSelection).map((item) => item.id);
          const priorityCode = priority.split(' ')[0] as Priority;
          batchUpdateTodos(ids, { priority: priorityCode });
          exitVisualMode();
          onCancel();
        }}
        onCancel={onCancel}
      />
    );
  }

  if (modal === 'batchSetCategory' && isVisualModeActive) {
    return (
      <SelectModal
        title={`Set Category (${getTodoSelectionCount()} items)`}
        options={['Uncategorised', ...categories]}
        onSelect={(category: string) => {
          const ids = getTodoItemsFromSelection(visualSelection).map((item) => item.id);
          const cat = category === 'Uncategorised' ? '' : category;
          batchUpdateTodos(ids, { category: cat });
          exitVisualMode();
          onCancel();
        }}
        onCancel={onCancel}
      />
    );
  }

  if (modal === 'batchSetDueDate' && isVisualModeActive) {
    return (
      <InputModal
        title={`Set Due Date (${getTodoSelectionCount()} items)`}
        placeholder="YYYY-MM-DD (empty to clear)"
        onSubmit={(dateStr: string) => {
          const dueDate = dateStr.trim() || null;
          if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
            logCommand('Invalid date format. Use YYYY-MM-DD');
            onCancel();
            return;
          }
          const ids = getTodoItemsFromSelection(visualSelection).map((item) => item.id);
          batchUpdateTodos(ids, { dueDate });
          exitVisualMode();
          onCancel();
        }}
        onCancel={onCancel}
      />
    );
  }

  // Unknown modal type
  return null;
}
