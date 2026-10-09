import React, { useState, useEffect, useRef } from 'react';
import { Language, FestivalProfile } from '../types';
import { DeviProfileAvatar, DEFAULT_DEVI_PROFILE_STORAGE_KEY } from './DeviProfileAvatar';
import { DiyaIcon, KalasamIcon } from './FestiveIcons';
import {
  X,
  Sparkles,
  MapPin,
  Phone,
  Calendar,
  ShieldCheck,
  Lock,
  Edit3,
  Check,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  Ticket,
  KeyRound,
  ArrowRight
} from 'lucide-react';
import { useFestivalProfile } from '../lib/profile';
import { TARGET_WHATSAPP_NUMBER } from '../lib/whatsapp';
import { compressImageFile } from '../lib/imageUtils';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onGoToAdmin?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  language,
  onGoToAdmin,
}) => {
  const { profile: serverProfile, refreshProfile } = useFestivalProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<FestivalProfile>(serverProfile);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  // Quick admin login state if needed
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editTab, setEditTab] = useState<'titles' | 'deity' | 'venue' | 'committee' | 'photo'>('titles');

  // Photo uploader
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');

  // Check admin login
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setShowPasswordPrompt(false);
      setInputPassword('');
      setPasswordError(null);
      return;
    }

    const token = sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
    if (token) {
      setIsAdminLoggedIn(true);
      setAdminToken(token);
    } else {
      setIsAdminLoggedIn(false);
      setAdminToken(null);
    }
    setEditData({ ...serverProfile });
  }, [isOpen, serverProfile]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleFieldChange = (field: keyof FestivalProfile, value: string) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Authenticate Admin inside modal
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPassword.trim()) return;

    setIsAuthenticating(true);
    setPasswordError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: inputPassword.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid admin password');
      }

      const token = data.token;
      sessionStorage.setItem('admin_token', token);
      localStorage.setItem('admin_token', token);
      setAdminToken(token);
      setIsAdminLoggedIn(true);
      setShowPasswordPrompt(false);
      setInputPassword('');
      setIsEditing(true);
      window.dispatchEvent(new Event('admin_auth_changed'));
      showToast(language === 'te' ? 'అడ్మిన్ లాగిన్ విజయవంతమైంది! ఇప్పుడు వివరాలు మార్చవచ్చు.' : 'Admin authenticated! You can now edit profile details.');
    } catch (err: any) {
      setPasswordError(err.message || 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Photo Upload Handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await compressImageFile(file, 900, 900, 0.85);
      setEditData((prev) => ({
        ...prev,
        profileImage: res,
      }));
      showToast(language === 'te' ? 'చిత్రం లోడ్ అయింది! దయచేసి సేవ్ చేయండి.' : 'Image loaded! Please save changes.');
    } catch {
      alert('Failed to process image');
    } finally {
      e.target.value = '';
    }
  };

  const handleApplyPhotoUrl = () => {
    if (!customPhotoUrl.trim()) return;
    setEditData((prev) => ({
      ...prev,
      profileImage: customPhotoUrl.trim(),
    }));
    setCustomPhotoUrl('');
    showToast(language === 'te' ? 'ఫోటో URL అప్లై చేయబడింది.' : 'Photo URL applied.');
  };

  // Save changes to backend
  const handleSaveProfile = async () => {
    const tokenToUse = adminToken || sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
    if (!tokenToUse) {
      setShowPasswordPrompt(true);
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
        body: JSON.stringify(editData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      // Sync local storage profile image if present
      if (data.profile?.profileImage) {
        try {
          localStorage.setItem(DEFAULT_DEVI_PROFILE_STORAGE_KEY, data.profile.profileImage);
        } catch {}
      }

      window.dispatchEvent(new Event('festival_profile_updated'));
      window.dispatchEvent(new Event('devi_profile_updated'));
      refreshProfile();
      setIsEditing(false);
      showToast(
        language === 'te'
          ? 'ఉత్సవ ప్రొఫైల్ శీర్షికలు & వివరాలు విజయవంతంగా అప్‌డేట్ అయ్యాయి!'
          : 'All festival titles & profile details updated live!'
      );
    } catch (err: any) {
      alert(err.message || 'Error saving changes');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const displayTitle = language === 'te'
    ? (serverProfile.eventTitleTe || 'ఎదుల్లగూడెం దేవి శరన్నవరాత్రులు 2026')
    : (serverProfile.eventTitleEn || 'Edullagudem Devi Sharannavarathulu 2026');

  const displaySubtitle = language === 'te'
    ? (serverProfile.eventSubtitleTe || 'శ్రీ దుర్గా భవానీ ఉత్సవ కమిటీ ప్రొఫైల్ & లక్కీ డ్రా')
    : (serverProfile.eventSubtitleEn || 'Sri Durga Bhavani Utsav Committee & Lucky Draw Portal');

  const displayDeity = language === 'te'
    ? (serverProfile.deityNameTe || 'శ్రీ ఎదుల్లగూడెం దేవి అమ్మవారు')
    : (serverProfile.deityNameEn || 'Sri Edullagudem Devi Ammavaru');

  const displayTagline = language === 'te'
    ? (serverProfile.deityTaglineTe || 'త్రిశూలధారిణి · శరన్నవరాత్రుల ప్రధాన దివ్య దర్శనం')
    : (serverProfile.deityTaglineEn || 'Sharannavarathulu Official Deity');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border-3 border-amber-400 overflow-hidden max-h-[94vh] flex flex-col">
        {/* Top Auspicious Banner */}
        <div className="bg-gradient-to-r from-red-950 via-[#7F1D1D] to-amber-950 text-amber-100 p-4 sm:p-5 relative border-b-2 border-amber-500 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-2 rounded-full text-amber-200 hover:text-white hover:bg-black/30 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <DiyaIcon className="w-5 h-5 text-amber-300" />
            <span className="text-[11px] font-bold tracking-widest text-amber-300 uppercase">
              {isEditing
                ? (language === 'te' ? 'అడ్మిన్ ప్రొఫైల్ సవరణ' : 'ADMIN PROFILE & TITLES EDITOR')
                : (language === 'te' ? 'అధికారిక ఉత్సవ దర్శనం' : 'OFFICIAL FESTIVAL DARSHAN')}
            </span>
            <KalasamIcon className="w-5 h-5 text-amber-300" />
          </div>

          <h3 className="text-lg sm:text-xl font-bold font-serif text-yellow-200">
            {displayTitle}
          </h3>
          <p className="text-xs text-amber-200/80">
            {displaySubtitle}
          </p>
        </div>

        {/* Toast alert */}
        {toastMessage && (
          <div className="p-3 bg-emerald-50 border-b border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-950">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Admin Login Prompt if unauthenticated and wants to edit */}
          {showPasswordPrompt && (
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                  <KeyRound className="w-4 h-4 text-amber-700" />
                  <span>{language === 'te' ? 'అడ్మిన్ పాస్‌వర్డ్ నమోదు చేయండి' : 'Enter Admin Password to Edit'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasswordPrompt(false)}
                  className="text-stone-400 hover:text-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-2.5">
                <input
                  type="password"
                  autoFocus
                  required
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  placeholder={language === 'te' ? 'అడ్మిన్ సెక్యూరిటీ పాస్‌వర్డ్...' : 'Admin security password...'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:border-amber-500 focus:outline-none"
                />

                {passwordError && (
                  <p className="text-xs text-red-600 font-semibold">{passwordError}</p>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isAuthenticating || !inputPassword.trim()}
                    className="flex-1 py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {isAuthenticating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>{language === 'te' ? 'లాగిన్ చేసి సవరించండి' : 'Authenticate & Open Editor'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordPrompt(false)}
                    className="py-2 px-3 rounded-xl bg-stone-200 text-stone-700 text-xs font-semibold"
                  >
                    {language === 'te' ? 'రద్దు' : 'Cancel'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* EDIT MODE: Rich In-Place Editor */}
          {isEditing ? (
            <div className="space-y-4 animate-fadeIn">
              {/* Category tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-stone-200 text-xs">
                <button
                  type="button"
                  onClick={() => setEditTab('titles')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    editTab === 'titles'
                      ? 'bg-amber-500 text-stone-950 shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {language === 'te' ? '1. శీర్షికలు' : '1. Titles'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditTab('deity')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    editTab === 'deity'
                      ? 'bg-amber-500 text-stone-950 shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {language === 'te' ? '2. అమ్మవారు & మంత్రం' : '2. Deity'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditTab('venue')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    editTab === 'venue'
                      ? 'bg-amber-500 text-stone-950 shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {language === 'te' ? '3. తేదీ & వేదిక' : '3. Schedule'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditTab('committee')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    editTab === 'committee'
                      ? 'bg-amber-500 text-stone-950 shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {language === 'te' ? '4. కమిటీ & చెల్లింపులు' : '4. Committee'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditTab('photo')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    editTab === 'photo'
                      ? 'bg-amber-500 text-stone-950 shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {language === 'te' ? '5. చిత్రం' : '5. Photo'}
                </button>
              </div>

              {/* Subtab 1: Titles */}
              {editTab === 'titles' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      {language === 'te' ? 'ప్రధాన ఉత్సవ పేరు (తెలుగు)' : 'Main Festival Title (Telugu)'}
                    </label>
                    <input
                      type="text"
                      value={editData.eventTitleTe}
                      onChange={(e) => handleFieldChange('eventTitleTe', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-sm focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      {language === 'te' ? 'ప్రధాన ఉత్సవ పేరు (ఇంగ్లీష్)' : 'Main Festival Title (English)'}
                    </label>
                    <input
                      type="text"
                      value={editData.eventTitleEn}
                      onChange={(e) => handleFieldChange('eventTitleEn', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-sm focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        {language === 'te' ? 'ఉప శీర్షిక (తెలుగు)' : 'Subtitle (Telugu)'}
                      </label>
                      <input
                        type="text"
                        value={editData.eventSubtitleTe}
                        onChange={(e) => handleFieldChange('eventSubtitleTe', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        {language === 'te' ? 'ఉప శీర్షిక (ఇంగ్లీష్)' : 'Subtitle (English)'}
                      </label>
                      <input
                        type="text"
                        value={editData.eventSubtitleEn}
                        onChange={(e) => handleFieldChange('eventSubtitleEn', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      {language === 'te' ? 'హీరో బ్యానర్ వివరణ' : 'Hero Description'}
                    </label>
                    <textarea
                      rows={2}
                      value={editData.heroDescriptionTe}
                      onChange={(e) => handleFieldChange('heroDescriptionTe', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Subtab 2: Deity */}
              {editTab === 'deity' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      {language === 'te' ? 'అమ్మవారి దివ్య నామం (తెలుగు)' : 'Deity Name (Telugu)'}
                    </label>
                    <input
                      type="text"
                      value={editData.deityNameTe}
                      onChange={(e) => handleFieldChange('deityNameTe', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-sm focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      {language === 'te' ? 'అమ్మవారి దివ్య నామం (ఇంగ్లీష్)' : 'Deity Name (English)'}
                    </label>
                    <input
                      type="text"
                      value={editData.deityNameEn}
                      onChange={(e) => handleFieldChange('deityNameEn', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-sm focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      {language === 'te' ? 'టాప్ పవిత్ర శ్లోకం / శీర్షిక' : 'Top Inscription'}
                    </label>
                    <input
                      type="text"
                      value={editData.topInscriptionTe}
                      onChange={(e) => handleFieldChange('topInscriptionTe', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-serif focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      {language === 'te' ? 'పవిత్ర మంత్రం' : 'Sacred Mantra'}
                    </label>
                    <textarea
                      rows={2}
                      value={editData.sacredMantra}
                      onChange={(e) => handleFieldChange('sacredMantra', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-serif focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Subtab 3: Schedule & Venue */}
              {editTab === 'venue' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        {language === 'te' ? 'డ్రా తేదీ (తెలుగు)' : 'Draw Date (Telugu)'}
                      </label>
                      <input
                        type="text"
                        value={editData.drawDateTe}
                        onChange={(e) => handleFieldChange('drawDateTe', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        {language === 'te' ? 'డ్రా తేదీ (ఇంగ్లీష్)' : 'Draw Date (English)'}
                      </label>
                      <input
                        type="text"
                        value={editData.drawDateEn}
                        onChange={(e) => handleFieldChange('drawDateEn', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      {language === 'te' ? 'డ్రా సమయం & వివరణ' : 'Draw Time & Details'}
                    </label>
                    <input
                      type="text"
                      value={editData.drawTimeTe}
                      onChange={(e) => handleFieldChange('drawTimeTe', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      {language === 'te' ? 'వేదిక పేరు / గ్రామం' : 'Venue Name / Village'}
                    </label>
                    <input
                      type="text"
                      value={editData.venueNameTe}
                      onChange={(e) => handleFieldChange('venueNameTe', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      {language === 'te' ? 'ఆలయ పూర్తి చిరునామా' : 'Temple Full Address'}
                    </label>
                    <textarea
                      rows={2}
                      value={editData.venueAddressTe}
                      onChange={(e) => handleFieldChange('venueAddressTe', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Subtab 4: Committee & Credentials */}
              {editTab === 'committee' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      {language === 'te' ? 'కమిటీ పేరు (తెలుగు)' : 'Committee Name (Telugu)'}
                    </label>
                    <input
                      type="text"
                      value={editData.committeeNameTe}
                      onChange={(e) => handleFieldChange('committeeNameTe', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        {language === 'te' ? 'UPI గ్రహీత పేరు' : 'UPI Receiver Name'}
                      </label>
                      <input
                        type="text"
                        value={editData.upiName}
                        onChange={(e) => handleFieldChange('upiName', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-mono font-bold focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        {language === 'te' ? 'UPI ఐడీ' : 'UPI ID'}
                      </label>
                      <input
                        type="text"
                        value={editData.upiId}
                        onChange={(e) => handleFieldChange('upiId', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-mono font-bold focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        {language === 'te' ? 'టోకెన్ రుసుము (₹)' : 'Ticket Fee (₹)'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={editData.ticketPrice}
                        onChange={(e) => handleFieldChange('ticketPrice', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-mono font-bold focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        {language === 'te' ? 'కోఆర్డినేటర్ ఫోన్' : 'Coordinator Phone'}
                      </label>
                      <input
                        type="tel"
                        value={editData.coordinatorPhone}
                        onChange={(e) => handleFieldChange('coordinatorPhone', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-mono font-bold focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab 5: Photo */}
              {editTab === 'photo' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-3 rounded-2xl bg-stone-50 border border-stone-200">
                    <DeviProfileAvatar size="xl" showHalo={true} customSrc={editData.profileImage} />
                    <div className="space-y-2 flex-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{language === 'te' ? 'ఫోన్ / కంప్యూటర్ నుండి అప్‌లోడ్' : 'Upload from Device'}</span>
                      </button>

                      {editData.profileImage && (
                        <button
                          type="button"
                          onClick={() => setEditData((prev) => ({ ...prev, profileImage: null }))}
                          className="py-1 px-2.5 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 text-[11px] font-bold block cursor-pointer"
                        >
                          {language === 'te' ? 'డిఫాల్ట్ చిత్రానికి రీసెట్' : 'Reset to Default'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-700 block">
                      {language === 'te' ? 'లేదా ఇమేజ్ లింక్ (URL):' : 'Or Image URL:'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={customPhotoUrl}
                        onChange={(e) => setCustomPhotoUrl(e.target.value)}
                        placeholder="https://...image.jpg"
                        className="flex-1 px-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:border-amber-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPhotoUrl}
                        disabled={!customPhotoUrl.trim()}
                        className="px-3 py-1.5 rounded-xl bg-stone-900 text-amber-300 font-bold text-xs disabled:opacity-40 cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Save & Cancel Action buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 stroke-[3]" />
                  )}
                  <span>{language === 'te' ? 'అన్ని వివరాలు భద్రపరచండి (Save All)' : 'Save All Changes'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer"
                >
                  {language === 'te' ? 'రద్దు' : 'Cancel'}
                </button>
              </div>
            </div>
          ) : (
            /* VIEW MODE: Beautiful Darshan Presentation with Edit Trigger */
            <>
              {/* Central Sacred Avatar Display */}
              <div className="flex flex-col items-center text-center p-5 rounded-3xl bg-gradient-to-b from-amber-50/90 via-white to-red-50/40 border border-amber-200 shadow-inner relative">
                {/* Admin Quick Edit Button Badge (Only shown to authenticated admin) */}
                {isAdminLoggedIn && (
                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs shadow flex items-center gap-1.5 cursor-pointer border border-amber-300 transition-all active:scale-95"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{language === 'te' ? 'శీర్షికలు సవరించండి' : 'Edit Details'}</span>
                    </button>
                  </div>
                )}

                <div className="relative mb-3">
                  <DeviProfileAvatar size="hero" showHalo={true} customSrc={serverProfile.profileImage} />
                </div>

                <h4 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight font-serif">
                  {displayDeity}
                </h4>
                <span className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full bg-amber-100 text-amber-950 text-xs font-bold border border-amber-300 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  {displayTagline}
                </span>

                <p className="text-xs text-stone-600 mt-2.5 max-w-md leading-relaxed font-serif">
                  {serverProfile.sacredMantra || 'సర్వ మంగళ మాంగల్యే శివే సర్వార్థ సాధికే । శరణ్యే త్ర్యంబకే గౌరీ నారాయణి నమోస్తుతే ॥'}
                </p>
              </div>

              {/* Key Organizer & Event Profile Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {/* UPI & Organizer */}
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-stone-500 font-semibold uppercase">UPI & Organizer</p>
                    <p className="font-bold text-stone-900">{serverProfile.upiName || 'KANDALA KIRAN REDDY'}</p>
                    <p className="font-mono text-emerald-800 font-bold text-[11px]">{serverProfile.upiId || '9573454579@postbank'}</p>
                  </div>
                </div>

                {/* Coordinator WhatsApp */}
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-stone-500 font-semibold uppercase">Coordinator WhatsApp</p>
                    <p className="font-mono font-bold text-stone-900">+91 {serverProfile.coordinatorPhone || TARGET_WHATSAPP_NUMBER}</p>
                    <p className="text-emerald-700 text-[11px] font-medium">Dual WhatsApp Active</p>
                  </div>
                </div>

                {/* Lucky Draw Schedule */}
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-stone-500 font-semibold uppercase">Grand Draw Schedule</p>
                    <p className="font-bold text-stone-900">
                      {language === 'te' ? serverProfile.drawDateTe : serverProfile.drawDateEn}
                    </p>
                    <p className="text-stone-600 text-[11px]">
                      {language === 'te' ? serverProfile.drawTimeTe : serverProfile.drawTimeEn}
                    </p>
                  </div>
                </div>

                {/* Temple Venue */}
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-amber-800 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-stone-500 font-semibold uppercase">Temple Location</p>
                    <p className="font-bold text-stone-900">
                      {language === 'te' ? serverProfile.venueNameTe : serverProfile.venueNameEn}
                    </p>
                    <p className="text-stone-600 text-[11px]">
                      {language === 'te' ? serverProfile.venueAddressTe : serverProfile.venueAddressEn}
                    </p>
                  </div>
                </div>
              </div>

              {/* Committee & Ticket Info Banner */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-300 flex items-center justify-between text-xs">
                <div>
                  <p className="text-[10px] text-amber-900 font-bold uppercase tracking-wider">
                    {language === 'te' ? 'నిర్వాహక కమిటీ' : 'Organizing Committee'}
                  </p>
                  <p className="font-bold text-stone-900 text-sm">
                    {language === 'te' ? serverProfile.committeeNameTe : serverProfile.committeeNameEn}
                  </p>
                  <p className="text-[11px] text-stone-600 mt-0.5">
                    {language === 'te' ? serverProfile.committeeDescTe : serverProfile.committeeDescEn}
                  </p>
                </div>

                <div className="text-right shrink-0 pl-3">
                  <span className="text-[10px] text-stone-500 block uppercase font-bold">Ticket Fee</span>
                  <span className="text-lg font-black text-amber-900">₹{serverProfile.ticketPrice || '50'}</span>
                </div>
              </div>

              {/* Administrator Control Action Bar (Only shown to authenticated admin) */}
              {isAdminLoggedIn && (
                <div className="p-3.5 rounded-2xl bg-stone-900 text-amber-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center shrink-0 font-bold">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-yellow-300">
                        {language === 'te' ? 'అడ్మిన్ ప్రొఫైల్ నిర్వహణ పోర్టల్' : 'Admin Profile Management'}
                      </p>
                      <p className="text-[11px] text-stone-300">
                        {language === 'te'
                          ? 'ఉత్సవ శీర్షికలు, ప్రొఫైల్ ఫోటో మరియు వివరాలను మీ ఇష్టానుసారం మార్చవచ్చు.'
                          : 'Change titles, banner image, dates, fee, and credentials freely.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="flex-1 sm:flex-none px-4 py-2 text-xs font-black rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow whitespace-nowrap"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{language === 'te' ? 'ఇక్కడే సవరించండి' : 'Edit Directly Here'}</span>
                    </button>

                    {onGoToAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onGoToAdmin();
                        }}
                        className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {language === 'te' ? 'అడ్మిన్ పోర్టల్' : 'Admin Portal'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-stone-100 border-t border-stone-200 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-stone-500 truncate max-w-[280px]">
            {displayTitle}
          </p>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-stone-800 text-white text-xs font-bold hover:bg-stone-700 cursor-pointer"
          >
            {language === 'te' ? 'మూసివేయి' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
