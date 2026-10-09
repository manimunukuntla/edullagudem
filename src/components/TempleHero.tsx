import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { getTranslation } from '../lib/translations';
import { DiyaIcon, KalasamIcon } from './FestiveIcons';
import { Calendar, Ticket, ShieldCheck, Sparkles, Phone, Eye, MapPin, Edit3 } from 'lucide-react';
import { DEFAULT_DEVI_PROFILE_STORAGE_KEY } from './DeviProfileAvatar';
import { TARGET_WHATSAPP_NUMBER } from '../lib/whatsapp';
import { SacredMurtiArt } from './DeviBanner';
import { useFestivalProfile } from '../lib/profile';

interface TempleHeroProps {
  language: Language;
  onStartRegistration: () => void;
  onCheckStatus: () => void;
  onOpenProfile?: () => void;
}

export const TempleHero: React.FC<TempleHeroProps> = ({
  language,
  onStartRegistration,
  onCheckStatus,
  onOpenProfile,
}) => {
  const t = getTranslation(language);
  const { profile } = useFestivalProfile();
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return Boolean(sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token'));
  });

  // Track admin auth state changes
  useEffect(() => {
    const handleAuthChange = () => {
      setIsAdmin(Boolean(sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token')));
    };
    window.addEventListener('admin_auth_changed', handleAuthChange);
    return () => window.removeEventListener('admin_auth_changed', handleAuthChange);
  }, []);

  const activeImage = profile.profileImage || profile.bannerImage || null;
  const currentTicketPrice = profile.ticketPrice || '50';
  const currentDrawDate = language === 'te'
    ? (profile.drawDateTe || '11 అక్టోబర్ 2026 నుండి 21 అక్టోబర్ 2026 వరకు')
    : (profile.drawDateEn || '11 October 2026 to 21 October 2026');
  const currentDrawNote = profile.drawNoteTe || 'విజయదశమి ముగింపు సాయంత్రం';

  const currentEventTitle = language === 'te'
    ? (profile.eventTitleTe || 'ఎదుల్లగూడెం దేవి శరన్నవరాత్రులు 2026')
    : (profile.eventTitleEn || 'Edullagudem Devi Sharannavarathulu 2026');

  const currentEventSubtitle = language === 'te'
    ? (profile.eventSubtitleTe || 'శ్రీ దుర్గా భవానీ ఉత్సవ కమిటీ ప్రొఫైల్ & లక్కీ డ్రా')
    : (profile.eventSubtitleEn || 'Sri Durga Bhavani Utsav Committee & Lucky Draw Portal');

  const currentBadge = language === 'te'
    ? (profile.eventBadgeTe || 'మహా లక్కీ డ్రా మహోత్సవం')
    : (profile.eventBadgeEn || 'Grand Lucky Draw Festival');

  const currentHeroDesc = language === 'te'
    ? (profile.heroDescriptionTe || `అమ్మవారి దివ్య కృపా కటాక్షాలతో ₹${currentTicketPrice} టోకెన్ చెల్లించి ఎదుల్లగూడెం దేవి శరన్నవరాత్రుల లక్కీ డ్రాలో పాల్గొనండి!`)
    : (profile.heroDescriptionEn || `Participate in the auspicious Sri Edullagudem Devi Sharannavarathulu lucky draw with ₹${currentTicketPrice} entry fee and receive your digital sequential token!`);

  const currentDeityName = language === 'te'
    ? (profile.deityNameTe || 'శ్రీ ఎదుల్లగూడెం దేవి అమ్మవారు')
    : (profile.deityNameEn || 'Sri Edullagudem Devi Ammavaru');

  const currentDeityTagline = language === 'te'
    ? (profile.deityTaglineTe || 'త్రిశూలధారిణి · శరన్నవరాత్రుల ప్రధాన దివ్య దర్శనం')
    : (profile.deityTaglineEn || 'Sharannavarathulu Official Deity');

  const topInscription = profile.topInscriptionTe || '॥ శ్రీ దుర్గా భవానీ ప్రసన్న ॥';
  const coordinatorPhone = profile.coordinatorPhone || TARGET_WHATSAPP_NUMBER;
  const upiId = profile.upiId || '9573454579@postbank';
  const upiName = profile.upiName || 'KANDALA KIRAN REDDY';

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#4A0E17] via-[#7F1D1D] to-[#3B0712] text-amber-50 border-b-4 border-amber-500 shadow-2xl">
      {/* Traditional Marigold Flower Garland (బంతిపూల తోరణం) & Mango leaves along top border */}
      <div className="w-full h-3 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 flex items-center justify-around overflow-hidden shadow-inner">
        {Array.from({ length: 32 }).map((_, i) => (
          <span key={i} className="text-[10px] leading-none select-none">
            {i % 2 === 0 ? '🌼' : '🍃'}
          </span>
        ))}
      </div>

      {/* Decorative Traditional Rangoli Kolam watermark */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, #FDE047 2%, transparent 0%), radial-gradient(circle at 75px 75px, #F59E0B 2%, transparent 0%)`,
          backgroundSize: '100px 100px',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-9">
        {/* Top Auspicious Inscription Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-4 text-center">
          <DiyaIcon className="w-6 h-6 text-amber-400 shrink-0" />
          <span className="font-serif text-xs sm:text-sm font-bold text-amber-300 tracking-widest uppercase">
            {topInscription}
          </span>
          <span className="hidden sm:inline text-amber-400/50">·</span>
          <span className="hidden sm:inline text-xs text-amber-200/90 font-medium">
            {currentEventTitle}
          </span>
          <KalasamIcon className="w-6 h-6 text-amber-400 shrink-0" />

          {/* Admin Live Quick Edit Shortcut */}
          {isAdmin && onOpenProfile && (
            <button
              type="button"
              onClick={onOpenProfile}
              className="ml-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 hover:bg-amber-300 text-stone-950 text-[11px] font-bold shadow transition-all cursor-pointer border border-amber-300 animate-pulse"
              title="అడ్మిన్: ప్రొఫైల్ శీర్షికలు & వివరాలు సవరించండి"
            >
              <Edit3 className="w-3 h-3 text-stone-950" />
              <span>{language === 'te' ? 'అడ్మిన్: శీర్షికలు సవరించండి' : 'Admin: Edit Titles'}</span>
            </button>
          )}
        </div>

        {/* Widescreen Banner Container */}
        <div className="relative rounded-2xl sm:rounded-3xl border-2 sm:border-3 border-amber-400/70 bg-gradient-to-r from-black/60 via-amber-950/40 to-black/70 p-4 sm:p-7 shadow-2xl backdrop-blur-xs overflow-hidden">
          {/* Ornate Corner Accents */}
          <div className="absolute top-2 left-2 text-amber-400 text-xs sm:text-sm select-none">⚜️</div>
          <div className="absolute top-2 right-2 text-amber-400 text-xs sm:text-sm select-none">⚜️</div>
          <div className="absolute bottom-2 left-2 text-amber-400 text-xs sm:text-sm select-none">⚜️</div>
          <div className="absolute bottom-2 right-2 text-amber-400 text-xs sm:text-sm select-none">⚜️</div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left Column: Grand Sacred Murti Banner Visual */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              <div
                onClick={onOpenProfile}
                className="relative group cursor-pointer max-w-[280px] sm:max-w-[320px] w-full rounded-2xl overflow-hidden shadow-2xl border-3 border-amber-300 ring-4 ring-amber-500/30 transition-transform duration-300 hover:scale-[1.02]"
                title="క్లిక్ చేసి అమ్మవారి పూర్తి దర్శనం & ప్రొఫైల్ వివరాలు చూడండి (Click for Full Darshan)"
              >
                {/* Glowing halo pulse behind the image */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-200 to-red-500 opacity-50 blur-md group-hover:opacity-75 transition-opacity" />

                <div className="relative aspect-[3/4] w-full bg-gradient-to-b from-amber-950 to-stone-950 flex items-center justify-center overflow-hidden">
                  {activeImage ? (
                    <img
                      src={activeImage}
                      alt={currentDeityName}
                      className="w-full h-full object-cover object-center"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <SacredMurtiArt className="w-full h-full object-cover" />
                  )}

                  {/* Sacred Bottom Overlay Badge */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3 pt-6 text-center">
                    <p className="font-serif font-black text-amber-200 text-sm sm:text-base leading-tight drop-shadow">
                      {currentDeityName}
                    </p>
                    <p className="text-[11px] text-amber-300/90 font-medium">
                      {currentDeityTagline}
                    </p>
                  </div>

                  {/* Click to expand darshan hint */}
                  <div className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/60 text-amber-300 backdrop-blur-xs group-hover:scale-110 transition-transform">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* View Darshan Button */}
              {onOpenProfile && (
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-400/20 hover:bg-amber-400/35 border border-amber-300/50 text-amber-200 hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'te' ? 'అమ్మవారి దర్శనం & ప్రొఫైల్ వివరాలు' : 'Divine Darshan & Festival Profile'}</span>
                </button>
              )}
            </div>

            {/* Right Column: Festival Titles, Credentials & Registration CTAs */}
            <div className="md:col-span-7 flex flex-col justify-center text-center md:text-left space-y-4">
              {/* Event Badge */}
              <div className="inline-flex items-center justify-center md:justify-start gap-2">
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-red-600 to-amber-600 border border-amber-300 text-yellow-100 text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
                  <span>{currentBadge}</span>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-bold">
                  2026
                </span>
              </div>

              {/* Main Festival Title Banner */}
              <div>
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-amber-200 tracking-tight leading-tight drop-shadow-lg">
                  {profile.eventTitleTe || 'ఎదుల్లగూడెం దేవి శరన్నవరాత్రులు'}
                </h1>
                <h2 className="text-lg sm:text-2xl font-serif font-bold text-yellow-300 mt-1 drop-shadow">
                  {profile.eventTitleEn || 'Edullagudem Devi Sharannavarathulu 2026'}
                </h2>
                <p className="text-xs sm:text-sm text-amber-100/90 mt-2 font-normal leading-relaxed">
                  {currentHeroDesc}
                </p>
              </div>

              {/* Highlights Ribbon: Date, Price, Venue */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* Lucky Draw Date */}
                <div className="p-3 rounded-xl bg-black/40 border border-amber-400/40 flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-700 to-amber-700 flex items-center justify-center shrink-0 shadow">
                    <Calendar className="w-5 h-5 text-amber-200" />
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                      {language === 'te' ? 'లక్కీ డ్రా తేదీ' : 'Grand Draw Date'}
                    </span>
                    <p className="font-bold text-white text-sm sm:text-base leading-tight">
                      {currentDrawDate}
                    </p>
                    <span className="text-[10px] text-amber-200/80">{currentDrawNote}</span>
                  </div>
                </div>

                {/* Entry Fee Box */}
                <div className="p-3 rounded-xl bg-black/40 border border-amber-400/40 flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shrink-0 shadow">
                    <Ticket className="w-5 h-5 text-stone-950 font-bold" />
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                      {language === 'te' ? 'టోకెన్ రుసుము' : 'Entry Ticket'}
                    </span>
                    <p className="font-black text-amber-300 text-lg sm:text-xl leading-tight">
                      ₹{currentTicketPrice} <span className="text-xs text-amber-100 font-semibold">/ {language === 'te' ? 'టోకెన్' : 'Token'}</span>
                    </p>
                    <span className="text-[10px] text-emerald-300 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> {language === 'te' ? 'సురక్షిత UPI పేమెంట్' : 'Verified UPI Payment'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onStartRegistration}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-base font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-stone-950 shadow-xl hover:shadow-amber-400/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-200"
                >
                  <Ticket className="w-5 h-5 text-stone-950" />
                  <span>
                    {language === 'te'
                      ? `ఇప్పుడే ₹${currentTicketPrice} చెల్లించి టోకెన్ పొందండి`
                      : `Register Now (Pay ₹${currentTicketPrice})`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onCheckStatus}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold bg-white/10 hover:bg-white/20 text-amber-100 border border-amber-300/50 hover:border-amber-300 transition-colors backdrop-blur-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{language === 'te' ? 'నా టోకెన్ తనిఖీ చేయండి' : 'Find My Token'}</span>
                </button>
              </div>

              {/* Verified Organizer Credentials Footer */}
              <div className="pt-2 border-t border-amber-400/20 flex flex-wrap items-center justify-between text-[11px] text-amber-200/80 gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>UPI: <strong className="font-mono text-amber-300">{upiId}</strong> ({upiName})</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <span>వాట్సాప్: <a href={`https://wa.me/91${coordinatorPhone}`} target="_blank" rel="noopener noreferrer" className="font-mono text-amber-300 font-bold hover:underline">+91 {coordinatorPhone}</a></span>
                  </div>
                  <span className="hidden sm:inline text-amber-400/50">·</span>
                  <span className="text-[10px] text-amber-300/80 font-medium">Created by Mani</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
