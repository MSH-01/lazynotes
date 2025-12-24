#!/usr/bin/env npx tsx
import React from "react";
import { render, Text, Box } from "ink";

const App = () => {
  return (
    <Box borderColor={"blackBright"} borderStyle={"single"} height={20} borderBottom borderTop>
      <Text>This is a box with margin</Text>
    </Box>
  );
};

render(<App />);
