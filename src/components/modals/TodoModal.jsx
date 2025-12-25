import React, { useState } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import { TextInput } from '@inkjs/ui';

export function TodoModal({ title, initialText = '', categories = [], defaultCategory = '', onSubmit, onCancel }) {
  const [text, setText] = useState(initialText);
  const { stdout } = useStdout();
  const terminalHeight = stdout?.rows || 24;
  const terminalWidth = stdout?.columns || 80;

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
    }
  });

  const handleSubmit = () => {
    if (!text.trim()) return;

    // Parse inline syntax: P2: Task text @due:2024-01-20 #category
    let todoText = text.trim();
    let priority = 'P4';
    let dueDate = null;
    let category = '';

    // Extract priority (P1:, P2:, P3:, P4: at the start)
    const priorityMatch = todoText.match(/^(P[1-4]):\s*/i);
    if (priorityMatch) {
      priority = priorityMatch[1].toUpperCase();
      todoText = todoText.slice(priorityMatch[0].length);
    }

    // Extract due date (@due:YYYY-MM-DD or @YYYY-MM-DD)
    const dueDateMatch = todoText.match(/\s*@(?:due:)?(\d{4}-\d{2}-\d{2})\s*/);
    if (dueDateMatch) {
      dueDate = dueDateMatch[1];
      todoText = todoText.replace(dueDateMatch[0], ' ').trim();
    }

    // Extract category (#category)
    const categoryMatch = todoText.match(/\s*#(\S+)\s*/);
    if (categoryMatch) {
      const catName = categoryMatch[1];
      // Check if it's an existing category (case-insensitive match)
      const existingCat = categories.find(
        (c) => c.toLowerCase() === catName.toLowerCase()
      );
      category = existingCat || catName;
      todoText = todoText.replace(categoryMatch[0], ' ').trim();
    } else {
      // Use default category if none specified
      category = defaultCategory;
    }

    onSubmit({
      text: todoText,
      priority,
      dueDate,
      category,
    });
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
        minWidth={50}
      >
        <Text bold color="blue">{title}</Text>
        <Box marginTop={1}>
          <TextInput
            placeholder="P2: Task text @due:2024-12-31 #category"
            value={text}
            onChange={setText}
            onSubmit={handleSubmit}
          />
        </Box>
        <Box marginTop={1} flexDirection="column">
          <Text color="gray">Format: [P1-4:] text [@due:YYYY-MM-DD] [#category]</Text>
          <Text color="gray">Enter to confirm, Escape to cancel</Text>
        </Box>
      </Box>
    </Box>
  );
}
