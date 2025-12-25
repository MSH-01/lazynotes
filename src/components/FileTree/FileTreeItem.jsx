import React from 'react';
import { Box, Text } from 'ink';

// Unicode arrows for expand/collapse
const ARROW_RIGHT = '▶';  // Collapsed
const ARROW_DOWN = '▼';   // Expanded

// File icon
const FILE_ICON = ' ';

export function FileTreeItem({ item, isSelected, isExpanded, width = 30 }) {
  const indent = '  '.repeat(item.depth);

  // For directories: show arrow, for files: show file icon with spacing to align
  const prefix = item.type === 'directory'
    ? (isExpanded ? ARROW_DOWN : ARROW_RIGHT)
    : FILE_ICON;

  const content = `${indent}${prefix} ${item.name}`;
  // Pad to fill width
  const paddedContent = content.padEnd(width);

  const bgColor = isSelected ? 'blue' : undefined;
  const textColor = isSelected ? 'white' : (item.type === 'directory' ? 'cyan' : 'white');

  return (
    <Box width="100%">
      <Text backgroundColor={bgColor} color={textColor}>
        {paddedContent}
      </Text>
    </Box>
  );
}
