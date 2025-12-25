import React from 'react';
import { Box, Text } from 'ink';

const ICONS = {
  file: ' ',
  directory: ' ',
  directoryOpen: ' ',
};

export function FileTreeItem({ item, isSelected, isExpanded }) {
  const indent = '  '.repeat(item.depth);
  const icon = item.type === 'directory'
    ? (isExpanded ? ICONS.directoryOpen : ICONS.directory)
    : ICONS.file;

  const bgColor = isSelected ? 'cyan' : undefined;
  const textColor = isSelected ? 'black' : (item.type === 'directory' ? 'blue' : 'white');

  return (
    <Box>
      <Text backgroundColor={bgColor} color={textColor}>
        {indent}{icon} {item.name}
      </Text>
    </Box>
  );
}
