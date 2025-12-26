import React, { useState } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import { TextInput } from "@inkjs/ui";

interface InputModalProps {
  title: string;
  placeholder: string;
  initialValue?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export function InputModal({
  title,
  placeholder,
  initialValue = "",
  onSubmit,
  onCancel,
}: InputModalProps): React.ReactElement {
  const [value, setValue] = useState(initialValue);
  const { stdout } = useStdout();
  const terminalHeight = stdout?.rows || 24;
  const terminalWidth = stdout?.columns || 80;

  const modalWidth = Math.floor(terminalWidth / 2);

  // Fill modal with spaces to obscure content behind
  const spaceFill = Array(3)
    .fill(" ".repeat(modalWidth - 2)) // -2 for borders
    .join("\n");

  useInput((_input, key) => {
    if (key.escape) {
      onCancel();
    }
  });

  const handleSubmit = (): void => {
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
        borderStyle="round"
        borderColor="blue"
        width={modalWidth}
      >
        {/* Space fill to obscure content behind */}
        <Box position="absolute" width={modalWidth - 2} height={3}>
          <Text>{spaceFill}</Text>
        </Box>
        {/* Title embedded in border */}
        <Box paddingX={1} marginTop={-1} marginLeft={0} position="absolute">
          <Text bold color="blue">
            {title}
          </Text>
        </Box>
        <Box>
          <TextInput
            placeholder={placeholder}
            // @ts-expect-error - TextInput supports value prop at runtime but types are incomplete
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
