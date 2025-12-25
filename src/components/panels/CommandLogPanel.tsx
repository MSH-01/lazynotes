import React from 'react';
import { Box, Text } from 'ink';
import { Panel } from '../common/Panel';
import { useApp } from '../../context';
import type { CommandLogEntry } from '../../types';

interface CommandLogPanelProps {
  maxHeight?: number;
}

interface AppState {
  commandLog: CommandLogEntry[];
}

export function CommandLogPanel({ maxHeight = 4 }: CommandLogPanelProps): React.ReactElement {
  const { state } = useApp();
  const { commandLog } = state;

  // Show most recent commands (reversed, newest at bottom)
  const visibleLogs = commandLog.slice(-maxHeight);

  return (
    <Panel title="[4] Command Log" isFocused={false} height={maxHeight + 2}>
      <Box flexDirection="column">
        {visibleLogs.length === 0 ? (
          <Text color="gray" dimColor>
            No commands yet
          </Text>
        ) : (
          visibleLogs.map((log, i) => (
            <Text key={i} color="gray" wrap="truncate-end">
              {log.message}
            </Text>
          ))
        )}
      </Box>
    </Panel>
  );
}
