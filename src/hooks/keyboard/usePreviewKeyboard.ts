import { useInput } from 'ink';

interface UsePreviewKeyboardOptions {
  /** Whether this hook should handle input */
  isActive: boolean;
  /** Total number of lines in the preview */
  lineCount: number;
  /** Current scroll offset */
  scrollOffset: number;
  /** Maximum visible lines (viewport height) */
  maxHeight: number;
  /** Callbacks for actions */
  actions: {
    setPreviewScroll: (offset: number) => void;
  };
  /** Callback to open external editor */
  onOpenEditor?: () => void;
}

/**
 * Keyboard handler hook for the Preview panel
 *
 * Handles:
 * - j/k: Scroll up/down
 * - g/G: Jump to top/bottom
 * - Ctrl+d/Ctrl+u: Page down/up
 * - e: Open in external editor
 */
export function usePreviewKeyboard({
  isActive,
  lineCount,
  scrollOffset,
  maxHeight,
  actions,
  onOpenEditor,
}: UsePreviewKeyboardOptions): void {
  const maxScroll = Math.max(0, lineCount - maxHeight);

  useInput(
    (input, key) => {
      // Scroll down
      if (input === 'j' || key.downArrow) {
        if (scrollOffset < maxScroll) {
          actions.setPreviewScroll(Math.min(maxScroll, scrollOffset + 1));
        }
        return;
      }

      // Scroll up
      if (input === 'k' || key.upArrow) {
        if (scrollOffset > 0) {
          actions.setPreviewScroll(Math.max(0, scrollOffset - 1));
        }
        return;
      }

      // Jump to top
      if (input === 'g') {
        actions.setPreviewScroll(0);
        return;
      }

      // Jump to bottom
      if (input === 'G') {
        actions.setPreviewScroll(maxScroll);
        return;
      }

      // Page down (Ctrl+d)
      if (key.ctrl && input === 'd') {
        const halfPage = Math.floor(maxHeight / 2);
        actions.setPreviewScroll(Math.min(maxScroll, scrollOffset + halfPage));
        return;
      }

      // Page up (Ctrl+u)
      if (key.ctrl && input === 'u') {
        const halfPage = Math.floor(maxHeight / 2);
        actions.setPreviewScroll(Math.max(0, scrollOffset - halfPage));
        return;
      }

      // Open in external editor
      if (input === 'e' && onOpenEditor) {
        onOpenEditor();
        return;
      }
    },
    { isActive }
  );
}
