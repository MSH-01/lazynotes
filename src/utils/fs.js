import fs from 'fs';
import path from 'path';
import os from 'os';

export function resolvePath(p) {
  if (!p) return p;
  if (p.startsWith('~')) {
    return path.join(os.homedir(), p.slice(1));
  }
  return path.resolve(p);
}

export function readDirectoryTree(dirPath, depth = 0) {
  const items = [];

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      // Skip hidden files
      if (entry.name.startsWith('.')) continue;

      const fullPath = path.join(dirPath, entry.name);
      const stats = fs.statSync(fullPath);

      const node = {
        name: entry.name,
        path: fullPath,
        type: entry.isDirectory() ? 'directory' : 'file',
        depth,
        size: entry.isFile() ? stats.size : null,
        modifiedAt: stats.mtime,
        createdAt: stats.birthtime,
      };

      if (entry.isDirectory()) {
        node.children = [];
        node.isExpanded = false;
      }

      items.push(node);
    }

    // Sort: directories first, then alphabetically
    items.sort((a, b) => {
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });
  } catch (err) {
    console.error(`Error reading directory ${dirPath}:`, err.message);
  }

  return items;
}

export function loadDirectoryChildren(dirPath, depth) {
  return readDirectoryTree(dirPath, depth);
}

export function createFile(dirPath, name) {
  const fullPath = path.join(dirPath, name);
  fs.writeFileSync(fullPath, '', 'utf8');
  return fullPath;
}

export function createDirectory(dirPath, name) {
  const fullPath = path.join(dirPath, name);
  fs.mkdirSync(fullPath);
  return fullPath;
}

export function renameItem(oldPath, newName) {
  const dir = path.dirname(oldPath);
  const newPath = path.join(dir, newName);
  fs.renameSync(oldPath, newPath);
  return newPath;
}

export function deleteItem(itemPath) {
  const stats = fs.statSync(itemPath);
  if (stats.isDirectory()) {
    fs.rmSync(itemPath, { recursive: true });
  } else {
    fs.unlinkSync(itemPath);
  }
}

export function readFileContent(filePath, maxSize = 1024 * 1024) {
  try {
    const stats = fs.statSync(filePath);
    if (stats.size > maxSize) {
      const content = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });
      return content.slice(0, maxSize) + '\n\n[File truncated - too large to display]';
    }
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return `[Error reading file: ${err.message}]`;
  }
}

export function fileExists(filePath) {
  return fs.existsSync(filePath);
}

export function isDirectory(filePath) {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}

export function writeFileContent(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

export function getFileStats(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      modifiedAt: stats.mtime,
      createdAt: stats.birthtime,
    };
  } catch {
    return null;
  }
}
