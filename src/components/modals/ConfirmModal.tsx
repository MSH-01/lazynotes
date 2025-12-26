import React from 'react';
import { Box, Text, useInput, useStdout } from 'ink';

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmModalProps): React.ReactElement {
  const { stdout } = useStdout();
  const terminalHeight = stdout?.rows || 24;
  const terminalWidth = stdout?.columns || 80;

  const modalWidth = Math.floor(terminalWidth / 2);

  // Fill modal with spaces to obscure content behind
  const spaceFill = Array(3)
    .fill(" ".repeat(modalWidth - 2))
    .join("\n");

  useInput((input, key) => {
    if (input === 'y' || input === 'Y') {
      onConfirm();
    } else if (input === 'n' || input === 'N' || key.escape) {
      onCancel();
    }
  });

  return (
    <Box
      position="absolute"
      width={terminalWidth}
      height={terminalHeight}
      justifyContent="center"
      alignItems="center"
    >
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="red"
        width={modalWidth}
      >
        {/* Space fill to obscure content behind */}
        <Box position="absolute" width={modalWidth - 2} height={3}>
          <Text>{spaceFill}</Text>
        </Box>
        <Box paddingX={1} marginTop={-1} marginLeft={0} position="absolute">
          <Text bold color="red">
            {title}
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text>{message}</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="gray">y: confirm, n: cancel</Text>
        </Box>
      </Box>
    </Box>
  );
}
