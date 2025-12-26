import React from 'react';
import { Box, Text, useApp as useInkApp, useInput } from 'ink';
import meow from 'meow';
import { AppProviders, useApp } from './context';
import { useConfig } from './hooks/useConfig';
import { Layout } from './components/Layout';
import { ModalRegistry } from './components/modals/ModalRegistry';
import type {
  ModalType,
  PanelType,
  FileTreeNode,
  TodoItem,
  TodoListItem,
  VisualModeState,
  Priority,
} from './types';

// Parse CLI arguments
const cli = meow(
  `
  Usage
    $ lazynotes [options]

  Options
    --dir, -d  Notes directory path

  Examples
    $ lazynotes --dir ~/my-notes
`,
  {
    importMeta: import.meta,
    flags: {
      dir: {
        type: 'string',
        shortFlag: 'd',
      },
    },
  }
);

interface TodosState {
  categories: string[];
  items: TodoItem[];
  selectedIndex: number;
  expandedCategories: Set<string>;
  flatList: TodoListItem[];
  scrollOffset: number;
}

interface AppState {
  modal: ModalType | null;
  flatList: FileTreeNode[];
  selectedIndex: number;
  todos: TodosState;
  filteredFileList: FileTreeNode[] | null;
  filteredTodoList: TodoListItem[] | null;
  visualMode: VisualModeState;
  isSearching: boolean;
}

interface AppActions {
  setFocusedPanel: (panel: PanelType) => void;
  startSearch: () => void;
  setModal: (modal: ModalType | null) => void;
  createFile: (name: string) => void;
  createDirectory: (name: string) => void;
  renameItem: (newName: string) => void;
  deleteItem: () => void;
  createTodo: (input: { text: string; priority: Priority; category: string; dueDate: string | null }) => void;
  updateTodo: (id: string, updates: Partial<TodoItem>) => void;
  deleteTodo: (id: string) => void;
  createCategory: (name: string) => void;
  deleteCategory: (name: string) => void;
  batchDeleteFiles: (paths: string[]) => void;
  batchToggleTodoComplete: (ids: string[]) => void;
  batchDeleteTodos: (ids: string[]) => void;
  batchUpdateTodos: (ids: string[], updates: Partial<TodoItem>) => void;
  getVisualSelection: () => (FileTreeNode | TodoListItem)[];
  exitVisualMode: () => void;
  logCommand: (message: string) => void;
}

interface AppContentProps {
  onOpenEditor?: (path: string) => void;
}

function AppContent({ onOpenEditor }: AppContentProps): React.ReactElement {
  const { exit } = useInkApp();
  const { state, actions } = useApp();
  const { modal, flatList, selectedIndex, todos, filteredFileList, filteredTodoList, visualMode, isSearching } = state;

  // Use filtered lists when available
  const fileList = filteredFileList || flatList;
  const todoList = filteredTodoList || todos.flatList;

  const selectedFileItem = fileList[selectedIndex];
  const selectedTodoItem = todoList[todos.selectedIndex];
  const selectedTodo =
    selectedTodoItem?.type === 'todo'
      ? todos.items.find((t) => t.id === (selectedTodoItem as TodoItem).id)
      : undefined;

  // Determine default category for new todos based on selection
  const getDefaultCategory = (): string => {
    if (!selectedTodoItem) return '';
    if (selectedTodoItem.type === 'category') {
      // If a category is selected, use it (unless it's special)
      const fullPath = selectedTodoItem.fullPath || selectedTodoItem.name;
      if (fullPath === 'Uncategorised' || fullPath === 'Completed') return '';
      return fullPath;
    }
    if (selectedTodoItem.type === 'todo') {
      // If a todo is selected, use its category
      return (selectedTodoItem as TodoItem).category || '';
    }
    return '';
  };

  // Global keyboard shortcuts
  useInput((input, _key) => {
    // Don't process shortcuts when searching (except handled in StatusBar)
    if (isSearching) return;

    // Quit
    if (input === 'q' && !modal) {
      exit();
      return;
    }

    // Panel switching (only when no modal)
    if (!modal) {
      if (input === '0') actions.setFocusedPanel('preview');
      else if (input === '1') actions.setFocusedPanel('status');
      else if (input === '2') actions.setFocusedPanel('fileTree');
      else if (input === '3') actions.setFocusedPanel('metadata');
      // 4 is command log - not focusable

      // Search with /
      else if (input === '/') {
        actions.startSearch();
      }
    }
  });

  // Modal context and handlers
  const modalContext = {
    selectedFileItem,
    selectedTodo,
    selectedTodoItem,
    categories: todos.categories,
    visualSelection: actions.getVisualSelection(),
    isVisualModeActive: visualMode.active,
    getDefaultCategory,
    fileTree: state.fileTree,
    notesDirectory: state.notesDirectory,
  };

  const modalHandlers = {
    onCancel: () => actions.setModal(null),
    createFile: (name: string) => actions.createFile(name),
    createDirectory: (name: string) => actions.createDirectory(name),
    renameItem: (newName: string) => actions.renameItem(newName),
    moveItem: (newParentDir: string) => actions.moveItem(newParentDir),
    deleteItem: () => actions.deleteItem(),
    batchDeleteFiles: (paths: string[]) => actions.batchDeleteFiles(paths),
    createTodo: (input: { text: string; priority: Priority; category: string; dueDate: string | null }) => {
      actions.createTodo(input);
      // If category doesn't exist and is not empty, create it
      if (
        input.category &&
        !todos.categories.includes(input.category) &&
        input.category !== 'Uncategorised' &&
        input.category !== 'Completed'
      ) {
        actions.createCategory(input.category);
      }
    },
    updateTodo: (id: string, updates: Partial<TodoItem>) => {
      actions.updateTodo(id, updates);
      // If category doesn't exist and is not empty, create it
      if (
        updates.category &&
        !todos.categories.includes(updates.category) &&
        updates.category !== 'Uncategorised' &&
        updates.category !== 'Completed'
      ) {
        actions.createCategory(updates.category);
      }
    },
    deleteTodo: (id: string) => actions.deleteTodo(id),
    createCategory: (name: string) => actions.createCategory(name),
    deleteCategory: (name: string) => actions.deleteCategory(name),
    batchToggleTodoComplete: (ids: string[]) => actions.batchToggleTodoComplete(ids),
    batchDeleteTodos: (ids: string[]) => actions.batchDeleteTodos(ids),
    batchUpdateTodos: (ids: string[], updates: Partial<TodoItem>) => actions.batchUpdateTodos(ids, updates),
    exitVisualMode: () => actions.exitVisualMode(),
    logCommand: (message: string) => actions.logCommand(message),
  };

  return (
    <Box flexDirection="column" width="100%" height="100%">
      <Layout onOpenEditor={onOpenEditor} />
      <ModalRegistry modal={modal} context={modalContext} handlers={modalHandlers} />
    </Box>
  );
}

interface AppProps {
  onOpenEditor?: (path: string) => void;
}

export function App({ onOpenEditor }: AppProps): React.ReactElement {
  const { config, error, isLoading } = useConfig(cli.flags);

  if (isLoading) {
    return (
      <Box>
        <Text>Loading...</Text>
      </Box>
    );
  }

  if (error || !config) {
    return (
      <Box>
        <Text color="red">Error: {error || 'Configuration not loaded'}</Text>
      </Box>
    );
  }

  return (
    <AppProviders notesDirectory={config.notesDirectory}>
      <AppContent onOpenEditor={onOpenEditor} />
    </AppProviders>
  );
}
