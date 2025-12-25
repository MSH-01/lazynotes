import React from 'react';
import { useInput } from 'ink';
import { Panel } from '../common/Panel.jsx';
import { FileTree } from '../FileTree/FileTree.jsx';
import { useAppContext } from '../../context/AppContext.jsx';

export function FileTreePanel({ maxHeight = 15 }) {
  const { state, actions } = useAppContext();
  const { focusedPanel, flatList, selectedIndex, modal } = state;
  const isFocused = focusedPanel === 'fileTree';

  // Handle keyboard input when focused
  useInput((input, key) => {
    if (!isFocused || modal) return;

    // Navigation
    if (input === 'j' || key.downArrow) {
      actions.moveSelection(1);
    } else if (input === 'k' || key.upArrow) {
      actions.moveSelection(-1);
    } else if (input === 'g') {
      actions.selectFirst();
    } else if (input === 'G') {
      actions.selectLast();
    }

    // Expand/collapse
    else if (key.return || input === 'l' || key.rightArrow) {
      const selectedItem = flatList[selectedIndex];
      if (selectedItem?.type === 'directory') {
        actions.expandSelected();
      }
    } else if (input === 'h' || key.leftArrow) {
      actions.collapseSelected();
    }

    // CRUD modals
    else if (input === 'n') {
      actions.setModal('create');
    } else if (input === 'N') {
      actions.setModal('createDir');
    } else if (input === 'r') {
      actions.setModal('rename');
    } else if (input === 'd') {
      actions.setModal('delete');
    }
  }, { isActive: isFocused && !modal });

  // Handle scroll to keep selected item visible
  React.useEffect(() => {
    if (selectedIndex < state.fileTreeScrollOffset) {
      actions.setFileTreeScroll(selectedIndex);
    } else if (selectedIndex >= state.fileTreeScrollOffset + maxHeight) {
      actions.setFileTreeScroll(selectedIndex - maxHeight + 1);
    }
  }, [selectedIndex, state.fileTreeScrollOffset, maxHeight, actions]);

  return (
    <Panel title="[0] Files" isFocused={isFocused} flexGrow={1}>
      <FileTree maxHeight={maxHeight} />
    </Panel>
  );
}
