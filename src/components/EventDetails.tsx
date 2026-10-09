import React, { useState, useEffect } from 'react';
import { Language, Prize } from '../types';
import { getTranslation } from '../lib/translations';
import { Gift, Award, Calendar, MapPin, ShieldCheck, Ticket, ArrowRight, Sparkles, Maximize2, X } from 'lucide-react';
import { DiyaIcon, KalasamIcon } from './FestiveIcons';
import { SponsorsSection } from './SponsorsSection';
import { DailyEventsSection } from './DailyEventsSection';
import { useFestivalProfile } from '../lib/profile';

interface EventDetailsProps {
  language: Language;
  onStartRegistration?: () => void;
}

export const FALLBACK_PRIZES: Prize[] = [
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

export const EventDetails: React.FC<EventDetailsProps> = ({ language, onStartRegistration }) => {
  const t = getTranslation(language);
  const { profile } = useFestivalProfile();
  const [prizes, setPrizes] = useState<Prize[]>(FALLBACK_PRIZES);
  const [selectedPrizeZoom, setSelectedPrizeZoom] = useState<Prize | null>(null);

  const fetchPrizes = async () => {
    try {
      const res = await fetch(`/api/prizes?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.prizes) && data.prizes.length > 0) {
          setPrizes(data.prizes);
        }
      }
    } catch (err) {
      console.log('Using default festival prizes');
    }
  };

  useEffect(() => {
    fetchPrizes();

    const handlePrizesUpdated = () => {
      fetchPrizes();
    };

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchPrizes();
      }
    };

    window.addEventListener('festival_prizes_updated', handlePrizesUpdated);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchPrizes();
      }
    }, 12000);

    return () => {
      clearInterval(timer);
      window.removeEventListener('festival_prizes_updated', handlePrizesUpdated);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  const getThemeClasses = (theme?: string) => {
    switch (theme) {
      case 'gold':
        return {
          gradient: 'from-amber-500 via-yellow-500 to-amber-600',
          badge: 'bg-amber-100 text-amber-900 border-amber-300',
          cardBorder: 'border-amber-300 hover:border-amber-400',
          text: 'text-amber-800',
          glow: 'shadow-amber-100',
        };
      case 'silver':
        return {
          gradient: 'from-stone-400 via-slate-400 to-stone-600',
          badge: 'bg-slate-100 text-slate-900 border-slate-300',
          cardBorder: 'border-slate-300 hover:border-slate-400',
          text: 'text-slate-800',
          glow: 'shadow-slate-100',
        };
      case 'bronze':
        return {
          gradient: 'from-amber-700 via-orange-800 to-amber-900',
          badge: 'bg-orange-100 text-orange-950 border-orange-300',
          cardBorder: 'border-orange-300 hover:border-orange-400',
          text: 'text-orange-900',
          glow: 'shadow-orange-100',
        };
      case 'emerald':
        return {
          gradient: 'from-emerald-600 via-teal-600 to-emerald-800',
          badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          cardBorder: 'border-emerald-300 hover:border-emerald-400',
          text: 'text-emerald-800',
          glow: 'shadow-emerald-100',
        };
      case 'red':
      default:
        return {
          gradient: 'from-red-600 via-rose-700 to-red-800',
          badge: 'bg-red-100 text-red-900 border-red-300',
          cardBorder: 'border-red-300 hover:border-red-400',
          text: 'text-red-800',
          glow: 'shadow-red-100',
        };
    }
  };

  return (
    <div className="max-w-6xl mx-auto my-12 px-4 sm:px-6 space-y-10 animate-fadeIn">
      {/* Prizes Section */}
      <div>
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <DiyaIcon className="w-5 h-5 text-amber-600" />
            <span className="text-xs uppercase font-bold text-amber-800 tracking-wider">
              {language === 'te' ? 'మహా లక్కీ డ్రా బహుమతులు' : 'Grand Lucky Draw Prizes'}
            </span>
            <DiyaIcon className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-serif font-black text-stone-900">
            {t.prizesTitle}
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xl mx-auto">
            {t.prizesSubtitle}
          </p>
        </div>

        {/* Prizes Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {prizes.map((p, idx) => {
            const theme = getThemeClasses(p.colorTheme);
            const displayTitle = language === 'te' ? (p.titleTe || p.title) : p.title;
            const displayRank = language === 'te' ? (p.teluguRank || p.rank) : p.rank;

            return (
              <div
                key={p.id || idx}
                className={`bg-white rounded-2xl border-2 ${theme.cardBorder} p-4.5 shadow-xs hover:shadow-lg transition-all duration-300 relative overflow-hidden flex flex-col justify-between group`}
              >
                {/* Popular / Top Prize Badge */}
                {p.isPopular && (
                  <div className="absolute top-0 right-0 z-20 bg-gradient-to-l from-amber-500 to-yellow-400 text-stone-950 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-stone-950" />
                    <span>{language === 'te' ? 'టాప్ బహుమతి' : 'Top Prize'}</span>
                  </div>
                )}

                <div>
                  {/* Dedicated Prize Image Section */}
                  <div
                    onClick={() => setSelectedPrizeZoom(p)}
                    className="relative w-full h-48 sm:h-52 rounded-xl overflow-hidden mb-3.5 bg-gradient-to-tr from-amber-100/70 via-stone-50 to-orange-50 border border-amber-300/80 shadow-inner group/img cursor-pointer"
                    title="క్లిక్ చేసి పెద్ద ఫోటో చూడండి (Click to Zoom)"
                  >
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={displayTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                        <div
                          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${theme.gradient} text-white flex items-center justify-center shadow-md mb-2`}
                        >
                          <Gift className="w-7 h-7" />
                        </div>
                        <span className="font-serif font-bold text-amber-950 text-xs line-clamp-1">{displayTitle}</span>
                      </div>
                    )}

                    {/* Top-left Rank overlay tag */}
                    <div className="absolute top-2 left-2 z-10">
                      <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border shadow-xs backdrop-blur-md bg-white/95 ${theme.badge}`}>
                        {displayRank}
                      </span>
                    </div>

                    {/* Top-right Worth tag */}
                    <div className="absolute top-2 right-2 z-10">
                      <span className="font-mono font-black text-red-700 text-xs px-2.5 py-1 rounded-lg bg-white/95 border border-amber-300 shadow-xs">
                        {p.value}
                      </span>
                    </div>

                    {/* Bottom-left Photo Indicator Badge */}
                    <div className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs text-amber-200 text-[10px] font-bold flex items-center gap-1 border border-amber-400/30">
                      <Sparkles className="w-3 h-3 text-yellow-300" />
                      <span>{language === 'te' ? 'బహుమతి ఫోటో' : 'Prize Photo'}</span>
                    </div>

                    {/* Zoom icon hint on hover */}
                    <div className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover/img:opacity-100 transition-opacity backdrop-blur-xs flex items-center gap-1 text-[10px] font-semibold">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>{language === 'te' ? 'జూమ్' : 'Zoom'}</span>
                    </div>
                  </div>

                  {/* Prize Info */}
                  <div className="space-y-2.5">
                    <div>
                      <h4 className="text-base font-bold text-stone-900 leading-snug group-hover:text-amber-900 transition-colors">
                        {displayTitle}
                      </h4>
                      {p.description && (
                        <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                          {p.description}
                        </p>
                      )}
                    </div>

                    {p.sponsor && (
                      <div className="text-[11px] text-amber-900/80 bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5">
                        <span className="font-bold block text-[10px] text-amber-800 uppercase">
                          {language === 'te' ? 'దాతల సౌజన్యం' : 'Sponsor / Courtesy'}:
                        </span>
                        <span className="font-medium text-stone-800">{p.sponsor}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Buy Token for this prize button */}
                {onStartRegistration && (
                  <div className="mt-4 pt-3.5 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={onStartRegistration}
                      className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 hover:border-amber-400 transition-all flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-[0.99] cursor-pointer group-hover:bg-gradient-to-r group-hover:from-amber-400 group-hover:to-amber-500 group-hover:text-stone-950"
                    >
                      <Ticket className="w-3.5 h-3.5 text-amber-700 group-hover:text-stone-950" />
                      <span>{language === 'te' ? 'ఈ డ్రా కోసం టోకెన్ పొందండి (₹50)' : 'Buy Token for this Draw (₹50)'}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-700 group-hover:text-stone-950" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* FULL-SIZE PRIZE IMAGE LIGHTBOX MODAL */}
        {selectedPrizeZoom && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-fadeIn"
            onClick={() => setSelectedPrizeZoom(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-xl w-full border-4 border-amber-400 shadow-2xl overflow-hidden p-6 text-center space-y-4 animate-scaleUp cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <div className="text-left">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                    {language === 'te' ? (selectedPrizeZoom.teluguRank || selectedPrizeZoom.rank) : selectedPrizeZoom.rank}
                  </span>
                  <h4 className="font-serif font-black text-lg sm:text-xl text-stone-900 leading-tight">
                    {language === 'te' ? (selectedPrizeZoom.titleTe || selectedPrizeZoom.title) : selectedPrizeZoom.title}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPrizeZoom(null)}
                  className="p-1.5 rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Large Image View */}
              <div className="w-full max-h-[55vh] rounded-2xl overflow-hidden border-2 border-amber-300 shadow-md bg-stone-50 flex items-center justify-center">
                {selectedPrizeZoom.imageUrl ? (
                  <img
                    src={selectedPrizeZoom.imageUrl}
                    alt={selectedPrizeZoom.title}
                    className="w-full h-full object-contain max-h-[55vh]"
                  />
                ) : (
                  <div className="py-16 flex flex-col items-center text-amber-900">
                    <Gift className="w-20 h-20 text-amber-600 mb-2" />
                    <span className="text-sm font-bold">{selectedPrizeZoom.title}</span>
                  </div>
                )}
              </div>

              {/* Prize Details Footer in Modal */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-left flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-800 block">
                    {language === 'te' ? 'బహుమతి విలువ' : 'Prize Worth'}
                  </span>
                  <span className="font-mono font-black text-red-700 text-base">
                    {selectedPrizeZoom.value}
                  </span>
                </div>
                {selectedPrizeZoom.sponsor && (
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-amber-800 block">
                      {language === 'te' ? 'సౌజన్యం' : 'Sponsor'}
                    </span>
                    <span className="font-semibold text-stone-800">
                      {selectedPrizeZoom.sponsor}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-stone-500 mt-5 italic">
          {t.prizesNote}
        </p>

        {/* Lucky Draw Token Registration - Action Banner */}
        {onStartRegistration && (
          <div className="mt-8 bg-gradient-to-r from-red-800 via-amber-700 to-yellow-600 rounded-3xl p-6 sm:p-7 text-white shadow-xl border-2 border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs border-2 border-amber-200 flex items-center justify-center shrink-0">
                <Ticket className="w-8 h-8 text-amber-200" />
              </div>
              <div className="text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-amber-200 text-xs font-bold mb-1 border border-white/20">
                  <Sparkles className="w-3 h-3 text-yellow-300" />
                  <span>Lucky Draw Token Registration</span>
                </div>
                <h4 className="text-xl sm:text-2xl font-serif font-black text-yellow-100">
                  {language === 'te'
                    ? 'కేవలం ₹50 తో లక్కీ డ్రాలో పాల్గొని బహుమతులు గెలుచుకోండి!'
                    : 'Win Grand Prizes with Just ₹50 Lucky Draw Token!'}
                </h4>
                <p className="text-xs text-amber-100/90 mt-1 max-w-xl">
                  {language === 'te'
                    ? 'మీ పేరు, మొబైల్ నంబర్ నమోదు చేసి అధికారిక సీరియల్ టోకెన్ నంబర్ వెంటనే పొందండి. వాట్సాప్ ద్వారా రసీదు పంపబడుతుంది.'
                    : 'Register your details, complete payment via UPI, and receive your continuous sequential token number on WhatsApp.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onStartRegistration}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 hover:from-amber-200 hover:to-amber-300 text-stone-950 shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border-2 border-yellow-100 whitespace-nowrap"
            >
              <Ticket className="w-4 h-4 text-stone-950" />
              <span>
                {language === 'te'
                  ? `ఇప్పుడే టోకెన్ కొనండి (₹${profile.ticketPrice || '50'})`
                  : `Buy Token Now (₹${profile.ticketPrice || '50'})`}
              </span>
              <ArrowRight className="w-4 h-4 text-stone-950" />
            </button>
          </div>
        )}
      </div>

      {/* Daily Festival Events & Puja Slots Section */}
      <DailyEventsSection language={language} />

      {/* Honorable Sponsors & Donors Section */}
      <SponsorsSection language={language} />

      {/* Event Details & Village Heritage Banner */}
      <div className="bg-gradient-to-r from-red-950 via-stone-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 border-2 border-amber-500/50 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Calendar className="w-4 h-4" />
              <span>DATE & SCHEDULE</span>
            </div>
            <h4 className="text-base sm:text-lg font-bold text-yellow-100">
              11 October 2026 to 21 October 2026
            </h4>
            <p className="text-xs text-stone-300 leading-relaxed">
              {language === 'te'
                ? (profile.drawTimeTe || 'శరన్నవరాత్రుల ముగింపు సందర్భంగా 21 అక్టోబర్ 2026 సాయంత్రం 6:00 గంటలకు ఎదుల్లగూడెం దేవి ఆలయ ప్రాంగణంలో భక్తుల సమక్షంలో పారదర్శక డ్రా.')
                : (profile.drawTimeEn || 'Evening 6:00 PM on 21 October 2026 at Temple Premises in presence of devotees.')}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <MapPin className="w-4 h-4" />
              <span>{language === 'te' ? 'వేడుక వేదిక' : 'Celebration Venue'}</span>
            </div>
            <h4 className="text-base sm:text-lg font-bold text-yellow-100">
              {language === 'te'
                ? (profile.venueNameTe || 'ఎదుల్లగూడెం (Edullagudem)')
                : (profile.venueNameEn || 'Edullagudem Village')}
            </h4>
            <p className="text-xs text-stone-300 leading-relaxed">
              {language === 'te'
                ? (profile.venueAddressTe || 'శ్రీ కనకదుర్గ అమ్మవారి దేవాలయం, ఇల్లందు మండలం, భద్రాద్రి కొత్తగూడెం జిల్లా, తెలంగాణ.')
                : (profile.venueAddressEn || 'Sri Kanakadurga Temple, Yellandu Mandal, Bhadradri Kothagudem Dist, Telangana.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
