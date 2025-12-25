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
  │   e      Edit file                  │
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
  const {
    focusedPanel,
    previewContent,
    previewError,
    previewScrollOffset,
    flatList,
    selectedPath,
    modal,
    editMode,
    editContent,
    cursorLine,
    cursorCol,
  } = state;

  const isFocused = focusedPanel === 'preview';
  const showCredits = focusedPanel === 'status';

  const selectedItem = flatList.find(item => item.path === selectedPath);
  const isDirectory = selectedItem?.type === 'directory';
  const isFile = selectedItem?.type === 'file';

  // Handle keyboard input
  useInput((input, key) => {
    if (modal) return;

    // Edit mode input handling
    if (editMode && isFocused) {
      const lines = (editContent || '').split('\n');

      // Save with Ctrl+S
      if (key.ctrl && input === 's') {
        actions.saveFile();
        return;
      }

      // Cancel with Escape
      if (key.escape) {
        actions.exitEditMode();
        actions.logCommand('Edit cancelled');
        return;
      }

      // Arrow key navigation
      if (key.upArrow) {
        const newLine = Math.max(0, cursorLine - 1);
        const newCol = Math.min(cursorCol, lines[newLine]?.length || 0);
        actions.setCursor(newLine, newCol);
        return;
      }
      if (key.downArrow) {
        const newLine = Math.min(lines.length - 1, cursorLine + 1);
        const newCol = Math.min(cursorCol, lines[newLine]?.length || 0);
        actions.setCursor(newLine, newCol);
        return;
      }
      if (key.leftArrow) {
        if (cursorCol > 0) {
          actions.setCursor(cursorLine, cursorCol - 1);
        } else if (cursorLine > 0) {
          actions.setCursor(cursorLine - 1, lines[cursorLine - 1]?.length || 0);
        }
        return;
      }
      if (key.rightArrow) {
        const lineLen = lines[cursorLine]?.length || 0;
        if (cursorCol < lineLen) {
          actions.setCursor(cursorLine, cursorCol + 1);
        } else if (cursorLine < lines.length - 1) {
          actions.setCursor(cursorLine + 1, 0);
        }
        return;
      }

      // Backspace
      if (key.backspace || key.delete) {
        if (cursorCol > 0) {
          const line = lines[cursorLine];
          lines[cursorLine] = line.slice(0, cursorCol - 1) + line.slice(cursorCol);
          actions.setEditContent(lines.join('\n'));
          actions.setCursor(cursorLine, cursorCol - 1);
        } else if (cursorLine > 0) {
          const prevLineLen = lines[cursorLine - 1].length;
          lines[cursorLine - 1] += lines[cursorLine];
          lines.splice(cursorLine, 1);
          actions.setEditContent(lines.join('\n'));
          actions.setCursor(cursorLine - 1, prevLineLen);
        }
        return;
      }

      // Enter - new line
      if (key.return) {
        const line = lines[cursorLine];
        const before = line.slice(0, cursorCol);
        const after = line.slice(cursorCol);
        lines[cursorLine] = before;
        lines.splice(cursorLine + 1, 0, after);
        actions.setEditContent(lines.join('\n'));
        actions.setCursor(cursorLine + 1, 0);
        return;
      }

      // Tab
      if (key.tab) {
        const line = lines[cursorLine];
        lines[cursorLine] = line.slice(0, cursorCol) + '  ' + line.slice(cursorCol);
        actions.setEditContent(lines.join('\n'));
        actions.setCursor(cursorLine, cursorCol + 2);
        return;
      }

      // Regular character input
      if (input && !key.ctrl && !key.meta) {
        const line = lines[cursorLine] || '';
        lines[cursorLine] = line.slice(0, cursorCol) + input + line.slice(cursorCol);
        actions.setEditContent(lines.join('\n'));
        actions.setCursor(cursorLine, cursorCol + input.length);
        return;
      }

      return;
    }

    // Normal mode (not editing)
    if (!isFocused) return;

    // Enter edit mode with 'e'
    if (input === 'e' && isFile && previewContent !== null) {
      actions.enterEditMode();
      actions.logCommand('Entered edit mode');
      return;
    }

    // Scrolling in view mode
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
  }, { isActive: isFocused || editMode });

  // Auto-scroll to keep cursor visible in edit mode
  React.useEffect(() => {
    if (editMode) {
      if (cursorLine < previewScrollOffset) {
        actions.setPreviewScroll(cursorLine);
      } else if (cursorLine >= previewScrollOffset + maxHeight - 1) {
        actions.setPreviewScroll(cursorLine - maxHeight + 2);
      }
    }
  }, [cursorLine, editMode, previewScrollOffset, maxHeight, actions]);

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

    // Edit mode rendering
    if (editMode && editContent !== null) {
      const lines = editContent.split('\n');
      const visibleLines = lines.slice(previewScrollOffset, previewScrollOffset + maxHeight - 1);

      return (
        <Box flexDirection="column">
          {visibleLines.map((line, i) => {
            const lineNum = previewScrollOffset + i;
            const isCurrentLine = lineNum === cursorLine;

            if (isCurrentLine) {
              // Render line with cursor
              const before = line.slice(0, cursorCol);
              const cursor = line[cursorCol] || ' ';
              const after = line.slice(cursorCol + 1);

              return (
                <Text key={lineNum} wrap="truncate-end">
                  <Text dimColor>{String(lineNum + 1).padStart(3)} </Text>
                  <Text>{before}</Text>
                  <Text inverse>{cursor}</Text>
                  <Text>{after}</Text>
                </Text>
              );
            }

            return (
              <Text key={lineNum} wrap="truncate-end">
                <Text dimColor>{String(lineNum + 1).padStart(3)} </Text>
                <Text>{line || ' '}</Text>
              </Text>
            );
          })}
        </Box>
      );
    }

    // Normal view mode
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
  } else if (editMode) {
    title = `[0] Preview - EDITING: ${selectedItem?.name} (Ctrl+S save, Esc cancel)`;
  } else if (selectedItem) {
    title = `[0] Preview - ${selectedItem.name}${isFile ? ' (e to edit)' : ''}`;
  }

  return (
    <Panel title={title} isFocused={isFocused || editMode} flexGrow={1}>
      {renderContent()}
    </Panel>
  );
}
