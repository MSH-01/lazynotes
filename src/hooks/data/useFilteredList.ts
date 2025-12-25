import { useMemo, useEffect } from 'react';
import fuzzysort from 'fuzzysort';

interface UseFilteredListOptions<T> {
  /** List of items to filter */
  items: T[];
  /** Key to search on (property name) */
  searchKey: keyof T;
  /** Current filter/search string */
  filter: string;
  /** Fuzzysort threshold (default: -10000) */
  threshold?: number;
  /** Callback when filtered list changes (for syncing with context) */
  onFilterChange?: (filtered: T[] | null) => void;
}

interface UseFilteredListResult<T> {
  /** The filtered (or original) list to display */
  displayList: T[];
  /** Whether a filter is currently active */
  isFiltered: boolean;
  /** Number of items matching the filter */
  matchCount: number;
}

/**
 * Hook for fuzzy filtering a list of items
 *
 * Uses fuzzysort for SublimeText-like fuzzy matching.
 * Returns the original list when no filter is active.
 */
export function useFilteredList<T>({
  items,
  searchKey,
  filter,
  threshold = -10000,
  onFilterChange,
}: UseFilteredListOptions<T>): UseFilteredListResult<T> {
  const trimmedFilter = filter.trim();
  const isFiltered = trimmedFilter.length > 0;

  const displayList = useMemo(() => {
    if (!isFiltered) {
      return items;
    }

    const results = fuzzysort.go(trimmedFilter, items, {
      key: searchKey as string,
      threshold,
    });

    return results.map((r) => r.obj);
  }, [items, trimmedFilter, searchKey, threshold, isFiltered]);

  // Sync filtered list to context if callback provided
  useEffect(() => {
    if (onFilterChange) {
      if (isFiltered) {
        onFilterChange(displayList);
      } else {
        onFilterChange(null);
      }
    }
  }, [isFiltered, displayList, onFilterChange]);

  return {
    displayList,
    isFiltered,
    matchCount: isFiltered ? displayList.length : items.length,
  };
}
