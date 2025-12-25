import { useEffect } from 'react';

interface UseScrollToSelectedOptions {
  /** Currently selected index */
  selectedIndex: number;
  /** Current scroll offset */
  scrollOffset: number;
  /** Maximum visible items (viewport height) */
  maxHeight: number;
  /** Callback to update scroll offset */
  setScrollOffset: (offset: number) => void;
  /** Whether this hook should be active */
  isActive?: boolean;
}

/**
 * Hook to automatically scroll the viewport to keep the selected item visible
 *
 * Adjusts scroll offset when selection moves outside the visible range.
 */
export function useScrollToSelected({
  selectedIndex,
  scrollOffset,
  maxHeight,
  setScrollOffset,
  isActive = true,
}: UseScrollToSelectedOptions): void {
  useEffect(() => {
    if (!isActive || maxHeight <= 0) return;

    // Selected item is above the visible area
    if (selectedIndex < scrollOffset) {
      setScrollOffset(selectedIndex);
      return;
    }

    // Selected item is below the visible area
    if (selectedIndex >= scrollOffset + maxHeight) {
      setScrollOffset(selectedIndex - maxHeight + 1);
      return;
    }
  }, [selectedIndex, scrollOffset, maxHeight, setScrollOffset, isActive]);
}
