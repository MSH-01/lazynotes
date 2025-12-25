import React, { memo } from 'react';
import { Box, Text } from 'ink';
import { Panel } from '../common/Panel';
import { useApp } from '../../context';
import type { PanelType } from '../../types';

function StatusPanelComponent(): React.ReactElement {
  const { state, karma } = useApp();
  const { focusedPanel } = state;
  const isFocused = focusedPanel === 'status';

  const { total, level, title } = karma.state;

  return (
    <Panel title="[1] Status" isFocused={isFocused} height={3}>
      <Box flexDirection="column">
        <Text>
          <Text color="yellow">★ </Text>
          <Text color="greenBright">{total}</Text>
          <Text color="gray"> karma · </Text>
          <Text color="cyan">Lv{level}</Text>
          <Text color="gray"> {title}</Text>
        </Text>
      </Box>
    </Panel>
  );
}

export const StatusPanel = memo(StatusPanelComponent);
