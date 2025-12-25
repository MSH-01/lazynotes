import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import {
  readDirectoryTree,
  loadDirectoryChildren,
  createFile as fsCreateFile,
  createDirectory as fsCreateDirectory,
  renameItem as fsRenameItem,
  deleteItem as fsDeleteItem,
  readFileContent,
} from '../utils/fs.js';
import {
  loadTodos as fsLoadTodos,
  saveTodos as fsSaveTodos,
  buildTodoFlatList,
  generateTodoId,
} from '../utils/todos.js';

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
  activeTab: 'files', // 'files' | 'todos'

  // Preview state
  previewContent: null,
  previewError: null,

  // Scroll positions
  previewScrollOffset: 0,
  fileTreeScrollOffset: 0,

  // Todos state
  todos: {
    categories: [],
    items: [],
    selectedIndex: 0,
    expandedCategories: new Set(['Uncategorised', 'Completed']),
    flatList: [],
    scrollOffset: 0,
  },

  // Command log
  commandLog: [],
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

    case 'LOG_COMMAND':
      return {
        ...state,
        commandLog: [...state.commandLog, { message: action.payload, timestamp: new Date() }].slice(-50),
      };

    // Tab switching
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };

    // Todos
    case 'SET_TODOS':
      return {
        ...state,
        todos: {
          ...state.todos,
          categories: action.payload.categories,
          items: action.payload.items,
        },
      };

    case 'SET_TODO_SELECTION':
      return {
        ...state,
        todos: {
          ...state.todos,
          selectedIndex: action.payload,
        },
      };

    case 'TOGGLE_TODO_CATEGORY': {
      const newExpanded = new Set(state.todos.expandedCategories);
      if (newExpanded.has(action.payload)) {
        newExpanded.delete(action.payload);
      } else {
        newExpanded.add(action.payload);
      }
      return {
        ...state,
        todos: {
          ...state.todos,
          expandedCategories: newExpanded,
        },
      };
    }

    case 'UPDATE_TODO_FLAT_LIST':
      return {
        ...state,
        todos: {
          ...state.todos,
          flatList: action.payload,
        },
      };

    case 'SET_TODO_SCROLL':
      return {
        ...state,
        todos: {
          ...state.todos,
          scrollOffset: action.payload,
        },
      };

    case 'ADD_TODO':
      return {
        ...state,
        todos: {
          ...state.todos,
          items: [...state.todos.items, action.payload],
        },
      };

    case 'UPDATE_TODO':
      return {
        ...state,
        todos: {
          ...state.todos,
          items: state.todos.items.map((item) =>
            item.id === action.payload.id ? { ...item, ...action.payload.updates } : item
          ),
        },
      };

    case 'DELETE_TODO':
      return {
        ...state,
        todos: {
          ...state.todos,
          items: state.todos.items.filter((item) => item.id !== action.payload),
        },
      };

    case 'ADD_CATEGORY':
      if (state.todos.categories.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        todos: {
          ...state.todos,
          categories: [...state.todos.categories, action.payload],
        },
      };

    case 'DELETE_CATEGORY':
      return {
        ...state,
        todos: {
          ...state.todos,
          categories: state.todos.categories.filter((c) => c !== action.payload),
          // Move items from deleted category to uncategorised
          items: state.todos.items.map((item) =>
            item.category === action.payload ? { ...item, category: '' } : item
          ),
        },
      };

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

  // Track if todos have been modified (skip save on initial load)
  const todosInitializedRef = useRef(false);

  // Load todos on mount
  useEffect(() => {
    const { categories, items } = fsLoadTodos();
    dispatch({ type: 'SET_TODOS', payload: { categories, items } });
    // Mark as initialized after a tick to avoid saving on initial load
    setTimeout(() => {
      todosInitializedRef.current = true;
    }, 0);
  }, []);

  // Update todo flat list when todos/expanded categories change
  useEffect(() => {
    const flatList = buildTodoFlatList(
      state.todos.categories,
      state.todos.items,
      state.todos.expandedCategories
    );
    dispatch({ type: 'UPDATE_TODO_FLAT_LIST', payload: flatList });
  }, [state.todos.categories, state.todos.items, state.todos.expandedCategories]);

  // Auto-save todos when items or categories change
  useEffect(() => {
    if (todosInitializedRef.current) {
      fsSaveTodos(state.todos.categories, state.todos.items);
    }
  }, [state.todos.categories, state.todos.items]);

  const logCommand = (message) => dispatch({ type: 'LOG_COMMAND', payload: message });

  const actions = {
    setFocusedPanel: (panel) => dispatch({ type: 'SET_FOCUSED_PANEL', payload: panel }),
    setModal: (modal) => dispatch({ type: 'SET_MODAL', payload: modal }),
    setPreviewScroll: (offset) => dispatch({ type: 'SET_PREVIEW_SCROLL', payload: offset }),
    setFileTreeScroll: (offset) => dispatch({ type: 'SET_FILE_TREE_SCROLL', payload: offset }),
    logCommand,

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

    toggleExpandSelected: () => {
      const item = state.flatList[state.selectedIndex];
      if (item?.type === 'directory') {
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
        logCommand(`Created file: ${name}`);
        loadTree();
      } catch (err) {
        logCommand(`Error creating file: ${err.message}`);
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
        logCommand(`Created directory: ${name}`);
        loadTree();
      } catch (err) {
        logCommand(`Error creating directory: ${err.message}`);
      }
    },

    renameItem: (newName) => {
      const item = state.flatList[state.selectedIndex];
      if (!item) return;
      try {
        const oldName = item.name;
        fsRenameItem(item.path, newName);
        logCommand(`Renamed: ${oldName} → ${newName}`);
        loadTree();
      } catch (err) {
        logCommand(`Error renaming: ${err.message}`);
      }
    },

    deleteItem: () => {
      const item = state.flatList[state.selectedIndex];
      if (!item) return;
      try {
        const name = item.name;
        fsDeleteItem(item.path);
        logCommand(`Deleted: ${name}`);
        loadTree();
      } catch (err) {
        logCommand(`Error deleting: ${err.message}`);
      }
    },

    // Reload preview content (after external edit)
    reloadPreview: () => {
      const selectedItem = state.flatList.find(item => item.path === state.selectedPath);
      if (selectedItem && selectedItem.type === 'file') {
        const content = readFileContent(selectedItem.path);
        dispatch({ type: 'SET_PREVIEW_CONTENT', payload: content });
      }
    },

    loadTree,

    // Tab switching
    setActiveTab: (tab) => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab }),

    // Todo navigation
    moveTodoSelection: (delta) => {
      const { flatList, selectedIndex } = state.todos;
      const newIndex = Math.max(0, Math.min(flatList.length - 1, selectedIndex + delta));
      if (newIndex !== selectedIndex) {
        dispatch({ type: 'SET_TODO_SELECTION', payload: newIndex });
      }
    },

    selectFirstTodo: () => {
      if (state.todos.flatList.length > 0) {
        dispatch({ type: 'SET_TODO_SELECTION', payload: 0 });
      }
    },

    selectLastTodo: () => {
      if (state.todos.flatList.length > 0) {
        dispatch({ type: 'SET_TODO_SELECTION', payload: state.todos.flatList.length - 1 });
      }
    },

    toggleExpandCategory: (categoryName) => {
      dispatch({ type: 'TOGGLE_TODO_CATEGORY', payload: categoryName });
    },

    setTodoScroll: (offset) => dispatch({ type: 'SET_TODO_SCROLL', payload: offset }),

    // Todo CRUD
    createTodo: ({ text, priority = 'P4', category = '', dueDate = null }) => {
      const todo = {
        id: generateTodoId(),
        text,
        completed: false,
        priority,
        category,
        dueDate,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_TODO', payload: todo });
      logCommand(`Created todo: ${text}`);
    },

    updateTodo: (id, updates) => {
      dispatch({ type: 'UPDATE_TODO', payload: { id, updates } });
      logCommand(`Updated todo`);
    },

    deleteTodo: (id) => {
      const todo = state.todos.items.find((t) => t.id === id);
      if (todo) {
        dispatch({ type: 'DELETE_TODO', payload: id });
        logCommand(`Deleted todo: ${todo.text}`);
      }
    },

    toggleTodoComplete: (id) => {
      const todo = state.todos.items.find((t) => t.id === id);
      if (todo) {
        dispatch({ type: 'UPDATE_TODO', payload: { id, updates: { completed: !todo.completed } } });
        logCommand(todo.completed ? `Uncompleted: ${todo.text}` : `Completed: ${todo.text}`);
      }
    },

    // Category management
    createCategory: (name) => {
      if (name && name.trim() && name !== 'Uncategorised' && name !== 'Completed') {
        dispatch({ type: 'ADD_CATEGORY', payload: name.trim() });
        logCommand(`Created category: ${name}`);
      }
    },

    deleteCategory: (name) => {
      dispatch({ type: 'DELETE_CATEGORY', payload: name });
      logCommand(`Deleted category: ${name}`);
    },

    // Get selected todo item
    getSelectedTodo: () => {
      const item = state.todos.flatList[state.todos.selectedIndex];
      if (item?.type === 'todo') {
        return state.todos.items.find((t) => t.id === item.id);
      }
      return null;
    },

    // Get selected category name
    getSelectedCategory: () => {
      const item = state.todos.flatList[state.todos.selectedIndex];
      if (item?.type === 'category') {
        return item.name;
      }
      return null;
    },
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
