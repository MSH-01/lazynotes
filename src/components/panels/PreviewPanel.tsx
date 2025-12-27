import React from 'react';
import { Box, Text, useInput } from 'ink';
import { Panel } from '../common/Panel';
import { useApp } from '../../context';
import type { FileTreeNode, PanelType } from '../../types';

const CREDITS = `
Lazynotes
`;

interface PreviewPanelProps {
  maxHeight?: number;
  onOpenEditor?: (path: string) => void;
}

interface AppState {
  focusedPanel: PanelType;
  previewContent: string | null;
  previewError: string | null;
  previewScrollOffset: number;
  flatList: FileTreeNode[];
  selectedIndex: number;
  filteredFileList: FileTreeNode[] | null;
  modal: string | null;
  isSearching: boolean;
}

interface AppActions {
  setPreviewScroll: (offset: number) => void;
  reloadPreview: () => void;
  loadTree: () => void;
}

export function PreviewPanel({
  maxHeight = 20,
  onOpenEditor,
}: PreviewPanelProps): React.ReactElement {
  const { state, actions } = useApp();
  const {
    focusedPanel,
    previewContent,
    previewError,
    previewScrollOffset,
    flatList,
    selectedIndex,
    filteredFileList,
    modal,
    isSearching,
  } = state;

  const isFocused = focusedPanel === 'preview';
  const showCredits = focusedPanel === 'status';

  const fileList = filteredFileList || flatList;
  const selectedItem = fileList[selectedIndex];
  const isDirectory = selectedItem?.type === 'directory';
  const isFile = selectedItem?.type === 'file';

  // Handle keyboard input
  useInput(
    (input, key) => {
      if (modal || !isFocused || isSearching) return;

      // Open in external editor with 'e'
      if (input === 'e' && isFile && selectedItem) {
        if (onOpenEditor) {
          onOpenEditor(selectedItem.path);
          // After editor closes, reload content and file tree
          actions.reloadPreview();
          actions.loadTree();
        }
        return;
      }

      // Scrolling
      if (!previewContent) return;

      const lines = previewContent.split('\n');
      const maxScroll = Math.max(0, lines.length - maxHeight);

      if (input === 'j' || key.downArrow) {
        actions.setPreviewScroll(Math.min(previewScrollOffset + 1, maxScroll));
      } else if (input === 'k' || key.upArrow) {
        actions.setPreviewScroll(Math.max(previewScrollOffset - 1, 0));
      } else if (input === 'g') {
        actions.setPreviewScroll(0);
      } else if (input === 'G') {
        actions.setPreviewScroll(maxScroll);
      } else if (key.ctrl && input === 'd') {
        actions.setPreviewScroll(Math.min(previewScrollOffset + Math.floor(maxHeight / 2), maxScroll));
      } else if (key.ctrl && input === 'u') {
        actions.setPreviewScroll(Math.max(previewScrollOffset - Math.floor(maxHeight / 2), 0));
      }
    },
    { isActive: isFocused }
  );

  const renderContent = (): React.ReactElement => {
    // Show credits when status panel is focused
    if (showCredits) {
      return (
        <Box flexDirection="column">
          {CREDITS.split('\n').map((line, i) => (
            <Text key={i} color="cyan">
              {line}
            </Text>
          ))}
        </Box>
      );
    }

    if (previewError) {
      return <Text color="red">{previewError}</Text>;
    }

    if (isDirectory) {
      return <Text color="gray">Select a file to preview</Text>;
    }

    if (!previewContent) {
      return <Text color="gray">No content to display</Text>;
    }

    const lines = previewContent.split('\n');
    const visibleLines = lines.slice(previewScrollOffset, previewScrollOffset + maxHeight);
    const totalLines = lines.length;
    const hasMore = totalLines > maxHeight;

    // Calculate scrollbar based on source lines
    const scrollbarHeight = maxHeight;
    const thumbSize = Math.max(1, Math.floor((maxHeight / totalLines) * scrollbarHeight));
    const maxScroll = Math.max(1, totalLines - maxHeight);
    const thumbPosition = Math.floor((previewScrollOffset / maxScroll) * (scrollbarHeight - thumbSize));

    const scrollbarChars: string[] = [];
    if (hasMore) {
      for (let i = 0; i < scrollbarHeight; i++) {
        if (i >= thumbPosition && i < thumbPosition + thumbSize) {
          scrollbarChars.push('█');
        } else {
          scrollbarChars.push('░');
        }
      }
    }

    // Join visible lines, preserving empty lines
    const visibleContent = visibleLines.map(line => line || ' ').join('\n');

    return (
      <Box flexDirection="row">
        <Box flexDirection="column" flexGrow={1}>
          <Text wrap="wrap">{visibleContent}</Text>
        </Box>
        {hasMore && (
          <Box flexDirection="column" marginLeft={1}>
            <Text color="gray">{scrollbarChars.join('\n')}</Text>
          </Box>
        )}
      </Box>
    );
  };

  // Build title
  let title = '[0] Preview';
  if (showCredits) {
    title = '[0] Status';
  } else if (selectedItem) {
    title = `[0] Preview - ${selectedItem.name}${isFile ? ' (e to edit)' : ''}`;
  }

  return (
    <Panel title={title} isFocused={isFocused} flexGrow={1}>
      {renderContent()}
    </Panel>
  );
}
