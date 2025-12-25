import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { TextInput } from '@inkjs/ui';

export function InputModal({ title, placeholder, initialValue = '', onSubmit, onCancel }) {
  const [value, setValue] = useState(initialValue);

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
      flexDirection="column"
      borderStyle="double"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
      position="absolute"
      marginLeft={10}
      marginTop={5}
    >
      <Text bold color="cyan">{title}</Text>
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
  );
}
