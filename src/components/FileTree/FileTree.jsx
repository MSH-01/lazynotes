import React from 'react';
import { Box, Text } from 'ink';
import { useAppContext } from '../../context/AppContext.jsx';
import { FileTreeItem } from './FileTreeItem.jsx';

export function FileTree({ maxHeight = 20 }) {
  const { state } = useAppContext();
  const { flatList, selectedPath, expandedDirs, fileTreeScrollOffset } = state;

  // Calculate visible window
  const visibleItems = flatList.slice(fileTreeScrollOffset, fileTreeScrollOffset + maxHeight);

  if (flatList.length === 0) {
    return (
      <Box>
        <Text color="gray">No files found</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" width="100%">
      {visibleItems.map((item) => (
        <FileTreeItem
          key={item.path}
          item={item}
          isSelected={item.path === selectedPath}
          isExpanded={expandedDirs.has(item.path)}
        />
      ))}
    </Box>
  );
}
