import React from 'react';
import { Language } from '../types';
import { getTranslation } from '../lib/translations';
import { DeviProfileAvatar } from './DeviProfileAvatar';
import { useFestivalProfile } from '../lib/profile';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  activeTab: 'home' | 'register' | 'lookup' | 'admin';
  onSelectTab: (tab: 'home' | 'register' | 'lookup' | 'admin') => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  activeTab,
  onSelectTab,
  onOpenProfile,
}) => {
  const t = getTranslation(language);
  const { profile } = useFestivalProfile();

  const brandTitle = language === 'te'
    ? (profile.eventTitleTe || 'ఎదుల్లగూడెం దేవి లక్కీ డ్రా')
    : (profile.eventTitleEn || 'Edullagudem Devi Lucky Draw');

  return (
    <header className="sticky top-0 z-40 bg-[#7F1D1D] text-white border-b-2 border-amber-500 shadow-md">
      {/* Auspicious golden top line pattern */}
      <div className="h-1 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 w-full" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Zone 1: Brand title & Sacred Profile Avatar */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenProfile || (() => onSelectTab('home'))}
            className="group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded-full"
            title={language === 'te' ? 'అమ్మవారి దివ్య దర్శనం & ప్రొఫైల్' : 'Festival Profile & Darshan'}
          >
            <DeviProfileAvatar size="md" showHalo={true} />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-amber-400 border border-stone-900 rounded-full flex items-center justify-center text-[8px] text-stone-950 font-bold">
              ✓
            </span>
          </button>

          <button
            onClick={() => onSelectTab('home')}
            className="flex flex-col text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded-sm"
          >
            <span className="font-serif font-bold text-sm sm:text-base tracking-wide text-amber-200 group-hover:text-amber-100 transition-colors whitespace-nowrap">
              {brandTitle}
            </span>
            <span className="text-[10px] text-amber-300/80 -mt-0.5 tracking-wider uppercase hidden sm:block truncate max-w-[200px]">
              {language === 'te' ? (profile.eventSubtitleTe || 'శరన్నవరాత్రులు 2026') : (profile.eventSubtitleEn || 'Sharannavarathulu 2026')}
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
          <button
            onClick={() => onSelectTab('home')}
            className={`transition-colors pb-0.5 text-xs lg:text-sm whitespace-nowrap ${
              activeTab === 'home'
                ? 'text-yellow-300 font-semibold border-b-2 border-yellow-300'
                : 'text-amber-100/90 hover:text-yellow-200'
            }`}
          >
            {t.navHome}
          </button>
          <button
            onClick={() => {
              if (activeTab !== 'home') {
                onSelectTab('home');
                setTimeout(() => {
                  document.getElementById('daily-events-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              } else {
                document.getElementById('daily-events-section')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="text-amber-100/90 hover:text-yellow-200 transition-colors pb-0.5 text-xs lg:text-sm whitespace-nowrap cursor-pointer"
          >
            {language === 'te' ? 'పూజా స్లాట్లు' : 'Puja Slots'}
          </button>
          <button
            onClick={() => onSelectTab('register')}
            className={`transition-colors pb-0.5 text-xs lg:text-sm whitespace-nowrap ${
              activeTab === 'register'
                ? 'text-yellow-300 font-semibold border-b-2 border-yellow-300'
                : 'text-amber-100/90 hover:text-yellow-200'
            }`}
          >
            {t.navRegister} (₹50)
          </button>
          <button
            onClick={() => onSelectTab('lookup')}
            className={`transition-colors pb-0.5 text-xs lg:text-sm whitespace-nowrap ${
              activeTab === 'lookup'
                ? 'text-yellow-300 font-semibold border-b-2 border-yellow-300'
                : 'text-amber-100/90 hover:text-yellow-200'
            }`}
          >
            {t.navLookup}
          </button>
          <button
            onClick={() => onSelectTab('admin')}
            className={`transition-colors pb-0.5 text-xs lg:text-sm whitespace-nowrap ${
              activeTab === 'admin'
                ? 'text-yellow-300 font-semibold border-b-2 border-yellow-300'
                : 'text-amber-100/90 hover:text-yellow-200'
            }`}
          >
            {t.navAdmin}
          </button>
          {onOpenProfile && (
            <button
              onClick={onOpenProfile}
              className="px-2.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <DeviProfileAvatar size="xs" showHalo={false} showBorder={false} />
              <span>{language === 'te' ? 'ప్రొఫైల్' : 'Profile'}</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Language Toggle & Mobile Action */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Profile button for mobile */}
          {onOpenProfile && (
            <button
              onClick={onOpenProfile}
              className="md:hidden p-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 hover:text-white"
              title="Profile"
            >
              <DeviProfileAvatar size="xs" showHalo={false} showBorder={false} />
            </button>
          )}

          {/* Language Switcher */}
          <div className="inline-flex rounded-lg bg-red-950/70 p-0.5 border border-amber-500/40">
            <button
              type="button"
              onClick={() => onLanguageChange('te')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-all whitespace-nowrap ${
                language === 'te'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-amber-200/80 hover:text-white'
              }`}
            >
              తెలుగు
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-all whitespace-nowrap ${
                language === 'en'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-amber-200/80 hover:text-white'
              }`}
            >
              English
            </button>
          </div>

          {/* Quick CTA on Mobile */}
          <button
            onClick={() => onSelectTab('register')}
            className="md:hidden px-2.5 py-1 text-xs font-bold rounded bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 hover:from-amber-300 hover:to-amber-400 shadow transition-colors whitespace-nowrap"
          >
            ₹50 Pay
          </button>
        </div>
      </div>

      {/* Mobile subnav row */}
      <div className="md:hidden flex items-center justify-around border-t border-red-900/60 bg-red-950/90 px-2 py-1.5 text-xs">
        <button
          onClick={() => onSelectTab('home')}
          className={`px-2 py-1 ${activeTab === 'home' ? 'text-amber-300 font-bold' : 'text-amber-100/80'}`}
        >
          {t.navHome}
        </button>
        <button
          onClick={() => onSelectTab('register')}
          className={`px-2 py-1 ${activeTab === 'register' ? 'text-amber-300 font-bold' : 'text-amber-100/80'}`}
        >
          {t.navRegister}
        </button>
        <button
          onClick={() => onSelectTab('lookup')}
          className={`px-2 py-1 ${activeTab === 'lookup' ? 'text-amber-300 font-bold' : 'text-amber-100/80'}`}
        >
          {t.navLookup}
        </button>
        <button
          onClick={() => onSelectTab('admin')}
          className={`px-2 py-1 ${activeTab === 'admin' ? 'text-amber-300 font-bold' : 'text-amber-100/80'}`}
        >
          {t.navAdmin}
        </button>
      </div>
    </header>
  );
};
