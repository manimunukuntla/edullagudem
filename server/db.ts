import path from 'path';
import { Entry } from '../src/types';
import { writeJsonAtomic, readJsonSafe } from './atomicStorage';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'entries.json');

export function clearAllLocalEntries(): void {
  writeLocalEntries([]);
}

export function readLocalEntries(): Entry[] {
  const entries = readJsonSafe<Entry[]>(DB_FILE, []);
  if (Array.isArray(entries) && entries.length > 0) {
    return entries;
  }
  // Fault recovery: check backup file if primary is empty
  const bakFile = `${DB_FILE}.bak`;
  const bakEntries = readJsonSafe<Entry[]>(bakFile, []);
  if (Array.isArray(bakEntries) && bakEntries.length > 0) {
    writeLocalEntries(bakEntries);
    return bakEntries;
  }
  return [];
}

export function writeLocalEntries(entries: Entry[]): void {
  writeJsonAtomic(DB_FILE, entries);
}

export function addLocalEntry(entry: Entry): Entry {
  const entries = readLocalEntries();
  const existingIdx = entries.findIndex(e => e.id === entry.id);
  if (existingIdx !== -1) {
    entries[existingIdx] = entry;
  } else {
    entries.push(entry);
  }
  writeLocalEntries(entries);
  return entry;
}

/**
 * Assigns the lowest available positive integer token starting from 1.
 * If token #5 was removed/deleted, the next approved user will receive #5,
 * followed by #6, filling any gaps in the sequence.
 */
export function getNextSequentialTokenNo(entries: Entry[]): number {
  const usedTokens = new Set<number>();
  for (const entry of entries) {
    if (typeof entry.tokenNo === 'number' && entry.tokenNo > 0 && entry.status === 'Paid') {
      usedTokens.add(entry.tokenNo);
    }
  }

  let candidate = 1;
  while (usedTokens.has(candidate)) {
    candidate++;
  }
  return candidate;
}

export function deleteLocalEntry(id: string): { success: boolean; deletedEntry?: Entry } {
  const entries = readLocalEntries();
  const index = entries.findIndex(e => e.id === id);
  if (index !== -1) {
    const [deleted] = entries.splice(index, 1);
    writeLocalEntries(entries);
    return { success: true, deletedEntry: deleted };
  }
  return { success: false };
}

export function updateLocalEntry(updated: Entry): boolean {
  const entries = readLocalEntries();
  const index = entries.findIndex(e => e.id === updated.id);
  if (index !== -1) {
    entries[index] = updated;
    writeLocalEntries(entries);
    return true;
  }
  return false;
}
