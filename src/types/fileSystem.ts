/**
 * File system related types
 */

import type { WithDepth } from './common';

/** Base properties for file system items */
interface FileSystemNodeBase extends WithDepth {
  name: string;
  path: string;
  modifiedAt: Date;
  createdAt: Date;
}

/** File node in the file tree */
export interface FileItem extends FileSystemNodeBase {
  type: 'file';
  size: number;
}

/** Directory node in the file tree */
export interface DirectoryItem extends FileSystemNodeBase {
  type: 'directory';
  size: null;
  children: FileTreeNode[];
  isExpanded?: boolean;
}

/** Union type for file tree nodes */
export type FileTreeNode = FileItem | DirectoryItem;

/** Type guard for file items */
export function isFileItem(node: FileTreeNode): node is FileItem {
  return node.type === 'file';
}

/** Type guard for directory items */
export function isDirectoryItem(node: FileTreeNode): node is DirectoryItem {
  return node.type === 'directory';
}

/** File stats returned from file system operations */
export interface FileStats {
  size: number;
  modifiedAt: Date;
  createdAt: Date;
}
