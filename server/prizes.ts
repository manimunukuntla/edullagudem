import path from 'path';
import { Prize } from '../src/types';
import { writeJsonAtomic, readJsonSafe } from './atomicStorage';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const PRIZES_FILE = path.resolve(DATA_DIR, 'prizes.json');

export const DEFAULT_PRIZES: Prize[] = [
  {
    id: 'prize-1',
    rank: '1st Prize',
    teluguRank: 'ప్రథమ బహుమతి (1st Prize)',
    title: 'Gold Coin / Hero Bike or Cash Prize',
    titleTe: 'బంగారు నాణెం / హీరో బైక్ లేదా సమాన నగదు బహుమతి',
    value: '₹25,000+',
    sponsor: 'శ్రీ ఎదుల్లగూడెం దేవి భక్త బృందం',
    colorTheme: 'gold',
    description: 'మహా లక్కీ డ్రా అత్యున్నత ప్రథమ బహుమతి - విజేతకు వేదికపై ఘన సత్కారం',
    imageUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=800&q=80',
    isPopular: true
  },
  {
    id: 'prize-2',
    rank: '2nd Prize',
    teluguRank: 'ద్వితీయ బహుమతి (2nd Prize)',
    title: 'Pure Silver Pooja Plate & Sacred Devi Articles',
    titleTe: 'స్వచ్ఛమైన వెండి పళ్లెం & దేవి పూజా సామగ్రి సెట్',
    value: '₹10,000+',
    sponsor: 'గ్రామ దాతల సౌజన్యంతో',
    colorTheme: 'silver',
    description: 'అమ్మవారి ఆశీస్సులతో పవిత్ర పూజా సామాగ్రి',
    imageUrl: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'prize-3',
    rank: '3rd Prize',
    teluguRank: 'తృతీయ బహుమతి (3rd Prize)',
    title: 'Kitchen Appliance Mega Set (Mixer / Grinder)',
    titleTe: 'స్మార్ట్ హోమ్ అప్లయన్సెస్ (మిక్సీ / గ్రైండర్ సెట్)',
    value: '₹5,000+',
    sponsor: 'ఎదుల్లగూడెం గ్రామ భక్త బృందం',
    colorTheme: 'bronze',
    description: 'గృహోపకరణాల ప్రత్యేక బహుమతి',
    imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'prize-4',
    rank: '4th Prize',
    teluguRank: 'చతుర్థ బహుమతి (4th Prize)',
    title: 'Smart LED TV / Audio Music System',
    titleTe: '43 అంగుళాల స్మార్ట్ LED టీవీ / మ్యూజిక్ సిస్టమ్',
    value: '₹15,000+',
    sponsor: 'కమిటీ సభ్యుల సౌజన్యంతో',
    colorTheme: 'emerald',
    description: 'హై-డెఫినిషన్ స్మార్ట్ ఎల్ఈడీ టీవీ',
    imageUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'prize-5',
    rank: 'Consolation',
    teluguRank: 'ప్రత్యేక ప్రోత్సాహక బహుమతులు (10 Winners)',
    title: '10 Consolation Pure Silk Sarees & Special Prasadam',
    titleTe: '10 మంది అదృష్టవంతులకు పట్టు చీరలు & విశేష అమ్మవారి ప్రసాదం',
    value: '10 Winners',
    sponsor: 'గ్రామ పెద్దల పర్యవేక్షణలో',
    colorTheme: 'red',
    description: '10 మంది విజేతలకు ప్రత్యేక ఆశీస్సులు & కానుకలు',
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'
  }
];

class PrizesManager {
  private prizes: Prize[] = [];

  constructor() {
    this.prizes = this.loadPrizes();
  }

  private loadPrizes(): Prize[] {
    const list = readJsonSafe<Prize[]>(PRIZES_FILE, DEFAULT_PRIZES);
    return Array.isArray(list) && list.length > 0 ? list : DEFAULT_PRIZES;
  }

  private savePrizes(prizesList: Prize[]): void {
    writeJsonAtomic(PRIZES_FILE, prizesList);
    this.prizes = prizesList;
  }

  public getPrizes(): Prize[] {
    this.prizes = this.loadPrizes();
    return this.prizes;
  }

  public addPrize(newPrizeData: Omit<Prize, 'id'>): Prize {
    const newPrize: Prize = {
      ...newPrizeData,
      id: `prize-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    };

    const updated = [...this.getPrizes(), newPrize];
    this.savePrizes(updated);
    return newPrize;
  }

  public updatePrize(id: string, updates: Partial<Prize>): Prize | null {
    const current = this.getPrizes();
    const index = current.findIndex(p => p.id === id);
    if (index === -1) return null;

    const updatedPrize: Prize = {
      ...current[index],
      ...updates,
      id // preserve ID
    };

    current[index] = updatedPrize;
    this.savePrizes(current);
    return updatedPrize;
  }

  public deletePrize(id: string): boolean {
    const current = this.getPrizes();
    const filtered = current.filter(p => p.id !== id);
    if (filtered.length === current.length) return false;

    this.savePrizes(filtered);
    return true;
  }

  public resetToDefaults(): Prize[] {
    this.savePrizes(DEFAULT_PRIZES);
    return DEFAULT_PRIZES;
  }
}

export const prizesManager = new PrizesManager();
