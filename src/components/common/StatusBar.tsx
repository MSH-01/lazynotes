import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { TextInput } from '@inkjs/ui';
import { useApp } from '../../context';
import { VERSION } from '../../version.js';
import type { PanelType, TabType, VisualModeState } from '../../types';

const HINTS: Record<PanelType | 'todos', string> = {
  preview: 'j/k:scroll  g/G:top/bottom  e:edit  /:search  q:quit',
  status: '0:preview  2:files  3:info  /:search  q:quit',
  fileTree: 'j/k:nav  v:visual  e:edit  n:new  N:dir  r:rename  d:del  []:tab  /:search  q:quit',
  todos: 'j/k:nav  v:visual  x:toggle  n:new  N:cat  p:priority  c:move  u:due  d:del  []:tab  /:search  q:quit',
  metadata: '0:preview  1:status  2:files  /:search  q:quit',
};

const VISUAL_HINTS: Record<string, string> = {
  fileTree: 'j/k:extend  d:delete  Esc:cancel',
  todos: 'j/k:extend  x:toggle  d:delete  p:priority  c:cat  u:due  Esc:cancel',
};

interface AppState {
  focusedPanel: PanelType;
  modal: string | null;
  activeTab: TabType;
  isSearching: boolean;
  searchFilter: string;
  visualMode: VisualModeState;
}

interface AppActions {
  clearSearch: () => void;
  setSearchQuery: (query: string) => void;
  confirmSearch: () => void;
}

export function StatusBar(): React.ReactElement {
  const { state, actions } = useApp();
  const { focusedPanel, modal, activeTab, isSearching, searchFilter, visualMode } = state;

  // Local state for input to avoid global re-renders while typing
  const [inputValue, setInputValue] = useState('');

  // Reset input when search starts
  useEffect(() => {
    if (isSearching) {
      setInputValue('');
    }
  }, [isSearching]);

  // Handle escape to cancel search or clear filter
  useInput(
    (_input, key) => {
      if (key.escape) {
        if (isSearching || searchFilter) {
          actions.clearSearch();
        }
      }
    },
    { isActive: isSearching || !!searchFilter }
  );

  // Search mode - show input
  if (isSearching) {
    const handleSubmit = (): void => {
      if (inputValue.trim()) {
        actions.setSearchQuery(inputValue);
        actions.confirmSearch();
      } else {
        actions.clearSearch();
      }
    };

    return (
      <Box
        borderStyle="round"
        borderColor="blue"
        borderTop
        borderBottom={false}
        borderLeft={false}
        borderRight={false}
      >
        <Text color="blue">/</Text>
        <TextInput
          placeholder="search..."
          // @ts-expect-error - TextInput supports value prop at runtime but types are incomplete
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
        />
        <Text color="gray"> (Enter:filter Esc:cancel)</Text>
      </Box>
    );
  }

  // Show active filter indicator
  if (searchFilter) {
    return (
      <Box
        borderStyle="round"
        borderColor="yellow"
        borderTop
        borderBottom={false}
        borderLeft={false}
        borderRight={false}
      >
        <Text color="yellow">Filter: &quot;{searchFilter}&quot;</Text>
        <Text color="gray"> (/:new search Esc:clear)</Text>
      </Box>
    );
  }

  // Normal mode - show hints
  let hint: string;
  if (modal) {
    hint = 'Enter:confirm  Escape:cancel';
  } else if (visualMode.active && focusedPanel === 'fileTree') {
    // Visual mode hints
    hint = activeTab === 'todos' ? VISUAL_HINTS.todos : VISUAL_HINTS.fileTree;
  } else if (focusedPanel === 'fileTree') {
    hint = activeTab === 'todos' ? HINTS.todos : HINTS.fileTree;
  } else {
    hint = HINTS[focusedPanel] || '';
  }

  return (
    <Box
      borderStyle="round"
      borderColor="gray"
      borderTop
      justifyContent="space-between"
      borderBottom={false}
      borderLeft={false}
      borderRight={false}
    >
      <Text color="gray">{hint}</Text>
      <Text color="greenBright">{VERSION}</Text>
    </Box>
  );
}
