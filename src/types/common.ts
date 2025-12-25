/**
 * Common types shared across the application
 */

/** Entry in the command log */
export interface CommandLogEntry {
  message: string;
  timestamp: Date;
}

/** Visual mode state for batch operations */
export interface VisualModeState {
  active: boolean;
  startIndex: number | null;
}

/** Configuration loaded from file or CLI */
export interface AppConfig {
  notesDirectory: string;
}

/** Generic list item with depth for rendering hierarchies */
export interface WithDepth {
  depth: number;
}

/** Item that can be selected in a list */
export interface Selectable {
  path?: string;
  id?: string;
}
