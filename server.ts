import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { googleSheetsService } from './server/googleSheets';
import { addLocalEntry, readLocalEntries } from './server/db';
import { Entry } from './src/types';
import { formatWhatsAppMessage, createWhatsAppUrl, TARGET_WHATSAPP_NUMBER } from './src/lib/whatsapp';

dotenv.config();

const app = express();
const PORT = 3000;
const PROFILE_FILE = path.resolve(process.cwd(), 'data', 'profile.json');
import { whatsAppDeliveryManager } from './server/whatsappDelivery';
import { securityManager } from './server/security';
import { prizesManager } from './server/prizes';
import { sponsorsManager } from './server/sponsors';
import { profileManager } from './server/profile';
import { dailyEventsManager } from './server/dailyEvents';
import { optimizeBase64Image } from './server/imageOptimizer';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Global Cache-Control for all /api endpoints to ensure instant freshness after admin corrections
app.use('/api', (_req: Request, res: Response, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Public configuration info
app.get('/api/config/info', (req: Request, res: Response) => {
  const profile = profileManager.getProfile();
  res.json({
    upiId: profile.upiId || process.env.UPI_ID || '9573454579@postbank',
    upiName: profile.upiName || process.env.UPI_NAME || 'KANDALA KIRAN REDDY',
    ticketAmount: profile.ticketPrice || process.env.TICKET_AMOUNT || '50',
    targetWhatsAppNumber: profile.coordinatorPhone || TARGET_WHATSAPP_NUMBER,
    sheetStatus: googleSheetsService.getStatus(),
    whatsappStatus: whatsAppDeliveryManager.getStatus(),
    profile
  });
});

// Public: Get festival profile and all details
app.get('/api/profile', (req: Request, res: Response) => {
  try {
    const profile = profileManager.getProfile();
    return res.json(profile);
  } catch (err) {
    console.error('Error fetching profile:', err);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Admin ONLY: Change festival profile, titles, and credentials
app.post('/api/admin/profile', async (req: Request, res: Response) => {
  try {
    if (!securityManager.verifyAdminToken(req.headers.authorization)) {
      return res.status(401).json({ error: 'Unauthorized: Only administrator can change the festival profile' });
    }

    const payload = { ...req.body };
    if (payload.profileImage) {
      payload.profileImage = await optimizeBase64Image(payload.profileImage, 800, 80);
    }
    if (payload.bannerImage) {
      payload.bannerImage = await optimizeBase64Image(payload.bannerImage, 1200, 80);
    }

    const updated = profileManager.updateProfile(payload);
    return res.json({ success: true, profile: updated, profileImage: updated.profileImage });
  } catch (err: any) {
    console.error('Error saving profile:', err);
    return res.status(500).json({ error: err?.message || 'Failed to update profile' });
  }
});

// Admin: Reset profile details to official defaults
app.post('/api/admin/profile/reset', (req: Request, res: Response) => {
  try {
    if (!securityManager.verifyAdminToken(req.headers.authorization)) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
    }

    const keepImage = req.body?.keepImage !== false;
    const defaults = profileManager.resetToDefaults(keepImage);
    return res.json({ success: true, profile: defaults });
  } catch (err: any) {
    console.error('Error resetting profile:', err);
    return res.status(500).json({ error: err?.message || 'Failed to reset profile' });
  }
});

// Public: Get all daily event slots
app.get('/api/daily-events', (req: Request, res: Response) => {
  try {
    const events = dailyEventsManager.getEvents();
    return res.json({ events });
  } catch (err) {
    console.error('Error fetching daily events:', err);
    return res.status(500).json({ error: 'Failed to fetch daily events' });
  }
});

// Admin: Add a new daily event slot
app.post('/api/admin/daily-events', (req: Request, res: Response) => {
  try {
    if (!securityManager.verifyAdminToken(req.headers.authorization)) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
    }
    const newSlot = dailyEventsManager.addEvent(req.body);
    return res.json({ success: true, event: newSlot, events: dailyEventsManager.getEvents() });
  } catch (err: any) {
    console.error('Error adding daily event:', err);
    return res.status(500).json({ error: err?.message || 'Failed to add daily event' });
  }
});

// Admin: Update a daily event slot
app.put('/api/admin/daily-events/:id', (req: Request, res: Response) => {
  try {
    if (!securityManager.verifyAdminToken(req.headers.authorization)) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
    }
    const { id } = req.params;
    const updated = dailyEventsManager.updateEvent(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Event slot not found' });
    }
    return res.json({ success: true, event: updated, events: dailyEventsManager.getEvents() });
  } catch (err: any) {
    console.error('Error updating daily event:', err);
    return res.status(500).json({ error: err?.message || 'Failed to update daily event' });
  }
});

// Admin: Delete a daily event slot
app.delete('/api/admin/daily-events/:id', (req: Request, res: Response) => {
  try {
    if (!securityManager.verifyAdminToken(req.headers.authorization)) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
    }
    const { id } = req.params;
    const success = dailyEventsManager.deleteEvent(id);
    if (!success) {
      return res.status(404).json({ error: 'Event slot not found' });
    }
    return res.json({ success: true, events: dailyEventsManager.getEvents() });
  } catch (err: any) {
    console.error('Error deleting daily event:', err);
    return res.status(500).json({ error: err?.message || 'Failed to delete daily event' });
  }
});

// Admin: Reset daily event slots to defaults
app.post('/api/admin/daily-events/reset', (req: Request, res: Response) => {
  try {
    if (!securityManager.verifyAdminToken(req.headers.authorization)) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
    }
    const events = dailyEventsManager.resetToDefaults();
    return res.json({ success: true, events });
  } catch (err: any) {
    console.error('Error resetting daily events:', err);
    return res.status(500).json({ error: err?.message || 'Failed to reset daily events' });
  }
});

// Public: Get all prizes
app.get('/api/prizes', (req: Request, res: Response) => {
  try {
    const prizes = prizesManager.getPrizes();
    return res.json({ prizes });
  } catch (err: any) {
    console.error('Error fetching prizes:', err);
    return res.status(500).json({ error: 'Failed to fetch prizes' });
  }
});

// Admin: Add a new prize
app.post('/api/admin/prizes', async (req: Request, res: Response) => {
  try {
    if (!securityManager.verifyAdminToken(req.headers.authorization)) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
    }
    const { rank, teluguRank, title, titleTe, value, sponsor, colorTheme, description, imageUrl, isPopular } = req.body;
    if (!rank || !title) {
      return res.status(400).json({ error: 'Rank and title are required' });
    }
    const optimizedImage = imageUrl ? await optimizeBase64Image(imageUrl, 800, 80) : '';
    const newPrize = prizesManager.addPrize({
      rank: rank.trim(),
      teluguRank: (teluguRank || rank).trim(),
      title: title.trim(),
      titleTe: (titleTe || title).trim(),
      value: (value || 'Valuable Gift').trim(),
      sponsor: (sponsor || '').trim(),
      colorTheme: colorTheme || 'gold',
      description: (description || '').trim(),
      imageUrl: optimizedImage.trim(),
      isPopular: Boolean(isPopular)
    });
    return res.json({ success: true, prize: newPrize, prizes: prizesManager.getPrizes() });
  } catch (err: any) {
    console.error('Error adding prize:', err);
    return res.status(500).json({ error: err?.message || 'Failed to add prize' });
  }
});

// Admin: Update prize
app.put('/api/admin/prizes/:id', async (req: Request, res: Response) => {
  try {
    if (!securityManager.verifyAdminToken(req.headers.authorization)) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
    }
    const { id } = req.params;
    const updates = { ...req.body };
    if (updates.imageUrl) {
      updates.imageUrl = await optimizeBase64Image(updates.imageUrl, 800, 80);
    }
    const updated = prizesManager.updatePrize(id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Prize not found' });
    }
    return res.json({ success: true, prize: updated, prizes: prizesManager.getPrizes() });
  } catch (err: any) {
    console.error('Error updating prize:', err);
    return res.status(500).json({ error: err?.message || 'Failed to update prize' });
  }
});

// Admin: Delete prize
app.delete('/api/admin/prizes/:id', (req: Request, res: Response) => {
  try {
    if (!securityManager.verifyAdminToken(req.headers.authorization)) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
    }
    const { id } = req.params;
    const ok = prizesManager.deletePrize(id);
    if (!ok) {
      return res.status(404).json({ error: 'Prize not found' });
    }
    return res.json({ success: true, prizes: prizesManager.getPrizes() });
  } catch (err: any) {
    console.error('Error deleting prize:', err);
    return res.status(500).json({ error: err?.message || 'Failed to delete prize' });
  }
});

// Admin: Reset prizes to default
app.post('/api/admin/prizes/reset', (req: Request, res: Response) => {
  try {
    if (!securityManager.verifyAdminToken(req.headers.authorization)) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
    }
    const defaults = prizesManager.resetToDefaults();
    return res.json({ success: true, prizes: defaults });
  } catch (err: any) {
    console.error('Error resetting prizes:', err);
    return res.status(500).json({ error: err?.message || 'Failed to reset prizes' });
  }
});

// Public: Get all sponsors
app.get('/api/sponsors', (req: Request, res: Response) => {
  try {
    const sponsors = sponsorsManager.getSponsors();
    return res.json({ sponsors });
  } catch (err: any) {
    console.error('Error fetching sponsors:', err);
    return res.status(500).json({ error: 'Failed to fetch sponsors' });
  }
});

// Admin: Add new sponsor
app.post('/api/admin/sponsors', async (req: Request, res: Response) => {
  try {
    if (!securityManager.verifyAdminToken(req.headers.authorization)) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
    }
    const { name, nameTe, title, titleTe, amount, location, phone, isFeatured, imageUrl } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Sponsor name is required' });
    }

    const optimizedImg = imageUrl ? await optimizeBase64Image(imageUrl, 800, 80) : '';

    const newSponsor = sponsorsManager.addSponsor({
      name: name.trim(),
      nameTe: (nameTe || name).trim(),
      title: (title || 'Devi Utsava Daata').trim(),
      titleTe: (titleTe || title || 'దేవి ఉత్సవ దాత').trim(),
      amount: (amount || '').trim(),
      location: (location || 'Edullagudem').trim(),
      phone: (phone || '').trim(),
      isFeatured: Boolean(isFeatured),
      imageUrl: (optimizedImg || '').trim()
    });

    return res.json({ success: true, sponsor: newSponsor, sponsors: sponsorsManager.getSponsors() });
  } catch (err: any) {
    console.error('Error adding sponsor:', err);
    return res.status(500).json({ error: err?.message || 'Failed to add sponsor' });
  }
});

// Admin: Update sponsor
app.put('/api/admin/sponsors/:id', async (req: Request, res: Response) => {
  try {
    if (!securityManager.verifyAdminToken(req.headers.authorization)) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
    }
    const { id } = req.params;
    const updates = { ...req.body };
    if (updates.imageUrl) {
      updates.imageUrl = await optimizeBase64Image(updates.imageUrl, 800, 80);
    }
    const updated = sponsorsManager.updateSponsor(id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Sponsor not found' });
    }
    return res.json({ success: true, sponsor: updated, sponsors: sponsorsManager.getSponsors() });
  } catch (err: any) {
    console.error('Error updating sponsor:', err);
    return res.status(500).json({ error: err?.message || 'Failed to update sponsor' });
  }
});

// Admin: Delete sponsor
app.delete('/api/admin/sponsors/:id', (req: Request, res: Response) => {
  try {
    if (!securityManager.verifyAdminToken(req.headers.authorization)) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
    }
    const { id } = req.params;
    const ok = sponsorsManager.deleteSponsor(id);
    if (!ok) {
      return res.status(404).json({ error: 'Sponsor not found' });
    }
    return res.json({ success: true, sponsors: sponsorsManager.getSponsors() });
  } catch (err: any) {
    console.error('Error deleting sponsor:', err);
    return res.status(500).json({ error: err?.message || 'Failed to delete sponsor' });
  }
});

// Admin: Reset sponsors to default
app.post('/api/admin/sponsors/reset', (req: Request, res: Response) => {
  try {
    if (!securityManager.verifyAdminToken(req.headers.authorization)) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
    }
    const defaults = sponsorsManager.resetToDefaults();
    return res.json({ success: true, sponsors: defaults });
  } catch (err: any) {
    console.error('Error resetting sponsors:', err);
    return res.status(500).json({ error: err?.message || 'Failed to reset sponsors' });
  }
});

// Admin: Buy / Issue Token Directly for Devotee
app.post('/api/admin/register-token', async (req: Request, res: Response) => {
  try {
    if (!securityManager.verifyAdminToken(req.headers.authorization)) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
    }
    const { name, phone, address, tokenCount, tokens, paymentMode, autoApprove } = req.body;
    const cleanPhone = (phone || '').toString().trim().replace(/\D/g, '');
    if (!name || cleanPhone.length !== 10) {
      return res.status(400).json({ error: 'Valid devotee name and 10-digit phone number are required' });
    }

    let tokenNames: string[] = [];
    if (Array.isArray(tokens) && tokens.length > 0) {
      tokenNames = tokens.map((t: any) => typeof t === 'string' ? t.trim() : (t.name || '').trim());
    }
    const count = Number(tokenCount) || (tokenNames.length > 0 ? tokenNames.length : 1);
    if (tokenNames.length === 0) {
      for (let i = 0; i < count; i++) {
        tokenNames.push(i === 0 ? name.trim() : `${name.trim()} (Token #${i + 1})`);
      }
    }

    const allEntries = await googleSheetsService.fetchAllEntries();
    const { getNextSequentialTokenNo } = await import('./server/db');

    const createdEntries: Entry[] = [];
    const mode = paymentMode || 'Cash';
    const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

    for (let i = 0; i < tokenNames.length; i++) {
      const devoteeName = tokenNames[i] || (i === 0 ? name.trim() : `${name.trim()} (Token #${i + 1})`);
      const willApprove = autoApprove !== false;
      let tokenNumber: number | null = null;
      if (willApprove) {
        tokenNumber = getNextSequentialTokenNo([...allEntries, ...createdEntries]);
      }

      const newEntry: Entry = {
        id: `entry-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        tokenNo: tokenNumber,
        name: devoteeName,
        phone: cleanPhone,
        address: (address || '').trim(),
        status: willApprove ? 'Paid' : 'Pending',
        submittedAt: nowStr,
        approvedAt: willApprove ? nowStr : null,
        notes: `Admin Direct Booking (${mode}) · ₹${count * 50} for ${count} Token(s)`
      };

      addLocalEntry(newEntry);
      const sheetResult = await googleSheetsService.appendEntry(newEntry);
      if (sheetResult.rowIndex) {
        newEntry.rowIndex = sheetResult.rowIndex;
      }
      createdEntries.push(newEntry);

      if (willApprove) {
        whatsAppDeliveryManager.sendDualTokenMessage(newEntry).catch(e => console.error('Auto delivery err:', e));
      }
    }

    return res.json({
      success: true,
      entries: createdEntries,
      message: `Successfully booked ${createdEntries.length} token(s) for ${name}!`
    });
  } catch (err: any) {
    console.error('Error admin booking token:', err);
    return res.status(500).json({ error: err?.message || 'Failed to issue token' });
  }
});

// Devotee registration & payment confirmation (Supports single or multiple tokens)
app.post('/api/payment-confirm', async (req: Request, res: Response) => {
  try {
    const { name, phone, address, notes, tokens } = req.body;

    // Strict validation: phone must be 10 digits
    const cleanedPhone = (phone || '').toString().trim().replace(/\D/g, '');
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (cleanedPhone.length !== 10) {
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
    }

    const nowStr = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    // Extract list of token names (if user added multiple tokens)
    let tokenNames: string[] = [];
    if (Array.isArray(tokens) && tokens.length > 0) {
      tokenNames = tokens.map((t: any) => {
        if (typeof t === 'string') return t.trim();
        return (t.name || '').trim();
      });
    }

    if (tokenNames.length === 0) {
      tokenNames = [name.trim()];
    }

    const totalAmount = tokenNames.length * 50;
    const createdEntries: Entry[] = [];

    for (let i = 0; i < tokenNames.length; i++) {
      const devoteeName = tokenNames[i] || (i === 0 ? name.trim() : `${name.trim()} (Token #${i + 1})`);
      const entryNotes = tokenNames.length > 1
        ? `Token ${i + 1} of ${tokenNames.length} · Paid ₹${totalAmount} (${tokenNames.length} Tokens) via UPI (9573454579@postbank)`
        : (notes || 'Paid ₹50 via UPI QR (9573454579@postbank)');

      const newEntry: Entry = {
        id: `entry-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
        tokenNo: null,
        name: devoteeName,
        phone: cleanedPhone,
        address: (address || '').trim(),
        status: 'Pending',
        submittedAt: nowStr,
        approvedAt: null,
        notes: entryNotes
      };

      // Save to local DB first
      addLocalEntry(newEntry);

      // Append to Google Sheet
      const sheetResult = await googleSheetsService.appendEntry(newEntry);
      if (sheetResult.rowIndex) {
        newEntry.rowIndex = sheetResult.rowIndex;
      }

      createdEntries.push(newEntry);
    }

    return res.status(200).json({
      success: true,
      entry: createdEntries[0],
      entries: createdEntries,
      count: createdEntries.length,
      totalAmount,
      message: 'Thank you! Your entry is submitted. Token will be sent after payment verification.'
    });
  } catch (err: any) {
    console.error('Error submitting payment entry:', err);
    return res.status(500).json({ error: err?.message || 'Server error processing entry' });
  }
});

// Devotee lookup: check token status by 10-digit mobile number
app.get('/api/status/lookup', async (req: Request, res: Response) => {
  try {
    const rawPhone = (req.query.phone as string) || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit phone number' });
    }

    const allEntries = await googleSheetsService.fetchAllEntries();
    // Find all entries for this phone (devotee could have purchased multiple tokens)
    const { normalizePhone } = await import('./server/googleSheets');
    const matches = allEntries.filter(e => normalizePhone(e.phone) === cleanPhone);

    return res.json({
      found: matches.length > 0,
      entries: matches
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to search token status' });
  }
});

// Admin Authentication
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (!securityManager.verifyAdminPassword(password)) {
    return res.status(401).json({ authenticated: false, error: 'Incorrect password' });
  }
  return res.json({
    authenticated: true,
    token: securityManager.getAdminToken()
  });
});

// Security: Get current security configuration status
app.get('/api/admin/security/status', (req: Request, res: Response) => {
  return res.json(securityManager.getSecurityStatus());
});

// Security: Option 1 - Change password with old password
app.post('/api/admin/security/change-password', (req: Request, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const result = securityManager.changeWithOldPassword(oldPassword, newPassword);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.json(result);
  } catch (err: any) {
    console.error('Error changing security password:', err);
    return res.status(500).json({ error: err?.message || 'Failed to change password' });
  }
});

// Security: Option 2 - Send OTP to coordinator phone number 6305729387 (Forgot Password)
app.post('/api/admin/security/send-otp', async (req: Request, res: Response) => {
  try {
    const result = await securityManager.sendResetOtp();
    return res.json(result);
  } catch (err: any) {
    console.error('Error sending security OTP:', err);
    return res.status(500).json({ error: 'Failed to dispatch OTP to coordinator number' });
  }
});

// Security: Option 2 - Verify OTP & Reset Password
app.post('/api/admin/security/verify-otp-reset', (req: Request, res: Response) => {
  try {
    const { otp, newPassword } = req.body;
    const result = securityManager.verifyOtpAndReset(otp, newPassword);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.json(result);
  } catch (err: any) {
    console.error('Error verifying OTP & resetting password:', err);
    return res.status(500).json({ error: err?.message || 'Failed to reset password' });
  }
});

// Admin: Get all entries (Pending ones first)
app.get('/api/admin/entries', async (req: Request, res: Response) => {
  try {
    if (!securityManager.verifyAdminToken(req.headers.authorization)) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    const entries = await googleSheetsService.fetchAllEntries();

    // Sort: Pending ones first, then by tokenNo or submitted time
    const sorted = [...entries].sort((a, b) => {
      if (a.status === 'Pending' && b.status !== 'Pending') return -1;
      if (a.status !== 'Pending' && b.status === 'Pending') return 1;
      if (a.tokenNo && b.tokenNo) return a.tokenNo - b.tokenNo;
      return 0;
    });

    const { getNextSequentialTokenNo } = await import('./server/db');
    const nextAvailableToken = getNextSequentialTokenNo(entries);

    return res.json({
      entries: sorted,
      nextAvailableToken,
      sheetStatus: googleSheetsService.getStatus()
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Error fetching entries' });
  }
});

// Admin: Delete entry & release/re-use its token sequence slot
app.post('/api/admin/delete', async (req: Request, res: Response) => {
  try {
    if (!securityManager.verifyAdminToken(req.headers.authorization)) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    const { id, phone } = req.body;
    if (!id && !phone) {
      return res.status(400).json({ error: 'Entry ID or phone required' });
    }

    const result = await googleSheetsService.deleteEntry(id, phone);
    if (!result.success) {
      return res.status(404).json({ error: result.error || 'Entry not found' });
    }

    const remainingEntries = await googleSheetsService.fetchAllEntries();
    const { getNextSequentialTokenNo } = await import('./server/db');
    const nextAvailableToken = getNextSequentialTokenNo(remainingEntries);

    return res.json({
      success: true,
      deletedEntry: result.deletedEntry,
      releasedTokenNo: result.deletedEntry?.tokenNo ?? null,
      nextAvailableToken,
      remainingCount: remainingEntries.length
    });
  } catch (err: any) {
    console.error('Error deleting entry:', err);
    return res.status(500).json({ error: err?.message || 'Failed to delete entry' });
  }
});

app.delete('/api/admin/entries/:id', async (req: Request, res: Response) => {
  try {
    if (!securityManager.verifyAdminToken(req.headers.authorization)) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    const { id } = req.params;
    const result = await googleSheetsService.deleteEntry(id);
    if (!result.success) {
      return res.status(404).json({ error: result.error || 'Entry not found' });
    }

    const remainingEntries = await googleSheetsService.fetchAllEntries();
    const { getNextSequentialTokenNo } = await import('./server/db');
    const nextAvailableToken = getNextSequentialTokenNo(remainingEntries);

    return res.json({
      success: true,
      deletedEntry: result.deletedEntry,
      releasedTokenNo: result.deletedEntry?.tokenNo ?? null,
      nextAvailableToken
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to delete entry' });
  }
});

// Admin: Remove all tokens count and start fresh from Token 1
app.post('/api/admin/tokens/reset', async (req: Request, res: Response) => {
  try {
    if (!securityManager.verifyAdminToken(req.headers.authorization)) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    await googleSheetsService.clearAllEntries();
    const remainingEntries = await googleSheetsService.fetchAllEntries();
    const { getNextSequentialTokenNo } = await import('./server/db');
    const nextAvailableToken = getNextSequentialTokenNo(remainingEntries);

    return res.json({
      success: true,
      message: 'All tokens count removed. Token numbering will now start from Token #1.',
      entries: remainingEntries,
      nextAvailableToken
    });
  } catch (err: any) {
    console.error('Error resetting all tokens:', err);
    return res.status(500).json({ error: err?.message || 'Failed to reset tokens' });
  }
});

// Admin: Approve entry & generate sequential Token No
app.post('/api/admin/approve', async (req: Request, res: Response) => {
  try {
    if (!securityManager.verifyAdminToken(req.headers.authorization)) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    const { id, phone, rowIndex } = req.body;
    if (!id && !phone) {
      return res.status(400).json({ error: 'Entry ID or phone required' });
    }

    const result = await googleSheetsService.approveEntry(id, phone, rowIndex);
    const updatedEntry = result.entry;

    // Send the token details to BOTH the client's registration number AND 6305729387 at the same time!
    const { createClientWhatsAppUrl, createCoordinatorWhatsAppUrl } = await import('./src/lib/whatsapp');
    const clientWhatsAppUrl = createClientWhatsAppUrl(updatedEntry);
    const coordinatorWhatsAppUrl = createCoordinatorWhatsAppUrl(updatedEntry);
    const whatsAppMessage = formatWhatsAppMessage(updatedEntry);

    // Simultaneously trigger WhatsApp dispatch to both numbers
    const dualDelivery = await whatsAppDeliveryManager.sendDualTokenMessage(updatedEntry);

    return res.json({
      success: true,
      entry: updatedEntry,
      whatsAppMessage,
      whatsAppUrl: coordinatorWhatsAppUrl,
      clientWhatsAppUrl,
      coordinatorWhatsAppUrl,
      clientDeliveryInfo: dualDelivery.client,
      coordinatorDeliveryInfo: dualDelivery.coordinator
    });
  } catch (err: any) {
    console.error('Error approving entry:', err);
    return res.status(500).json({ error: err?.message || 'Failed to approve entry' });
  }
});

// Admin: Real-time Server-Sent Events (SSE) Stream for WhatsApp delivery receipts
app.get('/api/admin/whatsapp/stream', (req: Request, res: Response) => {
  const token = req.query.token as string;
  if (!securityManager.verifyAdminToken(token)) {
    return res.status(401).send('Unauthorized stream access');
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  whatsAppDeliveryManager.addSseClient(clientId, res);
});

// Admin: Send WhatsApp message via API with real-time delivery receipt tracking
// Supports sending to client, coordinator (6305729387), or BOTH at a time!
app.post('/api/admin/whatsapp/send', async (req: Request, res: Response) => {
  try {
    if (!securityManager.verifyAdminToken(req.headers.authorization)) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    const { entryId, recipientType = 'both', simulateFailure = false, failureReason } = req.body;
    const allEntries = await googleSheetsService.fetchAllEntries();
    const entry = allEntries.find(e => e.id === entryId);

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    if (recipientType === 'both') {
      // Send to BOTH client and 6305729387 at the same time
      const dualDelivery = await whatsAppDeliveryManager.sendDualTokenMessage(entry, {
        simulateFailureClient: Boolean(simulateFailure)
      });
      return res.json({
        success: true,
        entry,
        clientDeliveryInfo: dualDelivery.client,
        coordinatorDeliveryInfo: dualDelivery.coordinator
      });
    } else if (recipientType === 'coordinator') {
      const deliveryInfo = await whatsAppDeliveryManager.sendTokenMessage(entry, {
        targetRole: 'coordinator',
        recipientPhone: TARGET_WHATSAPP_NUMBER,
        simulateFailure: Boolean(simulateFailure),
        failureReason
      });
      return res.json({ success: true, entry, deliveryInfo });
    } else {
      // recipientType === 'client'
      const deliveryInfo = await whatsAppDeliveryManager.sendTokenMessage(entry, {
        targetRole: 'client',
        recipientPhone: entry.phone,
        simulateFailure: Boolean(simulateFailure),
        failureReason
      });
      return res.json({ success: true, entry, deliveryInfo });
    }
  } catch (err: any) {
    console.error('Error sending WhatsApp message:', err);
    return res.status(500).json({ error: err?.message || 'Failed to send WhatsApp message' });
  }
});

// Admin: Simulate delivery state (for testing delivery receipts & failure handling)
app.post('/api/admin/whatsapp/simulate', async (req: Request, res: Response) => {
  try {
    if (!securityManager.verifyAdminToken(req.headers.authorization)) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    const { entryId, targetRole = 'client', status, failureReason } = req.body;
    const updated = whatsAppDeliveryManager.updateStatusManually(entryId, targetRole, status, failureReason);

    if (!updated) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    return res.json({ success: true, entry: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Error simulating status' });
  }
});

// Admin: Retry failed WhatsApp delivery
app.post('/api/admin/whatsapp/retry', async (req: Request, res: Response) => {
  try {
    if (!securityManager.verifyAdminToken(req.headers.authorization)) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    const { entryId, targetPhone } = req.body;
    const allEntries = await googleSheetsService.fetchAllEntries();
    const entry = allEntries.find(e => e.id === entryId);

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const deliveryInfo = await whatsAppDeliveryManager.sendTokenMessage(entry, {
      recipientPhone: targetPhone || entry.phone
    });

    return res.json({ success: true, entry, deliveryInfo });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to retry delivery' });
  }
});

// Admin: Save Meta WhatsApp Cloud API credentials
app.post('/api/admin/whatsapp/config', async (req: Request, res: Response) => {
  try {
    if (!securityManager.verifyAdminToken(req.headers.authorization)) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    const { token, phoneNumberId } = req.body;
    whatsAppDeliveryManager.setApiConfig(token || '', phoneNumberId || '');

    return res.json({
      success: true,
      status: whatsAppDeliveryManager.getStatus(),
      message: 'WhatsApp Cloud API settings saved successfully!'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to save WhatsApp config' });
  }
});

// Webhook: Meta WhatsApp Business Webhook Verification
app.get('/api/webhook/whatsapp', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const verifyToken = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'edullagudem_devi_token';

  if (mode === 'subscribe' && verifyToken === expectedToken) {
    console.log('WhatsApp Webhook verified successfully');
    return res.status(200).send(challenge);
  }
  return res.status(403).send('Verification failed');
});

// Webhook: Meta WhatsApp Business Delivery Receipts Listener
app.post('/api/webhook/whatsapp', (req: Request, res: Response) => {
  try {
    const result = whatsAppDeliveryManager.handleIncomingWebhook(req.body);
    console.log(`Processed ${result.processed} WhatsApp delivery receipts from webhook`);
    return res.status(200).json({ success: true, ...result });
  } catch (err: any) {
    console.error('Error handling WhatsApp webhook:', err);
    return res.status(200).json({ received: true }); // Always 200 OK to Meta to acknowledge receipt
  }
});

// Admin: Sync with Google Sheet
app.post('/api/admin/sync', async (req: Request, res: Response) => {
  try {
    const entries = await googleSheetsService.fetchAllEntries();
    return res.json({ success: true, count: entries.length, entries });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Sync failed' });
  }
});

async function start() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    // Dynamic import vite for development middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

start();
