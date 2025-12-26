import React, { useCallback, useMemo } from 'react';
import { Box, Text } from 'ink';
import { useApp } from '../../context';
import { TodoItem } from './TodoItem';
import { useFilteredList } from '../../hooks';
import type { TodoListItem, TodoItem as TodoItemType, VisualModeState } from '../../types';
import { isTodoItem, isCategoryItem } from '../../types';

interface TodoListProps {
  maxHeight?: number;
}

interface TodosState {
  flatList: TodoListItem[];
  selectedIndex: number;
  expandedCategories: Set<string>;
  scrollOffset: number;
}

export function TodoList({ maxHeight = 20 }: TodoListProps): React.ReactElement {
  const { state, actions } = useApp();
  const { todos, searchFilter, visualMode } = state;
  const { flatList, selectedIndex, expandedCategories, scrollOffset, items: allTodoItems } = todos;

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

  // For search, use ALL todo items (not just visible ones from flatList)
  // This ensures search works even when categories are collapsed
  const todoItems = useMemo(
    () => allTodoItems.filter((item): item is TodoItemType => isTodoItem(item)),
    [allTodoItems]
  );

  // Memoize the filter change callback to prevent effect re-runs
  const handleFilterChange = useCallback(
    (filtered: TodoItemType[] | null) => {
      actions.setFilteredTodoList(filtered as TodoListItem[] | null);
    },
    [actions.setFilteredTodoList]
  );

  // Filter list based on confirmed search filter using the shared hook
  const { displayList: filteredTodos, isFiltered } = useFilteredList<TodoItemType>({
    items: todoItems,
    searchKey: 'text',
    filter: searchFilter,
    onFilterChange: handleFilterChange,
  });

  // Use filtered todos when searching, otherwise use full flat list
  const displayList: TodoListItem[] = isFiltered ? filteredTodos : flatList;

  // Calculate visible window
  const visibleItems = useMemo(
    () => displayList.slice(scrollOffset, scrollOffset + maxHeight),
    [displayList, scrollOffset, maxHeight]
  );

  if (displayList.length === 0) {
    return (
      <Box>
        <Text color="gray">
          {searchFilter ? 'No matches' : "No todos yet. Press 'n' to create one."}
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" width="100%">
      {visibleItems.map((item, idx) => {
        const actualIndex = scrollOffset + idx;
        const key = isCategoryItem(item)
          ? `cat-${item.fullPath || item.name}`
          : `todo-${item.id}`;

        return (
          <TodoItem
            key={key}
            item={item}
            isSelected={actualIndex === selectedIndex}
            isExpanded={
              isCategoryItem(item) && expandedCategories.has(item.fullPath || item.name)
            }
            isInVisualSelection={isInVisualRange(actualIndex)}
          />
        );
      })}
    </Box>
  );
}
