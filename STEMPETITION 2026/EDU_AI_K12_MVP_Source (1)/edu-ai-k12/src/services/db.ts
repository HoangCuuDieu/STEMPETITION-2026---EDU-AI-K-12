import { openDB, type IDBPDatabase } from 'idb';
import type { ChatMessage, GradingResult } from '../types/assistant';

const DB_NAME = 'edumind-ai-v1';
const DB_VERSION = 1;

interface FavoriteRecord {
  id: string;
  domain: 'physics' | 'chemistry';
  addedAt: number;
}

interface EduMindDBSchema {
  favorites: {
    key: string;
    value: FavoriteRecord;
  };
  chatHistory: {
    key: string;
    value: ChatMessage;
  };
  gradingRecords: {
    key: string;
    value: GradingResult;
  };
}

let dbPromise: Promise<IDBPDatabase<EduMindDBSchema>> | null = null;

function getDB(): Promise<IDBPDatabase<EduMindDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<EduMindDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('favorites')) {
          db.createObjectStore('favorites', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('chatHistory')) {
          db.createObjectStore('chatHistory', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('gradingRecords')) {
          db.createObjectStore('gradingRecords', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function toggleFavorite(
  id: string,
  domain: 'physics' | 'chemistry',
): Promise<boolean> {
  const db = await getDB();
  const existing = await db.get('favorites', id);
  if (existing) {
    await db.delete('favorites', id);
    return false;
  }
  await db.put('favorites', { id, domain, addedAt: Date.now() });
  return true;
}

export async function getFavoritesByDomain(
  domain: 'physics' | 'chemistry',
): Promise<string[]> {
  const db = await getDB();
  const all = await db.getAll('favorites');
  return all.filter((f) => f.domain === domain).map((f) => f.id);
}

export async function saveChatMessage(msg: ChatMessage): Promise<void> {
  const db = await getDB();
  await db.put('chatHistory', msg);
}

export async function loadChatHistory(): Promise<ChatMessage[]> {
  const db = await getDB();
  const list = await db.getAll('chatHistory');
  return list.sort((a, b) => a.timestamp - b.timestamp);
}

export async function clearChatHistory(): Promise<void> {
  const db = await getDB();
  await db.clear('chatHistory');
}

export async function saveGradingRecord(record: GradingResult): Promise<void> {
  const db = await getDB();
  await db.put('gradingRecords', record);
}

export async function loadGradingRecords(): Promise<GradingResult[]> {
  const db = await getDB();
  const list = await db.getAll('gradingRecords');
  return list.sort((a, b) => b.createdAt - a.createdAt);
}
