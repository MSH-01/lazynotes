import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import type { FileSystemState, FileSystemActions, FileTreeNode } from '../types';
import {
  readDirectoryTree,
  loadDirectoryChildren,
  createFile as fsCreateFile,
  createDirectory as fsCreateDirectory,
  renameItem as fsRenameItem,
  deleteItem as fsDeleteItem,
  readFileContent,
} from '../utils/fs';

// ============================================================================
// State & Reducer
// ============================================================================

const initialState: FileSystemState = {
  notesDirectory: null,
  fileTree: [],
  flatList: [],
  expandedDirs: new Set(),
  previewContent: null,
  previewError: null,
};

type FileSystemAction =
  | { type: 'SET_NOTES_DIRECTORY'; payload: string }
  | { type: 'SET_FILE_TREE'; payload: { tree: FileTreeNode[]; flatList: FileTreeNode[] } }
  | { type: 'UPDATE_FLAT_LIST'; payload: FileTreeNode[] }
  | { type: 'TOGGLE_EXPAND_DIR'; payload: string }
  | { type: 'SET_PREVIEW_CONTENT'; payload: string | null }
  | { type: 'SET_PREVIEW_ERROR'; payload: string | null };

function fileSystemReducer(state: FileSystemState, action: FileSystemAction): FileSystemState {
  switch (action.type) {
    case 'SET_NOTES_DIRECTORY':
      return { ...state, notesDirectory: action.payload };

    case 'SET_FILE_TREE':
      return {
        ...state,
        fileTree: action.payload.tree,
        flatList: action.payload.flatList,
      };

    case 'UPDATE_FLAT_LIST':
      return { ...state, flatList: action.payload };

    case 'TOGGLE_EXPAND_DIR': {
      const newExpanded = new Set(state.expandedDirs);
      if (newExpanded.has(action.payload)) {
        newExpanded.delete(action.payload);
      } else {
        newExpanded.add(action.payload);
      }
      return { ...state, expandedDirs: newExpanded };
    }

    case 'SET_PREVIEW_CONTENT':
      // Avoid unnecessary re-renders when content hasn't changed
      if (state.previewContent === action.payload && state.previewError === null) return state;
      return { ...state, previewContent: action.payload, previewError: null };

    case 'SET_PREVIEW_ERROR':
      return { ...state, previewContent: null, previewError: action.payload };

    default:
      return state;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function buildFlatList(
  tree: FileTreeNode[],
  expandedDirs: Set<string>,
  depth: number = 0
): FileTreeNode[] {
  const result: FileTreeNode[] = [];

  for (const node of tree) {
    result.push({ ...node, depth });

    if (node.type === 'directory' && expandedDirs.has(node.path)) {
      let children = node.children;
      if (!children || children.length === 0) {
        children = loadDirectoryChildren(node.path, depth + 1);
      }
      const childItems = buildFlatList(children, expandedDirs, depth + 1);
      result.push(...childItems);
    }
  }

  return result;
}

// ============================================================================
// Context
// ============================================================================

export interface FileSystemContextValue {
  state: FileSystemState;
  actions: FileSystemActions;
}

interface FileSystemProviderProps {
  children: ReactNode;
  notesDirectory: string | null;
  /** Get current selected index (for CRUD operations) */
  getSelectedIndex?: () => number;
  /** Get current display list (for CRUD operations) */
  getDisplayList?: () => FileTreeNode[];
  /** Callback to log commands */
  logCommand?: (message: string) => void;
}

const FileSystemContext = createContext<FileSystemContextValue | null>(null);

export function FileSystemProvider({
  children,
  notesDirectory,
  getSelectedIndex,
  getDisplayList,
  logCommand,
}: FileSystemProviderProps) {
  const [state, dispatch] = useReducer(fileSystemReducer, {
    ...initialState,
    notesDirectory,
  });

  // Load file tree
  const loadTree = useCallback(() => {
    if (!notesDirectory) return;
    const tree = readDirectoryTree(notesDirectory, 0);
    const flatList = buildFlatList(tree, state.expandedDirs);
    dispatch({ type: 'SET_FILE_TREE', payload: { tree, flatList } });
  }, [notesDirectory, state.expandedDirs]);

  // Load tree on mount
  useEffect(() => {
    loadTree();
  }, [notesDirectory]);

  // Update flat list when expanded dirs change
  useEffect(() => {
    if (state.fileTree.length > 0) {
      const flatList = buildFlatList(state.fileTree, state.expandedDirs);
      dispatch({ type: 'UPDATE_FLAT_LIST', payload: flatList });
    }
  }, [state.expandedDirs, state.fileTree]);

  const actions: FileSystemActions = {
    loadTree,

    toggleExpandDir: useCallback((path: string) => {
      dispatch({ type: 'TOGGLE_EXPAND_DIR', payload: path });
    }, []),

    toggleExpandSelected: useCallback(() => {
      const list = getDisplayList?.() ?? state.flatList;
      const index = getSelectedIndex?.() ?? 0;
      const item = list[index];
      if (item?.type === 'directory') {
        dispatch({ type: 'TOGGLE_EXPAND_DIR', payload: item.path });
      }
    }, [state.flatList, getSelectedIndex, getDisplayList]),

    collapseSelected: useCallback(() => {
      const list = getDisplayList?.() ?? state.flatList;
      const index = getSelectedIndex?.() ?? 0;
      const item = list[index];

      if (item) {
        if (item.type === 'directory' && state.expandedDirs.has(item.path)) {
          dispatch({ type: 'TOGGLE_EXPAND_DIR', payload: item.path });
        } else if (item.depth > 0) {
          // Find parent directory
          for (let i = index - 1; i >= 0; i--) {
            const parent = list[i];
            if (parent.type === 'directory' && parent.depth < item.depth) {
              // Would need to update selection in SelectionContext
              break;
            }
          }
        }
      }
    }, [state.flatList, state.expandedDirs, getSelectedIndex, getDisplayList]),

    createFile: useCallback(
      (name: string) => {
        const list = getDisplayList?.() ?? state.flatList;
        const index = getSelectedIndex?.() ?? 0;
        const item = list[index];
        let targetDir = notesDirectory ?? '';

        if (item) {
          targetDir =
            item.type === 'directory' ? item.path : item.path.substring(0, item.path.lastIndexOf('/'));
        }

        try {
          fsCreateFile(targetDir, name);
          logCommand?.(`Created file: ${name}`);
          loadTree();
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          logCommand?.(`Error creating file: ${message}`);
        }
      },
      [notesDirectory, state.flatList, getSelectedIndex, getDisplayList, logCommand, loadTree]
    ),

    createDirectory: useCallback(
      (name: string) => {
        const list = getDisplayList?.() ?? state.flatList;
        const index = getSelectedIndex?.() ?? 0;
        const item = list[index];
        let targetDir = notesDirectory ?? '';

        if (item) {
          targetDir =
            item.type === 'directory' ? item.path : item.path.substring(0, item.path.lastIndexOf('/'));
        }

        try {
          fsCreateDirectory(targetDir, name);
          logCommand?.(`Created directory: ${name}`);
          loadTree();
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          logCommand?.(`Error creating directory: ${message}`);
        }
      },
      [notesDirectory, state.flatList, getSelectedIndex, getDisplayList, logCommand, loadTree]
    ),

    renameItem: useCallback(
      (newName: string) => {
        const list = getDisplayList?.() ?? state.flatList;
        const index = getSelectedIndex?.() ?? 0;
        const item = list[index];
        if (!item) return;

        try {
          const oldName = item.name;
          fsRenameItem(item.path, newName);
          logCommand?.(`Renamed: ${oldName} → ${newName}`);
          loadTree();
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          logCommand?.(`Error renaming: ${message}`);
        }
      },
      [state.flatList, getSelectedIndex, getDisplayList, logCommand, loadTree]
    ),

    deleteItem: useCallback(() => {
      const list = getDisplayList?.() ?? state.flatList;
      const index = getSelectedIndex?.() ?? 0;
      const item = list[index];
      if (!item) return;

      try {
        const name = item.name;
        fsDeleteItem(item.path);
        logCommand?.(`Deleted: ${name}`);
        loadTree();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logCommand?.(`Error deleting: ${message}`);
      }
    }, [state.flatList, getSelectedIndex, getDisplayList, logCommand, loadTree]),

    batchDeleteFiles: useCallback(
      (paths: string[]) => {
        for (const path of paths) {
          try {
            fsDeleteItem(path);
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logCommand?.(`Error deleting ${path}: ${message}`);
          }
        }
        logCommand?.(`Deleted ${paths.length} items`);
        loadTree();
      },
      [logCommand, loadTree]
    ),

    reloadPreview: useCallback(() => {
      const list = getDisplayList?.() ?? state.flatList;
      const index = getSelectedIndex?.() ?? 0;
      const selectedItem = list[index];

      if (selectedItem && selectedItem.type === 'file') {
        const content = readFileContent(selectedItem.path);
        dispatch({ type: 'SET_PREVIEW_CONTENT', payload: content });
      }
    }, [state.flatList, getSelectedIndex, getDisplayList]),
  };

  // Load preview content when selection changes (this would need integration)
  // This effect should be triggered by changes in selectedIndex from SelectionContext

  return (
    <FileSystemContext.Provider value={{ state, actions }}>{children}</FileSystemContext.Provider>
  );
}

export function useFileSystemContext(): FileSystemContextValue {
  const context = useContext(FileSystemContext);
  if (!context) {
    throw new Error('useFileSystemContext must be used within FileSystemProvider');
  }
  return context;
}
