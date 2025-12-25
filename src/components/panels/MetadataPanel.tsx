import React from 'react';
import { Box, Text } from 'ink';
import { Panel } from '../common/Panel';
import { useApp } from '../../context';
import { formatFileSize, formatDate, formatRelativeDate } from '../../utils/format';
import type { FileTreeNode, PanelType, FileItem } from '../../types';

interface AppState {
  focusedPanel: PanelType;
  flatList: FileTreeNode[];
  selectedIndex: number;
  filteredFileList: FileTreeNode[] | null;
}

function isFileItem(item: FileTreeNode): item is FileItem {
  return item.type === 'file';
}

export function MetadataPanel(): React.ReactElement {
  const { state } = useApp();
  const { focusedPanel, flatList, selectedIndex, filteredFileList } = state;
  const isFocused = focusedPanel === 'metadata';

  const fileList = filteredFileList || flatList;
  const selectedItem = fileList[selectedIndex];

  if (!selectedItem) {
    return (
      <Panel title="[3] Info" isFocused={isFocused} height={8}>
        <Text color="gray">No file selected</Text>
      </Panel>
    );
  }

  return (
    <Panel title="[3] Info" isFocused={isFocused} height={8}>
      <Box flexDirection="column">
        <Box>
          <Text color="gray">Type: </Text>
          <Text>{selectedItem.type}</Text>
        </Box>
        {isFileItem(selectedItem) && (
          <Box>
            <Text color="gray">Size: </Text>
            <Text>{formatFileSize(selectedItem.size)}</Text>
          </Box>
        )}
        <Box>
          <Text color="gray">Modified: </Text>
          <Text>{formatRelativeDate(selectedItem.modifiedAt)}</Text>
        </Box>
        <Box>
          <Text color="gray">Created: </Text>
          <Text>{formatDate(selectedItem.createdAt)}</Text>
        </Box>
        <Box>
          <Text color="gray" wrap="truncate-end">
            Path: {selectedItem.path}
          </Text>
        </Box>
      </Box>
    </Panel>
  );
}
