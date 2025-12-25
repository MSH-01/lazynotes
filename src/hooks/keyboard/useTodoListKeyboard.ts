import { useInput } from 'ink';
import type { TodoListItem, VisualModeState, ModalType } from '../../types';
import { isTodoItem, isCategoryItem } from '../../types';

interface UseTodoListKeyboardOptions {
  /** Whether this hook should handle input */
  isActive: boolean;
  /** Currently selected todo list item */
  selectedItem: TodoListItem | undefined;
  /** Current selection index */
  selectedIndex: number;
  /** Todo list items */
  todoList: TodoListItem[];
  /** Set of expanded categories */
  expandedCategories: Set<string>;
  /** Visual mode state */
  visualMode: VisualModeState;
  /** Callbacks for actions */
  actions: {
    moveTodoSelection: (delta: number) => void;
    selectFirstTodo: () => void;
    selectLastTodo: () => void;
    toggleExpandCategory: (name: string) => void;
    toggleTodoComplete: (id: string) => void;
    setModal: (modal: ModalType) => void;
    getVisualSelection: () => TodoListItem[];
    batchToggleTodoComplete: (ids: string[]) => void;
    exitVisualMode: () => void;
  };
}

/**
 * Keyboard handler hook for the Todos tab
 *
 * Handles:
 * - j/k: Navigation
 * - g/G: Jump to first/last
 * - h/l, Enter, arrows: Expand/collapse categories
 * - x/Space: Toggle completion
 * - n/N: Create todo/category
 * - e: Edit todo
 * - d: Delete (single or batch)
 * - p: Set priority
 * - c: Set category
 * - u: Set due date
 */
export function useTodoListKeyboard({
  isActive,
  selectedItem,
  selectedIndex,
  todoList,
  expandedCategories,
  visualMode,
  actions,
}: UseTodoListKeyboardOptions): void {
  useInput(
    (input, key) => {
      // Navigation
      if (input === 'j' || key.downArrow) {
        actions.moveTodoSelection(1);
        return;
      }
      if (input === 'k' || key.upArrow) {
        actions.moveTodoSelection(-1);
        return;
      }
      if (input === 'g') {
        actions.selectFirstTodo();
        return;
      }
      if (input === 'G') {
        actions.selectLastTodo();
        return;
      }

      // Expand/collapse category
      if (key.return || input === 'l' || key.rightArrow) {
        if (selectedItem && isCategoryItem(selectedItem)) {
          actions.toggleExpandCategory(selectedItem.fullPath || selectedItem.name);
        }
        return;
      }

      if (input === 'h' || key.leftArrow) {
        if (selectedItem && isCategoryItem(selectedItem)) {
          const categoryPath = selectedItem.fullPath || selectedItem.name;
          if (expandedCategories.has(categoryPath)) {
            actions.toggleExpandCategory(categoryPath);
          }
        } else if (selectedItem && isTodoItem(selectedItem)) {
          // Find parent category and jump to it
          for (let i = selectedIndex - 1; i >= 0; i--) {
            const item = todoList[i];
            if (item && isCategoryItem(item)) {
              actions.moveTodoSelection(i - selectedIndex);
              break;
            }
          }
        }
        return;
      }

      // Toggle completion with x or space
      if (input === 'x' || input === ' ') {
        if (visualMode.active) {
          // Batch toggle in visual mode
          const selection = actions.getVisualSelection();
          const todoIds = selection.filter(isTodoItem).map((item) => item.id);
          if (todoIds.length > 0) {
            actions.batchToggleTodoComplete(todoIds);
            actions.exitVisualMode();
          }
        } else if (selectedItem && isTodoItem(selectedItem)) {
          actions.toggleTodoComplete(selectedItem.id);
        }
        return;
      }

      // Todo CRUD modals
      if (input === 'n') {
        actions.setModal('createTodo');
        return;
      }
      if (input === 'N') {
        actions.setModal('createCategory');
        return;
      }
      if (input === 'e') {
        if (selectedItem && isTodoItem(selectedItem)) {
          actions.setModal('editTodo');
        }
        return;
      }
      if (input === 'd') {
        if (visualMode.active) {
          actions.setModal('batchDeleteTodos');
        } else if (selectedItem && isTodoItem(selectedItem)) {
          actions.setModal('deleteTodo');
        } else if (
          selectedItem &&
          isCategoryItem(selectedItem) &&
          selectedItem.name !== 'Uncategorised' &&
          selectedItem.name !== 'Completed'
        ) {
          actions.setModal('deleteCategory');
        }
        return;
      }
      if (input === 'p') {
        if (visualMode.active) {
          actions.setModal('batchSetPriority');
        } else if (selectedItem && isTodoItem(selectedItem)) {
          actions.setModal('setPriority');
        }
        return;
      }
      if (input === 'c') {
        if (visualMode.active) {
          actions.setModal('batchSetCategory');
        } else if (selectedItem && isTodoItem(selectedItem)) {
          actions.setModal('setCategory');
        }
        return;
      }
      if (input === 'u') {
        if (visualMode.active) {
          actions.setModal('batchSetDueDate');
        } else if (selectedItem && isTodoItem(selectedItem)) {
          actions.setModal('setDueDate');
        }
        return;
      }
    },
    { isActive }
  );
}
