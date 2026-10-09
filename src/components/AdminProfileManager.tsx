import React, { useState, useEffect, useRef } from 'react';
import { Language, FestivalProfile } from '../types';
import { DEFAULT_FESTIVAL_PROFILE } from '../lib/profile';
import { DeviProfileAvatar, DEFAULT_DEVI_PROFILE_STORAGE_KEY } from './DeviProfileAvatar';
import { compressImageFile } from '../lib/imageUtils';
import {
  Upload,
  Check,
  X,
  RotateCcw,
  Sparkles,
  MapPin,
  Calendar,
  Phone,
  ShieldCheck,
  HeartHandshake,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  Edit3,
  Sliders,
  Eye,
  CreditCard
} from 'lucide-react';
import { DiyaIcon, KalasamIcon } from './FestiveIcons';

interface AdminProfileManagerProps {
  language: Language;
  token: string | null;
}

export const AdminProfileManager: React.FC<AdminProfileManagerProps> = ({
  language,
  token,
}) => {
  const [profile, setProfile] = useState<FestivalProfile>(DEFAULT_FESTIVAL_PROFILE);
  const [activeTab, setActiveTab] = useState<'titles' | 'deity' | 'venue' | 'committee' | 'photos'>('titles');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Photo Uploader state
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch initial profile from backend
  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          setProfile({
            ...DEFAULT_FESTIVAL_PROFILE,
            ...data,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleFieldChange = (field: keyof FestivalProfile, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Photo Upload Handler (Local file)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const compressed = await compressImageFile(file, 900, 900, 0.85);
      setProfile((prev) => ({
        ...prev,
        profileImage: compressed,
      }));
      try {
        localStorage.setItem(DEFAULT_DEVI_PROFILE_STORAGE_KEY, compressed);
      } catch {}
      showToast(language === 'te' ? 'ఫోటో విజయవంతంగా లోడ్ అయింది! దయచేసి సేవ్ చేయండి.' : 'Photo loaded! Please save changes.');
    } catch (err) {
      alert('Failed to process image file');
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  // Apply Photo URL
  const handleApplyPhotoUrl = () => {
    if (!customPhotoUrl.trim()) return;
    setProfile((prev) => ({
      ...prev,
      profileImage: customPhotoUrl.trim(),
    }));
    try {
      localStorage.setItem(DEFAULT_DEVI_PROFILE_STORAGE_KEY, customPhotoUrl.trim());
    } catch {}
    setCustomPhotoUrl('');
    showToast(language === 'te' ? 'ఫోటో లింక్ అప్లై అయింది! దయచేసి సేవ్ చేయండి.' : 'Photo URL applied! Please save changes.');
  };

  // Reset Photo
  const handleResetPhoto = () => {
    setProfile((prev) => ({
      ...prev,
      profileImage: null,
    }));
    try {
      localStorage.removeItem(DEFAULT_DEVI_PROFILE_STORAGE_KEY);
    } catch {}
    showToast(language === 'te' ? 'డిఫాల్ట్ చిత్రానికి రీసెట్ చేయబడింది.' : 'Reset to default image.');
  };

  // Save All Profile Details to Backend
  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const tokenToUse = token || sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
    if (!tokenToUse) {
      alert(language === 'te' ? 'దయచేసి అడ్మిన్ లాగిన్ అవ్వండి.' : 'Please authenticate as admin first.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenToUse}`,
        },
        body: JSON.stringify(profile),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save profile');

      setProfile(data.profile);

      // Sync local storage profile image if present
      if (data.profile?.profileImage) {
        try {
          localStorage.setItem(DEFAULT_DEVI_PROFILE_STORAGE_KEY, data.profile.profileImage);
        } catch {}
      } else {
        try {
          localStorage.removeItem(DEFAULT_DEVI_PROFILE_STORAGE_KEY);
        } catch {}
      }

      window.dispatchEvent(new Event('festival_profile_updated'));
      window.dispatchEvent(new Event('devi_profile_updated'));

      showToast(
        language === 'te'
          ? 'ఉత్సవ ప్రొఫైల్ మరియు అన్ని శీర్షికలు విజయవంతంగా భద్రపరచబడ్డాయి!'
          : 'All festival titles & profile details updated successfully!'
      );
    } catch (err: any) {
      alert(err.message || 'Error saving profile details');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to Defaults
  const handleResetDefaults = async () => {
    const tokenToUse = token || sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
    if (!tokenToUse) return;

    if (
      !confirm(
        language === 'te'
          ? 'అధికారిక డిఫాల్ట్ శీర్షికలు మరియు ప్రొఫైల్ వివరాలను పునరుద్ధరించాలనుకుంటున్నారా?'
          : 'Reset all titles and profile details to official defaults?'
      )
    ) {
      return;
    }

    try {
      const res = await fetch('/api/admin/profile/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenToUse}`,
        },
        body: JSON.stringify({ keepImage: true }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset profile');

      setProfile(data.profile);
      window.dispatchEvent(new Event('festival_profile_updated'));
      window.dispatchEvent(new Event('devi_profile_updated'));

      showToast(
        language === 'te'
          ? 'అన్ని వివరాలు అధికారిక డిఫాల్ట్ స్థితికి రీసెట్ చేయబడ్డాయి.'
          : 'Reset to official default titles & profile successfully.'
      );
    } catch (err: any) {
      alert(err.message || 'Error resetting profile');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-800 hover:text-stone-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-amber-950 to-red-950 p-6 rounded-3xl border-3 border-amber-400 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <DeviProfileAvatar size="xl" showHalo={true} customSrc={profile.profileImage} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-serif font-black text-yellow-200">
                {language === 'te' ? 'ఉత్సవ ప్రొఫైల్ & శీర్షికల నిర్వహణ' : 'Festival Profile & Titles Manager'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-bold">
                Admin Control
              </span>
            </div>
            <p className="text-xs sm:text-sm text-amber-200/90 mt-1 max-w-2xl leading-relaxed">
              {language === 'te'
                ? 'ఉత్సవ ప్రధాన శీర్షికలు, అమ్మవారి వివరాలు, డ్రా తేదీ, వేదిక, కమిటీ మరియు చెల్లింపు వివరాలు మీ ఇష్టానుసారం సులభంగా సవరించండి.'
                : 'Full administrator control to customize all festival titles, deity inscriptions, draw schedule, venue, committee, and payment credentials.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="py-2.5 px-3.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-amber-200 border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Reset to official default profile"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'te' ? 'డిఫాల్ట్‌లకు రీసెట్' : 'Reset Defaults'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveAll()}
            disabled={isSaving}
            className="py-2.5 px-5 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {isSaving ? (
              <Loader2 className="w-4.5 h-4.5 animate-spin text-stone-950" />
            ) : (
              <Check className="w-4.5 h-4.5 stroke-[2.5]" />
            )}
            <span>{language === 'te' ? 'అన్ని వివరాలు భద్రపరచండి (Save All)' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs for Profile Categories */}
      <div className="flex items-center gap-2 border-b-2 border-amber-300/60 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('titles')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-2xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'titles'
              ? 'bg-amber-500 text-stone-950 shadow-md ring-2 ring-amber-400'
              : 'bg-white text-stone-700 hover:bg-amber-50 border border-stone-200'
          }`}
        >
          <Edit3 className="w-4 h-4 text-amber-900" />
          <span>{language === 'te' ? '1. ఉత్సవ శీర్షికలు & పేర్లు' : '1. Festival Titles'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('deity')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-2xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'deity'
              ? 'bg-amber-500 text-stone-950 shadow-md ring-2 ring-amber-400'
              : 'bg-white text-stone-700 hover:bg-amber-50 border border-stone-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-900" />
          <span>{language === 'te' ? '2. అమ్మవారి వివరాలు & మంత్రం' : '2. Deity & Mantra'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('venue')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-2xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'venue'
              ? 'bg-amber-500 text-stone-950 shadow-md ring-2 ring-amber-400'
              : 'bg-white text-stone-700 hover:bg-amber-50 border border-stone-200'
          }`}
        >
          <Calendar className="w-4 h-4 text-amber-900" />
          <span>{language === 'te' ? '3. డ్రా తేదీ & వేదిక' : '3. Schedule & Venue'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('committee')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-2xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'committee'
              ? 'bg-amber-500 text-stone-950 shadow-md ring-2 ring-amber-400'
              : 'bg-white text-stone-700 hover:bg-amber-50 border border-stone-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-900" />
          <span>{language === 'te' ? '4. కమిటీ & చెల్లింపులు' : '4. Committee & Payments'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('photos')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-2xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'photos'
              ? 'bg-amber-500 text-stone-950 shadow-md ring-2 ring-amber-400'
              : 'bg-white text-stone-700 hover:bg-amber-50 border border-stone-200'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-amber-900" />
          <span>{language === 'te' ? '5. అమ్మవారి ఫోటో / చిత్రం' : '5. Sacred Photo'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form Area (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border-2 border-stone-200 p-6 shadow-sm space-y-6">
          {/* TAB 1: EVENT TITLES & HEADERS */}
          {activeTab === 'titles' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-stone-200 pb-3">
                <h3 className="font-serif font-black text-stone-900 text-base sm:text-lg flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-600" />
                  <span>{language === 'te' ? 'ఉత్సవ ప్రధాన శీర్షికలు & పేర్లు' : 'Festival Titles & Headlines'}</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  These titles appear across the Header bar, Temple Hero Banner, Darshan modal, and Footer.
                </p>
              </div>

              {/* Event Title (Telugu) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-800">
                  {language === 'te' ? 'ఉత్సవ ప్రధాన పేరు (తెలుగులో)' : 'Main Festival Title (Telugu)'} *
                </label>
                <input
                  type="text"
                  required
                  value={profile.eventTitleTe}
                  onChange={(e) => handleFieldChange('eventTitleTe', e.target.value)}
                  placeholder="ఉదా: ఎదుల్లగూడెం దేవి శరన్నవరాత్రులు 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-amber-300 font-bold text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Event Title (English) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-800">
                  {language === 'te' ? 'ఉత్సవ ప్రధాన పేరు (ఇంగ్లీష్‌లో)' : 'Main Festival Title (English)'} *
                </label>
                <input
                  type="text"
                  required
                  value={profile.eventTitleEn}
                  onChange={(e) => handleFieldChange('eventTitleEn', e.target.value)}
                  placeholder="e.g. Edullagudem Devi Sharannavarathulu 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-amber-300 font-bold text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Event Subtitle (Telugu & English) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    {language === 'te' ? 'ఉప శీర్షిక (తెలుగు)' : 'Subtitle / Tagline (Telugu)'}
                  </label>
                  <input
                    type="text"
                    value={profile.eventSubtitleTe}
                    onChange={(e) => handleFieldChange('eventSubtitleTe', e.target.value)}
                    placeholder="ఉదా: శ్రీ దుర్గా భవానీ ఉత్సవ కమిటీ ప్రొఫైల్ & లక్కీ డ్రా"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    {language === 'te' ? 'ఉప శీర్షిక (ఇంగ్లీష్)' : 'Subtitle / Tagline (English)'}
                  </label>
                  <input
                    type="text"
                    value={profile.eventSubtitleEn}
                    onChange={(e) => handleFieldChange('eventSubtitleEn', e.target.value)}
                    placeholder="e.g. Sri Durga Bhavani Utsav Committee & Lucky Draw Portal"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Event Badge (Telugu & English) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    {language === 'te' ? 'ప్రత్యేక బ్యాడ్జ్ (తెలుగు)' : 'Event Ribbon Badge (Telugu)'}
                  </label>
                  <input
                    type="text"
                    value={profile.eventBadgeTe}
                    onChange={(e) => handleFieldChange('eventBadgeTe', e.target.value)}
                    placeholder="ఉదా: మహా లక్కీ డ్రా మహోత్సవం"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    {language === 'te' ? 'ప్రత్యేక బ్యాడ్జ్ (ఇంగ్లీష్)' : 'Event Ribbon Badge (English)'}
                  </label>
                  <input
                    type="text"
                    value={profile.eventBadgeEn}
                    onChange={(e) => handleFieldChange('eventBadgeEn', e.target.value)}
                    placeholder="e.g. Grand Lucky Draw Festival"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Hero Welcome Description (Telugu & English) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    {language === 'te' ? 'హీరో బ్యానర్ ఆహ్వాన సందేశం (తెలుగు)' : 'Hero Banner Welcome Message (Telugu)'}
                  </label>
                  <textarea
                    rows={2}
                    value={profile.heroDescriptionTe}
                    onChange={(e) => handleFieldChange('heroDescriptionTe', e.target.value)}
                    placeholder="అమ్మవారి దివ్య కృపా కటాక్షాలతో ₹50 టోకెన్ చెల్లించి ఎదుల్లగూడెం దేవి శరన్నవరాత్రుల లక్కీ డ్రాలో పాల్గొనండి!"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-amber-500 focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    {language === 'te' ? 'హీరో బ్యానర్ ఆహ్వాన సందేశం (ఇంగ్లీష్)' : 'Hero Banner Welcome Message (English)'}
                  </label>
                  <textarea
                    rows={2}
                    value={profile.heroDescriptionEn}
                    onChange={(e) => handleFieldChange('heroDescriptionEn', e.target.value)}
                    placeholder="Participate in the auspicious Sri Edullagudem Devi Sharannavarathulu lucky draw with ₹50 entry fee and receive your digital sequential token!"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-amber-500 focus:outline-none leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEITY & SACRED INSCRIPTIONS */}
          {activeTab === 'deity' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-stone-200 pb-3">
                <h3 className="font-serif font-black text-stone-900 text-base sm:text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <span>{language === 'te' ? 'అమ్మవారి దివ్య నామం & పవిత్ర మంత్రం' : 'Deity Name & Sacred Inscriptions'}</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Customize the official name of Ammavaru, divine taglines, and auspicious shlokams.
                </p>
              </div>

              {/* Top Sacred Inscription (Header bar) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-800">
                  {language === 'te' ? 'టాప్ పవిత్ర శీర్షిక (Top Sacred Inscription)' : 'Top Sacred Inscription'}
                </label>
                <input
                  type="text"
                  value={profile.topInscriptionTe}
                  onChange={(e) => handleFieldChange('topInscriptionTe', e.target.value)}
                  placeholder="ఉదా: ॥ శ్రీ దుర్గా భవానీ ప్రసన్న ॥"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-amber-300 font-serif font-bold text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Deity Name Telugu & English */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    {language === 'te' ? 'అమ్మవారి దివ్య నామం (తెలుగు)' : 'Deity Name (Telugu)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.deityNameTe}
                    onChange={(e) => handleFieldChange('deityNameTe', e.target.value)}
                    placeholder="ఉదా: శ్రీ ఎదుల్లగూడెం దేవి అమ్మవారు"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-xs sm:text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    {language === 'te' ? 'అమ్మవారి దివ్య నామం (ఇంగ్లీష్)' : 'Deity Name (English)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.deityNameEn}
                    onChange={(e) => handleFieldChange('deityNameEn', e.target.value)}
                    placeholder="e.g. Sri Edullagudem Devi Ammavaru"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-xs sm:text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Deity Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    {language === 'te' ? 'అమ్మవారి విశేష దర్శన ట్యాగ్‌లైన్ (తెలుగు)' : 'Deity Tagline (Telugu)'}
                  </label>
                  <input
                    type="text"
                    value={profile.deityTaglineTe}
                    onChange={(e) => handleFieldChange('deityTaglineTe', e.target.value)}
                    placeholder="ఉదా: త్రిశూలధారిణి · శరన్నవరాత్రుల ప్రధాన దివ్య దర్శనం"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    {language === 'te' ? 'అమ్మవారి విశేష దర్శన ట్యాగ్‌లైన్ (ఇంగ్లీష్)' : 'Deity Tagline (English)'}
                  </label>
                  <input
                    type="text"
                    value={profile.deityTaglineEn}
                    onChange={(e) => handleFieldChange('deityTaglineEn', e.target.value)}
                    placeholder="e.g. Sharannavarathulu Official Deity"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Sacred Mantra / Shlokam */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-stone-800">
                  {language === 'te' ? 'పవిత్ర శ్లోకం / మంత్రం (Sacred Mantra / Shlokam)' : 'Sacred Mantra / Shlokam'}
                </label>
                <textarea
                  rows={2}
                  value={profile.sacredMantra}
                  onChange={(e) => handleFieldChange('sacredMantra', e.target.value)}
                  placeholder="సర్వ మంగళ మాంగల్యే శివే సర్వార్థ సాధికే । శరణ్యే త్ర్యంబకే గౌరీ నారాయణి నమోస్తుతే ॥"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-serif focus:border-amber-500 focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 3: DRAW SCHEDULE & CELEBRATION VENUE */}
          {activeTab === 'venue' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-stone-200 pb-3">
                <h3 className="font-serif font-black text-stone-900 text-base sm:text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  <span>{language === 'te' ? 'లక్కీ డ్రా తేదీ & వేడుక వేదిక' : 'Draw Schedule & Celebration Venue'}</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Update the lucky draw date, timing, temple venue, and geographical details.
                </p>
              </div>

              {/* Draw Date (Telugu & English) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    {language === 'te' ? 'డ్రా తేదీ (తెలుగు)' : 'Draw Date (Telugu)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.drawDateTe}
                    onChange={(e) => handleFieldChange('drawDateTe', e.target.value)}
                    placeholder="ఉదా: 21 October 2026 (బుధవారం)"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-xs sm:text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    {language === 'te' ? 'డ్రా తేదీ (ఇంగ్లీష్)' : 'Draw Date (English)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.drawDateEn}
                    onChange={(e) => handleFieldChange('drawDateEn', e.target.value)}
                    placeholder="e.g. 21 October 2026 (Wednesday)"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-xs sm:text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Draw Time & Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    {language === 'te' ? 'డ్రా సమయం & వివరణ (తెలుగు)' : 'Draw Time & Details (Telugu)'}
                  </label>
                  <input
                    type="text"
                    value={profile.drawTimeTe}
                    onChange={(e) => handleFieldChange('drawTimeTe', e.target.value)}
                    placeholder="ఉదా: సాయంత్రం 6:00 గంటలకు ఎదుల్లగూడెం దేవి ఆలయ ప్రాంగణంలో భక్తుల సమక్షంలో పారదర్శక డ్రా."
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    {language === 'te' ? 'డ్రా సందర్భం / శీర్షిక (తెలుగు)' : 'Draw Occasion / Special Note (Telugu)'}
                  </label>
                  <input
                    type="text"
                    value={profile.drawNoteTe}
                    onChange={(e) => handleFieldChange('drawNoteTe', e.target.value)}
                    placeholder="ఉదా: విజయదశమి ముగింపు సాయంత్రం"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Venue Name & Village */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    {language === 'te' ? 'వేదిక పేరు / గ్రామం (తెలుగు)' : 'Venue Village (Telugu)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.venueNameTe}
                    onChange={(e) => handleFieldChange('venueNameTe', e.target.value)}
                    placeholder="ఉదా: ఎదుల్లగూడెం (Edullagudem)"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-xs sm:text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    {language === 'te' ? 'వేదిక పేరు / గ్రామం (ఇంగ్లీష్)' : 'Venue Village (English)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.venueNameEn}
                    onChange={(e) => handleFieldChange('venueNameEn', e.target.value)}
                    placeholder="e.g. Edullagudem Village"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-xs sm:text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Full Address (Telugu & English) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    {language === 'te' ? 'ఆలయ పూర్తి చిరునామా (తెలుగు)' : 'Temple Full Address (Telugu)'}
                  </label>
                  <textarea
                    rows={2}
                    value={profile.venueAddressTe}
                    onChange={(e) => handleFieldChange('venueAddressTe', e.target.value)}
                    placeholder="శ్రీ కనకదుర్గ అమ్మవారి దేవాలయం, ఇల్లందు మండలం, భద్రాద్రి కొత్తగూడెం జిల్లా, తెలంగాణ."
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-amber-500 focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    {language === 'te' ? 'ఆలయ పూర్తి చిరునామా (ఇంగ్లీష్)' : 'Temple Full Address (English)'}
                  </label>
                  <textarea
                    rows={2}
                    value={profile.venueAddressEn}
                    onChange={(e) => handleFieldChange('venueAddressEn', e.target.value)}
                    placeholder="Sri Kanakadurga Temple, Yellandu Mandal, Bhadradri Kothagudem Dist, Telangana."
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-amber-500 focus:outline-none leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COMMITTEE & PAYMENT CREDENTIALS */}
          {activeTab === 'committee' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-stone-200 pb-3">
                <h3 className="font-serif font-black text-stone-900 text-base sm:text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                  <span>{language === 'te' ? 'నిర్వాహక కమిటీ & చెల్లింపు ఆధారాలు' : 'Organizing Committee & Payment Credentials'}</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Update committee name, UPI payment details, ticket price, and coordinator WhatsApp phone number.
                </p>
              </div>

              {/* Committee Name (Telugu & English) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    {language === 'te' ? 'నిర్వాహక బృందం / కమిటీ పేరు (తెలుగు)' : 'Committee Name (Telugu)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.committeeNameTe}
                    onChange={(e) => handleFieldChange('committeeNameTe', e.target.value)}
                    placeholder="ఉదా: ఎదుల్లగూడెం దేవి ఉత్సవ కమిటీ"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-xs sm:text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    {language === 'te' ? 'నిర్వాహక బృందం / కమిటీ పేరు (ఇంగ్లీష్)' : 'Committee Name (English)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.committeeNameEn}
                    onChange={(e) => handleFieldChange('committeeNameEn', e.target.value)}
                    placeholder="e.g. Edullagudem Devi Utsava Committee"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-xs sm:text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Committee Description */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-stone-800">
                  {language === 'te' ? 'కమిటీ సందేశం / వివరణ (తెలుగు)' : 'Committee Message / Description (Telugu)'}
                </label>
                <input
                  type="text"
                  value={profile.committeeDescTe}
                  onChange={(e) => handleFieldChange('committeeDescTe', e.target.value)}
                  placeholder="ఉదా: గ్రామ పెద్దలు & యువకుల సమన్వయంతో భక్తిశ్రద్ధలతో నిర్వహించబడుతున్న శరన్నవరాత్రోత్సవాలు."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* UPI Name & UPI ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    {language === 'te' ? 'UPI గ్రహీత పేరు (Receiver Name)' : 'UPI Receiver Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.upiName}
                    onChange={(e) => handleFieldChange('upiName', e.target.value)}
                    placeholder="e.g. KANDALA KIRAN REDDY"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-xs sm:text-sm focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    {language === 'te' ? 'UPI ఐడీ (Payment UPI ID)' : 'Payment UPI ID'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.upiId}
                    onChange={(e) => handleFieldChange('upiId', e.target.value)}
                    placeholder="e.g. 9573454579@postbank"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-xs sm:text-sm focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Ticket Price & Coordinator WhatsApp Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    {language === 'te' ? 'టోకెన్ రుసుము (Ticket Fee ₹)' : 'Ticket Fee (₹)'} *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-stone-500 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      required
                      min={1}
                      value={profile.ticketPrice}
                      onChange={(e) => handleFieldChange('ticketPrice', e.target.value)}
                      placeholder="50"
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-300 font-bold text-sm focus:border-amber-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    {language === 'te' ? 'కోఆర్డినేటర్ వాట్సాప్ నంబర్ (10 అంకెలు)' : 'Coordinator WhatsApp Phone (10 digits)'} *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-stone-500 font-bold text-xs font-mono">+91</span>
                    <input
                      type="tel"
                      required
                      value={profile.coordinatorPhone}
                      onChange={(e) => handleFieldChange('coordinatorPhone', e.target.value)}
                      placeholder="6305729387"
                      className="w-full pl-12 pr-3 py-2 rounded-xl border border-stone-300 font-bold text-sm focus:border-amber-500 focus:outline-none font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-stone-500">
                    Official dual dispatch number for admin verification and lucky draw receipts.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SACRED PHOTO MANAGEMENT */}
          {activeTab === 'photos' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-stone-200 pb-3">
                <h3 className="font-serif font-black text-stone-900 text-base sm:text-lg flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-amber-600" />
                  <span>{language === 'te' ? 'అమ్మవారి పవిత్ర రూపం & ప్రొఫైల్ చిత్రం' : 'Sacred Deity Image & Profile Photo'}</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Upload an image from your device or paste an image URL. Updates across the live portal and banners.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-amber-50/60 border border-amber-300">
                <div className="shrink-0 flex flex-col items-center">
                  <DeviProfileAvatar size="2xl" showHalo={true} customSrc={profile.profileImage} />
                  <span className="text-[10px] font-bold text-amber-900 mt-2">Active Deity Portrait</span>
                </div>

                <div className="flex-1 w-full space-y-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
                    >
                      {isUploadingPhoto ? (
                        <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>{language === 'te' ? 'డివైస్ నుండి ఫోటో అప్‌లోడ్ చేయండి' : 'Upload Image from Computer/Mobile'}</span>
                    </button>

                    {profile.profileImage && (
                      <button
                        type="button"
                        onClick={handleResetPhoto}
                        className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-red-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{language === 'te' ? 'ఒరిజినల్ చిత్రానికి రీసెట్' : 'Reset to Default'}</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-700 block">
                      {language === 'te' ? 'లేదా ఇమేజ్ లింక్ (URL) అతికించండి:' : 'Or paste image URL (https://...):'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={customPhotoUrl}
                        onChange={(e) => setCustomPhotoUrl(e.target.value)}
                        placeholder="https://.../durga_ammavaru.jpg"
                        className="flex-1 px-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:border-amber-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPhotoUrl}
                        disabled={!customPhotoUrl.trim()}
                        className="px-4 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs disabled:opacity-40 cursor-pointer"
                      >
                        {language === 'te' ? 'అప్లై' : 'Apply'}
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-stone-500">
                    Supports JPG, PNG, WebP up to 8MB. Appears in the top navigation avatar, official darshan modal, and temple banner.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Save Action Bar */}
          <div className="pt-4 border-t-2 border-stone-200 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-stone-500">
              {language === 'te'
                ? 'మార్పులు చేసిన తర్వాత కింద ఉన్న బటన్‌ను క్లిక్ చేసి భద్రపరచండి.'
                : 'Click save to apply your changes across the live portal.'}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchProfile()}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
              >
                {language === 'te' ? 'రద్దు / రీలోడ్' : 'Discard / Reload'}
              </button>

              <button
                type="button"
                onClick={() => handleSaveAll()}
                disabled={isSaving}
                className="py-2.5 px-6 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                ) : (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                )}
                <span>{language === 'te' ? 'అన్ని వివరాలు భద్రపరచండి (Save Profile)' : 'Save All Changes'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Area: Live Real-Time Preview Card (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-gradient-to-b from-amber-950 via-stone-900 to-amber-950 text-white border-3 border-amber-400 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-amber-400/40 pb-2.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span>Live Portal Preview</span>
              </span>
              <span className="text-[10px] bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded-full border border-amber-400/30">
                Real-Time
              </span>
            </div>

            {/* Sacred Inscription */}
            <div className="text-center">
              <p className="font-serif text-xs font-bold text-amber-300 tracking-wider">
                {profile.topInscriptionTe || '॥ శ్రీ దుర్గా భవానీ ప్రసన్న ॥'}
              </p>
            </div>

            {/* Murti Preview with Frame */}
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <DeviProfileAvatar size="xl" showHalo={true} customSrc={profile.profileImage} />
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center text-xs font-black shadow-md">
                  ★
                </span>
              </div>
              <h4 className="font-serif font-black text-amber-100 text-base mt-2">
                {profile.deityNameTe || 'శ్రీ ఎదుల్లగూడెం దేవి అమ్మవారు'}
              </h4>
              <p className="text-[11px] text-amber-300/80">
                {profile.deityTaglineTe || 'శరన్నవరాత్రుల ప్రధాన దివ్య దర్శనం'}
              </p>
            </div>

            {/* Title & Badge */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-amber-400/40 space-y-1.5 text-center">
              <span className="inline-block px-2 py-0.5 rounded-full bg-red-600/80 text-yellow-200 text-[10px] font-black uppercase tracking-wider">
                {profile.eventBadgeTe || 'మహా లక్కీ డ్రా మహోత్సవం'}
              </span>
              <h5 className="font-serif font-black text-amber-200 text-sm sm:text-base leading-tight">
                {profile.eventTitleTe || 'ఎదుల్లగూడెం దేవి శరన్నవరాత్రులు 2026'}
              </h5>
              <p className="text-[11px] text-stone-300">
                {profile.eventTitleEn || 'Edullagudem Devi Sharannavarathulu 2026'}
              </p>
            </div>

            {/* Key Credentials Preview */}
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/10 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-stone-400 block">Draw Date:</span>
                  <span className="font-bold text-amber-200">{profile.drawDateTe}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/10 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-stone-400 block">Venue:</span>
                  <span className="font-bold text-amber-200">{profile.venueNameTe}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/10 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-stone-400 block">UPI Receiver & Fee:</span>
                  <span className="font-bold text-emerald-300">{profile.upiName} · ₹{profile.ticketPrice}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/10 flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-stone-400 block">WhatsApp Coordinator:</span>
                  <span className="font-mono font-bold text-amber-200">+91 {profile.coordinatorPhone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
