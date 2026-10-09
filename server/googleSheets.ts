import { google } from 'googleapis';
import { Entry } from '../src/types';
import { readLocalEntries, writeLocalEntries, getNextSequentialTokenNo, deleteLocalEntry } from './db';

const DEFAULT_SHEET_ID = '1AiIcdMBMOu5BVLf3Tvhekn5K4etuXrOgrMjmc_MicSw';

export function normalizePhone(phone: string | undefined | null): string {
  const digits = (phone || '').toString().replace(/\D/g, '');
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}

export class GoogleSheetsService {
  private sheetId: string;
  private clientEmail: string | undefined;
  private privateKey: string | undefined;
  private sheetsApi: ReturnType<typeof google.sheets> | null = null;
  private isConfigured = false;

  constructor() {
    this.sheetId = process.env.GOOGLE_SHEET_ID || DEFAULT_SHEET_ID;
    this.clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    this.privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (process.env.GOOGLE_CREDENTIALS_JSON) {
      try {
        const creds = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
        this.clientEmail = creds.client_email;
        this.privateKey = creds.private_key;
      } catch (err) {
        console.warn('Could not parse GOOGLE_CREDENTIALS_JSON:', err);
      }
    }

    if (this.clientEmail && this.privateKey) {
      try {
        const formattedKey = this.privateKey.includes('\\n')
          ? this.privateKey.replace(/\\n/g, '\n')
          : this.privateKey;

        const auth = new google.auth.JWT({
          email: this.clientEmail,
          key: formattedKey,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        this.sheetsApi = google.sheets({ version: 'v4', auth });
        this.isConfigured = true;
        console.log('Google Sheets API initialized for sheet:', this.sheetId);
      } catch (err) {
        console.error('Failed to initialize Google Sheets API:', err);
        this.isConfigured = false;
      }
    } else {
      console.log('Google Sheets API credentials not set. Running with persistent local database.');
    }
  }

  public getStatus() {
    return {
      configured: this.isConfigured,
      sheetId: this.sheetId,
      serviceEmail: this.clientEmail ? `${this.clientEmail.substring(0, 10)}...` : 'Not provided',
      hasPrivateKey: !!this.privateKey
    };
  }

  /**
   * Ensures header row A1:H1 exists
   */
  async ensureHeaders(): Promise<void> {
    if (!this.isConfigured || !this.sheetsApi) return;
    try {
      const response = await this.sheetsApi.spreadsheets.values.get({
        spreadsheetId: this.sheetId,
        range: 'A1:H1',
      });
      const rows = response.data.values;
      if (!rows || rows.length === 0 || rows[0].length === 0) {
        await this.sheetsApi.spreadsheets.values.update({
          spreadsheetId: this.sheetId,
          range: 'A1:H1',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [
              ['Token No', 'Name', 'Phone', 'Address', 'Status', 'Submitted At', 'Approved At', 'Notes']
            ],
          },
        });
        console.log('Created Google Sheet header row A1:H1');
      }
    } catch (err) {
      console.error('Error ensuring Google Sheet headers:', err);
    }
  }

  /**
   * Appends an entry row to the Google Sheet
   * Columns: A: Token No, B: Name, C: Phone, D: Address, E: Status, F: Submitted At, G: Approved At, H: Notes
   */
  async appendEntry(entry: Entry): Promise<{ success: boolean; rowIndex?: number; error?: string }> {
    if (!this.isConfigured || !this.sheetsApi) {
      return { success: false, error: 'Google Sheets credentials not yet configured' };
    }

    try {
      await this.ensureHeaders();

      const rowValues = [
        entry.tokenNo !== null && entry.tokenNo !== undefined ? entry.tokenNo : '',
        entry.name,
        entry.phone,
        entry.address || '',
        entry.status,
        entry.submittedAt,
        entry.approvedAt || '',
        entry.notes || ''
      ];

      const res = await this.sheetsApi.spreadsheets.values.append({
        spreadsheetId: this.sheetId,
        range: 'A:H',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [rowValues],
        },
      });

      // Extract updated range row index
      const updatedRange = res.data.updates?.updatedRange;
      let rowIndex: number | undefined;
      if (updatedRange) {
        const match = updatedRange.match(/A(\d+):/);
        if (match && match[1]) {
          rowIndex = parseInt(match[1], 10);
        }
      }

      return { success: true, rowIndex };
    } catch (err: any) {
      console.error('Error appending to Google Sheet:', err?.message || err);
      return { success: false, error: err?.message || 'Failed to append to sheet' };
    }
  }

  /**
   * Fetches all rows from the Google Sheet
   */
  async fetchAllEntries(): Promise<Entry[]> {
    if (!this.isConfigured || !this.sheetsApi) {
      return readLocalEntries();
    }

    try {
      const response = await this.sheetsApi.spreadsheets.values.get({
        spreadsheetId: this.sheetId,
        range: 'A2:H1000',
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return readLocalEntries();
      }

      const entries: Entry[] = rows
        .map((row, index) => {
          const rowIndex = index + 2; // Row in sheet (1-based, starting after header)
          const tokenVal = row[0] ? parseInt(row[0], 10) : null;
          const cleanRowPhone = normalizePhone(row[2] || '');
          return {
            id: `sheet-row-${rowIndex}-${cleanRowPhone || index}`,
            tokenNo: !isNaN(tokenVal as number) ? tokenVal : null,
            name: row[1] || '',
            phone: cleanRowPhone,
            address: row[3] || '',
            status: (row[4] === 'Paid' ? 'Paid' : 'Pending') as 'Pending' | 'Paid',
            submittedAt: row[5] || '',
            approvedAt: row[6] || null,
            notes: row[7] || '',
            rowIndex: rowIndex
          };
        })
        .filter(e => e.name || e.phone);

      // Safe merge: preserve any local entries so nothing is ever lost or wiped
      const localEntries = readLocalEntries();
      const entryMap = new Map<string, Entry>();
      for (const le of localEntries) {
        entryMap.set(le.id, le);
      }
      for (const se of entries) {
        entryMap.set(se.id, se);
      }
      const combined = Array.from(entryMap.values());
      writeLocalEntries(combined);
      return combined;
    } catch (err) {
      console.error('Error reading from Google Sheet, falling back to local DB:', err);
      return readLocalEntries();
    }
  }

  /**
   * Approves entry: assigns next sequential token No, updates row in Google Sheet.
   * Strictly matches by entryId first so multiple entries with the same phone number
   * each receive their own distinct token number.
   */
  async approveEntry(entryId: string, phone: string, rowIndex?: number): Promise<{ entry: Entry; error?: string }> {
    const allEntries = await this.fetchAllEntries();
    const cleanPhone = normalizePhone(phone);

    // Priority 1: Match by exact entryId
    let target = entryId ? allEntries.find(e => e.id === entryId) : undefined;

    // Priority 2: Match by exact rowIndex if provided
    if (!target && rowIndex) {
      target = allEntries.find(e => e.rowIndex === rowIndex);
    }

    // Priority 3: Match a Pending entry with this phone number
    if (!target && cleanPhone) {
      target = allEntries.find(e => normalizePhone(e.phone) === cleanPhone && e.status === 'Pending');
    }

    // Priority 4: Fallback to any entry with this phone number
    if (!target && cleanPhone) {
      target = allEntries.find(e => normalizePhone(e.phone) === cleanPhone);
    }

    if (!target) {
      throw new Error(`Entry with id "${entryId || phone}" not found`);
    }

    if (target.status === 'Paid' && target.tokenNo !== null) {
      return { entry: target };
    }

    // Assign next sequential token starting from 1
    const nextToken = getNextSequentialTokenNo(allEntries);
    const nowStr = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    target.tokenNo = nextToken;
    target.status = 'Paid';
    target.approvedAt = nowStr;

    // Update in local DB
    writeLocalEntries(allEntries);

    // Update in Google Sheet if configured
    if (this.isConfigured && this.sheetsApi) {
      try {
        const rowToUpdate = target.rowIndex || rowIndex;
        if (rowToUpdate) {
          await this.sheetsApi.spreadsheets.values.update({
            spreadsheetId: this.sheetId,
            range: `A${rowToUpdate}:H${rowToUpdate}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [
                [
                  target.tokenNo,
                  target.name,
                  target.phone,
                  target.address || '',
                  target.status,
                  target.submittedAt,
                  target.approvedAt,
                  target.notes || ''
                ]
              ],
            },
          });
          console.log(`Updated Google Sheet row ${rowToUpdate} for token #${target.tokenNo}`);
        } else {
          // If row index wasn't tracked, search row by phone where Token No (col A) is empty
          const res = await this.sheetsApi.spreadsheets.values.get({
            spreadsheetId: this.sheetId,
            range: 'A2:E1000',
          });
          const sheetRows = res.data.values || [];
          let foundIdx = sheetRows.findIndex(
            r => normalizePhone(r[2]) === normalizePhone(target!.phone) && (!r[0] || r[4] !== 'Paid')
          );
          if (foundIdx === -1) {
            foundIdx = sheetRows.findIndex(r => normalizePhone(r[2]) === normalizePhone(target!.phone));
          }
          if (foundIdx !== -1) {
            const actualRow = foundIdx + 2;
            target.rowIndex = actualRow;
            writeLocalEntries(allEntries);
            await this.sheetsApi.spreadsheets.values.update({
              spreadsheetId: this.sheetId,
              range: `A${actualRow}:H${actualRow}`,
              valueInputOption: 'USER_ENTERED',
              requestBody: {
                values: [
                  [
                    target.tokenNo,
                    target.name,
                    target.phone,
                    target.address || '',
                    target.status,
                    target.submittedAt,
                    target.approvedAt,
                    target.notes || ''
                  ]
                ],
              },
            });
          }
        }
      } catch (err: any) {
        console.error('Failed to update Google Sheet row:', err?.message || err);
      }
    }

    return { entry: target };
  }

  /**
   * Approves ALL pending entries for a given phone number sequentially
   */
  async approveAllPendingForPhone(phone: string): Promise<Entry[]> {
    const cleanPhone = normalizePhone(phone);
    const allEntries = await this.fetchAllEntries();
    const pendingForPhone = allEntries.filter(
      e => normalizePhone(e.phone) === cleanPhone && e.status === 'Pending'
    );

    const approvedEntries: Entry[] = [];
    for (const pending of pendingForPhone) {
      const res = await this.approveEntry(pending.id, pending.phone, pending.rowIndex);
      approvedEntries.push(res.entry);
    }
    return approvedEntries;
  }

  /**
   * Deletes an entry. If it held a token (e.g. token #5), that token is released
   * and will automatically be assigned to the next approved entry.
   */
  async deleteEntry(entryId: string, phone?: string): Promise<{ success: boolean; deletedEntry?: Entry; error?: string }> {
    const allEntries = await this.fetchAllEntries();
    let target = entryId ? allEntries.find(e => e.id === entryId) : undefined;
    if (!target && phone) {
      const cleanPhone = normalizePhone(phone);
      target = allEntries.find(e => normalizePhone(e.phone) === cleanPhone);
    }

    if (!target) {
      return { success: false, error: `Entry not found` };
    }

    const deleteResult = deleteLocalEntry(target.id);
    if (!deleteResult.success) {
      const remaining = allEntries.filter(e => e.id !== target.id);
      writeLocalEntries(remaining);
    }

    // If Google Sheet is configured, clear the row in Google Sheet
    if (this.isConfigured && this.sheetsApi && target.rowIndex) {
      try {
        await this.sheetsApi.spreadsheets.values.clear({
          spreadsheetId: this.sheetId,
          range: `A${target.rowIndex}:H${target.rowIndex}`,
        });
        console.log(`Cleared Google Sheet row ${target.rowIndex} for deleted entry ${target.name}`);
      } catch (err: any) {
        console.error('Error clearing row in Google Sheet:', err?.message || err);
      }
    }

    return { success: true, deletedEntry: target };
  }

  /**
   * Clears all entries from both local database and Google Sheet (if configured)
   */
  async clearAllEntries(): Promise<{ success: boolean }> {
    const { clearAllLocalEntries } = await import('./db');
    clearAllLocalEntries();

    if (this.isConfigured && this.sheetsApi) {
      try {
        await this.sheetsApi.spreadsheets.values.clear({
          spreadsheetId: this.sheetId,
          range: 'A2:H1000',
        });
        console.log('Cleared all entries in Google Sheet');
      } catch (err: any) {
        console.error('Error clearing Google Sheet:', err?.message || err);
      }
    }

    return { success: true };
  }
}

export const googleSheetsService = new GoogleSheetsService();
