import React from 'react';
import { Box, Text, useInput } from 'ink';
import { Panel } from '../common/Panel.jsx';
import { useAppContext } from '../../context/AppContext.jsx';

const CREDITS = `
  ╭─────────────────────────────────────╮
  │           L A Z Y N O T E S         │
  │                                     │
  │   A terminal-based note manager     │
  │   inspired by Lazygit               │
  │                                     │
  │   Built with:                       │
  │   • React + Ink                     │
  │   • Node.js                         │
  │                                     │
  │   Keyboard shortcuts:               │
  │   0-4    Switch panels              │
  │   j/k    Navigate / Scroll          │
  │   Enter  Expand/collapse folders    │
  │   e      Edit file in $EDITOR       │
  │   n      New file                   │
  │   N      New directory              │
  │   r      Rename                     │
  │   d      Delete                     │
  │   q      Quit                       │
  │                                     │
  │   github.com/MSH-01/lazynotes       │
  ╰─────────────────────────────────────╯
`;

export function PreviewPanel({ maxHeight = 20, onOpenEditor }) {
  const { state, actions } = useAppContext();
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
  useInput((input, key) => {
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
  }, { isActive: isFocused });

  const renderContent = () => {
    // Show credits when status panel is focused
    if (showCredits) {
      return (
        <Box flexDirection="column">
          {CREDITS.split('\n').map((line, i) => (
            <Text key={i} color="cyan">{line}</Text>
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
    const hasMore = lines.length > maxHeight;

    return (
      <Box flexDirection="column">
        {visibleLines.map((line, i) => (
          <Text key={previewScrollOffset + i} wrap="truncate-end">
            {line || ' '}
          </Text>
        ))}
        {hasMore && (
          <Text color="gray" dimColor>
            [{previewScrollOffset + 1}-{Math.min(previewScrollOffset + maxHeight, lines.length)} of {lines.length} lines]
          </Text>
        )}
      </Box>
    );
  };

  // Build title
  let title = '[0] Preview';
  if (showCredits) {
    title = '[0] Preview - Credits';
  } else if (selectedItem) {
    title = `[0] Preview - ${selectedItem.name}${isFile ? ' (e to edit)' : ''}`;
  }

  return (
    <Panel title={title} isFocused={isFocused} flexGrow={1}>
      {renderContent()}
    </Panel>
  );
}
