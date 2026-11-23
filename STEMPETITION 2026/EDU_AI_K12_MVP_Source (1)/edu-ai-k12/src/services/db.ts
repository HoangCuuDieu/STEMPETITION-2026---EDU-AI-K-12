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
  save: boolean,
): Promise<boolean> {
  const response = await fetch('/api/favorites/' + domain + '/' + encodeURIComponent(id), {
    method: save ? 'PUT' : 'DELETE',
    headers: {'X-Requested-With': 'XMLHttpRequest'},
  });
  if (response.ok) return (await response.json()).saved;
  if (response.status === 401) window.dispatchEvent(new Event('session-expired'));
  throw new Error('Chưa lưu được mục yêu thích.');
}

export async function getFavoritesByDomain(
  domain: 'physics' | 'chemistry',
): Promise<string[]> {
  const response = await fetch('/api/favorites/' + domain, {cache: 'no-store'});
  if (response.ok) return response.json();
  if (response.status === 401) window.dispatchEvent(new Event('session-expired'));
  throw new Error('Chưa tải được mục yêu thích.');
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


