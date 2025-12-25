import React from 'react';
import { Box, Text } from 'ink';

// Unicode arrows for expand/collapse
const ARROW_RIGHT = '▶';  // Collapsed
const ARROW_DOWN = '▼';   // Expanded

// File icon
const FILE_ICON = ' ';

export function FileTreeItem({ item, isSelected, isExpanded }) {
  const indent = '  '.repeat(item.depth);

  // For directories: show arrow, for files: show file icon with spacing to align
  const prefix = item.type === 'directory'
    ? (isExpanded ? ARROW_DOWN : ARROW_RIGHT)
    : FILE_ICON;

  const bgColor = isSelected ? 'blue' : undefined;
  const textColor = isSelected ? 'white' : (item.type === 'directory' ? 'cyan' : 'white');

  return (
    <Box>
      <Text backgroundColor={bgColor} color={textColor}>
        {indent}{prefix} {item.name}
      </Text>
    </Box>
  );
}
