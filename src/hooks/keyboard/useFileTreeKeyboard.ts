import { useInput } from 'ink';
import type { FileTreeNode, VisualModeState, ModalType } from '../../types';

interface UseFileTreeKeyboardOptions {
  /** Whether this hook should handle input */
  isActive: boolean;
  /** Currently selected file item */
  selectedItem: FileTreeNode | undefined;
  /** Visual mode state */
  visualMode: VisualModeState;
  /** Callbacks for actions */
  actions: {
    moveSelection: (delta: number) => void;
    selectFirst: () => void;
    selectLast: () => void;
    toggleExpandSelected: () => void;
    collapseSelected: () => void;
    setFocusedPanel: (panel: string) => void;
    setModal: (modal: ModalType) => void;
    reloadPreview: () => void;
    loadTree: () => void;
  };
  /** Callback to open external editor */
  onOpenEditor?: (path: string) => void;
}

/**
 * Keyboard handler hook for the Files tab
 *
 * Handles:
 * - j/k: Navigation
 * - g/G: Jump to first/last
 * - h/l, Enter, arrows: Expand/collapse directories
 * - e: Open in external editor
 * - n/N: Create file/directory
 * - r: Rename
 * - d: Delete (single or batch in visual mode)
 */
export function useFileTreeKeyboard({
  isActive,
  selectedItem,
  visualMode,
  actions,
  onOpenEditor,
}: UseFileTreeKeyboardOptions): void {
  useInput(
    (input, key) => {
      // Navigation
      if (input === 'j' || key.downArrow) {
        actions.moveSelection(1);
        return;
      }
      if (input === 'k' || key.upArrow) {
        actions.moveSelection(-1);
        return;
      }
      if (input === 'g') {
        actions.selectFirst();
        return;
      }
      if (input === 'G') {
        actions.selectLast();
        return;
      }

      // Expand/collapse toggle or open file
      if (key.return || input === 'l' || key.rightArrow) {
        if (selectedItem?.type === 'directory') {
          actions.toggleExpandSelected();
        } else if (selectedItem?.type === 'file') {
          // Switch to preview panel when pressing Enter on a file
          actions.setFocusedPanel('preview');
        }
        return;
      }

      if (input === 'h' || key.leftArrow) {
        actions.collapseSelected();
        return;
      }

      // Open in external editor with 'e'
      if (input === 'e') {
        if (selectedItem?.type === 'file' && onOpenEditor) {
          onOpenEditor(selectedItem.path);
          // After editor closes, reload content and file tree
          actions.reloadPreview();
          actions.loadTree();
        }
        return;
      }

      // CRUD modals
      if (input === 'n') {
        actions.setModal('create');
        return;
      }
      if (input === 'N') {
        actions.setModal('createDir');
        return;
      }
      if (input === 'r') {
        actions.setModal('rename');
        return;
      }
      if (input === 'd') {
        if (visualMode.active) {
          actions.setModal('batchDeleteFiles');
        } else {
          actions.setModal('delete');
        }
        return;
      }
    },
    { isActive }
  );
}
