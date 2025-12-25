import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import {
  readDirectoryTree,
  loadDirectoryChildren,
  createFile as fsCreateFile,
  createDirectory as fsCreateDirectory,
  renameItem as fsRenameItem,
  deleteItem as fsDeleteItem,
  readFileContent,
} from '../utils/fs.js';

const AppContext = createContext(null);

const initialState = {
  // Config
  notesDirectory: null,

  // File system state
  fileTree: [],
  selectedPath: null,
  selectedIndex: 0,
  expandedDirs: new Set(),
  flatList: [],

  // UI state
  focusedPanel: 'fileTree',
  modal: null,

  // Preview state
  previewContent: null,
  previewError: null,

  // Scroll positions
  previewScrollOffset: 0,
  fileTreeScrollOffset: 0,
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_NOTES_DIRECTORY':
      return { ...state, notesDirectory: action.payload };

    case 'SET_FILE_TREE':
      return {
        ...state,
        fileTree: action.payload.tree,
        flatList: action.payload.flatList,
      };

    case 'SET_SELECTED_PATH':
      return {
        ...state,
        selectedPath: action.payload.path,
        selectedIndex: action.payload.index,
        previewScrollOffset: 0,
      };

    case 'TOGGLE_EXPAND_DIR': {
      const newExpanded = new Set(state.expandedDirs);
      if (newExpanded.has(action.payload)) {
        newExpanded.delete(action.payload);
      } else {
        newExpanded.add(action.payload);
      }
      return { ...state, expandedDirs: newExpanded };
    }

    case 'UPDATE_FLAT_LIST':
      return { ...state, flatList: action.payload };

    case 'SET_FOCUSED_PANEL':
      return { ...state, focusedPanel: action.payload };

    case 'SET_MODAL':
      return { ...state, modal: action.payload };

    case 'SET_PREVIEW_CONTENT':
      return { ...state, previewContent: action.payload, previewError: null };

    case 'SET_PREVIEW_ERROR':
      return { ...state, previewContent: null, previewError: action.payload };

    case 'SET_PREVIEW_SCROLL':
      return { ...state, previewScrollOffset: action.payload };

    case 'SET_FILE_TREE_SCROLL':
      return { ...state, fileTreeScrollOffset: action.payload };

    default:
      return state;
  }
}

export function AppProvider({ children, notesDirectory }) {
  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    notesDirectory,
  });

  // Build flat list from tree
  const buildFlatList = useCallback((tree, expandedDirs, depth = 0) => {
    const result = [];
    for (const node of tree) {
      result.push({ ...node, depth });
      if (node.type === 'directory' && expandedDirs.has(node.path)) {
        if (!node.children || node.children.length === 0) {
          node.children = loadDirectoryChildren(node.path, depth + 1);
        }
        const childItems = buildFlatList(node.children, expandedDirs, depth + 1);
        result.push(...childItems);
      }
    }
    return result;
  }, []);

  // Load file tree
  const loadTree = useCallback(() => {
    if (!notesDirectory) return;
    const tree = readDirectoryTree(notesDirectory, 0);
    const flatList = buildFlatList(tree, state.expandedDirs);
    dispatch({ type: 'SET_FILE_TREE', payload: { tree, flatList } });
    if (flatList.length > 0 && !state.selectedPath) {
      dispatch({ type: 'SET_SELECTED_PATH', payload: { path: flatList[0].path, index: 0 } });
    }
  }, [notesDirectory, buildFlatList, state.expandedDirs, state.selectedPath]);

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
  }, [state.expandedDirs, state.fileTree, buildFlatList]);

  // Load preview content when selection changes
  useEffect(() => {
    if (!state.selectedPath) {
      dispatch({ type: 'SET_PREVIEW_CONTENT', payload: null });
      return;
    }
    const selectedItem = state.flatList.find(item => item.path === state.selectedPath);
    if (selectedItem && selectedItem.type === 'file') {
      const content = readFileContent(selectedItem.path);
      dispatch({ type: 'SET_PREVIEW_CONTENT', payload: content });
    } else {
      dispatch({ type: 'SET_PREVIEW_CONTENT', payload: null });
    }
  }, [state.selectedPath, state.flatList]);

  const actions = {
    setFocusedPanel: (panel) => dispatch({ type: 'SET_FOCUSED_PANEL', payload: panel }),
    setModal: (modal) => dispatch({ type: 'SET_MODAL', payload: modal }),
    setPreviewScroll: (offset) => dispatch({ type: 'SET_PREVIEW_SCROLL', payload: offset }),
    setFileTreeScroll: (offset) => dispatch({ type: 'SET_FILE_TREE_SCROLL', payload: offset }),

    moveSelection: (delta) => {
      const newIndex = Math.max(0, Math.min(state.flatList.length - 1, state.selectedIndex + delta));
      if (newIndex !== state.selectedIndex && state.flatList[newIndex]) {
        dispatch({ type: 'SET_SELECTED_PATH', payload: { path: state.flatList[newIndex].path, index: newIndex } });
      }
    },

    selectFirst: () => {
      if (state.flatList.length > 0) {
        dispatch({ type: 'SET_SELECTED_PATH', payload: { path: state.flatList[0].path, index: 0 } });
      }
    },

    selectLast: () => {
      if (state.flatList.length > 0) {
        const lastIndex = state.flatList.length - 1;
        dispatch({ type: 'SET_SELECTED_PATH', payload: { path: state.flatList[lastIndex].path, index: lastIndex } });
      }
    },

    toggleExpandDir: (path) => dispatch({ type: 'TOGGLE_EXPAND_DIR', payload: path }),

    expandSelected: () => {
      const item = state.flatList[state.selectedIndex];
      if (item?.type === 'directory' && !state.expandedDirs.has(item.path)) {
        dispatch({ type: 'TOGGLE_EXPAND_DIR', payload: item.path });
      }
    },

    collapseSelected: () => {
      const item = state.flatList[state.selectedIndex];
      if (item) {
        if (item.type === 'directory' && state.expandedDirs.has(item.path)) {
          dispatch({ type: 'TOGGLE_EXPAND_DIR', payload: item.path });
        } else if (item.depth > 0) {
          for (let i = state.selectedIndex - 1; i >= 0; i--) {
            const parent = state.flatList[i];
            if (parent.type === 'directory' && parent.depth < item.depth) {
              dispatch({ type: 'SET_SELECTED_PATH', payload: { path: parent.path, index: i } });
              break;
            }
          }
        }
      }
    },

    createFile: (name) => {
      const item = state.flatList[state.selectedIndex];
      let targetDir = notesDirectory;
      if (item) {
        targetDir = item.type === 'directory' ? item.path : item.path.substring(0, item.path.lastIndexOf('/'));
      }
      try {
        fsCreateFile(targetDir, name);
        loadTree();
      } catch (err) {
        console.error('Error creating file:', err);
      }
    },

    createDirectory: (name) => {
      const item = state.flatList[state.selectedIndex];
      let targetDir = notesDirectory;
      if (item) {
        targetDir = item.type === 'directory' ? item.path : item.path.substring(0, item.path.lastIndexOf('/'));
      }
      try {
        fsCreateDirectory(targetDir, name);
        loadTree();
      } catch (err) {
        console.error('Error creating directory:', err);
      }
    },

    renameItem: (newName) => {
      const item = state.flatList[state.selectedIndex];
      if (!item) return;
      try {
        fsRenameItem(item.path, newName);
        loadTree();
      } catch (err) {
        console.error('Error renaming item:', err);
      }
    },

    deleteItem: () => {
      const item = state.flatList[state.selectedIndex];
      if (!item) return;
      try {
        fsDeleteItem(item.path);
        loadTree();
      } catch (err) {
        console.error('Error deleting item:', err);
      }
    },

    loadTree,
  };

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
