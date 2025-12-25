import React from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import meow from 'meow';
import { AppProvider, useAppContext } from './context/AppContext.jsx';
import { useConfig } from './hooks/useConfig.js';
import { Layout } from './components/Layout.jsx';
import { InputModal } from './components/modals/InputModal.jsx';
import { ConfirmModal } from './components/modals/ConfirmModal.jsx';
import { SelectModal } from './components/modals/SelectModal.jsx';
import { TodoModal } from './components/modals/TodoModal.jsx';

// Parse CLI arguments
const cli = meow(`
  Usage
    $ lazynotes [options]

  Options
    --dir, -d  Notes directory path

  Examples
    $ lazynotes --dir ~/my-notes
`, {
  importMeta: import.meta,
  flags: {
    dir: {
      type: 'string',
      shortFlag: 'd',
    },
  },
});

function AppContent({ onOpenEditor }) {
  const { exit } = useApp();
  const { state, actions } = useAppContext();
  const { modal, flatList, selectedIndex, todos, filteredFileList, filteredTodoList, visualMode } = state;

  // Use filtered lists when available
  const fileList = filteredFileList || flatList;
  const todoList = filteredTodoList || todos.flatList;

  const selectedItem = fileList[selectedIndex];
  const selectedTodoItem = todoList[todos.selectedIndex];
  const selectedTodo = selectedTodoItem?.type === 'todo'
    ? todos.items.find((t) => t.id === selectedTodoItem.id)
    : null;

  // Determine default category for new todos based on selection
  const getDefaultCategory = () => {
    if (!selectedTodoItem) return '';
    if (selectedTodoItem.type === 'category') {
      // If a category is selected, use it (unless it's special)
      const fullPath = selectedTodoItem.fullPath || selectedTodoItem.name;
      if (fullPath === 'Uncategorised' || fullPath === 'Completed') return '';
      return fullPath;
    }
    if (selectedTodoItem.type === 'todo') {
      // If a todo is selected, use its category
      return selectedTodoItem.category || '';
    }
    return '';
  };

  const { isSearching } = state;

  // Global keyboard shortcuts
  useInput((input, key) => {
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

  // Modal handlers
  const handleCreateFile = (name) => {
    actions.createFile(name);
    actions.setModal(null);
  };

  const handleCreateDir = (name) => {
    actions.createDirectory(name);
    actions.setModal(null);
  };

  const handleRename = (newName) => {
    actions.renameItem(newName);
    actions.setModal(null);
  };

  const handleDelete = () => {
    actions.deleteItem();
    actions.setModal(null);
  };

  const handleCancelModal = () => {
    actions.setModal(null);
  };

  // Todo handlers
  const handleCreateTodo = ({ text, priority, dueDate, category }) => {
    actions.createTodo({ text, priority, dueDate, category });
    // If category doesn't exist and is not empty, create it
    if (category && !todos.categories.includes(category) &&
        category !== 'Uncategorised' && category !== 'Completed') {
      actions.createCategory(category);
    }
    actions.setModal(null);
  };

  const handleEditTodo = ({ text, priority, dueDate, category }) => {
    if (selectedTodo) {
      actions.updateTodo(selectedTodo.id, { text, priority, dueDate, category });
      // If category doesn't exist and is not empty, create it
      if (category && !todos.categories.includes(category) &&
          category !== 'Uncategorised' && category !== 'Completed') {
        actions.createCategory(category);
      }
    }
    actions.setModal(null);
  };

  const handleCreateCategory = (name) => {
    actions.createCategory(name);
    actions.setModal(null);
  };

  const handleDeleteTodo = () => {
    if (selectedTodo) {
      actions.deleteTodo(selectedTodo.id);
    }
    actions.setModal(null);
  };

  const handleDeleteCategory = () => {
    if (selectedTodoItem?.type === 'category') {
      actions.deleteCategory(selectedTodoItem.fullPath || selectedTodoItem.name);
    }
    actions.setModal(null);
  };

  const handleSetPriority = (priority) => {
    if (selectedTodo) {
      // Extract just the priority code (P1, P2, P3, P4)
      const priorityCode = priority.split(' ')[0];
      actions.updateTodo(selectedTodo.id, { priority: priorityCode });
    }
    actions.setModal(null);
  };

  const handleSetCategory = (category) => {
    if (selectedTodo) {
      const cat = category === 'Uncategorised' ? '' : category;
      actions.updateTodo(selectedTodo.id, { category: cat });
    }
    actions.setModal(null);
  };

  const handleSetDueDate = (dateStr) => {
    if (selectedTodo) {
      const dueDate = dateStr.trim() || null;
      // Basic validation
      if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
        actions.logCommand('Invalid date format. Use YYYY-MM-DD');
        actions.setModal(null);
        return;
      }
      actions.updateTodo(selectedTodo.id, { dueDate });
    }
    actions.setModal(null);
  };

  // Batch operation handlers
  const getVisualSelectionItems = () => {
    return actions.getVisualSelection();
  };

  const handleBatchDeleteFiles = () => {
    const selection = getVisualSelectionItems();
    const paths = selection.map(item => item.path);
    actions.batchDeleteFiles(paths);
    actions.exitVisualMode();
    actions.setModal(null);
  };

  const handleBatchDeleteTodos = () => {
    const selection = getVisualSelectionItems();
    const ids = selection.filter(item => item.type === 'todo').map(item => item.id);
    actions.batchDeleteTodos(ids);
    actions.exitVisualMode();
    actions.setModal(null);
  };

  const handleBatchSetPriority = (priority) => {
    const selection = getVisualSelectionItems();
    const ids = selection.filter(item => item.type === 'todo').map(item => item.id);
    const priorityCode = priority.split(' ')[0];
    actions.batchUpdateTodos(ids, { priority: priorityCode });
    actions.exitVisualMode();
    actions.setModal(null);
  };

  const handleBatchSetCategory = (category) => {
    const selection = getVisualSelectionItems();
    const ids = selection.filter(item => item.type === 'todo').map(item => item.id);
    const cat = category === 'Uncategorised' ? '' : category;
    actions.batchUpdateTodos(ids, { category: cat });
    actions.exitVisualMode();
    actions.setModal(null);
  };

  const handleBatchSetDueDate = (dateStr) => {
    const dueDate = dateStr.trim() || null;
    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      actions.logCommand('Invalid date format. Use YYYY-MM-DD');
      actions.setModal(null);
      return;
    }
    const selection = getVisualSelectionItems();
    const ids = selection.filter(item => item.type === 'todo').map(item => item.id);
    actions.batchUpdateTodos(ids, { dueDate });
    actions.exitVisualMode();
    actions.setModal(null);
  };

  // Get selection count for batch modals
  const getSelectionCount = () => {
    if (!visualMode.active) return 0;
    const selection = getVisualSelectionItems();
    return selection.filter(item => item.type === 'todo').length;
  };

  const getFileSelectionCount = () => {
    if (!visualMode.active) return 0;
    return getVisualSelectionItems().length;
  };

  return (
    <Box flexDirection="column" width="100%" height="100%">
      <Layout onOpenEditor={onOpenEditor} />

      {/* Modals */}
      {modal === 'create' && (
        <InputModal
          title="Create New File"
          placeholder="filename.md"
          onSubmit={handleCreateFile}
          onCancel={handleCancelModal}
        />
      )}

      {modal === 'createDir' && (
        <InputModal
          title="Create New Directory"
          placeholder="directory-name"
          onSubmit={handleCreateDir}
          onCancel={handleCancelModal}
        />
      )}

      {modal === 'rename' && selectedItem && (
        <InputModal
          title="Rename"
          placeholder="new-name"
          initialValue={selectedItem.name}
          onSubmit={handleRename}
          onCancel={handleCancelModal}
        />
      )}

      {modal === 'delete' && selectedItem && (
        <ConfirmModal
          title="Delete"
          message={`Are you sure you want to delete "${selectedItem.name}"?`}
          onConfirm={handleDelete}
          onCancel={handleCancelModal}
        />
      )}

      {/* Todo Modals */}
      {modal === 'createTodo' && (
        <TodoModal
          title="Create Todo"
          categories={todos.categories}
          defaultCategory={getDefaultCategory()}
          onSubmit={handleCreateTodo}
          onCancel={handleCancelModal}
        />
      )}

      {modal === 'editTodo' && selectedTodo && (
        <TodoModal
          title="Edit Todo"
          initialText={`${selectedTodo.priority}: ${selectedTodo.text}${selectedTodo.dueDate ? ` @due:${selectedTodo.dueDate}` : ''}${selectedTodo.category ? ` #${selectedTodo.category}` : ''}`}
          categories={todos.categories}
          onSubmit={handleEditTodo}
          onCancel={handleCancelModal}
        />
      )}

      {modal === 'createCategory' && (
        <InputModal
          title="Create Category"
          placeholder="category-name"
          onSubmit={handleCreateCategory}
          onCancel={handleCancelModal}
        />
      )}

      {modal === 'deleteTodo' && selectedTodo && (
        <ConfirmModal
          title="Delete Todo"
          message={`Delete "${selectedTodo.text}"?`}
          onConfirm={handleDeleteTodo}
          onCancel={handleCancelModal}
        />
      )}

      {modal === 'deleteCategory' && selectedTodoItem?.type === 'category' && (
        <ConfirmModal
          title="Delete Category"
          message={`Delete "${selectedTodoItem.fullPath || selectedTodoItem.name}" and all sub-categories? Todos will be moved to Uncategorised.`}
          onConfirm={handleDeleteCategory}
          onCancel={handleCancelModal}
        />
      )}

      {modal === 'setPriority' && selectedTodo && (
        <SelectModal
          title="Set Priority"
          options={['P1 (Urgent)', 'P2 (High)', 'P3 (Medium)', 'P4 (Low)']}
          onSelect={handleSetPriority}
          onCancel={handleCancelModal}
        />
      )}

      {modal === 'setCategory' && selectedTodo && (
        <SelectModal
          title="Set Category"
          options={['Uncategorised', ...todos.categories]}
          onSelect={handleSetCategory}
          onCancel={handleCancelModal}
        />
      )}

      {modal === 'setDueDate' && selectedTodo && (
        <InputModal
          title="Set Due Date"
          placeholder="YYYY-MM-DD (empty to clear)"
          initialValue={selectedTodo.dueDate || ''}
          onSubmit={handleSetDueDate}
          onCancel={handleCancelModal}
        />
      )}

      {/* Batch Operation Modals */}
      {modal === 'batchDeleteFiles' && visualMode.active && (
        <ConfirmModal
          title="Batch Delete"
          message={`Delete ${getFileSelectionCount()} selected items?`}
          onConfirm={handleBatchDeleteFiles}
          onCancel={handleCancelModal}
        />
      )}

      {modal === 'batchDeleteTodos' && visualMode.active && (
        <ConfirmModal
          title="Batch Delete Todos"
          message={`Delete ${getSelectionCount()} selected todos?`}
          onConfirm={handleBatchDeleteTodos}
          onCancel={handleCancelModal}
        />
      )}

      {modal === 'batchSetPriority' && visualMode.active && (
        <SelectModal
          title={`Set Priority (${getSelectionCount()} items)`}
          options={['P1 (Urgent)', 'P2 (High)', 'P3 (Medium)', 'P4 (Low)']}
          onSelect={handleBatchSetPriority}
          onCancel={handleCancelModal}
        />
      )}

      {modal === 'batchSetCategory' && visualMode.active && (
        <SelectModal
          title={`Set Category (${getSelectionCount()} items)`}
          options={['Uncategorised', ...todos.categories]}
          onSelect={handleBatchSetCategory}
          onCancel={handleCancelModal}
        />
      )}

      {modal === 'batchSetDueDate' && visualMode.active && (
        <InputModal
          title={`Set Due Date (${getSelectionCount()} items)`}
          placeholder="YYYY-MM-DD (empty to clear)"
          onSubmit={handleBatchSetDueDate}
          onCancel={handleCancelModal}
        />
      )}
    </Box>
  );
}

export function App({ onOpenEditor }) {
  const { config, error, isLoading } = useConfig(cli.flags);

  if (isLoading) {
    return (
      <Box>
        <Text>Loading...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Text color="red">Error: {error}</Text>
      </Box>
    );
  }

  return (
    <AppProvider notesDirectory={config.notesDirectory}>
      <AppContent onOpenEditor={onOpenEditor} />
    </AppProvider>
  );
}
