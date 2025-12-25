import React from 'react';
import { Box, Text, useInput } from 'ink';
import { Panel } from '../common/Panel.jsx';
import { FileTree } from '../FileTree/FileTree.jsx';
import { TodoList } from '../Todos/TodoList.jsx';
import { useAppContext } from '../../context/AppContext.jsx';

export function FileTreePanel({ maxHeight = 15, onOpenEditor }) {
  const { state, actions } = useAppContext();
  const { focusedPanel, flatList, selectedIndex, modal, activeTab, todos } = state;
  const isFocused = focusedPanel === 'fileTree';

  // Handle keyboard input when focused
  useInput((input, key) => {
    if (!isFocused || modal) return;

    // Tab switching with [ and ]
    if (input === '[' || input === ']') {
      actions.setActiveTab(activeTab === 'files' ? 'todos' : 'files');
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
        const selectedItem = flatList[selectedIndex];
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
        const selectedItem = flatList[selectedIndex];
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
        actions.setModal('delete');
      }
    }
    // TODOS TAB
    else {
      const selectedItem = todos.flatList[todos.selectedIndex];

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
          // Find parent category and jump to it
          for (let i = todos.selectedIndex - 1; i >= 0; i--) {
            if (todos.flatList[i]?.type === 'category') {
              actions.moveTodoSelection(i - todos.selectedIndex);
              break;
            }
          }
        }
      }

      // Toggle completion with x or space
      else if (input === 'x' || input === ' ') {
        if (selectedItem?.type === 'todo') {
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
        if (selectedItem?.type === 'todo') {
          actions.setModal('deleteTodo');
        } else if (selectedItem?.type === 'category' &&
                   selectedItem.name !== 'Uncategorised' &&
                   selectedItem.name !== 'Completed') {
          actions.setModal('deleteCategory');
        }
      } else if (input === 'p') {
        if (selectedItem?.type === 'todo') {
          actions.setModal('setPriority');
        }
      } else if (input === 'c') {
        if (selectedItem?.type === 'todo') {
          actions.setModal('setCategory');
        }
      } else if (input === 'u') {
        if (selectedItem?.type === 'todo') {
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
        Files
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
