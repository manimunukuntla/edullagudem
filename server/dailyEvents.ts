import path from 'path';
import { DailyEventSlot } from '../src/types';
import { DEFAULT_DAILY_EVENTS } from '../src/lib/dailyEvents';
import { writeJsonAtomic, readJsonSafe } from './atomicStorage';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const EVENTS_FILE = path.resolve(DATA_DIR, 'daily_events.json');

export { DEFAULT_DAILY_EVENTS };

class DailyEventsManager {
  private events: DailyEventSlot[];

  constructor() {
    this.events = this.loadEvents();
  }

  private loadEvents(): DailyEventSlot[] {
    const list = readJsonSafe<DailyEventSlot[]>(EVENTS_FILE, DEFAULT_DAILY_EVENTS);
    return Array.isArray(list) && list.length > 0 ? list : DEFAULT_DAILY_EVENTS;
  }

  private saveEvents(events: DailyEventSlot[]): void {
    writeJsonAtomic(EVENTS_FILE, events);
    this.events = events;
  }

  public getEvents(): DailyEventSlot[] {
    this.events = this.loadEvents();
    return [...this.events].sort((a, b) => a.dayNumber - b.dayNumber);
  }

  public getEvent(id: string): DailyEventSlot | undefined {
    return this.events.find((e) => e.id === id);
  }

  public addEvent(slotData: Partial<DailyEventSlot>): DailyEventSlot {
    const nextDayNo = this.events.length > 0
      ? Math.max(...this.events.map((e) => e.dayNumber || 0)) + 1
      : 1;

    const newSlot: DailyEventSlot = {
      id: `slot-${Date.now()}`,
      dayNumber: Number(slotData.dayNumber) || nextDayNo,
      dayTitleTe: slotData.dayTitleTe || `${nextDayNo}వ రోజు`,
      dayTitleEn: slotData.dayTitleEn || `Day ${nextDayNo}`,
      date: slotData.date || 'October 2026',
      dateTe: slotData.dateTe || `${slotData.date || ''}`,
      alankaramTe: slotData.alankaramTe || 'శ్రీ దేవి అలంకారం',
      alankaramEn: slotData.alankaramEn || 'Sri Devi Alankaram',
      titleTe: slotData.titleTe || 'నిత్య పూజా మహోత్సవం',
      titleEn: slotData.titleEn || 'Daily Puja Ceremony',
      morningSlotTe: slotData.morningSlotTe || 'ఉదయం 07:00 - 11:30',
      morningSlotEn: slotData.morningSlotEn || 'Morning 07:00 AM - 11:30 AM',
      eveningSlotTe: slotData.eveningSlotTe || 'సాయంత్రం 05:30 - 08:30',
      eveningSlotEn: slotData.eveningSlotEn || 'Evening 05:30 PM - 08:30 PM',
      descriptionTe: slotData.descriptionTe || '',
      descriptionEn: slotData.descriptionEn || '',
      prasadamTe: slotData.prasadamTe || 'మహా నైవేద్యం',
      prasadamEn: slotData.prasadamEn || 'Maha Naivedyam',
      specialSevaTe: slotData.specialSevaTe || '',
      specialSevaEn: slotData.specialSevaEn || '',
      sevakartalu: slotData.sevakartalu || 'గ్రామ భక్తులు',
      colorTheme: slotData.colorTheme || 'gold',
      status: slotData.status || 'upcoming',
      imageUrl: slotData.imageUrl || undefined,
      updatedAt: new Date().toISOString()
    };

    // If marked as 'today', unmark other 'today' statuses
    if (newSlot.status === 'today') {
      this.events = this.events.map((e) =>
        e.status === 'today' ? { ...e, status: 'upcoming' } : e
      );
    }

    this.events.push(newSlot);
    this.saveEvents(this.events);
    return newSlot;
  }

  public updateEvent(id: string, updates: Partial<DailyEventSlot>): DailyEventSlot | null {
    const index = this.events.findIndex((e) => e.id === id);
    if (index === -1) return null;

    // If updated status is 'today', unmark others
    if (updates.status === 'today') {
      this.events = this.events.map((e) =>
        e.id !== id && e.status === 'today' ? { ...e, status: 'completed' } : e
      );
    }

    const updated: DailyEventSlot = {
      ...this.events[index],
      ...updates,
      dayNumber: updates.dayNumber !== undefined ? Number(updates.dayNumber) : this.events[index].dayNumber,
      updatedAt: new Date().toISOString()
    };

    this.events[index] = updated;
    this.saveEvents(this.events);
    return updated;
  }

  public deleteEvent(id: string): boolean {
    const beforeLen = this.events.length;
    this.events = this.events.filter((e) => e.id !== id);
    if (this.events.length !== beforeLen) {
      this.saveEvents(this.events);
      return true;
    }
    return false;
  }

  public resetToDefaults(): DailyEventSlot[] {
    this.saveEvents(DEFAULT_DAILY_EVENTS);
    return [...DEFAULT_DAILY_EVENTS];
  }
}

export const dailyEventsManager = new DailyEventsManager();
