import { useState, useEffect } from 'react';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { resolvePath, fileExists, isDirectory } from '../utils/fs.js';

const DEFAULT_CONFIG = {
  notesDirectory: path.join(os.homedir(), 'notes'),
};

const CONFIG_PATHS = [
  path.join(os.homedir(), '.lazynotesrc'),
  path.join(os.homedir(), '.config', 'lazynotes', 'config.json'),
];

export function useConfig(cliFlags = {}) {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      let finalConfig = { ...DEFAULT_CONFIG };

      // 1. Check CLI flags first (highest priority)
      if (cliFlags.dir) {
        finalConfig.notesDirectory = resolvePath(cliFlags.dir);
        setConfig(finalConfig);
        setIsLoading(false);
        return;
      }

      // 2. Check environment variable
      if (process.env.LAZYNOTES_DIR) {
        finalConfig.notesDirectory = resolvePath(process.env.LAZYNOTES_DIR);
        setConfig(finalConfig);
        setIsLoading(false);
        return;
      }

      // 3. Check config files
      for (const configPath of CONFIG_PATHS) {
        if (fileExists(configPath)) {
          try {
            const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (fileConfig.notesDirectory) {
              finalConfig.notesDirectory = resolvePath(fileConfig.notesDirectory);
            }
            setConfig(finalConfig);
            setIsLoading(false);
            return;
          } catch (e) {
            setError(`Invalid config at ${configPath}: ${e.message}`);
          }
        }
      }

      // 4. Use default
      setConfig(finalConfig);
      setIsLoading(false);

    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  }, [cliFlags.dir]);

  // Ensure notes directory exists
  useEffect(() => {
    if (config && config.notesDirectory) {
      if (!fileExists(config.notesDirectory)) {
        try {
          fs.mkdirSync(config.notesDirectory, { recursive: true });
        } catch (err) {
          setError(`Could not create notes directory: ${err.message}`);
        }
      } else if (!isDirectory(config.notesDirectory)) {
        setError(`Notes path exists but is not a directory: ${config.notesDirectory}`);
      }
    }
  }, [config]);

  return { config, error, isLoading };
}
