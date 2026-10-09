import React, { useState, useEffect } from 'react';
import { Language, Prize } from '../types';
import {
  Gift,
  PlusCircle,
  Edit2,
  Trash2,
  RotateCcw,
  Check,
  AlertCircle,
  Sparkles,
  Award,
  DollarSign,
  Heart,
  X,
  Loader2,
  Eye,
  Image,
  Upload
} from 'lucide-react';
import { DiyaIcon } from './FestiveIcons';
import { FALLBACK_PRIZES } from './EventDetails';
import { compressImageFile } from '../lib/imageUtils';

export const PRIZE_IMAGE_PRESETS = [
  {
    nameTe: 'బంగారు నాణెం / Gold Coin',
    nameEn: 'Gold Coin',
    url: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=800&q=80',
  },
  {
    nameTe: 'హీరో స్ప్లెండర్ బైక్ / Hero Bike',
    nameEn: 'Hero Bike',
    url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
  },
  {
    nameTe: 'స్వచ్ఛమైన వెండి పళ్లెం / Pure Silver Pooja Thali',
    nameEn: 'Silver Pooja Thali',
    url: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80',
  },
  {
    nameTe: 'మిక్సీ / కిచెన్ గ్రైండర్ / Kitchen Mixer Grinder',
    nameEn: 'Kitchen Appliance Set',
    url: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80',
  },
  {
    nameTe: '43 అంగుళాల స్మార్ట్ LED టీవీ / Smart LED TV',
    nameEn: 'Smart LED TV',
    url: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80',
  },
  {
    nameTe: 'పట్టు చీరలు & ప్రసాదం / Pure Silk Sarees',
    nameEn: 'Pure Silk Sarees',
    url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
  },
  {
    nameTe: 'డబుల్ డోర్ ఫ్రిజ్ / Refrigerator',
    nameEn: 'Refrigerator',
    url: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80',
  },
  {
    nameTe: 'వాషింగ్ మెషీన్ / Washing Machine',
    nameEn: 'Washing Machine',
    url: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=800&q=80',
  },
  {
    nameTe: 'నగదు బహుమతి / Cash Prize',
    nameEn: 'Cash Prize',
    url: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=800&q=80',
  }
];

interface AdminPrizesManagerProps {
  language: Language;
  token: string | null;
  onOpenPublicPreview?: () => void;
}

export const AdminPrizesManager: React.FC<AdminPrizesManagerProps> = ({
  language,
  token,
}) => {
  const [prizes, setPrizes] = useState<Prize[]>(FALLBACK_PRIZES);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);

  // Form Fields
  const [rank, setRank] = useState('');
  const [teluguRank, setTeluguRank] = useState('');
  const [title, setTitle] = useState('');
  const [titleTe, setTitleTe] = useState('');
  const [value, setValue] = useState('');
  const [sponsor, setSponsor] = useState('');
  const [colorTheme, setColorTheme] = useState<'gold' | 'silver' | 'bronze' | 'red' | 'emerald'>('gold');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isPopular, setIsPopular] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirm Modal
  const [prizeToDelete, setPrizeToDelete] = useState<Prize | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setFormError(null);
    try {
      const compressedDataUrl = await compressImageFile(file, 1200, 1200, 0.85);
      setImageUrl(compressedDataUrl);
    } catch (err) {
      console.error('Image compression failed:', err);
      setFormError(language === 'te' ? 'చిత్రం అప్‌లోడ్ విఫలమైంది.' : 'Failed to process image file.');
    } finally {
      setIsUploadingImage(false);
      // Reset input value so same file can be re-selected if desired
      e.target.value = '';
    }
  };

  const fetchPrizes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/prizes?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.prizes)) {
          setPrizes(data.prizes);
        }
      }
    } catch (err) {
      console.error('Error loading prizes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrizes();
  }, []);

  const openAddModal = () => {
    setEditingPrize(null);
    setRank(`Prize #${prizes.length + 1}`);
    setTeluguRank(language === 'te' ? `బహుమతి #${prizes.length + 1}` : `Prize #${prizes.length + 1}`);
    setTitle('');
    setTitleTe('');
    setValue('₹5,000+');
    setSponsor('శ్రీ ఎదుల్లగూడెం భక్త బృందం');
    setColorTheme('gold');
    setDescription('');
    setImageUrl('https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=800&q=80');
    setIsPopular(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Prize) => {
    setEditingPrize(p);
    setRank(p.rank);
    setTeluguRank(p.teluguRank || p.rank);
    setTitle(p.title);
    setTitleTe(p.titleTe || p.title);
    setValue(p.value);
    setSponsor(p.sponsor || '');
    setColorTheme(p.colorTheme || 'gold');
    setDescription(p.description || '');
    setImageUrl(p.imageUrl || '');
    setIsPopular(Boolean(p.isPopular));
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSavePrize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setFormError('Admin session expired. Please log in again.');
      return;
    }

    if (!title.trim() && !titleTe.trim()) {
      setFormError(language === 'te' ? 'దయచేసి బహుమతి పేరు నమోదు చేయండి' : 'Please enter the prize name/item');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    const payload = {
      rank: rank.trim() || 'Prize',
      teluguRank: teluguRank.trim() || rank.trim(),
      title: title.trim() || titleTe.trim(),
      titleTe: titleTe.trim() || title.trim(),
      value: value.trim() || 'Valuable Gift',
      sponsor: sponsor.trim(),
      colorTheme,
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      isPopular,
    };

    try {
      const url = editingPrize ? `/api/admin/prizes/${editingPrize.id}` : '/api/admin/prizes';
      const method = editingPrize ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save prize');
      }

      if (data.prizes) {
        setPrizes(data.prizes);
      } else {
        fetchPrizes();
      }

      window.dispatchEvent(new Event('festival_prizes_updated'));
      setIsModalOpen(false);
      showToast(
        editingPrize
          ? (language === 'te' ? 'బహుమతి విజయవంతంగా నవీకరించబడింది!' : 'Prize updated successfully!')
          : (language === 'te' ? 'నూతన బహుమతి విజయవంతంగా జోడించబడింది!' : 'New prize added successfully!')
      );
    } catch (err: any) {
      setFormError(err.message || 'Error saving prize');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePrize = async () => {
    if (!prizeToDelete || !token) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/admin/prizes/${prizeToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete prize');

      if (data.prizes) {
        setPrizes(data.prizes);
      } else {
        fetchPrizes();
      }

      window.dispatchEvent(new Event('festival_prizes_updated'));
      setPrizeToDelete(null);
      showToast(language === 'te' ? 'బహుమతి తొలగించబడింది.' : 'Prize deleted.');
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!token) return;
    if (!window.confirm(language === 'te' ? 'అన్ని బహుమతులను ఒరిజినల్ డిఫాల్ట్ బహుమతులకు రీసెట్ చేయాలా?' : 'Reset prizes to sacred default list?')) {
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/prizes/reset', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset prizes');

      if (data.prizes) setPrizes(data.prizes);
      window.dispatchEvent(new Event('festival_prizes_updated'));
      showToast(language === 'te' ? 'బహుమతులు డిఫాల్ట్‌లకు రీసెట్ చేయబడ్డాయి!' : 'Prizes reset to sacred defaults!');
    } catch (err: any) {
      alert(`Reset error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getThemeClasses = (theme?: string) => {
    switch (theme) {
      case 'gold':
        return {
          bg: 'bg-amber-500',
          badge: 'bg-amber-100 text-amber-900 border-amber-300',
          card: 'border-amber-300 hover:border-amber-400',
        };
      case 'silver':
        return {
          bg: 'bg-slate-500',
          badge: 'bg-slate-100 text-slate-900 border-slate-300',
          card: 'border-slate-300 hover:border-slate-400',
        };
      case 'bronze':
        return {
          bg: 'bg-amber-800',
          badge: 'bg-orange-100 text-orange-950 border-orange-300',
          card: 'border-orange-300 hover:border-orange-400',
        };
      case 'emerald':
        return {
          bg: 'bg-emerald-600',
          badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          card: 'border-emerald-300 hover:border-emerald-400',
        };
      case 'red':
      default:
        return {
          bg: 'bg-red-700',
          badge: 'bg-red-100 text-red-900 border-red-300',
          card: 'border-red-300 hover:border-red-400',
        };
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-800 hover:text-stone-900 p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-900 via-stone-900 to-amber-900 text-white p-5 sm:p-6 rounded-2xl border-2 border-amber-500/70 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center shrink-0">
            <Gift className="w-7 h-7 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-yellow-200">
                {language === 'te' ? 'లక్కీ డ్రా బహుమతుల నిర్వహణ' : 'Lucky Draw Prizes Management'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                {prizes.length} {language === 'te' ? 'బహుమతులు' : 'Prizes'}
              </span>
            </div>
            <p className="text-xs text-amber-200/80 mt-1 max-w-xl">
              {language === 'te'
                ? 'ఇక్కడ అడ్మిన్ కొత్త బహుమతులను జోడించవచ్చు, సవరించవచ్చు లేదా తొలగించవచ్చు. భక్తులకు హోమ్‌పేజీలో ఇవి కనిపిస్తాయి.'
                : 'Add new prizes, modify titles, specify values, and manage sponsors for the Lucky Draw event.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-stone-950 flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer border border-amber-200"
          >
            <PlusCircle className="w-4 h-4 text-stone-950" />
            <span>{language === 'te' ? '+ కొత్త బహుమతిని జోడించండి' : '+ Add New Prize'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={isSaving}
            className="px-3 py-2 rounded-xl font-semibold text-xs bg-white/10 hover:bg-white/20 text-stone-200 border border-stone-400/30 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reset to initial festival prizes"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'te' ? 'రీసెట్' : 'Reset'}</span>
          </button>
        </div>
      </div>

      {/* Prizes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {prizes.map((p, idx) => {
          const theme = getThemeClasses(p.colorTheme);
          return (
            <div
              key={p.id || idx}
              className={`bg-white rounded-2xl border-2 ${theme.card} p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden`}
            >
              {p.isPopular && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-yellow-400 text-stone-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-bl-lg shadow-2xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-stone-950" />
                  <span>Highlight</span>
                </div>
              )}

              <div className="space-y-3">
                {/* Dedicated Prize Image Section on Card */}
                {p.imageUrl ? (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden mb-2 bg-stone-100 border border-stone-200 group">
                    <img
                      src={p.imageUrl}
                      alt={p.titleTe || p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2 z-10">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border shadow-xs bg-white/95 ${theme.badge}`}>
                        {language === 'te' ? (p.teluguRank || p.rank) : p.rank}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2 z-10">
                      <span className="font-mono font-bold text-red-700 text-xs px-2 py-0.5 rounded-md bg-white/95 border border-amber-300 shadow-2xs">
                        {p.value}
                      </span>
                    </div>
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-xs">
                      <Image className="w-3 h-3 text-amber-300" />
                      <span>{language === 'te' ? 'ఫోటో ఉంది' : 'Photo'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-24 rounded-xl bg-amber-50/60 border border-dashed border-amber-300 flex flex-col items-center justify-center text-amber-800 mb-2">
                    <Image className="w-6 h-6 text-amber-500 mb-1" />
                    <span className="text-[11px] font-medium">{language === 'te' ? 'ఫోటో జోడించబడలేదు' : 'No Image Added'}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg ${theme.bg} text-white flex items-center justify-center font-bold shadow-sm shrink-0`}>
                      <Gift className="w-4 h-4" />
                    </div>
                    <div>
                      <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${theme.badge}`}>
                        {language === 'te' ? (p.teluguRank || p.rank) : p.rank}
                      </span>
                      <div className="text-xs font-bold text-red-700 font-mono mt-0.5">
                        {p.value}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-stone-900 text-base leading-snug">
                    {p.titleTe || p.title}
                  </h4>
                  {p.title && p.titleTe && p.title !== p.titleTe && (
                    <p className="text-xs text-stone-500 font-medium mt-0.5">
                      {p.title}
                    </p>
                  )}
                  {p.description && (
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      {p.description}
                    </p>
                  )}
                </div>

                {p.sponsor && (
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900">
                    <span className="font-bold text-[10px] uppercase text-amber-800 block">
                      {language === 'te' ? 'దాత / సౌజన్యం' : 'Sponsor'}:
                    </span>
                    <span>{p.sponsor}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                <div className="text-[11px] text-stone-400 font-mono">
                  Theme: <strong className="text-stone-600 uppercase">{p.colorTheme || 'gold'}</strong>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(p)}
                    className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                    title="Edit Prize"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                    <span>{language === 'te' ? 'ఎడిట్' : 'Edit'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrizeToDelete(p)}
                    className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                    title="Delete Prize"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>{language === 'te' ? 'తొలగించు' : 'Delete'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Prize Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-amber-400 overflow-hidden">
            <div className="bg-gradient-to-r from-red-800 via-red-700 to-amber-700 text-white px-6 py-4 flex items-center justify-between border-b-2 border-amber-400">
              <div className="flex items-center gap-2.5">
                <Gift className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base font-serif text-amber-200">
                  {editingPrize
                    ? (language === 'te' ? 'బహుమతి వివరాలు సవరించండి' : 'Edit Prize Details')
                    : (language === 'te' ? 'నూతన బహుమతిని జోడించండి' : 'Add New Prize')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-amber-200 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrize} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Rank & Telugu Rank */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Rank (English) *
                  </label>
                  <input
                    type="text"
                    value={rank}
                    onChange={(e) => setRank(e.target.value)}
                    placeholder="e.g. 1st Prize, 2nd Prize, Consolation"
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    బహుమతి స్థానం (తెలుగు)
                  </label>
                  <input
                    type="text"
                    value={teluguRank}
                    onChange={(e) => setTeluguRank(e.target.value)}
                    placeholder="ఉదా: ప్రథమ బహుమతి, ద్వితీయ బహుమతి"
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Title Telugu & English */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  బహుమతి పేరు / వస్తువు (తెలుగు) *
                </label>
                <input
                  type="text"
                  value={titleTe}
                  onChange={(e) => setTitleTe(e.target.value)}
                  placeholder="ఉదా: బంగారు నాణెం / హీరో బైక్ లేదా నగదు బహుమతి"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Prize Item / Name (English)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Gold Coin / Hero Bike or Cash Prize"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Value & Color Theme */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    అంచనా విలువ / Worth (₹)
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="ఉదా: ₹25,000+ లేదా 10 Winners"
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    కలర్ థీమ్ (Theme Badge)
                  </label>
                  <select
                    value={colorTheme}
                    onChange={(e) => setColorTheme(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:border-amber-500 focus:outline-none bg-white"
                  >
                    <option value="gold">🥇 Gold (బంగారు పసుపు)</option>
                    <option value="silver">🥈 Silver (వెండి తెలుపు)</option>
                    <option value="bronze">🥉 Bronze (కాంస్య కాషాయం)</option>
                    <option value="emerald">💎 Emerald (పచ్చ ఆకుపచ్చ)</option>
                    <option value="red">🌺 Sacred Red (సింధూర ఎరుపు)</option>
                  </select>
                </div>
              </div>

              {/* Sponsor Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  దాతల పేరు / Sponsor (Optional)
                </label>
                <input
                  type="text"
                  value={sponsor}
                  onChange={(e) => setSponsor(e.target.value)}
                  placeholder="ఉదా: శ్రీ ఎదుల్లగూడెం భక్త బృందం / దాతల సౌజన్యం"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  వివరణ / Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="బహుమతికి సంబంధించిన అదనపు వివరాలు..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>

              {/* DEDICATED PRIZE IMAGE SECTION */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50/60 to-amber-50 border-2 border-amber-300 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Image className="w-4 h-4 text-amber-600" />
                    <span>{language === 'te' ? 'బహుమతి ఫోటో సెక్షన్ (Prize Image Section)' : 'Prize Image Section'}</span>
                  </label>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{language === 'te' ? 'ఫోటో తీసివేయి' : 'Remove Image'}</span>
                    </button>
                  )}
                </div>

                {/* Image Preview & Upload Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  {/* Preview Box */}
                  <div className="sm:col-span-5">
                    <div className="w-full h-32 rounded-xl border-2 border-amber-300 bg-white overflow-hidden flex items-center justify-center relative shadow-inner">
                      {imageUrl ? (
                        <>
                          <img
                            src={imageUrl}
                            alt="Prize Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                            Preview
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-3 text-stone-400">
                          <Image className="w-8 h-8 mx-auto mb-1 text-stone-300" />
                          <span className="text-[10px] block font-medium">
                            {language === 'te' ? 'ఫోటో ప్రివ్యూ' : 'Image Preview'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload / URL Options */}
                  <div className="sm:col-span-7 space-y-2">
                    {/* File Upload Button */}
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        {language === 'te' ? 'ఫోన్ / కంప్యూటర్ నుండి అప్‌లోడ్ చేయండి:' : 'Upload from Device:'}
                      </label>
                      <label className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors border border-amber-400">
                        {isUploadingImage ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 text-stone-950" />
                        )}
                        <span>{language === 'te' ? 'ఫోటో ఫైల్ ఎంచుకోండి (Upload)' : 'Choose Image File'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Web Image URL */}
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        {language === 'te' ? 'లేదా వెబ్ ఇమేజ్ లింక్ (Image URL):' : 'Or Image URL Link:'}
                      </label>
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Festival Prize Image Presets */}
                <div className="pt-2 border-t border-amber-200/80">
                  <label className="block text-[11px] font-bold text-stone-800 mb-1.5">
                    {language === 'te' ? 'త్వరిత బహుమతి చిత్రాలు (1-Click Presets):' : 'Quick Prize Presets (1-Click):'}
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-white/70 rounded-xl border border-amber-200">
                    {PRIZE_IMAGE_PRESETS.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setImageUrl(preset.url)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
                          imageUrl === preset.url
                            ? 'bg-amber-500 text-stone-950 border-amber-600 font-bold shadow-2xs'
                            : 'bg-white hover:bg-amber-100 text-stone-800 border-stone-200 hover:border-amber-300'
                        }`}
                      >
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>{language === 'te' ? preset.nameTe : preset.nameEn}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Popular Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="popularCheck"
                  checked={isPopular}
                  onChange={(e) => setIsPopular(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-400"
                />
                <label htmlFor="popularCheck" className="text-xs font-semibold text-stone-800 cursor-pointer">
                  {language === 'te' ? 'టాప్ హైలైట్ బహుమతిగా గుర్తించు (Highlight as Top Prize)' : 'Highlight as Top Featured Prize'}
                </label>
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                >
                  {language === 'te' ? 'రద్దు చేయి' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                  ) : (
                    <Check className="w-4 h-4 text-stone-950" />
                  )}
                  <span>
                    {editingPrize
                      ? (language === 'te' ? 'నవీకరించు' : 'Update Prize')
                      : (language === 'te' ? 'బహుమతిని జోడించు' : 'Save Prize')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {prizeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-red-500 overflow-hidden">
            <div className="bg-red-700 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                <h4 className="font-bold text-sm">
                  {language === 'te' ? 'బహుమతిని తొలగించాలా?' : 'Delete Prize?'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPrizeToDelete(null)}
                className="text-red-200 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                {language === 'te'
                  ? `మీరు నిజంగా '${prizeToDelete.titleTe || prizeToDelete.title}' బహుమతిని తొలగించాలనుకుంటున్నారా?`
                  : `Are you sure you want to delete '${prizeToDelete.title}' (${prizeToDelete.rank})?`}
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setPrizeToDelete(null)}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                >
                  {language === 'te' ? 'వద్దు' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleDeletePrize}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>{language === 'te' ? 'అవును, తొలగించు' : 'Yes, Delete'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
