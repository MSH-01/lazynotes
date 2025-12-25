# LazyNotes Architecture

A terminal-based note manager inspired by lazygit, built with React and Ink.

## Tech Stack

- **React 19** - UI library
- **Ink 6** - React renderer for terminal UIs (renders to ANSI escape codes)
- **@inkjs/ui** - Pre-built terminal UI components (TextInput)
- **meow** - CLI argument parsing
- **tsx** - TypeScript/JSX executor for Node.js
- **fuzzysort** - Fast fuzzy search (SublimeText-like matching)

## Project Structure

```
lazynotes/
├── index.jsx                 # Entry point - terminal mode management, editor integration
├── package.json
├── ARCHITECTURE.md
└── src/
    ├── App.jsx               # Main app component, CLI parsing, modal rendering
    ├── context/
    │   └── AppContext.jsx    # Global state management (React Context + useReducer)
    ├── hooks/
    │   └── useConfig.js      # Configuration loading hook
    ├── components/
    │   ├── Layout.jsx        # Main layout (2-column grid)
    │   ├── common/
    │   │   ├── Panel.jsx     # Reusable bordered panel wrapper
    │   │   └── StatusBar.jsx # Bottom status bar with keyboard hints
    │   ├── FileTree/
    │   │   ├── FileTree.jsx      # File list renderer with virtual scrolling
    │   │   └── FileTreeItem.jsx  # Individual file/folder row
    │   ├── Todos/
    │   │   ├── TodoList.jsx      # Todo list renderer with virtual scrolling
    │   │   └── TodoItem.jsx      # Individual todo/category row
    │   ├── panels/
    │   │   ├── StatusPanel.jsx   # File/dir counts
    │   │   ├── FileTreePanel.jsx # File tree + todos (tabbed), keyboard handling
    │   │   ├── PreviewPanel.jsx  # File content preview
    │   │   ├── MetadataPanel.jsx # Selected item metadata
    │   │   └── CommandLogPanel.jsx # Command history log
    │   └── modals/
    │       ├── InputModal.jsx    # Text input dialog
    │       ├── ConfirmModal.jsx  # Y/N confirmation dialog
    │       ├── SelectModal.jsx   # List selection dialog (j/k navigation)
    │       └── TodoModal.jsx     # Todo creation/editing dialog
    └── utils/
        ├── fs.js             # File system operations
        ├── todos.js          # Todo parsing, serialization, file I/O
        └── format.js         # Date/size formatting helpers
```

## State Management

### AppContext.jsx

Uses React Context + useReducer pattern. Single source of truth for all app state.

**Key State Shape:**
```javascript
{
  // Config
  notesDirectory: string,

  // File system
  fileTree: [],              // Hierarchical tree structure
  flatList: [],              // Flattened for display/navigation
  selectedPath: string,
  selectedIndex: number,
  expandedDirs: Set<string>,

  // UI
  focusedPanel: 'preview' | 'status' | 'fileTree' | 'metadata',
  modal: string | null,      // Active modal name
  activeTab: 'files' | 'todos',

  // Search (inline in status bar)
  isSearching: boolean,
  searchQuery: string,

  // Preview
  previewContent: string,
  previewScrollOffset: number,
  fileTreeScrollOffset: number,

  // Todos
  todos: {
    categories: string[],
    items: Todo[],
    selectedIndex: number,
    expandedCategories: Set<string>,
    flatList: [],            // Flattened categories + todos
    scrollOffset: number,
  },

  // Logging
  commandLog: [],
}
```

**Todo Item Shape:**
```javascript
{
  id: string,
  text: string,
  completed: boolean,
  priority: 'P1' | 'P2' | 'P3' | 'P4',
  category: string,          // Empty string = uncategorised
  dueDate: string | null,    // 'YYYY-MM-DD' format
  createdAt: string,         // ISO timestamp
}
```

## Data Flow

1. **User Input** → Ink's `useInput` hook in panel components
2. **Action Dispatch** → `actions.someAction()` from context
3. **Reducer** → Updates state immutably
4. **Effects** → Side effects (file I/O, flat list rebuilding)
5. **Re-render** → React updates terminal output

## File Storage

### Notes
- Stored as plain files in configurable directory (default: `~/notes`)
- Directory structure mirrors UI tree

### Todos
- Single file: `~/.config/lazynotes/todos.md`
- Markdown format with categories as headers:
```markdown
# Work
- [ ] P1: Urgent task @due:2024-12-25
- [ ] P2: Important task

# Uncategorised
- [ ] P4: Random task

# Completed
- [x] P3: Done task
```

### Configuration Priority
1. CLI flags: `--dir` or `-d`
2. Environment: `LAZYNOTES_DIR`
3. Config files: `~/.lazynotesrc` or `~/.config/lazynotes/config.json`
4. Default: `~/notes`

## Component Patterns

### Panel Component
Reusable bordered container with:
- Optional title (string or JSX) rendered in border
- Focus state (blue border when focused)
- Flexible height/growth

### List Components (FileTree, TodoList)
- Virtual scrolling via `scrollOffset` + `maxHeight`
- Flat list for navigation, derived from hierarchical data
- Selection tracked by index

### Modal Components
- Absolute positioning to overlay terminal
- Double border style
- Escape to cancel, Enter to confirm
- `useInput` for keyboard handling

## Keyboard Architecture

- **Global shortcuts** handled in `App.jsx` (quit, panel switching)
- **Panel-specific shortcuts** handled in respective panel components
- **Modal shortcuts** handled in modal components
- Shortcuts only active when: panel is focused AND no modal open

### Key Patterns
- `j/k` or arrows: Navigation
- `g/G`: Jump to first/last
- `Enter/l`: Expand/select
- `h`: Collapse/go back
- `n/N`: Create new item
- `d`: Delete
- `/`: Fuzzy search (files + todos)
- `q`: Quit

## Adding New Features

### New Panel
1. Create component in `src/components/panels/`
2. Add to `Layout.jsx`
3. Add focus state to `AppContext.jsx`
4. Add keyboard hints to `StatusBar.jsx`

### New Modal
1. Create component in `src/components/modals/`
2. Add modal name to reducer's `SET_MODAL` handling
3. Add render case in `App.jsx`
4. Trigger with `actions.setModal('modalName')`

### New State
1. Add to `initialState` in `AppContext.jsx`
2. Add reducer cases
3. Add actions
4. Add effects if needed (file I/O, derived state)

## Styling

Terminal-native colors via Ink's `<Text>` props:
- `color="blue"` - Focus/primary
- `color="cyan"` - Directories/categories
- `color="green"` - Success/counts
- `color="red"` - Danger/errors/P1 priority
- `color="yellow"` - Warning/P2 priority
- `color="gray"` - Secondary/hints
- `dimColor` - Muted text
- `inverse` - Selection highlighting
- `bold` - Emphasis
