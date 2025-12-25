import React from 'react';
import { Box, Text } from 'ink';
import { useAppContext } from '../../context/AppContext.jsx';
import { TodoItem } from './TodoItem.jsx';

export function TodoList({ maxHeight = 20 }) {
  const { state } = useAppContext();
  const { todos } = state;
  const { flatList, selectedIndex, expandedCategories, scrollOffset } = todos;

  // Calculate visible window
  const visibleItems = flatList.slice(scrollOffset, scrollOffset + maxHeight);

  if (flatList.length === 0) {
    return (
      <Box>
        <Text color="gray">No todos yet. Press 'n' to create one.</Text>
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
          />
        );
      })}
    </Box>
  );
}
