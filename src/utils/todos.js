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

    // Category header: # CategoryName
    if (trimmed.startsWith('# ')) {
      const categoryName = trimmed.slice(2).trim();
      // Don't add special categories to user categories list
      if (categoryName !== 'Uncategorised' && categoryName !== 'Completed') {
        if (!categories.includes(categoryName)) {
          categories.push(categoryName);
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

  // Write categories (sorted) first
  const sortedCategories = [...categories].sort();

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

  // Build flat list - user categories first (sorted), then Uncategorised, then Completed
  const sortedUserCategories = [...categories].sort();
  const orderedCategories = [...sortedUserCategories, 'Uncategorised', 'Completed'];

  for (const cat of orderedCategories) {
    const catItems = byCategory.get(cat) || [];

    result.push({
      type: 'category',
      name: cat,
      depth: 0,
      itemCount: catItems.length,
    });

    if (expandedCategories.has(cat)) {
      // Sort todos: by priority first, then by due date
      const sorted = [...catItems].sort((a, b) => {
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

      for (const item of sorted) {
        result.push({ type: 'todo', ...item, depth: 1 });
      }
    }
  }

  return result;
}
