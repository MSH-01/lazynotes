import React from 'react';
import { Box, Text } from 'ink';

export function Panel({ title, children, isFocused = false, height, flexGrow }) {
  const borderColor = isFocused ? 'blue' : undefined;

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={borderColor}
      height={height}
      flexGrow={flexGrow}
    >
      {/* Title embedded in border - positioned at top */}
      {title && (
        <Box marginTop={-1} marginLeft={1} position="absolute">
          <Text color={borderColor}>{title}</Text>
        </Box>
      )}
      <Box flexDirection="column" flexGrow={1} paddingX={1} paddingTop={title ? 0 : 0}>
        {children}
      </Box>
    </Box>
  );
}
