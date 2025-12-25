import React from 'react';
import { Box, Text } from 'ink';
import { Panel } from '../common/Panel.jsx';
import { useAppContext } from '../../context/AppContext.jsx';

export function StatusPanel() {
  const { state } = useAppContext();
  const { focusedPanel, flatList, notesDirectory } = state;
  const isFocused = focusedPanel === 'status';

  const fileCount = flatList.filter(f => f.type === 'file').length;
  const dirCount = flatList.filter(f => f.type === 'directory').length;

  return (
    <Panel title="[1] Status" isFocused={isFocused} height={3}>
      <Box flexDirection="column">
        <Text>
          <Text color="gray">Files: </Text>
          <Text color="green">{fileCount}</Text>
          <Text color="gray">  Dirs: </Text>
          <Text color="blue">{dirCount}</Text>
        </Text>
      </Box>
    </Panel>
  );
}
