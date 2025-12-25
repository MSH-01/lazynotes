import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { TextInput } from '@inkjs/ui';
import { useAppContext } from '../../context/AppContext.jsx';

const HINTS = {
  preview: 'j/k:scroll  g/G:top/bottom  e:edit  /:search  q:quit',
  status: '0:preview  2:files  3:info  /:search  q:quit',
  fileTree: 'j/k:nav  e:edit  n:new  N:dir  r:rename  d:del  []:tab  /:search  q:quit',
  todos: 'j/k:nav  x:toggle  n:new  p:priority  c:cat  u:due  d:del  []:tab  /:search  q:quit',
  metadata: '0:preview  1:status  2:files  /:search  q:quit',
};

export function StatusBar() {
  const { state, actions } = useAppContext();
  const { focusedPanel, modal, activeTab, isSearching, searchFilter } = state;

  // Local state for input to avoid global re-renders while typing
  const [inputValue, setInputValue] = useState('');

  // Reset input when search starts
  useEffect(() => {
    if (isSearching) {
      setInputValue('');
    }
  }, [isSearching]);

  // Handle escape to cancel search or clear filter
  useInput((input, key) => {
    if (key.escape) {
      if (isSearching || searchFilter) {
        actions.clearSearch();
      }
    }
  }, { isActive: isSearching || !!searchFilter });

  // Search mode - show input
  if (isSearching) {
    const handleSubmit = () => {
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
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
        />
        <Text color="gray">  (Enter:filter  Esc:cancel)</Text>
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
        <Text color="yellow">Filter: "{searchFilter}"</Text>
        <Text color="gray">  (/:new search  Esc:clear)</Text>
      </Box>
    );
  }

  // Normal mode - show hints
  let hint;
  if (modal) {
    hint = 'Enter:confirm  Escape:cancel';
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
      borderBottom={false}
      borderLeft={false}
      borderRight={false}
    >
      <Text color="gray">{hint}</Text>
    </Box>
  );
}
