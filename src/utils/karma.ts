import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.config', 'lazynotes');
const KARMA_FILE = path.join(CONFIG_DIR, 'karma.json');

export interface KarmaData {
  total: number;
  history: KarmaEvent[];
}

export interface KarmaEvent {
  action: KarmaAction;
  points: number;
  timestamp: string;
}

export type KarmaAction =
  | 'complete_todo'
  | 'uncomplete_todo'
  | 'create_todo'
  | 'delete_todo';

// Points by priority (P1 = hardest = most points)
const PRIORITY_POINTS: Record<string, number> = {
  P1: 40,
  P2: 30,
  P3: 20,
  P4: 10,
};

export function getPointsForComplete(priority: string): number {
  return PRIORITY_POINTS[priority] || 10;
}

export function getPointsForAction(action: KarmaAction, priority?: string): number {
  switch (action) {
    case 'complete_todo':
      return getPointsForComplete(priority || 'P4');
    case 'uncomplete_todo':
      return -getPointsForComplete(priority || 'P4');
    case 'create_todo':
      return 5;
    case 'delete_todo':
      return -5;
    default:
      return 0;
  }
}

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadKarma(): KarmaData {
  ensureConfigDir();

  if (!fs.existsSync(KARMA_FILE)) {
    return { total: 0, history: [] };
  }

  try {
    const content = fs.readFileSync(KARMA_FILE, 'utf8');
    return JSON.parse(content);
  } catch {
    return { total: 0, history: [] };
  }
}

export function saveKarma(data: KarmaData): void {
  ensureConfigDir();

  // Keep only last 100 events to prevent file bloat
  const trimmedData: KarmaData = {
    total: data.total,
    history: data.history.slice(-100),
  };

  fs.writeFileSync(KARMA_FILE, JSON.stringify(trimmedData, null, 2), 'utf8');
}

export function addKarmaEvent(action: KarmaAction, priority?: string): KarmaData {
  const data = loadKarma();
  const points = getPointsForAction(action, priority);

  const event: KarmaEvent = {
    action,
    points,
    timestamp: new Date().toISOString(),
  };

  data.total += points;
  data.history.push(event);

  saveKarma(data);
  return data;
}

export function getKarmaLevel(total: number): { level: number; title: string } {
  if (total < 100) return { level: 1, title: 'Beginner' };
  if (total < 500) return { level: 2, title: 'Apprentice' };
  if (total < 1000) return { level: 3, title: 'Achiever' };
  if (total < 2500) return { level: 4, title: 'Pro' };
  if (total < 5000) return { level: 5, title: 'Expert' };
  if (total < 10000) return { level: 6, title: 'Master' };
  return { level: 7, title: 'Enlightened' };
}
