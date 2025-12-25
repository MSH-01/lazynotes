import React from 'react';
import { Box, Text } from 'ink';
import { Panel } from '../common/Panel.jsx';
import { useAppContext } from '../../context/AppContext.jsx';

export function CommandLogPanel({ maxHeight = 4 }) {
  const { state } = useAppContext();
  const { commandLog } = state;

  // Show most recent commands (reversed, newest at bottom)
  const visibleLogs = commandLog.slice(-maxHeight);

  return (
    <Panel title="[4] Command Log" isFocused={false} height={maxHeight + 2}>
      <Box flexDirection="column">
        {visibleLogs.length === 0 ? (
          <Text color="gray" dimColor>No commands yet</Text>
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
