import React, { useMemo, useEffect } from 'react';
import { Box, Text } from 'ink';
import fuzzysort from 'fuzzysort';
import { useAppContext } from '../../context/AppContext.jsx';
import { FileTreeItem } from './FileTreeItem.jsx';

export function FileTree({ maxHeight = 20 }) {
  const { state, actions } = useAppContext();
  const { flatList, selectedIndex, expandedDirs, fileTreeScrollOffset, searchFilter, visualMode } = state;

  // Helper to check if an index is in visual selection range
  const isInVisualRange = (index) => {
    if (!visualMode.active) return false;
    const start = Math.min(visualMode.startIndex, selectedIndex);
    const end = Math.max(visualMode.startIndex, selectedIndex);
    return index >= start && index <= end;
  };

  // Filter list based on confirmed search filter
  const displayList = useMemo(() => {
    if (!searchFilter.trim()) {
      return flatList;
    }

    const results = fuzzysort.go(searchFilter, flatList, {
      key: 'name',
      threshold: -10000,
    });

    return results.map(r => r.obj);
  }, [flatList, searchFilter]);

  // Report filtered list to context for navigation and operations
  // Only runs when searchFilter actually has a value
  useEffect(() => {
    if (!searchFilter.trim()) return;

    const results = fuzzysort.go(searchFilter, flatList, {
      key: 'name',
      threshold: -10000,
    });
    actions.setFilteredFileList(results.map(r => r.obj));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchFilter, flatList]);

  // Calculate visible window
  const visibleItems = displayList.slice(fileTreeScrollOffset, fileTreeScrollOffset + maxHeight);

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
