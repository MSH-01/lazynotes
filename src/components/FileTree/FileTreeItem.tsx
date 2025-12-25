import React, { memo } from 'react';
import { Text } from 'ink';
import type { FileTreeNode } from '../../types';

// Unicode arrows for expand/collapse
const ARROW_RIGHT = '▶'; // Collapsed
const ARROW_DOWN = '▼'; // Expanded

// File icon (space to align with arrows)
const FILE_ICON = ' ';

interface FileTreeItemProps {
  item: FileTreeNode;
  isSelected: boolean;
  isExpanded: boolean;
  isInVisualSelection: boolean;
}

function FileTreeItemComponent({
  item,
  isSelected,
  isExpanded,
  isInVisualSelection,
}: FileTreeItemProps): React.ReactElement {
  const indent = '  '.repeat(item.depth);

  const prefix = item.type === 'directory' ? (isExpanded ? ARROW_DOWN : ARROW_RIGHT) : FILE_ICON;

  const content = `${indent}${prefix} ${item.name}`;

  // Pad with spaces to ensure full width (will be truncated by terminal)
  const paddedContent = content + ' '.repeat(200);

  // Use inverse for cursor selection
  if (isSelected) {
    return (
      <Text inverse bold wrap="truncate-end">
        {paddedContent}
      </Text>
    );
  }

  // Visual selection (but not cursor)
  if (isInVisualSelection) {
    return (
      <Text backgroundColor="blue" color="white" wrap="truncate-end">
        {paddedContent}
      </Text>
    );
  }

  return (
    <Text
      color={item.type === 'directory' ? 'cyan' : undefined}
      dimColor={item.type !== 'directory'}
      wrap="truncate-end"
    >
      {content}
    </Text>
  );
}

// Memoize to prevent unnecessary re-renders in lists
export const FileTreeItem = memo(FileTreeItemComponent);
