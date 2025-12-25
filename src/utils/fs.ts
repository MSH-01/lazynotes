import fs from 'fs';
import path from 'path';
import os from 'os';
import type { FileTreeNode, FileStats } from '../types';

/**
 * Resolve a path, expanding ~ to home directory
 */
export function resolvePath(p: string | null | undefined): string {
  if (!p) return '';
  if (p.startsWith('~')) {
    return path.join(os.homedir(), p.slice(1));
  }
  return path.resolve(p);
}

/**
 * Read a directory and return its contents as a tree structure
 */
export function readDirectoryTree(dirPath: string, depth: number = 0): FileTreeNode[] {
  const items: FileTreeNode[] = [];

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      // Skip hidden files
      if (entry.name.startsWith('.')) continue;

      const fullPath = path.join(dirPath, entry.name);
      const stats = fs.statSync(fullPath);

      if (entry.isDirectory()) {
        items.push({
          name: entry.name,
          path: fullPath,
          type: 'directory',
          depth,
          size: null,
          modifiedAt: stats.mtime,
          createdAt: stats.birthtime,
          children: [],
          isExpanded: false,
        });
      } else {
        items.push({
          name: entry.name,
          path: fullPath,
          type: 'file',
          depth,
          size: stats.size,
          modifiedAt: stats.mtime,
          createdAt: stats.birthtime,
        });
      }
    }

    // Sort: directories first, then alphabetically
    items.sort((a, b) => {
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error reading directory ${dirPath}:`, message);
  }

  return items;
}

/**
 * Load children of a directory (alias for readDirectoryTree)
 */
export function loadDirectoryChildren(dirPath: string, depth: number): FileTreeNode[] {
  return readDirectoryTree(dirPath, depth);
}

/**
 * Create an empty file
 */
export function createFile(dirPath: string, name: string): string {
  const fullPath = path.join(dirPath, name);
  fs.writeFileSync(fullPath, '', 'utf8');
  return fullPath;
}

/**
 * Create a directory
 */
export function createDirectory(dirPath: string, name: string): string {
  const fullPath = path.join(dirPath, name);
  fs.mkdirSync(fullPath);
  return fullPath;
}

/**
 * Rename a file or directory
 */
export function renameItem(oldPath: string, newName: string): string {
  const dir = path.dirname(oldPath);
  const newPath = path.join(dir, newName);
  fs.renameSync(oldPath, newPath);
  return newPath;
}

/**
 * Delete a file or directory (recursively for directories)
 */
export function deleteItem(itemPath: string): void {
  const stats = fs.statSync(itemPath);
  if (stats.isDirectory()) {
    fs.rmSync(itemPath, { recursive: true });
  } else {
    fs.unlinkSync(itemPath);
  }
}

/**
 * Read file content with optional size limit
 */
export function readFileContent(filePath: string, maxSize: number = 1024 * 1024): string {
  try {
    const stats = fs.statSync(filePath);
    if (stats.size > maxSize) {
      const content = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });
      return content.slice(0, maxSize) + '\n\n[File truncated - too large to display]';
    }
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return `[Error reading file: ${message}]`;
  }
}

/**
 * Check if a file exists
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Check if a path is a directory
 */
export function isDirectory(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Write content to a file
 */
export function writeFileContent(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content, 'utf8');
}

/**
 * Get file stats (size, dates)
 */
export function getFileStats(filePath: string): FileStats | null {
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
