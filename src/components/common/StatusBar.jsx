import React from 'react';
import { Box, Text } from 'ink';
import { useAppContext } from '../../context/AppContext.jsx';

const HINTS = {
  fileTree: 'j/k:navigate  Enter:expand  n:new file  N:new dir  r:rename  d:delete  q:quit',
  preview: 'j/k:scroll  g/G:top/bottom  Ctrl+d/u:page down/up  q:quit',
  metadata: '0:files  1:preview  q:quit',
};

export function StatusBar() {
  const { state } = useAppContext();
  const { focusedPanel, modal } = state;

  const hint = modal ? 'Enter:confirm  Escape:cancel' : HINTS[focusedPanel] || '';

  return (
    <Box
      borderStyle="single"
      borderColor="gray"
      borderTop
      borderBottom={false}
      borderLeft={false}
      borderRight={false}
      paddingX={1}
    >
      <Text color="gray">{hint}</Text>
    </Box>
  );
}
