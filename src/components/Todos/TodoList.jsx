import React, { useMemo, useEffect } from 'react';
import { Box, Text } from 'ink';
import fuzzysort from 'fuzzysort';
import { useAppContext } from '../../context/AppContext.jsx';
import { TodoItem } from './TodoItem.jsx';

export function TodoList({ maxHeight = 20 }) {
  const { state, actions } = useAppContext();
  const { todos, searchFilter, visualMode } = state;
  const { flatList, selectedIndex, expandedCategories, scrollOffset } = todos;

  // Helper to check if an index is in visual selection range
  const isInVisualRange = (index) => {
    if (!visualMode.active) return false;
    const start = Math.min(visualMode.startIndex, selectedIndex);
    const end = Math.max(visualMode.startIndex, selectedIndex);
    return index >= start && index <= end;
  };

  // Filter list based on confirmed search filter (only filter todo items, not categories)
  const displayList = useMemo(() => {
    if (!searchFilter.trim()) {
      return flatList;
    }

    // Only search through todo items
    const todoItems = flatList.filter(item => item.type === 'todo');
    const results = fuzzysort.go(searchFilter, todoItems, {
      key: 'text',
      threshold: -10000,
    });

    return results.map(r => r.obj);
  }, [flatList, searchFilter]);

  // Report filtered list to context for navigation and operations
  // Only runs when searchFilter actually has a value
  useEffect(() => {
    if (!searchFilter.trim()) return;

    const todoItems = flatList.filter(item => item.type === 'todo');
    const results = fuzzysort.go(searchFilter, todoItems, {
      key: 'text',
      threshold: -10000,
    });
    actions.setFilteredTodoList(results.map(r => r.obj));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchFilter, flatList]);

  // Calculate visible window
  const visibleItems = displayList.slice(scrollOffset, scrollOffset + maxHeight);

  if (displayList.length === 0) {
    return (
      <Box>
        <Text color="gray">{searchFilter ? 'No matches' : "No todos yet. Press 'n' to create one."}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" width="100%">
      {visibleItems.map((item, idx) => {
        const actualIndex = scrollOffset + idx;
        const key = item.type === 'category' ? `cat-${item.name}` : `todo-${item.id}`;

        return (
          <TodoItem
            key={key}
            item={item}
            isSelected={actualIndex === selectedIndex}
            isExpanded={item.type === 'category' && expandedCategories.has(item.name)}
            isInVisualSelection={isInVisualRange(actualIndex)}
          />
        );
      })}
    </Box>
  );
}
