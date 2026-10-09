import React, { useState, useEffect } from 'react';
import { Language, DailyEventSlot, EventSlotStatus } from '../types';
import { DEFAULT_DAILY_EVENTS } from '../lib/dailyEvents';
import { DiyaIcon } from './FestiveIcons';
import {
  Calendar,
  Flame,
  Check,
  Edit2,
  Plus,
  Trash2,
  X,
  Loader2,
  Moon,
  RotateCcw,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface AdminDailyEventsManagerProps {
  language: Language;
  token: string | null;
}

export const AdminDailyEventsManager: React.FC<AdminDailyEventsManagerProps> = ({
  language,
  token,
}) => {
  const [events, setEvents] = useState<DailyEventSlot[]>(DEFAULT_DAILY_EVENTS);
  const [editingSlot, setEditingSlot] = useState<DailyEventSlot | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deleteModalSlot, setDeleteModalSlot] = useState<DailyEventSlot | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form data for editor
  const [formData, setFormData] = useState<Partial<DailyEventSlot>>({});

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/daily-events');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.events) && data.events.length > 0) {
          setEvents(data.events);
        }
      }
    } catch {
      // Use defaults
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getToken = () => {
    return token || sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
  };

  const handleOpenEdit = (slot: DailyEventSlot) => {
    setFormData({ ...slot });
    setEditingSlot(slot);
    setIsAddingNew(false);
  };

  const handleOpenAddNew = () => {
    const nextDay = events.length > 0 ? Math.max(...events.map((e) => e.dayNumber || 0)) + 1 : 1;
    setFormData({
      dayNumber: nextDay,
      dayTitleTe: `${nextDay}వ రోజు`,
      dayTitleEn: `Day ${nextDay}`,
      date: 'October 2026',
      dateTe: `${nextDay} అక్టోబర్ 2026`,
      alankaramTe: 'శ్రీ దేవి అలంకారం',
      alankaramEn: 'Sri Devi Alankaram',
      titleTe: 'నిత్య విశేష పూజా కార్యక్రమం',
      titleEn: 'Special Daily Pooja Ceremony',
      eveningSlotTe: 'సాయంత్రం 05:30 - 08:30',
      eveningSlotEn: 'Evening 05:30 PM - 08:30 PM',
      descriptionTe: 'శ్రీ దుర్గా భవానీ అమ్మవారి దివ్య దర్శనం మరియు విశేష పూజలు.',
      descriptionEn: 'Divine darshan and special pooja rituals.',
      colorTheme: 'gold',
      status: 'upcoming',
    });
    setEditingSlot(null);
    setIsAddingNew(true);
  };

  // Quick One-Click Set As Today
  const handleSetToday = async (slot: DailyEventSlot) => {
    const activeToken = getToken();
    if (!activeToken) {
      alert(language === 'te' ? 'దయచేసి లాగిన్ అవ్వండి.' : 'Please authenticate as admin.');
      return;
    }

    try {
      const res = await fetch(`/api/admin/daily-events/${slot.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({ status: 'today' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      if (Array.isArray(data.events)) {
        setEvents(data.events);
      } else {
        await fetchEvents();
      }

      window.dispatchEvent(new Event('daily_events_updated'));
      showToast(
        language === 'te'
          ? `${slot.dayTitleTe} నేటి లైవ్ పూజగా (Today) గుర్తించబడింది!`
          : `Day ${slot.dayNumber} marked as Today's Puja!`
      );
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  // Save Add / Edit
  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeToken = getToken();
    if (!activeToken) {
      alert(language === 'te' ? 'దయచేసి లాగిన్ అవ్వండి.' : 'Please authenticate as admin.');
      return;
    }

    setIsSaving(true);
    try {
      const url = isAddingNew
        ? '/api/admin/daily-events'
        : `/api/admin/daily-events/${editingSlot?.id}`;
      const method = isAddingNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save slot');

      if (Array.isArray(data.events)) {
        setEvents(data.events);
      } else {
        await fetchEvents();
      }

      window.dispatchEvent(new Event('daily_events_updated'));
      setEditingSlot(null);
      setIsAddingNew(false);
      showToast(
        language === 'te'
          ? 'దినచర్య స్లాట్ వివరాలు విజయవంతంగా భద్రపరచబడ్డాయి!'
          : 'Daily event slot saved successfully!'
      );
    } catch (err: any) {
      alert(err.message || 'Error saving slot');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Slot
  const handleDeleteSlot = async () => {
    if (!deleteModalSlot) return;
    const activeToken = getToken();
    if (!activeToken) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/daily-events/${deleteModalSlot.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete slot');

      if (Array.isArray(data.events)) {
        setEvents(data.events);
      } else {
        await fetchEvents();
      }

      window.dispatchEvent(new Event('daily_events_updated'));
      setDeleteModalSlot(null);
      showToast(
        language === 'te'
          ? 'స్లాట్ విజయవంతంగా తొలగించబడింది.'
          : 'Event slot deleted successfully.'
      );
    } catch (err: any) {
      alert(err.message || 'Error deleting slot');
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset to Defaults
  const handleResetDefaults = async () => {
    const activeToken = getToken();
    if (!activeToken) return;

    if (
      !confirm(
        language === 'te'
          ? 'అధికారిక శరన్నవరాత్రుల దినచర్య షెడ్యూల్‌ను రీసెట్ చేయాలనుకుంటున్నారా?'
          : 'Reset all daily slots to official Navarathri schedule?'
      )
    ) {
      return;
    }

    try {
      const res = await fetch('/api/admin/daily-events/reset', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset events');

      if (Array.isArray(data.events)) {
        setEvents(data.events);
      } else {
        await fetchEvents();
      }

      window.dispatchEvent(new Event('daily_events_updated'));
      showToast(
        language === 'te'
          ? 'అధికారిక శరన్నవరాత్రుల దినచర్య షెడ్యూల్ విజయవంతంగా పునరుద్ధరించబడింది.'
          : 'Reset to official schedule successfully.'
      );
    } catch (err: any) {
      alert(err.message || 'Error resetting events');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border-2 border-emerald-400 text-emerald-950 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-800 hover:text-stone-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-[#7F1D1D] to-amber-950 p-6 rounded-3xl border-3 border-amber-400 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-serif font-black text-yellow-200">
              {language === 'te'
                ? 'దినచర్య & ఈవెంట్ స్లాట్ల నిర్వహణ'
                : 'Daily Events & Slots Manager'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-bold">
              Admin Only
            </span>
          </div>
          <p className="text-xs sm:text-sm text-amber-200/90 mt-1 max-w-2xl leading-relaxed">
            {language === 'te'
              ? 'ప్రతి రోజు అమ్మవారి అలంకారం, సాయంత్రపు సమయాలు, పూజా విశేషాలను ఇక్కడ సులభంగా సవరించండి లేదా నూతన స్లాట్లు చేర్చండి.'
              : 'Add and edit daily event slots, alankarams, evening timings, and mark the active day of the festival.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="py-2.5 px-3.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-amber-200 border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Reset to default schedule"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'te' ? 'డిఫాల్ట్‌లకు రీసెట్' : 'Reset Defaults'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddNew}
            className="py-2.5 px-5 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{language === 'te' ? 'నూతన స్లాట్ జోడించండి' : 'Add Event Slot'}</span>
          </button>
        </div>
      </div>

      {/* Slots Cards List */}
      <div className="space-y-4">
        {events.map((slot) => {
          const isToday = slot.status === 'today';
          const isCompleted = slot.status === 'completed';

          return (
            <div
              key={slot.id}
              className={`rounded-2xl border-2 p-4 sm:p-5 transition-all shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                isToday
                  ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/40 shadow-sm'
                  : isCompleted
                  ? 'bg-stone-50 border-stone-200'
                  : 'bg-white border-stone-200 hover:border-amber-300'
              }`}
            >
              {/* Day info */}
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-stone-900 text-amber-300">
                    {language === 'te' ? slot.dayTitleTe : slot.dayTitleEn}
                  </span>

                  <span className="text-xs text-stone-500 font-bold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>{language === 'te' ? (slot.dateTe || slot.date) : slot.date}</span>
                  </span>

                  {isToday ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white flex items-center gap-1 animate-pulse">
                      <Flame className="w-3 h-3 text-yellow-300" />
                      <span>{language === 'te' ? 'నేటి పూజ (LIVE)' : 'TODAY ACTIVE'}</span>
                    </span>
                  ) : isCompleted ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-200 text-stone-700">
                      {language === 'te' ? 'ముగిసినది' : 'Completed'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900">
                      {language === 'te' ? 'రాబోయే రోజు' : 'Upcoming'}
                    </span>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-bold text-stone-900 font-serif">
                  {language === 'te' ? slot.alankaramTe : slot.alankaramEn}
                </h3>

                <p className="text-xs text-stone-700 font-semibold">
                  {language === 'te' ? slot.titleTe : slot.titleEn}
                </p>

                {/* Evening Timing */}
                {(slot.eveningSlotTe || slot.eveningSlotEn) && (
                  <div className="flex items-center gap-2 text-xs text-stone-600 pt-1">
                    <span className="flex items-center gap-1.5 font-mono text-[11px] bg-orange-50 text-orange-950 border border-orange-200 px-2.5 py-1 rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-orange-600" />
                      <strong>{slot.eveningSlotTe || 'సాయంత్రం 05:30 - 08:30'}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                {!isToday && (
                  <button
                    type="button"
                    onClick={() => handleSetToday(slot)}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Mark this slot as today's live pooja"
                  >
                    <Flame className="w-3.5 h-3.5 text-red-600" />
                    <span>{language === 'te' ? 'నేటి పూజగా చేయండి' : 'Set as Today'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleOpenEdit(slot)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{language === 'te' ? 'సవరించండి' : 'Edit'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteModalSlot(slot)}
                  className="p-2 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                  title="Delete slot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Slot Editor for Admin */}
      {(editingSlot || isAddingNew) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border-3 border-amber-400 overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-950 via-[#7F1D1D] to-amber-950 text-white p-4 sm:p-5 relative border-b-2 border-amber-500 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditingSlot(null);
                  setIsAddingNew(false);
                }}
                className="absolute top-3.5 right-3.5 p-2 rounded-full text-amber-200 hover:text-white hover:bg-black/30 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <DiyaIcon className="w-5 h-5 text-amber-400" />
                <span className="text-[11px] font-bold tracking-widest text-amber-300 uppercase">
                  {isAddingNew
                    ? (language === 'te' ? 'నూతన దినచర్య స్లాట్ జోడింపు' : 'ADD NEW EVENT SLOT')
                    : (language === 'te' ? 'దినచర్య స్లాట్ సవరణ' : 'EDIT EVENT SLOT')}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold font-serif text-yellow-200">
                {isAddingNew
                  ? (language === 'te' ? 'నూతన రోజు పూజా స్లాట్' : 'New Festival Event Slot')
                  : (language === 'te' ? `సవరణ: ${formData.dayTitleTe || ''}` : `Edit: ${formData.dayTitleEn || ''}`)}
              </h3>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveSlot} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {/* Day Number & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {language === 'te' ? 'రోజు సంఖ్య (Day Number)' : 'Day Number'} *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    required
                    value={formData.dayNumber || 1}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dayNumber: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {language === 'te' ? 'స్టేటస్ (Status)' : 'Status'} *
                  </label>
                  <select
                    value={formData.status || 'upcoming'}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as EventSlotStatus }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold focus:border-amber-500 focus:outline-none"
                  >
                    <option value="today">{language === 'te' ? '🔥 నేటి పూజ (Today Live)' : '🔥 Today Live'}</option>
                    <option value="upcoming">{language === 'te' ? '📅 రాబోయే రోజు (Upcoming)' : '📅 Upcoming'}</option>
                    <option value="completed">{language === 'te' ? '✓ ముగిసినది (Completed)' : '✓ Completed'}</option>
                  </select>
                </div>
              </div>

              {/* Day Titles (Telugu & English) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {language === 'te' ? 'రోజు శీర్షిక (తెలుగు)' : 'Day Title (Telugu)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.dayTitleTe || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dayTitleTe: e.target.value }))}
                    placeholder="ఉదా: 8వ రోజు (దుర్గాష్టమి)"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {language === 'te' ? 'రోజు శీర్షిక (ఇంగ్లీష్)' : 'Day Title (English)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.dayTitleEn || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dayTitleEn: e.target.value }))}
                    placeholder="e.g. Day 8 (Durgashtami)"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Date (Telugu & English) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {language === 'te' ? 'తేదీ (తెలుగు)' : 'Date (Telugu)'}
                  </label>
                  <input
                    type="text"
                    value={formData.dateTe || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dateTe: e.target.value }))}
                    placeholder="ఉదా: 19 అక్టోబర్ 2026 (సోమవారం)"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {language === 'te' ? 'తేదీ (ఇంగ్లీష్)' : 'Date (English)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.date || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    placeholder="e.g. 19 Oct 2026"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Devi Alankaram (Telugu & English) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {language === 'te' ? 'అమ్మవారి అలంకారం (తెలుగు)' : 'Devi Alankaram (Telugu)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.alankaramTe || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, alankaramTe: e.target.value }))}
                    placeholder="ఉదా: శ్రీ దుర్గా దేవి అలంకారం"
                    className="w-full px-3 py-2 rounded-xl border-2 border-amber-300 text-xs font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {language === 'te' ? 'అమ్మవారి అలంకారం (ఇంగ్లీష్)' : 'Devi Alankaram (English)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.alankaramEn || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, alankaramEn: e.target.value }))}
                    placeholder="e.g. Sri Durga Devi Alankaram"
                    className="w-full px-3 py-2 rounded-xl border-2 border-amber-300 text-xs font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Main Puja Title (Telugu & English) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {language === 'te' ? 'పూజా కార్యక్రమం పేరు (తెలుగు)' : 'Puja Event Title (Telugu)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.titleTe || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, titleTe: e.target.value }))}
                    placeholder="ఉదా: దుర్గాష్టమి మహా చండీ హోమం & పూజ"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {language === 'te' ? 'పూజా కార్యక్రమం పేరు (ఇంగ్లీష్)' : 'Puja Event Title (English)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.titleEn || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, titleEn: e.target.value }))}
                    placeholder="e.g. Durgashtami Chandi Homam"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Evening Pooja Time (Telugu & English) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {language === 'te' ? 'సాయంత్రపు పూజా సమయం (తెలుగు)' : 'Evening Pooja Time (Telugu)'}
                  </label>
                  <input
                    type="text"
                    value={formData.eveningSlotTe || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, eveningSlotTe: e.target.value }))}
                    placeholder="ఉదా: సాయంత్రం 05:30 - 08:30"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-amber-500 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {language === 'te' ? 'సాయంత్రపు పూజా సమయం (ఇంగ్లీష్)' : 'Evening Pooja Time (English)'}
                  </label>
                  <input
                    type="text"
                    value={formData.eveningSlotEn || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, eveningSlotEn: e.target.value }))}
                    placeholder="e.g. Evening 05:30 PM - 08:30 PM"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  {language === 'te' ? 'పూర్తి వివరాలు (Description)' : 'Full Details / Description'}
                </label>
                <textarea
                  rows={3}
                  value={formData.descriptionTe || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, descriptionTe: e.target.value }))}
                  placeholder="ఈ రోజు జరిగే పూజా కార్యక్రమాల సమగ్ర వివరాలు..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-amber-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-stone-200">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 stroke-[3]" />
                  )}
                  <span>{language === 'te' ? 'స్లాట్ వివరాలు భద్రపరచండి' : 'Save Event Slot'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingSlot(null);
                    setIsAddingNew(false);
                  }}
                  className="py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer"
                >
                  {language === 'te' ? 'రద్దు' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-red-300 overflow-hidden">
            <div className="bg-red-700 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-200" />
                <h3 className="font-bold text-base">
                  {language === 'te' ? 'ఈవెంట్ స్లాట్ తొలగించాలా?' : 'Delete Event Slot?'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalSlot(null)}
                className="text-red-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1">
                <p className="font-bold text-stone-900 text-sm">
                  {deleteModalSlot.dayTitleTe} - {deleteModalSlot.alankaramTe}
                </p>
                <p className="text-stone-500">{deleteModalSlot.titleTe}</p>
                {deleteModalSlot.eveningSlotTe && (
                  <p className="text-stone-600 font-mono">{deleteModalSlot.eveningSlotTe}</p>
                )}
              </div>

              <p className="text-xs text-stone-600">
                {language === 'te'
                  ? 'ఈ రోజు పూజా స్లాట్‌ను ఖచ్చితంగా తొలగించాలనుకుంటున్నారా?'
                  : 'Are you sure you want to permanently delete this event slot?'}
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalSlot(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                >
                  {language === 'te' ? 'రద్దు' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSlot}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>{language === 'te' ? 'తొలగించండి' : 'Delete'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
