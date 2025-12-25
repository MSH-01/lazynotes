import React from 'react';
import { Box, useStdout } from 'ink';
import { FileTreePanel } from './panels/FileTreePanel.jsx';
import { MetadataPanel } from './panels/MetadataPanel.jsx';
import { PreviewPanel } from './panels/PreviewPanel.jsx';
import { StatusBar } from './common/StatusBar.jsx';

export function Layout() {
  const { stdout } = useStdout();
  const terminalHeight = stdout?.rows || 24;
  const contentHeight = terminalHeight - 2;
  const fileTreeHeight = Math.floor(contentHeight * 0.7) - 8;
  const previewHeight = contentHeight - 2;

  return (
    <Box flexDirection="column" height={terminalHeight}>
      <Box flexDirection="row" flexGrow={1}>
        {/* Left panel: 1/3 width, split into FileTree and Metadata */}
        <Box flexDirection="column" width="33%">
          <FileTreePanel maxHeight={fileTreeHeight} />
          <MetadataPanel />
        </Box>

        {/* Right panel: 2/3 width, Preview */}
        <Box flexDirection="column" width="67%">
          <PreviewPanel maxHeight={previewHeight} />
        </Box>
      </Box>

      <StatusBar />
    </Box>
  );
}
