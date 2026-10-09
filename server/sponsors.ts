import path from 'path';
import { Sponsor } from '../src/types';
import { writeJsonAtomic, readJsonSafe } from './atomicStorage';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const SPONSORS_FILE = path.resolve(DATA_DIR, 'sponsors.json');

export const DEFAULT_SPONSORS: Sponsor[] = [
  {
    id: 'sponsor-1',
    name: 'Sri Edullagudem Devi Bhaktha Brundam',
    nameTe: 'శ్రీ ఎదుల్లగూడెం దేవి భక్త బృందం',
    title: '1st Prize Gold Coin / Hero Bike Sponsor',
    titleTe: 'ప్రథమ బహుమతి (బంగారు నాణెం / బైక్) ప్రధాన దాతలు',
    amount: '₹25,000+',
    location: 'Edullagudem',
    isFeatured: true,
    imageUrl: '',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sponsor-2',
    name: 'Village Elders & Donors Committee',
    nameTe: 'గ్రామ దాతలు & పెద్దల సౌజన్యం',
    title: '2nd Prize Pure Silver Pooja Plate Sponsor',
    titleTe: 'ద్వితీయ బహుమతి వెండి పళ్లెం & పూజా సామగ్రి దాతలు',
    amount: '₹10,000+',
    location: 'Edullagudem',
    isFeatured: false,
    imageUrl: '',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sponsor-3',
    name: 'Edullagudem Bhakta Brundam',
    nameTe: 'ఎదుల్లగూడెం గ్రామ భక్త బృందం',
    title: '3rd Prize Home Appliances Set Sponsor',
    titleTe: 'తృతీయ బహుమతి గృహోపకరణాల సెట్ దాతలు',
    amount: '₹5,000+',
    location: 'Edullagudem',
    isFeatured: false,
    imageUrl: '',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sponsor-4',
    name: 'Sri Kanakadurga Utsava Samithi Members',
    nameTe: 'శ్రీ కనకదుర్గ ఉత్సవ సమితి సభ్యులు',
    title: '4th Prize Smart LED TV Sponsor',
    titleTe: 'చతుర్థ బహుమతి స్మార్ట్ LED టీవీ దాతలు',
    amount: '₹15,000+',
    location: 'Edullagudem',
    isFeatured: false,
    imageUrl: '',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sponsor-5',
    name: 'Sharannavarathri Annadana Maha Daatalu',
    nameTe: 'శరన్నవరాత్రి అన్నదాన మహా దాతలు',
    title: '9 Days Daily Annadanam & Prasadam Donors',
    titleTe: '9 రోజుల నిత్య అన్నదాన & విశేష ప్రసాద వితరణ దాతలు',
    amount: 'Maha Seva',
    location: 'Edullagudem',
    isFeatured: true,
    imageUrl: '',
    createdAt: new Date().toISOString()
  }
];

class SponsorsManager {
  private sponsors: Sponsor[] = [];

  constructor() {
    this.sponsors = this.loadSponsors();
  }

  private loadSponsors(): Sponsor[] {
    const list = readJsonSafe<Sponsor[]>(SPONSORS_FILE, DEFAULT_SPONSORS);
    return Array.isArray(list) && list.length > 0 ? list : DEFAULT_SPONSORS;
  }

  private saveSponsors(sponsorsList: Sponsor[]): void {
    writeJsonAtomic(SPONSORS_FILE, sponsorsList);
    this.sponsors = sponsorsList;
  }

  public getSponsors(): Sponsor[] {
    this.sponsors = this.loadSponsors();
    return [...this.sponsors];
  }

  public addSponsor(data: Partial<Sponsor>): Sponsor {
    const newSponsor: Sponsor = {
      id: `sponsor-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: (data.name || '').trim(),
      nameTe: (data.nameTe || data.name || '').trim(),
      title: (data.title || '').trim(),
      titleTe: (data.titleTe || data.title || '').trim(),
      amount: (data.amount || '').trim(),
      location: (data.location || '').trim(),
      phone: (data.phone || '').trim(),
      isFeatured: Boolean(data.isFeatured),
      imageUrl: (data.imageUrl || '').trim(),
      createdAt: new Date().toISOString()
    };

    const current = this.getSponsors();
    current.push(newSponsor);
    this.saveSponsors(current);
    return newSponsor;
  }

  public updateSponsor(id: string, updates: Partial<Sponsor>): Sponsor | null {
    const current = this.getSponsors();
    const index = current.findIndex(s => s.id === id);
    if (index === -1) return null;

    const existing = current[index];
    const updated: Sponsor = {
      ...existing,
      name: updates.name !== undefined ? updates.name.trim() : existing.name,
      nameTe: updates.nameTe !== undefined ? updates.nameTe.trim() : existing.nameTe,
      title: updates.title !== undefined ? updates.title.trim() : existing.title,
      titleTe: updates.titleTe !== undefined ? updates.titleTe.trim() : existing.titleTe,
      amount: updates.amount !== undefined ? updates.amount.trim() : existing.amount,
      location: updates.location !== undefined ? updates.location.trim() : existing.location,
      phone: updates.phone !== undefined ? updates.phone.trim() : existing.phone,
      isFeatured: updates.isFeatured !== undefined ? Boolean(updates.isFeatured) : existing.isFeatured,
      imageUrl: updates.imageUrl !== undefined ? updates.imageUrl.trim() : existing.imageUrl
    };

    current[index] = updated;
    this.saveSponsors(current);
    return updated;
  }

  public deleteSponsor(id: string): boolean {
    const current = this.getSponsors();
    const filtered = current.filter(s => s.id !== id);
    if (filtered.length === current.length) return false;

    this.saveSponsors(filtered);
    return true;
  }

  public resetToDefaults(): Sponsor[] {
    this.saveSponsors(DEFAULT_SPONSORS);
    return [...DEFAULT_SPONSORS];
  }
}

export const sponsorsManager = new SponsorsManager();
