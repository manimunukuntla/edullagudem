import { Entry } from '../types';

export const TARGET_WHATSAPP_NUMBER = '6305729387';

/**
 * Formats the exact WhatsApp message required by the specification:
 * 
 * ఎదుల్లగూడెం దేవి శరన్నవరాత్రులు 2026 Lucky Draw Token
 * 
 * Token No: {number}
 * Name: {name}
 * Phone: {phone}
 * Address: {address or "Not provided"}
 * Amount Paid: ₹50
 * Lucky Draw Opening Date: 21 October 2026
 * 
 * Please forward this Token message to the user.
 */
export function formatWhatsAppMessage(entry: Entry): string {
  const addressText = entry.address && entry.address.trim().length > 0 ? entry.address.trim() : 'Not provided';
  const tokenNumber = entry.tokenNo !== null && entry.tokenNo !== undefined ? entry.tokenNo : 'Pending';

  return `ఎదుల్లగూడెం దేవి శరన్నవరాత్రులు 2026 Lucky Draw Token

Token No: ${tokenNumber}
Name: ${entry.name}
Phone: ${entry.phone}
Address: ${addressText}
Amount Paid: ₹50
Lucky Draw Opening Date: 21 October 2026

Please forward this Token message to the user.`;
}

/**
 * Creates direct wa.me link for any specified phone number
 */
export function createWhatsAppUrl(entry: Entry, phoneOverride?: string): string {
  const phone = phoneOverride || TARGET_WHATSAPP_NUMBER;
  const cleanPhone = phone.replace(/\D/g, '');
  // Ensure country code 91 for Indian numbers if not already present
  const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const message = formatWhatsAppMessage(entry);
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Creates direct wa.me link specifically for the devotee / client's registered mobile number
 */
export function createClientWhatsAppUrl(entry: Entry): string {
  return createWhatsAppUrl(entry, entry.phone);
}

/**
 * Creates direct wa.me link specifically for the festival coordinator number 6305729387
 */
export function createCoordinatorWhatsAppUrl(entry: Entry): string {
  return createWhatsAppUrl(entry, TARGET_WHATSAPP_NUMBER);
}
