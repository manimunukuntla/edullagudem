import path from 'path';
import { FestivalProfile } from '../src/types';
import { writeJsonAtomic, readJsonSafe } from './atomicStorage';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const PROFILE_FILE = path.resolve(DATA_DIR, 'profile.json');

export const DEFAULT_PROFILE: FestivalProfile = {
  profileImage: null,
  bannerImage: null,

  // Primary Event Titles
  eventTitleTe: 'ఎదుల్లగూడెం దేవి శరన్నవరాత్రులు 2026',
  eventTitleEn: 'Edullagudem Devi Sharannavarathulu 2026',
  eventSubtitleTe: 'శ్రీ దుర్గా భవానీ ఉత్సవ కమిటీ ప్రొఫైల్ & లక్కీ డ్రా',
  eventSubtitleEn: 'Sri Durga Bhavani Utsav Committee & Lucky Draw Portal',
  eventBadgeTe: 'మహా లక్కీ డ్రా మహోత్సవం',
  eventBadgeEn: 'Grand Lucky Draw Festival',
  heroDescriptionTe: 'అమ్మవారి దివ్య కృపా కటాక్షాలతో ₹50 టోకెన్ చెల్లించి ఎదుల్లగూడెం దేవి శరన్నవరాత్రుల లక్కీ డ్రాలో పాల్గొనండి!',
  heroDescriptionEn: 'Participate in the auspicious Sri Edullagudem Devi Sharannavarathulu lucky draw with ₹50 entry fee and receive your digital sequential token!',

  // Deity & Devotional Inscriptions
  deityNameTe: 'శ్రీ ఎదుల్లగూడెం దేవి అమ్మవారు',
  deityNameEn: 'Sri Edullagudem Devi Ammavaru',
  deityTaglineTe: 'త్రిశూలధారిణి · శరన్నవరాత్రుల ప్రధాన దివ్య దర్శనం',
  deityTaglineEn: 'Sharannavarathulu Official Deity',
  sacredMantra: 'సర్వ మంగళ మాంగల్యే శివే సర్వార్థ సాధికే । శరణ్యే త్ర్యంబకే గౌరీ నారాయణి నమోస్తుతే ॥',
  topInscriptionTe: '॥ శ్రీ దుర్గా భవానీ ప్రసన్న ॥',

  // Organizer & Payment Credentials
  upiName: 'KANDALA KIRAN REDDY',
  upiId: '9573454579@postbank',
  ticketPrice: '50',
  coordinatorPhone: '6305729387',
  organizerRoleTe: 'నిర్వాహకులు & పూజా కమిటీ',
  organizerRoleEn: 'Festival Organizer & Committee',

  // Venue & Schedule
  drawDateTe: '11 అక్టోబర్ 2026 నుండి 21 అక్టోబర్ 2026 వరకు',
  drawDateEn: '11 October 2026 to 21 October 2026',
  drawTimeTe: 'సాయంత్రం 6:00 గంటలకు ఎదుల్లగూడెం దేవి ఆలయ ప్రాంగణంలో భక్తుల సమక్షంలో పారదర్శక డ్రా.',
  drawTimeEn: 'Evening 6:00 PM at Temple Premises in presence of devotees.',
  drawNoteTe: 'విజయదశమి ముగింపు సాయంత్రం',
  venueNameTe: 'ఎదుల్లగూడెం (Edullagudem)',
  venueNameEn: 'Edullagudem Village',
  venueAddressTe: 'శ్రీ కనకదుర్గ అమ్మవారి దేవాలయం, ఇల్లందు మండలం, భద్రాద్రి కొత్తగూడెం జిల్లా, తెలంగాణ.',
  venueAddressEn: 'Sri Kanakadurga Temple, Yellandu Mandal, Bhadradri Kothagudem Dist, Telangana.',
  committeeNameTe: 'ఎదుల్లగూడెం దేవి ఉత్సవ కమిటీ',
  committeeNameEn: 'Edullagudem Devi Utsava Committee',
  committeeDescTe: 'గ్రామ పెద్దలు & భక్తుల సమన్వయంతో భక్తిశ్రద్ధలతో నిర్వహించబడుతున్న శరన్నవరాత్రోత్సవాలు.',
  committeeDescEn: 'Organized with devotion by village elders and committee.'
};

class ProfileManager {
  private profile: FestivalProfile;

  constructor() {
    this.profile = this.loadProfile();
  }

  private loadProfile(): FestivalProfile {
    const data = readJsonSafe<Partial<FestivalProfile>>(PROFILE_FILE, DEFAULT_PROFILE);
    return {
      ...DEFAULT_PROFILE,
      ...data,
      profileImage: data.profileImage || null,
      bannerImage: data.bannerImage || null
    };
  }

  private saveProfile(profileData: FestivalProfile): void {
    writeJsonAtomic(PROFILE_FILE, profileData);
    this.profile = profileData;
  }

  public getProfile(): FestivalProfile {
    this.profile = this.loadProfile();
    return { ...this.profile };
  }

  public updateProfile(updates: Partial<FestivalProfile>): FestivalProfile {
    const current = this.getProfile();
    const updated: FestivalProfile = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // If profileImage is explicitly undefined, keep existing
    if (updates.profileImage === undefined) {
      updated.profileImage = current.profileImage;
    }

    this.saveProfile(updated);
    return updated;
  }

  public resetToDefaults(keepImage: boolean = true): FestivalProfile {
    const current = this.getProfile();
    const reset: FestivalProfile = {
      ...DEFAULT_PROFILE,
      profileImage: keepImage ? current.profileImage : null,
      updatedAt: new Date().toISOString()
    };
    this.saveProfile(reset);
    return reset;
  }
}

export const profileManager = new ProfileManager();
