import React from 'react';
import { Box, Text } from 'ink';

interface PanelProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  isFocused?: boolean;
  height?: number;
  flexGrow?: number;
}

export function Panel({
  title,
  children,
  isFocused = false,
  height,
  flexGrow,
}: PanelProps): React.ReactElement {
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
          {typeof title === 'string' ? <Text color={borderColor}>{title}</Text> : title}
        </Box>
      )}
      <Box flexDirection="column" flexGrow={1} paddingTop={title ? 0 : 0}>
        {children}
      </Box>
    </Box>
  );
}
