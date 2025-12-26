import React, { useState } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';

interface SelectModalProps {
  title: string;
  options: string[];
  onSelect: (option: string) => void;
  onCancel: () => void;
}

export function SelectModal({
  title,
  options,
  onSelect,
  onCancel,
}: SelectModalProps): React.ReactElement {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { stdout } = useStdout();
  const terminalHeight = stdout?.rows || 24;
  const terminalWidth = stdout?.columns || 80;

  const modalWidth = Math.floor(terminalWidth / 2);
  const contentHeight = options.length + 2; // options + help text

  // Fill modal with spaces to obscure content behind
  const spaceFill = Array(contentHeight)
    .fill(" ".repeat(modalWidth - 2))
    .join("\n");

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }

    if (input === 'j' || key.downArrow) {
      setSelectedIndex((prev) => Math.min(prev + 1, options.length - 1));
    } else if (input === 'k' || key.upArrow) {
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (key.return) {
      onSelect(options[selectedIndex]);
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
        borderColor="blue"
        width={modalWidth}
      >
        {/* Space fill to obscure content behind */}
        <Box position="absolute" width={modalWidth - 2} height={contentHeight}>
          <Text>{spaceFill}</Text>
        </Box>
        <Box paddingX={1} marginTop={-1} marginLeft={0} position="absolute">
          <Text bold color="blue">
            {title}
          </Text>
        </Box>
        <Box marginTop={1} flexDirection="column">
          {options.map((option, index) => (
            <Text key={option} inverse={index === selectedIndex} bold={index === selectedIndex}>
              {index === selectedIndex ? '> ' : '  '}
              {option}
            </Text>
          ))}
        </Box>
        <Box marginTop={1}>
          <Text color="gray">j/k: navigate, Enter: select, Escape: cancel</Text>
        </Box>
      </Box>
    </Box>
  );
}
