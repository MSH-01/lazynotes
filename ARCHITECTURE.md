# LazyNotes Architecture

A terminal-based note manager inspired by lazygit, built with React and Ink.

## Tech Stack

- **React 19** - UI library
- **Ink 6** - React renderer for terminal UIs (renders to ANSI escape codes)
- **@inkjs/ui** - Pre-built terminal UI components (TextInput)
- **TypeScript** - Type-safe development with strict mode
- **meow** - CLI argument parsing
- **tsx** - TypeScript/JSX executor for Node.js
- **fuzzysort** - Fast fuzzy search (SublimeText-like matching)

## Project Structure

```
lazynotes/
├── index.tsx                 # Entry point - terminal mode, editor integration
├── package.json
├── tsconfig.json             # TypeScript configuration
├── ARCHITECTURE.md
└── src/
    ├── App.tsx               # Main app, CLI parsing, global shortcuts
    ├── types/
    │   ├── index.ts          # Re-exports all types
    │   ├── common.ts         # CommandLogEntry, VisualModeState, AppConfig
    │   ├── fileSystem.ts     # FileItem, DirectoryItem, FileTreeNode
    │   ├── todos.ts          # TodoItem, CategoryItem, Priority, TodoListItem
    │   ├── ui.ts             # ModalType, PanelType, TabType
    │   └── context.ts        # State/Action interfaces per context
    ├── context/
    │   ├── index.ts          # Re-exports providers and hooks
    │   ├── AppProviders.tsx  # Combined provider wrapper, useApp hook
    │   ├── UIContext.tsx     # Panel focus, modals, tabs, command log
    │   ├── SearchContext.tsx # Search state, filtered lists
    │   ├── SelectionContext.tsx # Selection indices, scroll, visual mode
    │   ├── FileSystemContext.tsx # File tree, CRUD operations
    │   └── TodoContext.tsx   # Todos, categories, batch operations
    ├── hooks/
    │   ├── index.ts          # Re-exports all hooks
    │   ├── useConfig.ts      # Configuration loading
    │   ├── navigation/
    │   │   ├── useKeyboardNavigation.ts  # j/k/g/G navigation
    │   │   ├── useScrollToSelected.ts    # Auto-scroll viewport
    │   │   └── useVisualSelection.ts     # Visual mode helpers
    │   ├── keyboard/
    │   │   ├── useFileTreeKeyboard.ts    # File-specific handlers
    │   │   ├── useTodoListKeyboard.ts    # Todo-specific handlers
    │   │   └── usePreviewKeyboard.ts     # Preview scrolling
    │   └── data/
    │       └── useFilteredList.ts        # Generic fuzzy filtering
    ├── components/
    │   ├── Layout.tsx        # Main layout (2-column grid)
    │   ├── common/
    │   │   ├── Panel.tsx     # Reusable bordered panel
    │   │   └── StatusBar.tsx # Keyboard hints + search input
    │   ├── FileTree/
    │   │   ├── FileTree.tsx      # File list + filtering
    │   │   └── FileTreeItem.tsx  # File/folder row (memoized)
    │   ├── Todos/
    │   │   ├── TodoList.tsx      # Todo list + filtering
    │   │   └── TodoItem.tsx      # Todo/category row (memoized)
    │   ├── panels/
    │   │   ├── StatusPanel.tsx   # File/dir counts (memoized)
    │   │   ├── FileTreePanel.tsx # Files + Todos tabs, keyboard
    │   │   ├── PreviewPanel.tsx  # File content preview
    │   │   ├── MetadataPanel.tsx # Selected item metadata
    │   │   └── CommandLogPanel.tsx # Command history
    │   └── modals/
    │       ├── ModalRegistry.tsx # Centralized modal rendering
    │       ├── InputModal.tsx    # Text input dialog
    │       ├── ConfirmModal.tsx  # Y/N confirmation
    │       ├── SelectModal.tsx   # List selection (j/k nav)
    │       └── TodoModal.tsx     # Todo creation/editing
    └── utils/
        ├── fs.ts             # File system operations
        ├── todos.ts          # Todo parsing, hierarchy helpers
        └── format.ts         # Date/size formatting
```

## Type System

### Core Types (`src/types/`)

```typescript
// File system types
interface FileItem {
  type: 'file';
  name: string;
  path: string;
  depth: number;
  size: number;
  modifiedAt: Date;
  createdAt: Date;
}

interface DirectoryItem {
  type: 'directory';
  name: string;
  path: string;
  depth: number;
  children: FileTreeNode[];
  modifiedAt: Date;
  createdAt: Date;
}

type FileTreeNode = FileItem | DirectoryItem;

// Todo types
type Priority = 'P1' | 'P2' | 'P3' | 'P4';

interface TodoItem {
  type: 'todo';
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  category: string;
  dueDate: string | null;
  createdAt: string;
  depth: number;
}

interface CategoryItem {
  type: 'category';
  name: string;
  fullPath: string;
  depth: number;
  itemCount: number;
}

type TodoListItem = TodoItem | CategoryItem;

// UI types
type PanelType = 'preview' | 'status' | 'fileTree' | 'metadata';
type TabType = 'files' | 'todos';
type ModalType = 'create' | 'createDir' | 'rename' | 'delete' | 'createTodo' | ...;

interface VisualModeState {
  active: boolean;
  startIndex: number | null;
}
```

### Type Guards

```typescript
function isTodoItem(item: TodoListItem): item is TodoItem;
function isCategoryItem(item: TodoListItem): item is CategoryItem;
function isFileItem(node: FileTreeNode): node is FileItem;
function isDirectoryItem(node: FileTreeNode): node is DirectoryItem;
```

## State Management

### Split Context Architecture

The app uses 5 focused contexts instead of a monolithic context:

| Context | Responsibility |
|---------|---------------|
| `UIContext` | Panel focus, modals, tabs, command log |
| `SearchContext` | Search state, filtered lists |
| `SelectionContext` | Selection indices, scroll offsets, visual mode |
| `FileSystemContext` | File tree, CRUD operations |
| `TodoContext` | Todos, categories, batch operations |

Each context has:
- Typed state interface
- Typed actions interface
- `useCallback` memoized action creators
- Clean separation of concerns

### AppProviders & useApp

`AppProviders.tsx` wraps all contexts in the correct order and provides:

```typescript
// Combined provider for App root
<AppProviders notesDirectory={config.notesDirectory}>
  <AppContent />
</AppProviders>

// Combined hook with backward-compatible API
const { state, actions } = useApp();

// Or access individual contexts for fine-grained control
const { state: uiState, actions: uiActions } = useUIContext();
```

The `ContextCoordinator` component handles cross-context effects:
- Exit visual mode when switching panels/tabs
- Reset selection when search is confirmed
- Load preview content when file selection changes

## Custom Hooks

### Navigation Hooks

```typescript
// Generic keyboard navigation (j/k/g/G)
useKeyboardNavigation({
  listLength: number,
  selectedIndex: number,
  onMove: (delta: number) => void,
  onSelectFirst: () => void,
  onSelectLast: () => void,
  isActive: boolean,
});

// Auto-scroll viewport to keep selection visible
useScrollToSelected({
  selectedIndex: number,
  scrollOffset: number,
  maxHeight: number,
  setScrollOffset: (offset: number) => void,
});

// Visual mode selection helpers
useVisualSelection<T>({
  items: T[],
  selectedIndex: number,
  visualMode: VisualModeState,
}) => {
  isInVisualRange: (index: number) => boolean,
  getSelection: () => T[],
  toggleVisualMode: () => void,
};
```

### Data Hooks

```typescript
// Generic fuzzy filtering (eliminates duplicate fuzzysort logic)
useFilteredList<T>({
  items: T[],
  searchKey: keyof T,
  filter: string,
  threshold?: number,
  onFilterChange?: (filtered: T[] | null) => void,
}) => {
  displayList: T[],
  isFiltered: boolean,
  matchCount: number,
};
```

## Modal Registry

Centralized modal rendering in `ModalRegistry.tsx`:

```typescript
interface ModalRegistryProps {
  modal: ModalType;
  context: ModalContextData;
  handlers: ModalHandlers;
}

// Usage in App.tsx
<ModalRegistry
  modal={modal}
  context={modalContext}
  handlers={modalHandlers}
/>
```

Replaces 160+ lines of conditional modal rendering with a clean registry pattern.

## Performance Optimizations

| Optimization | Location | Purpose |
|--------------|----------|---------|
| `React.memo` | FileTreeItem, TodoItem, StatusPanel | Prevent unnecessary re-renders of list items |
| `useMemo` | useFilteredList, visible items, counts | Memoize expensive computations |
| `useCallback` | All context actions, visual selection | Stable function references |

## Key Features

### Visual Mode (Batch Operations)
- Press `v` to enter visual selection mode
- `j/k` extends selection range (highlighted in blue)
- Operations apply to all selected items:
  - Files: `d` batch delete
  - Todos: `x` toggle, `d` delete, `p` priority, `c` category, `u` due date
- Auto-exits when switching tabs or panels
- Escape cancels selection

### Hierarchical Categories
- Slash notation: `Work/Projects/Q1`
- Creating sub-category auto-creates parents
- Collapsing parent hides all children
- Deleting parent cascades to children (todos → Uncategorised)
- Helper functions in `todos.ts`:
  - `parseCategoryPath()`, `getParentPath()`, `getCategoryDepth()`
  - `isDescendantOf()`, `isCategoryVisible()`, `sortCategoriesHierarchically()`

### Search/Filter System
- Press `/` to start search (fuzzy matching via fuzzysort)
- Type query, Enter confirms filter
- Escape clears filter
- Files: searches file names
- Todos: searches todo text only (not categories)
- Implemented via `useFilteredList` hook

## Data Flow

1. **User Input** → Ink's `useInput` hook in panel components
2. **Action Dispatch** → Typed actions from context
3. **Reducer** → Updates state immutably
4. **Effects** → Side effects (file I/O, flat list rebuilding)
5. **Re-render** → React updates terminal output

## File Storage

### Notes
- Plain files in configurable directory (default: `~/notes`)
- Directory structure mirrors UI tree

### Todos
- Single file: `~/.config/lazynotes/todos.md`
- Markdown format:
```markdown
# Work
- [ ] P1: Urgent task @due:2024-12-25

# Work/Projects
- [ ] P2: Project task

# Uncategorised
- [ ] P4: Random task

# Completed
- [x] P3: Done task #Work
```

### Configuration Priority
1. CLI flags: `--dir` or `-d`
2. Environment: `LAZYNOTES_DIR`
3. Config files: `~/.lazynotesrc` or `~/.config/lazynotes/config.json`
4. Default: `~/notes`

## Keyboard Architecture

- **Global shortcuts** in `App.tsx` (quit, panel switching, search)
- **Panel-specific** in respective panel components
- **Modal shortcuts** in modal components
- Active only when: panel focused AND no modal open

### Key Patterns
| Key | Action |
|-----|--------|
| `j/k` or arrows | Navigation |
| `g/G` | Jump to first/last |
| `Enter/l` | Expand/select |
| `h` | Collapse/go back |
| `n/N` | Create new item |
| `d` | Delete |
| `v` | Visual mode |
| `/` | Fuzzy search |
| `q` | Quit |

---

## Adding New Features

### New Panel
1. Create component in `src/components/panels/`
2. Add to `Layout.tsx`
3. Add panel type to `PanelType` in `types/ui.ts`
4. Add keyboard hints to `StatusBar.tsx`

### New Modal
1. Create component in `src/components/modals/`
2. Add modal type to `ModalType` in `types/ui.ts`
3. Add case in `ModalRegistry.tsx`
4. Trigger with `actions.setModal('modalName')`

### New Hook
1. Create in appropriate `src/hooks/` subdirectory
2. Export from `src/hooks/index.ts`
3. Add TypeScript interfaces for options and return value

### New Type
1. Add to appropriate file in `src/types/`
2. Export from `src/types/index.ts`
3. Add type guard if discriminated union

## Styling

Terminal colors via Ink's `<Text>` props:
- `color="blue"` - Focus/primary
- `color="cyan"` - Directories/categories
- `color="green"` - Success/counts
- `color="red"` - Danger/errors/P1
- `color="yellow"` - Warning/P2
- `color="gray"` - Secondary/hints
- `dimColor` - Muted text
- `inverse` - Selection highlighting
- `bold` - Emphasis

## Future Improvements

- [x] ~~Migrate `AppContext.jsx` to TypeScript and integrate with split contexts~~ (Done - deleted legacy file, using `AppProviders.tsx`)
- [ ] Add unit tests for utility functions and hooks
- [ ] Implement context selectors (`use-context-selector`) if re-renders become problematic
- [ ] Add error boundaries for graceful failure handling
