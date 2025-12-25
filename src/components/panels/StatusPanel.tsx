import React, { useMemo, memo } from 'react';
import { Box, Text } from 'ink';
import { Panel } from '../common/Panel';
import { useApp } from '../../context';
import type { FileTreeNode, PanelType } from '../../types';

interface AppState {
  focusedPanel: PanelType;
  flatList: FileTreeNode[];
  notesDirectory: string | null;
}

function StatusPanelComponent(): React.ReactElement {
  const { state } = useApp();
  const { focusedPanel, flatList } = state;
  const isFocused = focusedPanel === 'status';

  const { fileCount, dirCount } = useMemo(
    () => ({
      fileCount: flatList.filter((f) => f.type === 'file').length,
      dirCount: flatList.filter((f) => f.type === 'directory').length,
    }),
    [flatList]
  );

  return (
    <Panel title="[1] Status" isFocused={isFocused} height={3}>
      <Box flexDirection="column">
        <Text>
          <Text color="gray">Files: </Text>
          <Text color="green">{fileCount}</Text>
          <Text color="gray"> Dirs: </Text>
          <Text color="blue">{dirCount}</Text>
        </Text>
      </Box>
    </Panel>
  );
}

export const StatusPanel = memo(StatusPanelComponent);
