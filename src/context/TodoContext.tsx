import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import type { TodoState, TodoActions, TodoItem, TodoListItem, CreateTodoInput, UpdateTodoInput } from '../types';
import { isTodoItem } from '../types';
import {
  loadTodos as fsLoadTodos,
  saveTodos as fsSaveTodos,
  buildTodoFlatList,
  generateTodoId,
  isDescendantOf,
  parseCategoryPath,
} from '../utils/todos';

// ============================================================================
// State & Reducer
// ============================================================================

const initialState: TodoState = {
  categories: [],
  items: [],
  expandedCategories: new Set(),
  flatList: [],
};

type TodoAction =
  | { type: 'SET_TODOS'; payload: { categories: string[]; items: TodoItem[] } }
  | { type: 'ADD_TODO'; payload: TodoItem }
  | { type: 'UPDATE_TODO'; payload: { id: string; updates: UpdateTodoInput } }
  | { type: 'DELETE_TODO'; payload: string }
  | { type: 'TOGGLE_CATEGORY'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: string }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'UPDATE_FLAT_LIST'; payload: TodoListItem[] };

function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case 'SET_TODOS':
      return {
        ...state,
        categories: action.payload.categories,
        items: action.payload.items,
      };

    case 'ADD_TODO':
      return {
        ...state,
        items: [...state.items, action.payload],
      };

    case 'UPDATE_TODO':
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload.updates } : item
        ),
      };

    case 'DELETE_TODO':
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
      };

    case 'TOGGLE_CATEGORY': {
      const categoryPath = action.payload;
      const newExpanded = new Set(state.expandedCategories);

      if (newExpanded.has(categoryPath)) {
        // Collapsing: remove this category AND all descendants
        newExpanded.delete(categoryPath);
        for (const cat of newExpanded) {
          if (isDescendantOf(cat, categoryPath)) {
            newExpanded.delete(cat);
          }
        }
      } else {
        // Expanding: just add this category
        newExpanded.add(categoryPath);
      }

      return { ...state, expandedCategories: newExpanded };
    }

    case 'ADD_CATEGORY':
      if (state.categories.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        categories: [...state.categories, action.payload],
      };

    case 'DELETE_CATEGORY': {
      const categoryPath = action.payload;
      // Find all categories to delete (this one + all descendants)
      const categoriesToDelete = [categoryPath];
      for (const cat of state.categories) {
        if (isDescendantOf(cat, categoryPath)) {
          categoriesToDelete.push(cat);
        }
      }

      return {
        ...state,
        categories: state.categories.filter((c) => !categoriesToDelete.includes(c)),
        // Move items from deleted categories to uncategorised
        items: state.items.map((item) =>
          categoriesToDelete.includes(item.category) ? { ...item, category: '' } : item
        ),
      };
    }

    case 'UPDATE_FLAT_LIST':
      return { ...state, flatList: action.payload };

    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================

export interface TodoContextValue {
  state: TodoState;
  actions: TodoActions;
}

interface TodoProviderProps {
  children: ReactNode;
  /** Get current selected index */
  getSelectedIndex?: () => number;
  /** Get current display list */
  getDisplayList?: () => TodoListItem[];
  /** Callback to log commands */
  logCommand?: (message: string) => void;
}

const TodoContext = createContext<TodoContextValue | null>(null);

export function TodoProvider({
  children,
  getSelectedIndex,
  getDisplayList,
  logCommand,
}: TodoProviderProps) {
  const [state, dispatch] = useReducer(todoReducer, initialState);

  // Track if todos have been modified (skip save on initial load)
  const todosInitializedRef = useRef(false);

  // Load todos on mount
  useEffect(() => {
    const { categories, items } = fsLoadTodos();
    dispatch({ type: 'SET_TODOS', payload: { categories, items: items as TodoItem[] } });
    // Mark as initialized after a tick to avoid saving on initial load
    setTimeout(() => {
      todosInitializedRef.current = true;
    }, 0);
  }, []);

  // Update flat list when todos/expanded categories change
  useEffect(() => {
    const flatList = buildTodoFlatList(state.categories, state.items, state.expandedCategories);
    dispatch({ type: 'UPDATE_FLAT_LIST', payload: flatList });
  }, [state.categories, state.items, state.expandedCategories]);

  // Auto-save todos when items or categories change
  useEffect(() => {
    if (todosInitializedRef.current) {
      fsSaveTodos(state.categories, state.items);
    }
  }, [state.categories, state.items]);

  const actions: TodoActions = {
    createTodo: useCallback(
      ({ text, priority = 'P4', category = '', dueDate = null }: CreateTodoInput) => {
        const todo: TodoItem = {
          type: 'todo',
          id: generateTodoId(),
          text,
          completed: false,
          priority,
          category,
          dueDate: dueDate ?? null,
          createdAt: new Date().toISOString(),
          depth: 0,
        };
        dispatch({ type: 'ADD_TODO', payload: todo });
        logCommand?.(`Created todo: ${text}`);
      },
      [logCommand]
    ),

    updateTodo: useCallback(
      (id: string, updates: UpdateTodoInput) => {
        dispatch({ type: 'UPDATE_TODO', payload: { id, updates } });
        logCommand?.(`Updated todo`);
      },
      [logCommand]
    ),

    deleteTodo: useCallback(
      (id: string) => {
        const todo = state.items.find((t) => t.id === id);
        if (todo) {
          dispatch({ type: 'DELETE_TODO', payload: id });
          logCommand?.(`Deleted todo: ${todo.text}`);
        }
      },
      [state.items, logCommand]
    ),

    toggleTodoComplete: useCallback(
      (id: string) => {
        const todo = state.items.find((t) => t.id === id);
        if (todo) {
          dispatch({ type: 'UPDATE_TODO', payload: { id, updates: { completed: !todo.completed } } });
          logCommand?.(todo.completed ? `Uncompleted: ${todo.text}` : `Completed: ${todo.text}`);
        }
      },
      [state.items, logCommand]
    ),

    createCategory: useCallback(
      (name: string) => {
        if (name && name.trim() && name !== 'Uncategorised' && name !== 'Completed') {
          const trimmedName = name.trim();
          // Auto-create all parent categories
          const segments = parseCategoryPath(trimmedName);
          for (let i = 1; i <= segments.length; i++) {
            const path = segments.slice(0, i).join('/');
            dispatch({ type: 'ADD_CATEGORY', payload: path });
          }
          logCommand?.(`Created category: ${trimmedName}`);
        }
      },
      [logCommand]
    ),

    deleteCategory: useCallback(
      (name: string) => {
        dispatch({ type: 'DELETE_CATEGORY', payload: name });
        logCommand?.(`Deleted category: ${name}`);
      },
      [logCommand]
    ),

    toggleExpandCategory: useCallback((name: string) => {
      dispatch({ type: 'TOGGLE_CATEGORY', payload: name });
    }, []),

    // Batch operations
    batchToggleTodoComplete: useCallback(
      (ids: string[]) => {
        for (const id of ids) {
          const todo = state.items.find((t) => t.id === id);
          if (todo) {
            dispatch({ type: 'UPDATE_TODO', payload: { id, updates: { completed: !todo.completed } } });
          }
        }
        logCommand?.(`Toggled ${ids.length} todos`);
      },
      [state.items, logCommand]
    ),

    batchDeleteTodos: useCallback(
      (ids: string[]) => {
        for (const id of ids) {
          dispatch({ type: 'DELETE_TODO', payload: id });
        }
        logCommand?.(`Deleted ${ids.length} todos`);
      },
      [logCommand]
    ),

    batchUpdateTodos: useCallback(
      (ids: string[], updates: UpdateTodoInput) => {
        for (const id of ids) {
          dispatch({ type: 'UPDATE_TODO', payload: { id, updates } });
        }
        logCommand?.(`Updated ${ids.length} todos`);
      },
      [logCommand]
    ),

    // Getters
    getSelectedTodo: useCallback(() => {
      const list = getDisplayList?.() ?? state.flatList;
      const index = getSelectedIndex?.() ?? 0;
      const item = list[index];
      if (item && isTodoItem(item)) {
        return state.items.find((t) => t.id === item.id) ?? null;
      }
      return null;
    }, [state.flatList, state.items, getSelectedIndex, getDisplayList]),

    getSelectedCategory: useCallback(() => {
      const list = getDisplayList?.() ?? state.flatList;
      const index = getSelectedIndex?.() ?? 0;
      const item = list[index];
      if (item?.type === 'category') {
        return item.fullPath || item.name;
      }
      return null;
    }, [state.flatList, getSelectedIndex, getDisplayList]),
  };

  return <TodoContext.Provider value={{ state, actions }}>{children}</TodoContext.Provider>;
}

export function useTodoContext(): TodoContextValue {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodoContext must be used within TodoProvider');
  }
  return context;
}
