import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.config', 'lazynotes');
const TODOS_FILE = path.join(CONFIG_DIR, 'todos.md');

// Regex to parse todo lines: - [ ] P1: Task text @due:2024-01-15 #category
const TODO_REGEX = /^-\s*\[([ xX])\]\s*(P[1-4]):\s*(.+?)(?:\s*@due:(\d{4}-\d{2}-\d{2}))?(?:\s*#(\S+))?$/;

export function getTodosFilePath() {
  return TODOS_FILE;
}

export function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  return CONFIG_DIR;
}

export function generateTodoId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export function parseTodoLine(line) {
  const match = line.match(TODO_REGEX);
  if (!match) return null;

  const [, checkbox, priority, text, dueDate, category] = match;
  return {
    id: generateTodoId(),
    text: text.trim(),
    completed: checkbox.toLowerCase() === 'x',
    priority,
    dueDate: dueDate || null,
    category: category || '',
    createdAt: new Date().toISOString(),
  };
}

export function serializeTodoLine(todo, includeCategory = false) {
  const checkbox = todo.completed ? 'x' : ' ';
  const dueStr = todo.dueDate ? ` @due:${todo.dueDate}` : '';
  // Include category tag for completed items so we remember where they came from
  const catStr = includeCategory && todo.category ? ` #${todo.category}` : '';
  return `- [${checkbox}] ${todo.priority}: ${todo.text}${dueStr}${catStr}`;
}

export function parseTodosFile(content) {
  const categories = [];
  const items = [];
  let currentCategory = '';

  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Category header: # CategoryName or # Category/SubCategory
    if (trimmed.startsWith('# ')) {
      const categoryName = trimmed.slice(2).trim();
      // Don't add special categories to user categories list
      if (categoryName !== 'Uncategorised' && categoryName !== 'Completed') {
        // Auto-create parent categories if they don't exist
        const segments = parseCategoryPath(categoryName);
        for (let i = 1; i <= segments.length; i++) {
          const path = segments.slice(0, i).join('/');
          if (!categories.includes(path)) {
            categories.push(path);
          }
        }
      }
      currentCategory = categoryName;
      continue;
    }

    // Todo item
    if (trimmed.startsWith('- [')) {
      const todo = parseTodoLine(trimmed);
      if (todo) {
        // Determine category based on section
        if (currentCategory === 'Completed') {
          todo.completed = true;
          // Category is already parsed from the #tag in the line
          // Keep todo.category as-is from parseTodoLine
        } else if (currentCategory === 'Uncategorised') {
          todo.category = '';
        } else {
          todo.category = currentCategory;
        }
        items.push(todo);
      }
    }
  }

  return { categories, items };
}

export function serializeTodos(categories, items) {
  const lines = [];

  // Group items by category
  const byCategory = new Map();
  byCategory.set('', []); // Uncategorised

  for (const cat of categories) {
    byCategory.set(cat, []);
  }

  const completedItems = [];

  for (const item of items) {
    if (item.completed) {
      completedItems.push(item);
    } else {
      const cat = item.category || '';
      if (!byCategory.has(cat)) {
        byCategory.set(cat, []);
      }
      byCategory.get(cat).push(item);
    }
  }

  // Write categories (sorted hierarchically - parents before children)
  const sortedCategories = sortCategoriesHierarchically(categories);

  for (const cat of sortedCategories) {
    const catItems = byCategory.get(cat) || [];
    lines.push(`# ${cat}`);
    for (const item of catItems) {
      lines.push(serializeTodoLine(item));
    }
    lines.push('');
  }

  // Write Uncategorised
  const uncategorised = byCategory.get('') || [];
  lines.push('# Uncategorised');
  for (const item of uncategorised) {
    lines.push(serializeTodoLine(item));
  }
  lines.push('');

  // Write Completed (include category tag to preserve original category)
  lines.push('# Completed');
  for (const item of completedItems) {
    lines.push(serializeTodoLine(item, true));
  }
  lines.push('');

  return lines.join('\n');
}

export function loadTodos() {
  ensureConfigDir();

  if (!fs.existsSync(TODOS_FILE)) {
    // Return empty state if file doesn't exist
    return { categories: [], items: [] };
  }

  try {
    const content = fs.readFileSync(TODOS_FILE, 'utf8');
    return parseTodosFile(content);
  } catch (err) {
    console.error('Error loading todos:', err.message);
    return { categories: [], items: [] };
  }
}

export function saveTodos(categories, items) {
  ensureConfigDir();

  try {
    const content = serializeTodos(categories, items);
    fs.writeFileSync(TODOS_FILE, content, 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving todos:', err.message);
    return false;
  }
}

export function isOverdue(dueDate) {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  return due < today;
}

export function isDueSoon(dueDate, days = 3) {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= days;
}

// === Hierarchical Category Helpers ===

/**
 * Parse a category path into segments
 * "Work/Projects/Q1" => ["Work", "Projects", "Q1"]
 */
export function parseCategoryPath(categoryPath) {
  if (!categoryPath) return [];
  return categoryPath.split('/').filter(Boolean);
}

/**
 * Get the parent path of a category
 * "Work/Projects/Q1" => "Work/Projects"
 * "Work" => ""
 */
export function getParentPath(categoryPath) {
  const segments = parseCategoryPath(categoryPath);
  if (segments.length <= 1) return '';
  return segments.slice(0, -1).join('/');
}

/**
 * Get the display name (last segment) of a category
 * "Work/Projects/Q1" => "Q1"
 */
export function getCategoryDisplayName(categoryPath) {
  const segments = parseCategoryPath(categoryPath);
  return segments[segments.length - 1] || categoryPath;
}

/**
 * Get the depth of a category (0-indexed)
 * "Work" => 0, "Work/Projects" => 1, "Work/Projects/Q1" => 2
 */
export function getCategoryDepth(categoryPath) {
  const segments = parseCategoryPath(categoryPath);
  return Math.max(0, segments.length - 1);
}

/**
 * Check if a category path is a descendant of another
 * isDescendantOf("Work/Projects", "Work") => true
 */
export function isDescendantOf(childPath, parentPath) {
  if (!parentPath || !childPath) return false;
  return childPath.startsWith(parentPath + '/');
}

/**
 * Check if a category is visible given expanded categories
 * A category is visible if all its ancestors are expanded
 */
export function isCategoryVisible(categoryPath, expandedCategories) {
  const segments = parseCategoryPath(categoryPath);
  // Root categories are always visible
  if (segments.length <= 1) return true;

  // Check each ancestor
  for (let i = 1; i < segments.length; i++) {
    const ancestorPath = segments.slice(0, i).join('/');
    if (!expandedCategories.has(ancestorPath)) {
      return false;
    }
  }
  return true;
}

/**
 * Build a sorted, hierarchical list of category paths
 * Ensures parent categories come before their children
 */
export function sortCategoriesHierarchically(categories) {
  return [...categories].sort((a, b) => {
    const segmentsA = parseCategoryPath(a);
    const segmentsB = parseCategoryPath(b);

    // Compare segment by segment
    const minLen = Math.min(segmentsA.length, segmentsB.length);
    for (let i = 0; i < minLen; i++) {
      const cmp = segmentsA[i].localeCompare(segmentsB[i]);
      if (cmp !== 0) return cmp;
    }

    // Shorter path comes first (parent before child)
    return segmentsA.length - segmentsB.length;
  });
}

export function buildTodoFlatList(categories, items, expandedCategories) {
  const result = [];

  // Group items by category
  const byCategory = new Map();
  byCategory.set('Uncategorised', []);
  byCategory.set('Completed', []);

  for (const cat of categories) {
    byCategory.set(cat, []);
  }

  for (const item of items) {
    if (item.completed) {
      byCategory.get('Completed').push(item);
    } else {
      const cat = item.category || 'Uncategorised';
      if (!byCategory.has(cat)) {
        byCategory.set(cat, []);
      }
      byCategory.get(cat).push(item);
    }
  }

  // Sort user categories hierarchically (parents before children)
  const sortedUserCategories = sortCategoriesHierarchically(categories);

  // Helper to sort todos by priority then due date
  const sortTodos = (todos) => [...todos].sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority.localeCompare(b.priority);
    }
    if (a.dueDate && b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate);
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  // Build flat list for user categories (hierarchical)
  for (const fullPath of sortedUserCategories) {
    // Check if this category is visible (all ancestors expanded)
    if (!isCategoryVisible(fullPath, expandedCategories)) {
      continue;
    }

    const depth = getCategoryDepth(fullPath);
    const displayName = getCategoryDisplayName(fullPath);
    const catItems = byCategory.get(fullPath) || [];

    result.push({
      type: 'category',
      name: displayName,
      fullPath: fullPath,
      depth: depth,
      itemCount: catItems.length,
    });

    // Only show todos if this category is expanded
    if (expandedCategories.has(fullPath)) {
      const sorted = sortTodos(catItems);
      for (const item of sorted) {
        result.push({ type: 'todo', ...item, depth: depth + 1 });
      }
    }
  }

  // Add Uncategorised (always at depth 0)
  const uncategorised = byCategory.get('Uncategorised') || [];
  result.push({
    type: 'category',
    name: 'Uncategorised',
    fullPath: 'Uncategorised',
    depth: 0,
    itemCount: uncategorised.length,
  });

  if (expandedCategories.has('Uncategorised')) {
    const sorted = sortTodos(uncategorised);
    for (const item of sorted) {
      result.push({ type: 'todo', ...item, depth: 1 });
    }
  }

  // Add Completed (always at depth 0)
  const completed = byCategory.get('Completed') || [];
  result.push({
    type: 'category',
    name: 'Completed',
    fullPath: 'Completed',
    depth: 0,
    itemCount: completed.length,
  });

  if (expandedCategories.has('Completed')) {
    const sorted = sortTodos(completed);
    for (const item of sorted) {
      result.push({ type: 'todo', ...item, depth: 1 });
    }
  }

  return result;
}
