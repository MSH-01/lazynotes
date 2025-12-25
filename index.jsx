#!/usr/bin/env npx tsx
import React from "react";
import { render } from "ink";
import { App } from "./src/App.jsx";

// Enter alternate screen buffer (like lazygit, vim, etc.)
const enterAltScreen = () => {
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
const { unmount, waitUntilExit } = render(<App />);

// Wait for app to exit, then cleanup
waitUntilExit().then(() => {
  cleanup();
});
