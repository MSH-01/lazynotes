import React from 'react';
import { Box, Text } from 'ink';

export function Panel({ title, children, isFocused = false, height, flexGrow }) {
  const borderColor = isFocused ? 'cyan' : 'gray';

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={borderColor}
      height={height}
      flexGrow={flexGrow}
    >
      {title && (
        <Box paddingX={1}>
          <Text bold color={isFocused ? 'cyan' : 'white'}>
            {title}
          </Text>
        </Box>
      )}
      <Box flexDirection="column" flexGrow={1} paddingX={1}>
        {children}
      </Box>
    </Box>
  );
}
