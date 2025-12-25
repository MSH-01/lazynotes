import { useCallback, useMemo } from 'react';
import type { VisualModeState } from '../../types';

interface UseVisualSelectionOptions<T> {
  /** List of items */
  items: T[];
  /** Currently selected index */
  selectedIndex: number;
  /** Visual mode state */
  visualMode: VisualModeState;
  /** Callback to enter visual mode */
  enterVisualMode: () => void;
  /** Callback to exit visual mode */
  exitVisualMode: () => void;
}

interface UseVisualSelectionResult<T> {
  /** Check if an index is within the visual selection range */
  isInVisualRange: (index: number) => boolean;
  /** Get all selected items */
  getSelection: () => T[];
  /** Toggle visual mode on/off */
  toggleVisualMode: () => void;
  /** Whether visual mode is currently active */
  isActive: boolean;
  /** Start index of the selection (if active) */
  startIndex: number | null;
  /** End index of the selection (if active) */
  endIndex: number | null;
}

/**
 * Hook for managing visual selection mode (like Vim's visual mode)
 *
 * Allows selecting a range of items for batch operations.
 */
export function useVisualSelection<T>({
  items,
  selectedIndex,
  visualMode,
  enterVisualMode,
  exitVisualMode,
}: UseVisualSelectionOptions<T>): UseVisualSelectionResult<T> {
  // Calculate the actual start and end indices
  const { startIndex, endIndex } = useMemo(() => {
    if (!visualMode.active || visualMode.startIndex === null) {
      return { startIndex: null, endIndex: null };
    }
    return {
      startIndex: Math.min(visualMode.startIndex, selectedIndex),
      endIndex: Math.max(visualMode.startIndex, selectedIndex),
    };
  }, [visualMode.active, visualMode.startIndex, selectedIndex]);

  const isInVisualRange = useCallback(
    (index: number): boolean => {
      if (startIndex === null || endIndex === null) return false;
      return index >= startIndex && index <= endIndex;
    },
    [startIndex, endIndex]
  );

  const getSelection = useCallback((): T[] => {
    if (startIndex === null || endIndex === null) return [];
    return items.slice(startIndex, endIndex + 1);
  }, [items, startIndex, endIndex]);

  const toggleVisualMode = useCallback(() => {
    if (visualMode.active) {
      exitVisualMode();
    } else {
      enterVisualMode();
    }
  }, [visualMode.active, enterVisualMode, exitVisualMode]);

  return {
    isInVisualRange,
    getSelection,
    toggleVisualMode,
    isActive: visualMode.active,
    startIndex,
    endIndex,
  };
}
