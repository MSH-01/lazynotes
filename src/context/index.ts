/**
 * Context exports
 *
 * Split contexts for better performance and separation of concerns.
 */

// Combined provider and hook (use these in most cases)
export { AppProviders, useApp } from './AppProviders';

// Individual contexts (for components that only need specific state)
export { UIProvider, useUIContext } from './UIContext';
export { SearchProvider, useSearchContext } from './SearchContext';
export { SelectionProvider, useSelectionContext } from './SelectionContext';
export { FileSystemProvider, useFileSystemContext } from './FileSystemContext';
export { TodoProvider, useTodoContext } from './TodoContext';
