import React from 'react';
import { Box, Text } from 'ink';
import { useAppContext } from '../../context/AppContext.jsx';

const HINTS = {
  preview: 'j/k:scroll  g/G:top/bottom  e:edit  q:quit',
  status: '0:preview  2:files  3:info  q:quit',
  fileTree: 'j/k:navigate  Enter:expand  e:edit  n:new  N:newdir  r:rename  d:delete  [/]:tab  q:quit',
  todos: 'j/k:navigate  x:toggle  n:new  N:category  p:priority  c:category  u:due  d:delete  [/]:tab  q:quit',
  metadata: '0:preview  1:status  2:files  q:quit',
};

export function StatusBar() {
  const { state } = useAppContext();
  const { focusedPanel, modal, activeTab } = state;

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
      // paddingX={1}
    >
      <Text color="gray">{hint}</Text>
    </Box>
  );
}
