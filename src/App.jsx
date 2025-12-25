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
  const { modal, flatList, selectedIndex, todos } = state;

  const selectedItem = flatList[selectedIndex];
  const selectedTodoItem = todos.flatList[todos.selectedIndex];
  const selectedTodo = selectedTodoItem?.type === 'todo'
    ? todos.items.find((t) => t.id === selectedTodoItem.id)
    : null;

  // Global keyboard shortcuts
  useInput((input, key) => {
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
      actions.deleteCategory(selectedTodoItem.name);
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
          message={`Delete category "${selectedTodoItem.name}"? Todos will be moved to Uncategorised.`}
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
