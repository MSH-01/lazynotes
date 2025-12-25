import { useInput } from 'ink';

interface UseKeyboardNavigationOptions {
  /** Total number of items in the list */
  listLength: number;
  /** Currently selected index */
  selectedIndex: number;
  /** Callback when selection should move by delta */
  onMove: (delta: number) => void;
  /** Callback to select first item */
  onSelectFirst: () => void;
  /** Callback to select last item */
  onSelectLast: () => void;
  /** Whether this hook should handle input */
  isActive: boolean;
}

/**
 * Hook for vim-style keyboard navigation (j/k, g/G, arrows)
 *
 * Handles:
 * - j/↓: Move down
 * - k/↑: Move up
 * - g: Jump to first
 * - G: Jump to last
 */
export function useKeyboardNavigation({
  listLength,
  selectedIndex,
  onMove,
  onSelectFirst,
  onSelectLast,
  isActive,
}: UseKeyboardNavigationOptions): void {
  useInput(
    (input, key) => {
      if (listLength === 0) return;

      // Move down
      if (input === 'j' || key.downArrow) {
        if (selectedIndex < listLength - 1) {
          onMove(1);
        }
        return;
      }

      // Move up
      if (input === 'k' || key.upArrow) {
        if (selectedIndex > 0) {
          onMove(-1);
        }
        return;
      }

      // Jump to first
      if (input === 'g') {
        onSelectFirst();
        return;
      }

      // Jump to last
      if (input === 'G') {
        onSelectLast();
        return;
      }
    },
    { isActive }
  );
}
