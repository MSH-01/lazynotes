import React from 'react';
import { Box, Text, useInput } from 'ink';

export function ConfirmModal({ title, message, onConfirm, onCancel }) {
  useInput((input, key) => {
    if (input === 'y' || input === 'Y') {
      onConfirm();
    } else if (input === 'n' || input === 'N' || key.escape) {
      onCancel();
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="red"
      paddingX={2}
      paddingY={1}
      position="absolute"
      marginLeft={10}
      marginTop={5}
    >
      <Text bold color="red">{title}</Text>
      <Box marginTop={1}>
        <Text>{message}</Text>
      </Box>
      <Box marginTop={1}>
        <Text color="gray">y: confirm, n: cancel</Text>
      </Box>
    </Box>
  );
}
