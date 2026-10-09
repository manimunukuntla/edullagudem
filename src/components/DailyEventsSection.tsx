import React, { useState, useEffect } from 'react';
import { Language, DailyEventSlot } from '../types';
import { DEFAULT_DAILY_EVENTS } from '../lib/dailyEvents';
import { DiyaIcon, KalasamIcon } from './FestiveIcons';
import {
  Calendar,
  Flame,
  Moon,
  Clock
} from 'lucide-react';

interface DailyEventsSectionProps {
  language: Language;
}

export const DailyEventsSection: React.FC<DailyEventsSectionProps> = ({
  language,
}) => {
  const [events, setEvents] = useState<DailyEventSlot[]>(DEFAULT_DAILY_EVENTS);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');

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
      // Use fallback
    }
  };

  useEffect(() => {
    fetchEvents();

    const handleEventsUpdated = () => {
      fetchEvents();
    };

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchEvents();
      }
    };

    window.addEventListener('daily_events_updated', handleEventsUpdated);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchEvents();
      }
    }, 12000);

    return () => {
      clearInterval(timer);
      window.removeEventListener('daily_events_updated', handleEventsUpdated);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  // Filter events
  const filteredEvents = events.filter((ev) => {
    if (selectedDayNumber !== 'all' && ev.dayNumber !== selectedDayNumber) {
      return false;
    }
    if (statusFilter !== 'all' && ev.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const todayEvent = events.find((e) => e.status === 'today');

  return (
    <div className="space-y-6 my-10 animate-fadeIn" id="daily-events-section">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-[#7F1D1D] to-amber-950 rounded-3xl p-5 sm:p-7 border-2 border-amber-400/80 text-white shadow-xl relative overflow-hidden">
        {/* Background festive motif */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <DiyaIcon className="w-5 h-5 text-amber-400" />
              <span className="text-[11px] font-bold tracking-widest text-amber-300 uppercase">
                {language === 'te' ? 'నిత్య పూజా & ఉత్సవ కార్యక్రమాలు' : 'DAILY FESTIVAL EVENTS'}
              </span>
              <KalasamIcon className="w-5 h-5 text-amber-400" />
            </div>

            <h2 className="text-xl sm:text-3xl font-black font-serif text-yellow-200">
              {language === 'te'
                ? 'శరన్నవరాత్రుల దినచర్య & పూజా సమయాలు'
                : 'Sharannavarathri Daily Schedule'}
            </h2>
            <p className="text-xs sm:text-sm text-amber-200/90 mt-1 max-w-2xl leading-relaxed">
              {language === 'te'
                ? 'ప్రతి రోజు అమ్మవారి విశేష అలంకారం, పూజా కార్యక్రమాలు మరియు సాయంత్రపు సమయాల వివరాలు.'
                : 'Complete schedule of sacred Devi Alankarams, puja rituals, and evening ceremony timings.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {todayEvent && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDayNumber(todayEvent.dayNumber);
                  setStatusFilter('all');
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold border border-amber-300 shadow flex items-center gap-1.5 cursor-pointer animate-pulse"
              >
                <Flame className="w-4 h-4 text-yellow-300" />
                <span>
                  {language === 'te' ? `నేటి పూజ: ${todayEvent.dayTitleTe}` : `Today: Day ${todayEvent.dayNumber}`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Day Selector Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-3 sm:p-4 shadow-xs space-y-3">
        {/* Top Filter Tabs: All, Today, Upcoming, Completed */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-bold text-stone-500 mr-1 hidden sm:inline">
              {language === 'te' ? 'ఫిల్టర్:' : 'Filter:'}
            </span>

            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setSelectedDayNumber('all');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                statusFilter === 'all' && selectedDayNumber === 'all'
                  ? 'bg-stone-900 text-amber-300 shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {language === 'te' ? 'మొత్తం (అన్ని రోజులు)' : 'All Days'}
            </button>

            {todayEvent && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('today');
                  setSelectedDayNumber('all');
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  statusFilter === 'today'
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>{language === 'te' ? 'నేటి విశేష పూజ' : "Today's Puja"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setStatusFilter('upcoming');
                setSelectedDayNumber('all');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                statusFilter === 'upcoming'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {language === 'te' ? 'రాబోయే కార్యక్రమాలు' : 'Upcoming'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStatusFilter('completed');
                setSelectedDayNumber('all');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-stone-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {language === 'te' ? 'ముగిసినవి' : 'Completed'}
            </button>
          </div>
        </div>

        {/* Day Number Pills (1 to 10) for quick day jumps */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-stone-100">
          <button
            type="button"
            onClick={() => setSelectedDayNumber('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedDayNumber === 'all'
                ? 'bg-amber-500 text-stone-950 font-black ring-2 ring-amber-400'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            {language === 'te' ? 'అన్ని రోజులు' : 'All Days'}
          </button>

          {events.map((slot) => {
            const isToday = slot.status === 'today';
            const isSelected = selectedDayNumber === slot.dayNumber;
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => {
                  setSelectedDayNumber(slot.dayNumber);
                  setStatusFilter('all');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-stone-900 text-amber-300 ring-2 ring-amber-400 shadow-xs'
                    : isToday
                    ? 'bg-red-100 text-red-900 border border-red-300 font-black'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {isToday && <span className="w-2 h-2 rounded-full bg-red-600 animate-ping mr-0.5" />}
                <span>{language === 'te' ? `${slot.dayNumber}వ రోజు` : `Day ${slot.dayNumber}`}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards Grid: Daily Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredEvents.map((slot) => {
          const isToday = slot.status === 'today';
          const isCompleted = slot.status === 'completed';

          return (
            <div
              key={slot.id}
              className={`rounded-3xl border-2 transition-all overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md ${
                isToday
                  ? 'bg-gradient-to-b from-amber-50 via-white to-red-50/30 border-amber-400 ring-2 ring-amber-400/40'
                  : isCompleted
                  ? 'bg-stone-50/80 border-stone-200 opacity-95'
                  : 'bg-white border-amber-200 hover:border-amber-300'
              }`}
            >
              {/* Card Top Ribbon */}
              <div
                className={`p-4 sm:p-5 border-b ${
                  isToday
                    ? 'bg-gradient-to-r from-red-900 via-amber-900 to-red-900 text-amber-100 border-amber-400/50'
                    : 'bg-stone-900 text-stone-100 border-stone-800'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-400 text-stone-950">
                      {language === 'te' ? slot.dayTitleTe : slot.dayTitleEn}
                    </span>

                    {/* Status Badge */}
                    {isToday && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-600 text-white flex items-center gap-1 shadow-xs animate-pulse">
                        <Flame className="w-3 h-3 text-yellow-300" />
                        <span>{language === 'te' ? 'నేటి పూజ (LIVE)' : 'TODAY LIVE'}</span>
                      </span>
                    )}

                    {isCompleted && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-700 text-stone-300">
                        {language === 'te' ? 'ముగిసినది' : 'Completed'}
                      </span>
                    )}

                    {!isToday && !isCompleted && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-900/60 text-amber-200 border border-amber-500/30">
                        {language === 'te' ? 'రాబోయే రోజు' : 'Upcoming'}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold font-serif text-yellow-200 leading-snug">
                    {language === 'te' ? slot.alankaramTe : slot.alankaramEn}
                  </h3>
                  <p className="text-xs text-amber-200/80 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{language === 'te' ? (slot.dateTe || slot.date) : slot.date}</span>
                  </p>
                </div>
              </div>

              {/* Card Body Details */}
              <div className="p-4 sm:p-5 space-y-3.5 flex-1">
                {/* Event Title & Description */}
                <div>
                  <h4 className="font-bold text-stone-900 text-sm sm:text-base leading-snug">
                    {language === 'te' ? slot.titleTe : slot.titleEn}
                  </h4>
                  {(slot.descriptionTe || slot.descriptionEn) && (
                    <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                      {language === 'te'
                        ? (slot.descriptionTe || slot.descriptionEn)
                        : (slot.descriptionEn || slot.descriptionTe)}
                    </p>
                  )}
                </div>

                {/* Evening Pooja Timing Slot */}
                {(slot.eveningSlotTe || slot.eveningSlotEn) && (
                  <div className="p-3 rounded-2xl bg-orange-50/90 border border-orange-200 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-200 text-orange-950 flex items-center justify-center shrink-0">
                      <Clock className="w-4.5 h-4.5 text-orange-900" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-orange-950 uppercase tracking-wider block">
                        {language === 'te' ? 'సాయంత్రపు పూజా సమయం' : 'Evening Pooja Timing'}
                      </span>
                      <p className="font-bold text-stone-900 text-xs sm:text-sm mt-0.5">
                        {language === 'te'
                          ? (slot.eveningSlotTe || 'సాయంత్రం 05:30 - 08:30')
                          : (slot.eveningSlotEn || 'Evening 05:30 PM - 08:30 PM')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="p-3 bg-stone-100/90 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
                <span className="font-serif text-[11px] text-amber-900 font-bold">
                  {language === 'te' ? '॥ శ్రీ మాత్రే నమః ॥' : 'Sri Matre Namaha'}
                </span>
                <span className="text-[10px] font-medium text-stone-500">
                  {language === 'te' ? `దినం #${slot.dayNumber}` : `Day #${slot.dayNumber}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
