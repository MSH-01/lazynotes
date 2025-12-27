#!/usr/bin/env npx tsx
import React from 'react';
import { withFullScreen } from 'fullscreen-ink';
import { spawnSync } from 'child_process';
import { App } from './src/App';

// Enter alternate screen buffer (for editor)
const enterAltScreen = (): void => {
  process.stdout.write('\x1b[?1049h');
  process.stdout.write('\x1b[?25l');
  process.stdout.write('\x1b[2J');
  process.stdout.write('\x1b[H');
};

// Exit alternate screen buffer
const exitAltScreen = (): void => {
  process.stdout.write('\x1b[?25h');
  process.stdout.write('\x1b[?1049l');
};

// Open file in external editor
const openEditor = (filePath: string): void => {
  // Exit alternate screen to give editor full control
  exitAltScreen();

  // Use $EDITOR env var, fall back to vim
  const editor = process.env.EDITOR || 'vim';

  // Spawn editor synchronously - blocks until editor closes
  spawnSync(editor, [filePath], { stdio: 'inherit' });

  // Re-enter alternate screen
  enterAltScreen();
};

// Render the app with fullscreen-ink
withFullScreen(<App onOpenEditor={openEditor} />).start();
