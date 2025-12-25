/**
 * Todo related types
 */

import type { WithDepth } from './common';

/** Priority levels for todos */
export type Priority = 'P1' | 'P2' | 'P3' | 'P4';

/** All valid priorities */
export const PRIORITIES: Priority[] = ['P1', 'P2', 'P3', 'P4'];

/** Priority display labels */
export const PRIORITY_LABELS: Record<Priority, string> = {
  P1: 'Urgent',
  P2: 'High',
  P3: 'Medium',
  P4: 'Low',
};

/** A todo item */
export interface TodoItem extends WithDepth {
  type: 'todo';
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  category: string;
  dueDate: string | null;
  createdAt: string;
}

/** A category in the todo list */
export interface CategoryItem extends WithDepth {
  type: 'category';
  name: string;
  fullPath: string;
  itemCount: number;
}

/** Union type for todo flat list items */
export type TodoListItem = TodoItem | CategoryItem;

/** Type guard for todo items */
export function isTodoItem(item: TodoListItem): item is TodoItem {
  return item.type === 'todo';
}

/** Type guard for category items */
export function isCategoryItem(item: TodoListItem): item is CategoryItem {
  return item.type === 'category';
}

/** Input for creating a new todo */
export interface CreateTodoInput {
  text: string;
  priority?: Priority;
  category?: string;
  dueDate?: string | null;
}

/** Input for updating a todo */
export interface UpdateTodoInput {
  text?: string;
  priority?: Priority;
  category?: string;
  dueDate?: string | null;
  completed?: boolean;
}

/** Parsed todo data from markdown line */
export interface ParsedTodo {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  dueDate: string | null;
  category: string;
  createdAt: string;
}

/** Result of parsing todos file */
export interface ParsedTodosFile {
  categories: string[];
  items: TodoItem[];
}
