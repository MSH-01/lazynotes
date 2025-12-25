import React, { useState } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import { TextInput } from '@inkjs/ui';

export function InputModal({ title, placeholder, initialValue = '', onSubmit, onCancel }) {
  const [value, setValue] = useState(initialValue);
  const { stdout } = useStdout();
  const terminalHeight = stdout?.rows || 24;
  const terminalWidth = stdout?.columns || 80;

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
    }
  });

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
    }
  };

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
        borderStyle="double"
        borderColor="blue"
        paddingX={2}
        paddingY={1}
        minWidth={40}
      >
        <Text bold color="blue">{title}</Text>
        <Box marginTop={1}>
          <TextInput
            placeholder={placeholder}
            value={value}
            onChange={setValue}
            onSubmit={handleSubmit}
          />
        </Box>
        <Box marginTop={1}>
          <Text color="gray">Enter to confirm, Escape to cancel</Text>
        </Box>
      </Box>
    </Box>
  );
}
