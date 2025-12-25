import React from 'react';
import { Text } from 'ink';
import { isOverdue, isDueSoon } from '../../utils/todos.js';

// Unicode arrows for expand/collapse categories
const ARROW_RIGHT = '▶';
const ARROW_DOWN = '▼';

// Priority colors
const PRIORITY_COLORS = {
  P1: 'red',
  P2: 'yellow',
  P3: 'cyan',
  P4: 'gray',
};

export function TodoItem({ item, isSelected, isExpanded, isInVisualSelection }) {
  const indent = '  '.repeat(item.depth);

  // Category row
  if (item.type === 'category') {
    const arrow = isExpanded ? ARROW_DOWN : ARROW_RIGHT;
    const countStr = item.itemCount > 0 ? ` (${item.itemCount})` : '';
    const content = `${indent}${arrow} ${item.name}${countStr}`;
    const paddedContent = content + ' '.repeat(200);

    if (isSelected) {
      return <Text inverse bold wrap="truncate-end">{paddedContent}</Text>;
    }

    // Visual selection (but not cursor)
    if (isInVisualSelection) {
      return <Text backgroundColor="blue" color="white" wrap="truncate-end">{paddedContent}</Text>;
    }

    return (
      <Text color="cyan" wrap="truncate-end">
        {content}
      </Text>
    );
  }

  // Todo item row
  const checkbox = item.completed ? '[x]' : '[ ]';
  const priorityColor = PRIORITY_COLORS[item.priority] || undefined;

  // Build due date string with color
  let dueStr = '';
  let dueColor = undefined;
  if (item.dueDate) {
    dueStr = ` @${item.dueDate}`;
    if (isOverdue(item.dueDate)) {
      dueColor = 'red';
    } else if (isDueSoon(item.dueDate)) {
      dueColor = 'yellow';
    }
  }

  // For completed items, dim everything
  if (item.completed) {
    const content = `${indent}${checkbox} ${item.priority}: ${item.text}${dueStr}`;
    const paddedContent = content + ' '.repeat(200);

    if (isSelected) {
      return <Text inverse bold wrap="truncate-end">{paddedContent}</Text>;
    }

    // Visual selection (but not cursor)
    if (isInVisualSelection) {
      return <Text backgroundColor="blue" color="white" wrap="truncate-end">{paddedContent}</Text>;
    }

    return (
      <Text dimColor wrap="truncate-end">
        {content}
      </Text>
    );
  }

  // Active todo item
  const content = `${indent}${checkbox} ${item.priority}: ${item.text}${dueStr}`;
  const paddedContent = content + ' '.repeat(200);

  if (isSelected) {
    return <Text inverse bold wrap="truncate-end">{paddedContent}</Text>;
  }

  // Visual selection (but not cursor)
  if (isInVisualSelection) {
    return <Text backgroundColor="blue" color="white" wrap="truncate-end">{paddedContent}</Text>;
  }

  // Non-selected: color by priority, due date colored separately
  // We need to render this as a single Text element for proper truncation
  // Use priority color for the whole line, with due date emphasis if needed
  return (
    <Text color={dueColor || priorityColor} wrap="truncate-end">
      {content}
    </Text>
  );
}
