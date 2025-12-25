import React from 'react';
import { Box, useStdout } from 'ink';
import { StatusPanel } from './panels/StatusPanel.jsx';
import { FileTreePanel } from './panels/FileTreePanel.jsx';
import { MetadataPanel } from './panels/MetadataPanel.jsx';
import { PreviewPanel } from './panels/PreviewPanel.jsx';
import { CommandLogPanel } from './panels/CommandLogPanel.jsx';
import { StatusBar } from './common/StatusBar.jsx';

export function Layout({ onOpenEditor }) {
  const { stdout } = useStdout();
  const terminalHeight = stdout?.rows || 24;
  const terminalWidth = stdout?.columns || 80;

  // Calculate heights
  const statusBarHeight = 2;
  const commandLogHeight = 6;
  const contentHeight = terminalHeight - statusBarHeight;
  const rightPanelPreviewHeight = contentHeight - commandLogHeight;
  const leftPanelFileTreeHeight = Math.floor(contentHeight * 0.55);

  return (
    <Box flexDirection="column" height={terminalHeight} width={terminalWidth}>
      <Box flexDirection="row" flexGrow={1}>
        {/* Left panel: 1/3 width, split into Status, FileTree, and Metadata */}
        <Box flexDirection="column" width="33%">
          <StatusPanel />
          <FileTreePanel maxHeight={leftPanelFileTreeHeight - 12} onOpenEditor={onOpenEditor} />
          <MetadataPanel />
        </Box>

        {/* Right panel: 2/3 width, Preview + Command Log */}
        <Box flexDirection="column" width="67%">
          <PreviewPanel maxHeight={rightPanelPreviewHeight - 4} onOpenEditor={onOpenEditor} />
          <CommandLogPanel maxHeight={4} />
        </Box>
      </Box>

      <StatusBar />
    </Box>
  );
}
