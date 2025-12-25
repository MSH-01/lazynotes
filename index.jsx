#!/usr/bin/env npx tsx
import React from "react";
import { render } from "ink";
import { spawnSync } from "child_process";
import { App } from "./src/App.jsx";

// Enter alternate screen buffer (like lazygit, vim, etc.)
const enterAltScreen = () => {
  // process.stdout.write('\x1b]0;lazynotes\x07'); // Set terminal title
  process.stdout.write('\x1b[?1049h'); // Enter alternate screen
  process.stdout.write('\x1b[?25l');   // Hide cursor
  process.stdout.write('\x1b[2J');     // Clear screen
  process.stdout.write('\x1b[H');      // Move cursor to top-left
};

// Exit alternate screen buffer and restore terminal
const exitAltScreen = () => {
  process.stdout.write('\x1b[?25h');   // Show cursor
  process.stdout.write('\x1b[?1049l'); // Exit alternate screen
};

// Open file in external editor
const openEditor = (filePath) => {
  // Exit alternate screen to give editor full control
  exitAltScreen();

  // Use $EDITOR env var, fall back to vim
  const editor = process.env.EDITOR || 'vim';

  // Spawn editor synchronously - blocks until editor closes
  spawnSync(editor, [filePath], { stdio: 'inherit' });

  // Re-enter alternate screen
  enterAltScreen();
};

// Enter fullscreen immediately
enterAltScreen();

// Handle cleanup on exit
const cleanup = () => {
  exitAltScreen();
};

process.on('exit', cleanup);
process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});
process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});

// Render the app
const { unmount, waitUntilExit } = render(<App onOpenEditor={openEditor} />);

// Wait for app to exit, then cleanup
waitUntilExit().then(() => {
  cleanup();
});
