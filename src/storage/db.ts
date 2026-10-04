import { openDB, IDBPDatabase } from 'idb';
import { Team, RoundNumber, PlannedPrompt, PromptAttempt, GameSettings } from '../game/types';
import { AppStep } from '../App';

export interface SavedGameState {
  step: AppStep;
  teams: Team[];
  promptPlan: PlannedPrompt[];
  currentRound: RoundNumber;
  currentTeamIndex: number;
  activeDeadlineAt: number;
  lastTurnAttempts: PromptAttempt[];
  lastTurnScore: number;
  settings?: GameSettings;
  updatedAt: number;
}

export interface CompletedGameSummary {
  id: string;
  completedAt: number;
  teams: Team[];
  winnerName: string;
  winnerScore: number;
}

const DB_NAME = 'kalameh_bazi_db';
const DB_VERSION = 1;
const ACTIVE_GAME_KEY = 'active_game';
const LOCAL_STORAGE_BACKUP_KEY = 'kalameh_bazi_active_game_backup';

let dbPromise: Promise<IDBPDatabase> | null = null;

function isIndexedDBAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
  } catch {
    return false;
  }
}

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('gameState')) {
          db.createObjectStore('gameState');
        }
        if (!db.objectStoreNames.contains('gameHistory')) {
          db.createObjectStore('gameHistory', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Saves current active game state to IndexedDB with localStorage fallback.
 */
export async function saveActiveGameState(state: SavedGameState): Promise<void> {
  const snapshot: SavedGameState = {
    ...state,
    updatedAt: Date.now(),
  };

  try {
    if (isIndexedDBAvailable()) {
      const db = await getDB();
      await db.put('gameState', snapshot, ACTIVE_GAME_KEY);
    }
  } catch {
    // Silently proceed to localStorage backup
  }

  // Also write to localStorage for instant synchronous fallback
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(snapshot));
    }
  } catch {
    // Ignore storage quota or private browsing errors
  }
}

/**
 * Loads saved active game state if present.
 */
export async function loadActiveGameState(): Promise<SavedGameState | null> {
  try {
    if (isIndexedDBAvailable()) {
      const db = await getDB();
      const state = await db.get('gameState', ACTIVE_GAME_KEY);
      if (state) return state as SavedGameState;
    }
  } catch {
    // Fall back to localStorage
  }

  try {
    if (typeof localStorage !== 'undefined') {
      const backup = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
      if (backup) {
        return JSON.parse(backup) as SavedGameState;
      }
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Clears active game state when game is completed or reset.
 */
export async function clearActiveGameState(): Promise<void> {
  try {
    if (isIndexedDBAvailable()) {
      const db = await getDB();
      await db.delete('gameState', ACTIVE_GAME_KEY);
    }
  } catch {
    // Ignore
  }

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_BACKUP_KEY);
    }
  } catch {
    // Ignore
  }
}

/**
 * Saves a finished game summary to history.
 */
export async function saveCompletedGame(summary: CompletedGameSummary): Promise<void> {
  try {
    if (isIndexedDBAvailable()) {
      const db = await getDB();
      await db.put('gameHistory', summary);
    }
  } catch {
    // Ignore
  }
}

/**
 * Loads past game history.
 */
export async function loadGameHistory(): Promise<CompletedGameSummary[]> {
  try {
    if (isIndexedDBAvailable()) {
      const db = await getDB();
      return (await db.getAll('gameHistory')) as CompletedGameSummary[];
    }
  } catch {
    return [];
  }
  return [];
}
