import fs from 'fs';
import path from 'path';

/**
 * Atomic JSON Storage Engine.
 * 
 * Prevents race condition truncations and file corruption:
 * 1. Writes to a unique temp file first.
 * 2. Renames atomically via fs.renameSync (never leaves an empty/truncated 0-byte file).
 * 3. Keeps an automated .bak backup for bulletproof fault recovery.
 * 4. NEVER overwrites user data with defaults if a transient read error occurs.
 */

export function writeJsonAtomic(filePath: string, data: any): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const tmpPath = `${filePath}.tmp.${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const bakPath = `${filePath}.bak`;
  const jsonStr = JSON.stringify(data, null, 2);

  try {
    // Write full payload to temporary file
    fs.writeFileSync(tmpPath, jsonStr, 'utf8');

    // Atomic rename replaces the target file in a single OS filesystem operation
    fs.renameSync(tmpPath, filePath);

    // Keep backup copy for crash recovery
    fs.copyFileSync(filePath, bakPath);
  } catch (err) {
    console.error(`[AtomicStorage] Error writing ${filePath}:`, err);
    // Cleanup temp file if it exists
    if (fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch {}
    }
  }
}

export function readJsonSafe<T>(filePath: string, fallbackData: T): T {
  const bakPath = `${filePath}.bak`;

  // Try reading primary file
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content && content.trim().length > 0) {
        return JSON.parse(content) as T;
      }
    } catch (err) {
      console.warn(`[AtomicStorage] Syntax error in ${filePath}, attempting recovery from .bak:`, err);
    }
  }

  // Try reading backup file
  if (fs.existsSync(bakPath)) {
    try {
      const bakContent = fs.readFileSync(bakPath, 'utf8');
      if (bakContent && bakContent.trim().length > 0) {
        const recovered = JSON.parse(bakContent) as T;
        // Restore to primary file
        writeJsonAtomic(filePath, recovered);
        console.log(`[AtomicStorage] Successfully restored ${filePath} from backup!`);
        return recovered;
      }
    } catch (bakErr) {
      console.error(`[AtomicStorage] Error reading backup ${bakPath}:`, bakErr);
    }
  }

  // If primary file does not exist at all, write fallback once
  if (!fs.existsSync(filePath)) {
    try {
      writeJsonAtomic(filePath, fallbackData);
    } catch {}
  }

  return fallbackData;
}
