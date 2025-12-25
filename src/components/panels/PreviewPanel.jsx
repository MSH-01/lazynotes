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
  │   n      New file                   │
  │   N      New directory              │
  │   r      Rename                     │
  │   d      Delete                     │
  │   q      Quit                       │
  │                                     │
  │   github.com/MSH-01/lazynotes       │
  ╰─────────────────────────────────────╯
`;

export function PreviewPanel({ maxHeight = 20 }) {
  const { state, actions } = useAppContext();
  const { focusedPanel, previewContent, previewError, previewScrollOffset, flatList, selectedPath, modal } = state;
  const isFocused = focusedPanel === 'preview';
  const showCredits = focusedPanel === 'status';

  const selectedItem = flatList.find(item => item.path === selectedPath);
  const isDirectory = selectedItem?.type === 'directory';

  // Handle keyboard input for scrolling
  useInput((input, key) => {
    if (!isFocused || modal || !previewContent) return;

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
  }, { isActive: isFocused && !modal });

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

  const title = showCredits
    ? '[0] Preview - Credits'
    : selectedItem
      ? `[0] Preview - ${selectedItem.name}`
      : '[0] Preview';

  return (
    <Panel title={title} isFocused={isFocused} flexGrow={1}>
      {renderContent()}
    </Panel>
  );
}
