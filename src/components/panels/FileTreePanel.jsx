import React from 'react';
import { Box, Text, useInput } from 'ink';
import { Panel } from '../common/Panel.jsx';
import { FileTree } from '../FileTree/FileTree.jsx';
import { TodoList } from '../Todos/TodoList.jsx';
import { useAppContext } from '../../context/AppContext.jsx';

export function FileTreePanel({ maxHeight = 15, onOpenEditor }) {
  const { state, actions } = useAppContext();
  const { focusedPanel, flatList, selectedIndex, modal, activeTab, todos, isSearching, filteredFileList, filteredTodoList, visualMode } = state;
  const isFocused = focusedPanel === 'fileTree';

  // Get the correct list based on filter state
  const fileList = filteredFileList || flatList;
  const todoList = filteredTodoList || todos.flatList;

  // Handle keyboard input when focused
  useInput((input, key) => {
    if (!isFocused || modal || isSearching) return;

    // Exit visual mode with Escape
    if (key.escape && visualMode.active) {
      actions.exitVisualMode();
      return;
    }

    // Tab switching with [ and ]
    if (input === '[' || input === ']') {
      actions.setActiveTab(activeTab === 'files' ? 'todos' : 'files');
      return;
    }

    // Toggle visual mode with v
    if (input === 'v') {
      if (visualMode.active) {
        actions.exitVisualMode();
      } else {
        actions.enterVisualMode();
      }
      return;
    }

    // FILES TAB
    if (activeTab === 'files') {
      // Navigation
      if (input === 'j' || key.downArrow) {
        actions.moveSelection(1);
      } else if (input === 'k' || key.upArrow) {
        actions.moveSelection(-1);
      } else if (input === 'g') {
        actions.selectFirst();
      } else if (input === 'G') {
        actions.selectLast();
      }

      // Expand/collapse toggle or open file
      else if (key.return || input === 'l' || key.rightArrow) {
        const selectedItem = fileList[selectedIndex];
        if (selectedItem?.type === 'directory') {
          actions.toggleExpandSelected();
        } else if (selectedItem?.type === 'file') {
          // Switch to preview panel when pressing Enter on a file
          actions.setFocusedPanel('preview');
        }
      } else if (input === 'h' || key.leftArrow) {
        actions.collapseSelected();
      }

      // Open in external editor with 'e'
      else if (input === 'e') {
        const selectedItem = fileList[selectedIndex];
        if (selectedItem?.type === 'file' && onOpenEditor) {
          onOpenEditor(selectedItem.path);
          // After editor closes, reload content and file tree
          actions.reloadPreview();
          actions.loadTree();
        }
      }

      // CRUD modals
      else if (input === 'n') {
        actions.setModal('create');
      } else if (input === 'N') {
        actions.setModal('createDir');
      } else if (input === 'r') {
        actions.setModal('rename');
      } else if (input === 'd') {
        if (visualMode.active) {
          actions.setModal('batchDeleteFiles');
        } else {
          actions.setModal('delete');
        }
      }
    }
    // TODOS TAB
    else {
      const selectedItem = todoList[todos.selectedIndex];

      // Navigation
      if (input === 'j' || key.downArrow) {
        actions.moveTodoSelection(1);
      } else if (input === 'k' || key.upArrow) {
        actions.moveTodoSelection(-1);
      } else if (input === 'g') {
        actions.selectFirstTodo();
      } else if (input === 'G') {
        actions.selectLastTodo();
      }

      // Expand/collapse category or toggle todo
      else if (key.return || input === 'l' || key.rightArrow) {
        if (selectedItem?.type === 'category') {
          actions.toggleExpandCategory(selectedItem.name);
        }
      } else if (input === 'h' || key.leftArrow) {
        if (selectedItem?.type === 'category' && todos.expandedCategories.has(selectedItem.name)) {
          actions.toggleExpandCategory(selectedItem.name);
        } else if (selectedItem?.type === 'todo') {
          // Find parent category and jump to it (only works in unfiltered mode)
          for (let i = todos.selectedIndex - 1; i >= 0; i--) {
            if (todoList[i]?.type === 'category') {
              actions.moveTodoSelection(i - todos.selectedIndex);
              break;
            }
          }
        }
      }

      // Toggle completion with x or space
      else if (input === 'x' || input === ' ') {
        if (visualMode.active) {
          // Batch toggle in visual mode
          const selection = actions.getVisualSelection();
          const todoIds = selection.filter(item => item.type === 'todo').map(item => item.id);
          if (todoIds.length > 0) {
            actions.batchToggleTodoComplete(todoIds);
            actions.exitVisualMode();
          }
        } else if (selectedItem?.type === 'todo') {
          actions.toggleTodoComplete(selectedItem.id);
        }
      }

      // Todo CRUD modals
      else if (input === 'n') {
        actions.setModal('createTodo');
      } else if (input === 'N') {
        actions.setModal('createCategory');
      } else if (input === 'e') {
        if (selectedItem?.type === 'todo') {
          actions.setModal('editTodo');
        }
      } else if (input === 'd') {
        if (visualMode.active) {
          actions.setModal('batchDeleteTodos');
        } else if (selectedItem?.type === 'todo') {
          actions.setModal('deleteTodo');
        } else if (selectedItem?.type === 'category' &&
                   selectedItem.name !== 'Uncategorised' &&
                   selectedItem.name !== 'Completed') {
          actions.setModal('deleteCategory');
        }
      } else if (input === 'p') {
        if (visualMode.active) {
          actions.setModal('batchSetPriority');
        } else if (selectedItem?.type === 'todo') {
          actions.setModal('setPriority');
        }
      } else if (input === 'c') {
        if (visualMode.active) {
          actions.setModal('batchSetCategory');
        } else if (selectedItem?.type === 'todo') {
          actions.setModal('setCategory');
        }
      } else if (input === 'u') {
        if (visualMode.active) {
          actions.setModal('batchSetDueDate');
        } else if (selectedItem?.type === 'todo') {
          actions.setModal('setDueDate');
        }
      }
    }
  }, { isActive: isFocused && !modal });

  // Handle scroll to keep selected item visible (Files tab)
  React.useEffect(() => {
    if (activeTab === 'files') {
      if (selectedIndex < state.fileTreeScrollOffset) {
        actions.setFileTreeScroll(selectedIndex);
      } else if (selectedIndex >= state.fileTreeScrollOffset + maxHeight) {
        actions.setFileTreeScroll(selectedIndex - maxHeight + 1);
      }
    }
  }, [selectedIndex, state.fileTreeScrollOffset, maxHeight, actions, activeTab]);

  // Handle scroll to keep selected item visible (Todos tab)
  React.useEffect(() => {
    if (activeTab === 'todos') {
      if (todos.selectedIndex < todos.scrollOffset) {
        actions.setTodoScroll(todos.selectedIndex);
      } else if (todos.selectedIndex >= todos.scrollOffset + maxHeight) {
        actions.setTodoScroll(todos.selectedIndex - maxHeight + 1);
      }
    }
  }, [todos.selectedIndex, todos.scrollOffset, maxHeight, actions, activeTab]);

  // Build the title with tabs
  const titleContent = (
    <>
      <Text>[2] </Text>
      <Text bold={activeTab === 'files'}>
        Notes
      </Text>
      <Text> - </Text>
      <Text bold={activeTab === 'todos'}>
        Todos
      </Text>
    </>
  );

  return (
    <Panel title={titleContent} isFocused={isFocused} flexGrow={1}>
      {activeTab === 'files' ? (
        <FileTree maxHeight={maxHeight} />
      ) : (
        <TodoList maxHeight={maxHeight} />
      )}
    </Panel>
  );
}
