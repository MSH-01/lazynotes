import React, { useCallback, useMemo } from 'react';
import { Box, Text } from 'ink';
import { useApp } from '../../context';
import { FileTreeItem } from './FileTreeItem';
import { useFilteredList } from '../../hooks';
import type { FileTreeNode, VisualModeState } from '../../types';

interface FileTreeProps {
  maxHeight?: number;
}

export function FileTree({ maxHeight = 20 }: FileTreeProps): React.ReactElement {
  const { state, actions } = useApp();
  const {
    flatList,
    selectedIndex,
    expandedDirs,
    fileTreeScrollOffset,
    searchFilter,
    visualMode,
  } = state;

  // Helper to check if an index is in visual selection range
  const isInVisualRange = useCallback(
    (index: number): boolean => {
      if (!visualMode.active || visualMode.startIndex === null) return false;
      const start = Math.min(visualMode.startIndex, selectedIndex);
      const end = Math.max(visualMode.startIndex, selectedIndex);
      return index >= start && index <= end;
    },
    [visualMode, selectedIndex]
  );

  // Filter list based on confirmed search filter using the shared hook
  const { displayList } = useFilteredList<FileTreeNode>({
    items: flatList,
    searchKey: 'name',
    filter: searchFilter,
    onFilterChange: actions.setFilteredFileList,
  });

  // Calculate visible window
  const visibleItems = useMemo(
    () => displayList.slice(fileTreeScrollOffset, fileTreeScrollOffset + maxHeight),
    [displayList, fileTreeScrollOffset, maxHeight]
  );

  if (displayList.length === 0) {
    return (
      <Box>
        <Text color="gray">{searchFilter ? 'No matches' : 'No files found'}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" width="100%">
      {visibleItems.map((item, idx) => {
        const actualIndex = fileTreeScrollOffset + idx;
        return (
          <FileTreeItem
            key={item.path}
            item={item}
            isSelected={actualIndex === selectedIndex}
            isExpanded={expandedDirs.has(item.path)}
            isInVisualSelection={isInVisualRange(actualIndex)}
          />
        );
      })}
    </Box>
  );
}
