import React from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import meow from 'meow';
import { AppProvider, useAppContext } from './context/AppContext.jsx';
import { useConfig } from './hooks/useConfig.js';
import { Layout } from './components/Layout.jsx';
import { InputModal } from './components/modals/InputModal.jsx';
import { ConfirmModal } from './components/modals/ConfirmModal.jsx';

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

function AppContent() {
  const { exit } = useApp();
  const { state, actions } = useAppContext();
  const { modal, flatList, selectedIndex } = state;

  const selectedItem = flatList[selectedIndex];

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

  return (
    <Box flexDirection="column" width="100%" height="100%">
      <Layout />

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
    </Box>
  );
}

export function App() {
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
      <AppContent />
    </AppProvider>
  );
}
