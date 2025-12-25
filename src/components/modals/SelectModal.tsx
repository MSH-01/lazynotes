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
        borderStyle="double"
        borderColor="blue"
        paddingX={2}
        paddingY={1}
        minWidth={40}
      >
        <Text bold color="blue">
          {title}
        </Text>
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
