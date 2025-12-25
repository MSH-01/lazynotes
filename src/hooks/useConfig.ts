import { useState, useEffect } from 'react';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { resolvePath, fileExists, isDirectory } from '../utils/fs';
import type { AppConfig } from '../types';

/** CLI flags that can override config */
interface CLIFlags {
  dir?: string;
}

/** Return value of useConfig hook */
interface UseConfigResult {
  config: AppConfig | null;
  error: string | null;
  isLoading: boolean;
}

const DEFAULT_CONFIG: AppConfig = {
  notesDirectory: path.join(os.homedir(), 'notes'),
};

const CONFIG_PATHS = [
  path.join(os.homedir(), '.lazynotesrc'),
  path.join(os.homedir(), '.config', 'lazynotes', 'config.json'),
];

/**
 * Hook to load application configuration
 *
 * Priority order:
 * 1. CLI flags (--dir)
 * 2. Environment variable (LAZYNOTES_DIR)
 * 3. Config files (~/.lazynotesrc, ~/.config/lazynotes/config.json)
 * 4. Default (~/notes)
 */
export function useConfig(cliFlags: CLIFlags = {}): UseConfigResult {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const finalConfig: AppConfig = { ...DEFAULT_CONFIG };

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
            const fileContent = fs.readFileSync(configPath, 'utf8');
            const fileConfig = JSON.parse(fileContent) as Partial<AppConfig>;
            if (fileConfig.notesDirectory) {
              finalConfig.notesDirectory = resolvePath(fileConfig.notesDirectory);
            }
            setConfig(finalConfig);
            setIsLoading(false);
            return;
          } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            setError(`Invalid config at ${configPath}: ${message}`);
          }
        }
      }

      // 4. Use default
      setConfig(finalConfig);
      setIsLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
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
          const message = err instanceof Error ? err.message : String(err);
          setError(`Could not create notes directory: ${message}`);
        }
      } else if (!isDirectory(config.notesDirectory)) {
        setError(`Notes path exists but is not a directory: ${config.notesDirectory}`);
      }
    }
  }, [config]);

  return { config, error, isLoading };
}
