import React, { useState, useEffect } from 'react';
import { Language, Sponsor } from '../types';
import {
  Sparkles,
  HeartHandshake,
  MapPin,
  Award,
  Phone,
  Maximize2,
  X,
  Check,
  Loader2,
  ZoomIn,
  Edit2
} from 'lucide-react';
import { DiyaIcon, KalasamIcon } from './FestiveIcons';

interface SponsorsSectionProps {
  language: Language;
}

export const DEFAULT_FALLBACK_SPONSORS: Sponsor[] = [
  {
    id: 'sponsor-1',
    name: 'Sri Edullagudem Devi Bhaktha Brundam',
    nameTe: 'శ్రీ ఎదుల్లగూడెం దేవి భక్త బృందం',
    title: '1st Prize Gold Coin / Hero Bike Sponsor',
    titleTe: 'ప్రథమ బహుమతి (బంగారు నాణెం / బైక్) ప్రధాన దాతలు',
    amount: '₹25,000+',
    location: 'Edullagudem',
    isFeatured: true,
    imageUrl: ''
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
    imageUrl: ''
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
    imageUrl: ''
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
    imageUrl: ''
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
    imageUrl: ''
  }
];

const CONTRIBUTION_PRESETS = [
  {
    te: 'విగ్రహ దాత (Auspicious Idol Sponsor)',
    en: 'Sacred Devi Idol Sponsor',
    amount: 'Vigraha Seva',
  },
  {
    te: 'ప్రథమ బహుమతి (బంగారు నాణెం / బైక్) ప్రధాన దాతలు',
    en: '1st Prize Gold Coin / Hero Bike Sponsor',
    amount: '₹25,000+',
  },
  {
    te: 'ద్వితీయ బహుమతి వెండి పళ్లెం & పూజా సామగ్రి దాతలు',
    en: '2nd Prize Pure Silver Pooja Plate Sponsor',
    amount: '₹10,000+',
  },
  {
    te: 'తృతీయ బహుమతి గృహోపకరణాల సెట్ దాతలు',
    en: '3rd Prize Home Appliances Set Sponsor',
    amount: '₹5,000+',
  },
  {
    te: 'చతుర్థ బహుమతి 43 అంగుళాల స్మార్ట్ LED టీవీ దాతలు',
    en: '4th Prize Smart LED TV Sponsor',
    amount: '₹15,000+',
  },
  {
    te: '9 రోజుల నిత్య అన్నదాన & విశేష ప్రసాద వితరణ దాతలు',
    en: '9 Days Daily Annadanam & Prasadam Donors',
    amount: 'Maha Seva',
  },
  {
    te: 'దేవి శరన్నవరాత్రుల విద్యుత్ దీపాలంకరణ & మైక్ సెట్ దాతలు',
    en: 'Festival Stage Lighting & Sound System Sponsor',
    amount: '₹12,000+',
  },
  {
    te: 'అమ్మవారి పవిత్ర పూజా పుష్పాలు & అలంకరణ దాతలు',
    en: 'Daily Pooja & Floral Decoration Sponsor',
    amount: '₹5,000+',
  },
];

export const SponsorsSection: React.FC<SponsorsSectionProps> = ({ language }) => {
  const [sponsors, setSponsors] = useState<Sponsor[]>(DEFAULT_FALLBACK_SPONSORS);
  const [imageSize, setImageSize] = useState<'large' | 'xl' | 'grand'>('xl');
  const [zoomSponsor, setZoomSponsor] = useState<Sponsor | null>(null);

  // Admin authentication check for quick in-place editing
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
  });

  // Direct Contribution Edit Modal State
  const [editingContributionSponsor, setEditingContributionSponsor] = useState<Sponsor | null>(null);
  const [editTitleTe, setEditTitleTe] = useState('');
  const [editTitleEn, setEditTitleEn] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [isSavingContribution, setIsSavingContribution] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick Admin Password Prompt Modal if not logged in
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [pendingEditSponsor, setPendingEditSponsor] = useState<Sponsor | null>(null);

  const fetchSponsors = async () => {
    try {
      const res = await fetch(`/api/sponsors?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.sponsors) && data.sponsors.length > 0) {
          setSponsors(data.sponsors);
        }
      }
    } catch {
      // Use fallback
    }
  };

  useEffect(() => {
    fetchSponsors();

    const handleUpdate = () => {
      fetchSponsors();
    };

    const handleAuthChange = () => {
      const currentToken = sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
      setAdminToken(currentToken);
    };

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchSponsors();
      }
    };

    window.addEventListener('festival_sponsors_updated', handleUpdate);
    window.addEventListener('admin_auth_changed', handleAuthChange);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchSponsors();
      }
    }, 12000);

    return () => {
      clearInterval(timer);
      window.removeEventListener('festival_sponsors_updated', handleUpdate);
      window.removeEventListener('admin_auth_changed', handleAuthChange);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenEditContribution = (sponsor: Sponsor) => {
    const currentToken = sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
    if (!currentToken) {
      setPendingEditSponsor(sponsor);
      setShowAuthPrompt(true);
      return;
    }

    setEditingContributionSponsor(sponsor);
    setEditTitleTe(sponsor.titleTe || sponsor.title || '');
    setEditTitleEn(sponsor.title || '');
    setEditAmount(sponsor.amount || '');
  };

  const handleAuthenticateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: authPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.authenticated) {
        throw new Error(data.error || 'Incorrect Admin Password');
      }

      setAdminToken(data.token);
      sessionStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_token', data.token);
      window.dispatchEvent(new Event('admin_auth_changed'));
      setShowAuthPrompt(false);
      setAuthPassword('');

      if (pendingEditSponsor) {
        setEditingContributionSponsor(pendingEditSponsor);
        setEditTitleTe(pendingEditSponsor.titleTe || pendingEditSponsor.title || '');
        setEditTitleEn(pendingEditSponsor.title || '');
        setEditAmount(pendingEditSponsor.amount || '');
        setPendingEditSponsor(null);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    }
  };

  const handleSaveContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContributionSponsor) return;

    const tokenToUse = adminToken || sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
    if (!tokenToUse) {
      alert(language === 'te' ? 'దయచేసి అడ్మిన్ లాగిన్ అవ్వండి.' : 'Please authenticate as admin first.');
      return;
    }

    setIsSavingContribution(true);
    try {
      const res = await fetch(`/api/admin/sponsors/${editingContributionSponsor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenToUse}`,
        },
        body: JSON.stringify({
          title: (editTitleEn.trim() || editTitleTe.trim()),
          titleTe: (editTitleTe.trim() || editTitleEn.trim()),
          amount: editAmount.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update contribution');

      setSponsors(data.sponsors);
      window.dispatchEvent(new Event('festival_sponsors_updated'));
      setEditingContributionSponsor(null);
      showToast(
        language === 'te'
          ? `"${editingContributionSponsor.name}" సహకారం వివరాలు విజయవంతంగా భద్రపరచబడ్డాయి!`
          : `Contribution for "${editingContributionSponsor.name}" updated successfully!`
      );
    } catch (err: any) {
      alert(err.message || 'Failed to save contribution');
    } finally {
      setIsSavingContribution(false);
    }
  };

  // Dynamic image size styling classes
  const getImageDimensions = () => {
    switch (imageSize) {
      case 'grand':
        return 'w-60 h-60 sm:w-72 sm:h-72';
      case 'xl':
        return 'w-48 h-48 sm:w-56 sm:h-56';
      case 'large':
      default:
        return 'w-40 h-40 sm:w-48 sm:h-48';
    }
  };

  return (
    <section className="my-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-900 text-yellow-100 border-2 border-emerald-400 shadow-2xl flex items-center gap-3 animate-fadeIn">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-300 hover:text-white ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sacred Traditional Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-amber-900 to-red-950 rounded-3xl p-6 sm:p-8 text-white border-2 border-amber-400/80 shadow-2xl relative overflow-hidden">
        {/* Decorative corner diyas */}
        <div className="absolute top-3 left-4 opacity-30">
          <DiyaIcon className="w-12 h-12 text-amber-300" />
        </div>
        <div className="absolute top-3 right-4 opacity-30">
          <KalasamIcon className="w-12 h-12 text-amber-300" />
        </div>

        <div className="relative text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30 text-xs font-bold uppercase tracking-wider">
            <HeartHandshake className="w-4 h-4 text-amber-300" />
            <span>{language === 'te' ? 'గౌరవనీయ దాతలు & స్పాన్సర్లు' : 'Festival Sponsors & Donors'}</span>
          </div>

          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black text-amber-100">
            {language === 'te'
              ? 'శ్రీ దేవి శరన్నవరాత్రోత్సవాల విశేష దాతలు & స్పాన్సర్లు'
              : 'Honorable Sponsors & Benevolent Donors 2026'}
          </h3>

          <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed font-sans">
            {language === 'te'
              ? 'శ్రీ ఎదుల్లగూడెం కనకదుర్గ అమ్మవారి శరన్నవరాత్రుల మహా లక్కీ డ్రా, విగ్రహ దాతలు మరియు నిత్య అన్నదాన కార్యక్రమాలకు ఉదారంగా విరాళాలు, విశేష బహుమతులు అందజేసిన గౌరవనీయ దాతల వివరాలు.'
              : 'Heartfelt gratitude to our noble patrons, donors, and sponsors whose generous contributions make the Devi Sharannavarathri festivities and Maha Lucky Draw possible.'}
          </p>

          {/* VIEW CONTROLS: IMAGE SIZE SWITCHER & ADMIN STATUS */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-amber-300/80 font-bold flex items-center gap-1">
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{language === 'te' ? 'ఫోటో సైజు (Image Size):' : 'Photo Size:'}</span>
            </span>

            <div className="inline-flex rounded-xl bg-black/40 p-1 border border-amber-400/40">
              <button
                type="button"
                onClick={() => setImageSize('large')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  imageSize === 'large'
                    ? 'bg-amber-400 text-stone-950 shadow-sm'
                    : 'text-amber-200 hover:text-white'
                }`}
              >
                {language === 'te' ? 'పెద్దది (Large)' : 'Large'}
              </button>
              <button
                type="button"
                onClick={() => setImageSize('xl')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  imageSize === 'xl'
                    ? 'bg-amber-400 text-stone-950 shadow-sm'
                    : 'text-amber-200 hover:text-white'
                }`}
              >
                {language === 'te' ? 'మహా పెద్దది (Extra Large)' : 'Extra Large'}
              </button>
              <button
                type="button"
                onClick={() => setImageSize('grand')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  imageSize === 'grand'
                    ? 'bg-amber-400 text-stone-950 shadow-sm'
                    : 'text-amber-200 hover:text-white'
                }`}
              >
                {language === 'te' ? 'పూర్తి దర్శనం (Grand 280px)' : 'Grand (280px)'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sponsors Cards Grid with GREATLY INCREASED IMAGES & EDITABLE CONTRIBUTION */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sponsors.map((sponsor, index) => {
          const isFeatured = Boolean(sponsor.isFeatured);
          const displayName = (language === 'te' && sponsor.nameTe) ? sponsor.nameTe : sponsor.name;
          const displayTitle = (language === 'te' && sponsor.titleTe) ? sponsor.titleTe : sponsor.title;

          return (
            <div
              key={sponsor.id || index}
              className={`relative bg-white rounded-3xl border-3 transition-all duration-300 p-6 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:-translate-y-1.5 overflow-hidden group ${
                isFeatured
                  ? 'border-amber-400 bg-gradient-to-b from-amber-50/70 via-white to-orange-50/30 ring-4 ring-amber-300/40'
                  : 'border-amber-200/80 hover:border-amber-400'
              }`}
            >
              {/* Featured Maha Daata Ribbon Badge */}
              {isFeatured && (
                <div className="absolute top-0 right-0 z-10">
                  <div className="bg-gradient-to-l from-amber-500 via-amber-400 to-yellow-300 text-stone-950 font-black text-xs tracking-wider uppercase px-4 py-1.5 rounded-bl-2xl shadow-md flex items-center gap-1.5 border-b border-l border-amber-300">
                    <Sparkles className="w-4 h-4 text-red-800 animate-pulse" />
                    <span>{language === 'te' ? 'ముఖ్య దాత (Maha Daata)' : 'Maha Daata'}</span>
                  </div>
                </div>
              )}

              {/* Corner Traditional Motifs */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-600/60" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-600/60" />

              <div className="space-y-6 text-center flex flex-col items-center">
                {/* PROMINENT, GREATLY INCREASED SPONSOR IMAGE */}
                <div className="relative mt-2">
                  <div
                    onClick={() => setZoomSponsor(sponsor)}
                    className={`${getImageDimensions()} rounded-3xl overflow-hidden border-4 border-amber-400 shadow-2xl bg-gradient-to-b from-amber-100 via-orange-50 to-stone-100 p-1.5 group-hover:scale-105 transition-all duration-300 ring-4 ring-amber-300/40 cursor-pointer relative group/img`}
                    title="Click to view full photo"
                  >
                    {sponsor.imageUrl && sponsor.imageUrl.trim().length > 0 ? (
                      <img
                        src={sponsor.imageUrl}
                        alt={displayName}
                        className="w-full h-full object-cover rounded-2xl"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full rounded-2xl bg-gradient-to-br from-amber-100 via-amber-200 to-yellow-200 flex flex-col items-center justify-center text-amber-950 p-4">
                        <KalasamIcon className="w-16 h-16 sm:w-20 sm:h-20 text-amber-700" />
                        <span className="text-sm font-black mt-2 uppercase tracking-wider text-amber-900">
                          {displayName.slice(0, 3)}
                        </span>
                      </div>
                    )}

                    {/* Hover Zoom Overlay */}
                    <div className="absolute inset-0 bg-black/30 rounded-2xl opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xs text-xs font-bold flex items-center gap-1.5 border border-amber-300">
                        <ZoomIn className="w-4 h-4 text-amber-300" />
                        <span>{language === 'te' ? 'పెద్ద దర్శనం' : 'Zoom Photo'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Golden Auspicious Star Badge */}
                  <span className="absolute -bottom-2 right-3 w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 border-2 border-amber-300 text-yellow-200 flex items-center justify-center text-sm font-black shadow-lg">
                    ★
                  </span>
                </div>

                {/* Sponsor Name & Location */}
                <div className="space-y-1.5 w-full px-2">
                  <h4 className="font-serif font-black text-stone-900 text-xl sm:text-2xl leading-tight group-hover:text-amber-900 transition-colors">
                    {displayName}
                  </h4>

                  {sponsor.nameTe && sponsor.nameTe !== sponsor.name && language === 'en' && (
                    <p className="text-xs font-bold text-amber-900">{sponsor.nameTe}</p>
                  )}

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    {sponsor.location && (
                      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-xs text-amber-950 border border-amber-200 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span>{sponsor.location}</span>
                      </div>
                    )}

                    {sponsor.phone && (
                      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-stone-100 text-xs text-stone-700 font-mono border border-stone-200">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>+91 {sponsor.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* HIGHLIGHTED CONTRIBUTION BOX (WITH 1-CLICK EDIT CONTRIBUTION BUTTON) */}
                <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-400 shadow-md space-y-2 text-center relative group/contrib">
                  {sponsor.amount && sponsor.amount.trim().length > 0 && (
                    <div className="flex items-center justify-end">
                      <span className="font-mono font-black text-red-700 text-xs sm:text-sm bg-white px-3 py-1 rounded-lg border-2 border-amber-300 shadow-xs">
                        {sponsor.amount}
                      </span>
                    </div>
                  )}

                  {/* PROMINENT CONTRIBUTION (e.g. విగ్రహ దాత: or 1st Prize Gold Coin) */}
                  <div className="bg-white/80 p-3 rounded-xl border border-amber-300 shadow-2xs">
                    <p className="font-serif font-black text-stone-900 text-base sm:text-lg leading-snug flex items-center justify-center gap-2">
                      <Award className="w-5 h-5 text-amber-700 shrink-0 inline" />
                      <span>{displayTitle}</span>
                    </p>
                  </div>

                  {/* ONLY SHOWN TO AUTHENTICATED ADMIN, HIDDEN FROM USERS */}
                  {adminToken && (
                    <div className="pt-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => handleOpenEditContribution(sponsor)}
                        className="px-2.5 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-stone-950 font-bold text-xs border border-amber-400 shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                        title="Admin Only: Edit this contribution"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-stone-950" />
                        <span>{language === 'te' ? 'సహకారం సవరించండి (అడ్మిన్)' : 'Edit Contribution (Admin)'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Devotional blessing footer */}
              <div className="mt-5 pt-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600 font-semibold">
                <span className="flex items-center gap-1.5 text-amber-900">
                  <DiyaIcon className="w-4 h-4 text-amber-600" />
                  <span>శ్రీ కనకదుర్గ అమ్మవారి కృపాకటాక్షములు</span>
                </span>
                <span className="font-mono text-amber-800 font-bold">#2026</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* QUICK IN-PLACE MODAL: EDIT CONTRIBUTION */}
      {editingContributionSponsor && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border-3 border-amber-400 shadow-2xl overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-red-800 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-300" />
                <h4 className="font-bold text-base">
                  {language === 'te'
                    ? 'సహకారం వివరాలను సవరించండి (Edit Contribution)'
                    : 'Edit Contribution & Prize Details'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingContributionSponsor(null)}
                className="text-amber-200 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveContribution} className="p-6 space-y-4 text-xs">
              {/* Sponsor Preview */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-300 flex items-center gap-3.5">
                {editingContributionSponsor.imageUrl ? (
                  <img
                    src={editingContributionSponsor.imageUrl}
                    alt={editingContributionSponsor.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400 shadow-sm"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-amber-200 border-2 border-amber-400 flex items-center justify-center font-bold text-amber-950">
                    {editingContributionSponsor.name.slice(0, 2)}
                  </div>
                )}
                <div>
                  <h5 className="font-bold text-stone-900 text-sm sm:text-base">
                    {language === 'te' && editingContributionSponsor.nameTe
                      ? editingContributionSponsor.nameTe
                      : editingContributionSponsor.name}
                  </h5>
                  <p className="text-xs text-amber-900 font-medium">
                    {editingContributionSponsor.location || 'Edullagudem'}
                  </p>
                </div>
              </div>

              {/* 1-Click Contribution Presets */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-800">
                  {language === 'te' ? 'త్వరిత సూచనలు (క్లిక్ చేసి ఎంచుకోండి):' : 'Quick Contribution Presets (Click to Fill):'}
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-stone-50 rounded-xl border border-stone-200">
                  {CONTRIBUTION_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setEditTitleTe(preset.te);
                        setEditTitleEn(preset.en);
                        setEditAmount(preset.amount);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-stone-800 font-semibold text-[11px] border border-stone-200 hover:border-amber-300 transition-colors text-left cursor-pointer"
                    >
                      <span>{preset.te}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Contribution Title in Telugu */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-800">
                  {language === 'te'
                    ? 'సహకారం వివరాలు / బహుమతి పేరు (తెలుగు)'
                    : 'Contribution / Prize Title (Telugu)'} *
                </label>
                <input
                  type="text"
                  required
                  value={editTitleTe}
                  onChange={(e) => setEditTitleTe(e.target.value)}
                  placeholder="ఉదా: విగ్రహ దాత: లేదా ప్రథమ బహుమతి ప్రధాన దాతలు"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-amber-300 text-xs sm:text-sm font-semibold focus:border-amber-500 focus:outline-none bg-white"
                />
              </div>

              {/* Contribution Title in English */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-800">
                  {language === 'te'
                    ? 'సహకారం వివరాలు (ఇంగ్లీష్)'
                    : 'Contribution / Prize Title (English)'}
                </label>
                <input
                  type="text"
                  value={editTitleEn}
                  onChange={(e) => setEditTitleEn(e.target.value)}
                  placeholder="e.g. Sacred Devi Idol Sponsor or 1st Prize Sponsor"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm font-semibold focus:border-amber-500 focus:outline-none bg-white"
                />
              </div>

              {/* Amount / Value */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-800">
                  {language === 'te' ? 'మొత్తం / విలువ (Amount / Value)' : 'Amount / Value (₹)'}
                </label>
                <input
                  type="text"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder="ఉదా: ₹25,000+ లేదా విగ్రహ వితరణ"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm font-mono focus:border-amber-500 focus:outline-none bg-white"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingContributionSponsor(null)}
                  className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                >
                  {language === 'te' ? 'రద్దు చేయి' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingContribution}
                  className="py-2.5 px-5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {isSavingContribution ? (
                    <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                  ) : (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  )}
                  <span>{language === 'te' ? 'సహకారం భద్రపరచండి' : 'Save Contribution'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADMIN AUTH PROMPT (If not already logged in when clicking edit) */}
      {showAuthPrompt && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full border-3 border-amber-400 shadow-2xl overflow-hidden animate-scaleUp">
            <div className="bg-gradient-to-r from-red-900 to-amber-900 text-white px-5 py-3.5 flex items-center justify-between">
              <span className="font-bold text-sm">
                {language === 'te' ? 'అడ్మిన్ ప్రమాణీకరణ (Admin Password)' : 'Admin Authentication'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowAuthPrompt(false);
                  setPendingEditSponsor(null);
                }}
                className="text-amber-200 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAuthenticateAdmin} className="p-5 space-y-3.5 text-xs">
              <p className="text-stone-600">
                {language === 'te'
                  ? 'సహకారాన్ని (CONTRIBUTION) సవరించడానికి దయచేసి అడ్మిన్ పాస్‌వర్డ్ నమోదు చేయండి.'
                  : 'Please enter the admin password to edit this contribution.'}
              </p>

              {authError && (
                <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                  {authError}
                </div>
              )}

              <input
                type="password"
                required
                autoFocus
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Admin Password"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:border-amber-500 focus:outline-none"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAuthPrompt(false)}
                  className="py-2 px-3 rounded-xl bg-stone-100 text-stone-700 font-semibold cursor-pointer"
                >
                  {language === 'te' ? 'రద్దు' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold cursor-pointer"
                >
                  {language === 'te' ? 'ప్రవేశించు & సవరించు' : 'Login & Edit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL-SIZE PHOTO ZOOM LIGHTBOX MODAL */}
      {zoomSponsor && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomSponsor(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full border-4 border-amber-400 shadow-2xl overflow-hidden p-6 text-center space-y-4 animate-scaleUp cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h4 className="font-serif font-black text-xl text-stone-900">
                {(language === 'te' && zoomSponsor.nameTe) ? zoomSponsor.nameTe : zoomSponsor.name}
              </h4>
              <button
                type="button"
                onClick={() => setZoomSponsor(null)}
                className="p-1 rounded-full text-stone-500 hover:text-stone-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BIG HIGH-RES PHOTO */}
            <div className="w-full max-h-[60vh] rounded-2xl overflow-hidden border-4 border-amber-400 shadow-xl bg-stone-100 flex items-center justify-center">
              {zoomSponsor.imageUrl ? (
                <img
                  src={zoomSponsor.imageUrl}
                  alt={zoomSponsor.name}
                  className="w-full h-full object-contain max-h-[60vh]"
                />
              ) : (
                <div className="py-20 flex flex-col items-center text-amber-900">
                  <KalasamIcon className="w-24 h-24 text-amber-700" />
                  <span className="text-base font-bold mt-2">{zoomSponsor.name}</span>
                </div>
              )}
            </div>

            {/* CONTRIBUTION HIGHLIGHT IN ZOOM MODAL */}
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300">
              <p className="font-serif font-black text-stone-900 text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-700 shrink-0" />
                <span>{(language === 'te' && zoomSponsor.titleTe) ? zoomSponsor.titleTe : zoomSponsor.title}</span>
              </p>
              {zoomSponsor.amount && (
                <p className="text-sm font-bold text-red-700 font-mono mt-1">
                  {zoomSponsor.amount}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
