export type WhatsAppDeliveryStatus = 'not_sent' | 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

export interface WhatsAppDeliveryLog {
  timestamp: string;
  status: WhatsAppDeliveryStatus;
  note: string;
}

export interface WhatsAppDeliveryInfo {
  status: WhatsAppDeliveryStatus;
  messageId?: string;
  recipientPhone: string;
  recipientName?: string;
  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  failedAt?: string | null;
  failureReason?: string | null;
  attempts?: number;
  logs?: WhatsAppDeliveryLog[];
}

export interface Entry {
  id: string;
  tokenNo: number | null;
  name: string;
  phone: string;
  address: string;
  status: 'Pending' | 'Paid';
  submittedAt: string;
  approvedAt: string | null;
  notes?: string;
  rowIndex?: number; // 1-based index in Google Sheet
  // Client (devotee) delivery status
  whatsAppStatus?: WhatsAppDeliveryStatus;
  whatsAppInfo?: WhatsAppDeliveryInfo;
  // Coordinator (6305729387) delivery status
  coordinatorWhatsAppStatus?: WhatsAppDeliveryStatus;
  coordinatorWhatsAppInfo?: WhatsAppDeliveryInfo;
}

export type Language = 'te' | 'en';

export interface DevoteeTokenItem {
  id: string;
  name: string;
}

export interface Prize {
  id: string;
  rank: string;
  teluguRank: string;
  title: string;
  titleTe?: string;
  value: string;
  sponsor?: string;
  colorTheme?: 'gold' | 'silver' | 'bronze' | 'red' | 'emerald';
  description?: string;
  imageUrl?: string;
  isPopular?: boolean;
}

export interface Sponsor {
  id: string;
  name: string;
  nameTe?: string;
  imageUrl?: string;
  title: string;
  titleTe?: string;
  amount?: string;
  location?: string;
  phone?: string;
  isFeatured?: boolean;
  createdAt?: string;
}

export interface RegistrationFormData {
  name: string;
  phone: string;
  address: string;
  tokenCount?: number;
  tokens?: DevoteeTokenItem[];
}

export interface AdminAuthResponse {
  authenticated: boolean;
  message?: string;
}

export interface ApproveResponse {
  success: boolean;
  entry: Entry;
  whatsAppMessage: string;
  whatsAppUrl: string;
  clientWhatsAppUrl: string;
  coordinatorWhatsAppUrl: string;
  error?: string;
}

export interface FestivalProfile {
  // Visuals
  profileImage?: string | null;
  bannerImage?: string | null;

  // Primary Event Titles
  eventTitleTe: string;
  eventTitleEn: string;
  eventSubtitleTe: string;
  eventSubtitleEn: string;
  eventBadgeTe: string;
  eventBadgeEn: string;
  heroDescriptionTe: string;
  heroDescriptionEn: string;

  // Deity & Devotional Inscriptions
  deityNameTe: string;
  deityNameEn: string;
  deityTaglineTe: string;
  deityTaglineEn: string;
  sacredMantra: string;
  topInscriptionTe: string;

  // Organizer & Payment Credentials
  upiName: string;
  upiId: string;
  ticketPrice: string;
  coordinatorPhone: string;
  organizerRoleTe: string;
  organizerRoleEn: string;

  // Venue & Schedule
  drawDateTe: string;
  drawDateEn: string;
  drawTimeTe: string;
  drawTimeEn: string;
  drawNoteTe: string;
  venueNameTe: string;
  venueNameEn: string;
  venueAddressTe: string;
  venueAddressEn: string;
  committeeNameTe: string;
  committeeNameEn: string;
  committeeDescTe: string;
  committeeDescEn: string;

  updatedAt?: string;
}

export type EventSlotStatus = 'today' | 'upcoming' | 'completed';

export interface DailyEventSlot {
  id: string;
  dayNumber: number; // e.g. 1 to 10
  dayTitleTe: string; // e.g. '1వ రోజు (ప్రథమ దినం)'
  dayTitleEn: string; // e.g. 'Day 1'
  date: string; // e.g. '12 Oct 2026'
  dateTe?: string; // e.g. '12 అక్టోబర్ 2026 (సోమవారం)'
  alankaramTe: string; // e.g. 'శ్రీ బాలా త్రిపుర సుందరి దేవి'
  alankaramEn: string; // e.g. 'Sri Bala Tripura Sundari Devi'
  titleTe: string; // e.g. 'కలశ స్థాపన & గణపతి హోమం'
  titleEn: string; // e.g. 'Kalasha Sthapana & Ganapathi Homam'
  morningSlotTe?: string; // e.g. 'ఉదయం 06:30 - 11:30'
  morningSlotEn?: string; // e.g. 'Morning 6:30 AM - 11:30 AM'
  eveningSlotTe?: string; // e.g. 'సాయంత్రం 05:30 - 09:00'
  eveningSlotEn?: string; // e.g. 'Evening 5:30 PM - 9:00 PM'
  descriptionTe?: string;
  descriptionEn?: string;
  prasadamTe?: string; // e.g. 'రవ్వ కేసరి & పులిహోర'
  prasadamEn?: string; // e.g. 'Rava Kesari & Pulihora'
  specialSevaTe?: string; // e.g. 'మహా కుంకుమార్చన'
  specialSevaEn?: string; // e.g. 'Maha Kumkumarchana'
  sevakartalu?: string; // e.g. 'గ్రామ భక్త బృందం'
  colorTheme?: 'gold' | 'red' | 'purple' | 'emerald' | 'rose' | 'amber';
  status: EventSlotStatus; // 'today' | 'upcoming' | 'completed'
  imageUrl?: string;
  updatedAt?: string;
}


