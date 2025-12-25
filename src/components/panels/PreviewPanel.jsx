import React from 'react';
import { Box, Text, useInput } from 'ink';
import { Panel } from '../common/Panel.jsx';
import { useAppContext } from '../../context/AppContext.jsx';

export function PreviewPanel({ maxHeight = 20 }) {
  const { state, actions } = useAppContext();
  const { focusedPanel, previewContent, previewError, previewScrollOffset, flatList, selectedPath, modal } = state;
  const isFocused = focusedPanel === 'preview';

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

  const title = selectedItem
    ? `Preview [1] - ${selectedItem.name}`
    : 'Preview [1]';

  return (
    <Panel title={title} isFocused={isFocused} flexGrow={1}>
      {renderContent()}
    </Panel>
  );
}
