import React, { useState, useEffect, useRef } from 'react';
import { Language, Sponsor } from '../types';
import {
  HeartHandshake,
  PlusCircle,
  Trash2,
  Edit2,
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Loader2,
  Sparkles,
  MapPin,
  Award,
  Phone,
  RotateCcw,
  CheckCircle2,
  Maximize2,
  ZoomIn
} from 'lucide-react';
import { KalasamIcon } from './FestiveIcons';
import { compressImageFile } from '../lib/imageUtils';

interface AdminSponsorsManagerProps {
  language: Language;
  token: string | null;
}

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

export const AdminSponsorsManager: React.FC<AdminSponsorsManagerProps> = ({
  language,
  token,
}) => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [contributionModalSponsor, setContributionModalSponsor] = useState<Sponsor | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [imageSizeView, setImageSizeView] = useState<'standard' | 'extra_large'>('extra_large');
  const [previewPhotoModal, setPreviewPhotoModal] = useState<Sponsor | null>(null);

  // INLINE CONTRIBUTION EDITING STATE (Card by Card)
  const [inlineEditingSponsorId, setInlineEditingSponsorId] = useState<string | null>(null);
  const [inlineTitleTe, setInlineTitleTe] = useState('');
  const [inlineTitleEn, setInlineTitleEn] = useState('');
  const [inlineAmount, setInlineAmount] = useState('');
  const [isSavingInline, setIsSavingInline] = useState(false);

  // Full Form State
  const [name, setName] = useState('');
  const [nameTe, setNameTe] = useState('');
  const [title, setTitle] = useState('');
  const [titleTe, setTitleTe] = useState('');
  const [amount, setAmount] = useState('');
  const [location, setLocation] = useState('Edullagudem');
  const [phone, setPhone] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Quick Modal Contribution Edit Form State
  const [quickTitleTe, setQuickTitleTe] = useState('');
  const [quickTitleEn, setQuickTitleEn] = useState('');
  const [quickAmount, setQuickAmount] = useState('');
  const [isSavingContribution, setIsSavingContribution] = useState(false);

  const fetchSponsors = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/sponsors?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.sponsors)) {
          setSponsors(data.sponsors);
        }
      }
    } catch (err) {
      console.error('Failed to load sponsors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSponsors();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const resetForm = () => {
    setName('');
    setNameTe('');
    setTitle('');
    setTitleTe('');
    setAmount('');
    setLocation('Edullagudem');
    setPhone('');
    setIsFeatured(false);
    setImageUrl('');
    setEditingSponsor(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setName(sponsor.name);
    setNameTe(sponsor.nameTe || sponsor.name);
    setTitle(sponsor.title);
    setTitleTe(sponsor.titleTe || sponsor.title);
    setAmount(sponsor.amount || '');
    setLocation(sponsor.location || 'Edullagudem');
    setPhone(sponsor.phone || '');
    setIsFeatured(Boolean(sponsor.isFeatured));
    setImageUrl(sponsor.imageUrl || '');
    setIsModalOpen(true);
  };

  // Open Quick Edit Contribution Modal
  const handleOpenContributionModal = (sponsor: Sponsor) => {
    setContributionModalSponsor(sponsor);
    setQuickTitleTe(sponsor.titleTe || sponsor.title || '');
    setQuickTitleEn(sponsor.title || '');
    setQuickAmount(sponsor.amount || '');
  };

  // Open INLINE Contribution Editor on Card
  const handleStartInlineEdit = (sponsor: Sponsor) => {
    setInlineEditingSponsorId(sponsor.id);
    setInlineTitleTe(sponsor.titleTe || sponsor.title || '');
    setInlineTitleEn(sponsor.title || '');
    setInlineAmount(sponsor.amount || '');
  };

  const handleCancelInlineEdit = () => {
    setInlineEditingSponsorId(null);
  };

  // Save INLINE Contribution
  const handleSaveInlineContribution = async (sponsorId: string) => {
    const tokenToUse = token || sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
    if (!tokenToUse) {
      alert(language === 'te' ? 'దయచేసి అడ్మిన్ లాగిన్ అవ్వండి.' : 'Please authenticate as admin first.');
      return;
    }

    setIsSavingInline(true);
    try {
      const res = await fetch(`/api/admin/sponsors/${sponsorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenToUse}`,
        },
        body: JSON.stringify({
          title: (inlineTitleEn.trim() || inlineTitleTe.trim()),
          titleTe: (inlineTitleTe.trim() || inlineTitleEn.trim()),
          amount: inlineAmount.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update contribution');

      setSponsors(data.sponsors);
      window.dispatchEvent(new Event('festival_sponsors_updated'));
      setInlineEditingSponsorId(null);
      showToast(
        language === 'te'
          ? 'సహకారం వివరాలు (CONTRIBUTION) విజయవంతంగా భద్రపరచబడ్డాయి!'
          : 'Contribution details updated successfully!'
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update contribution');
    } finally {
      setIsSavingInline(false);
    }
  };

  // Handle local image file upload (converts to base64 Data URL)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert(language === 'te' ? 'చిత్రం పరిమాణం 8MB కంటే తక్కువగా ఉండాలి.' : 'Image size must be under 8MB.');
      return;
    }

    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setImageUrl(result);
      }
      setIsUploadingImage(false);
    };
    reader.onerror = () => {
      alert('Failed to read image file');
      setIsUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert(language === 'te' ? 'దయచేసి దాత పేరును నమోదు చేయండి' : 'Please enter sponsor name');
      return;
    }
    const tokenToUse = token || sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
    if (!tokenToUse) return;

    const payload = {
      name: name.trim(),
      nameTe: (nameTe || name).trim(),
      title: (title || 'Devi Utsava Daata').trim(),
      titleTe: (titleTe || title || 'దేవి ఉత్సవ దాత').trim(),
      amount: amount.trim(),
      location: location.trim(),
      phone: phone.trim(),
      isFeatured,
      imageUrl: imageUrl.trim(),
    };

    try {
      if (editingSponsor) {
        const res = await fetch(`/api/admin/sponsors/${editingSponsor.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenToUse}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update sponsor');

        setSponsors(data.sponsors);
        showToast(language === 'te' ? 'దాత & సహకారం వివరాలు అప్‌డేట్ చేయబడ్డాయి!' : 'Sponsor & contribution updated successfully!');
      } else {
        const res = await fetch('/api/admin/sponsors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenToUse}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to add sponsor');

        setSponsors(data.sponsors);
        showToast(language === 'te' ? 'కొత్త దాత విజయవంతంగా చేర్చబడ్డారు!' : 'New sponsor added successfully!');
      }

      window.dispatchEvent(new Event('festival_sponsors_updated'));
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      alert(err.message || 'Error saving sponsor');
    }
  };

  // Save Quick Modal Contribution Update
  const handleSaveContributionQuick = async (e: React.FormEvent) => {
    e.preventDefault();
    const tokenToUse = token || sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
    if (!contributionModalSponsor || !tokenToUse) return;

    setIsSavingContribution(true);
    try {
      const res = await fetch(`/api/admin/sponsors/${contributionModalSponsor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenToUse}`,
        },
        body: JSON.stringify({
          title: quickTitleEn.trim() || quickTitleTe.trim(),
          titleTe: quickTitleTe.trim() || quickTitleEn.trim(),
          amount: quickAmount.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update contribution');

      setSponsors(data.sponsors);
      window.dispatchEvent(new Event('festival_sponsors_updated'));
      setContributionModalSponsor(null);
      showToast(
        language === 'te'
          ? `"${contributionModalSponsor.name}" సహకారం వివరాలు విజయవంతంగా మార్చబడ్డాయి!`
          : `Contribution for "${contributionModalSponsor.name}" updated successfully!`
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update contribution');
    } finally {
      setIsSavingContribution(false);
    }
  };

  const handleDeleteSponsor = async (id: string) => {
    const tokenToUse = token || sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
    if (!tokenToUse) return;

    try {
      const res = await fetch(`/api/admin/sponsors/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokenToUse}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete sponsor');

      setSponsors(data.sponsors);
      window.dispatchEvent(new Event('festival_sponsors_updated'));
      setDeleteConfirmId(null);
      showToast(language === 'te' ? 'దాత విజయవంతంగా తొలగించబడ్డారు.' : 'Sponsor deleted successfully.');
    } catch (err: any) {
      alert(err.message || 'Error deleting sponsor');
    }
  };

  const handleResetDefaults = async () => {
    const tokenToUse = token || sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
    if (!tokenToUse) return;
    if (
      !confirm(
        language === 'te'
          ? 'అధికారిక డిఫాల్ట్ దాతల జాబితాను పునరుద్ధరించాలనుకుంటున్నారా?'
          : 'Reset to official default sponsors?'
      )
    ) {
      return;
    }

    try {
      const res = await fetch('/api/admin/sponsors/reset', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenToUse}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset sponsors');

      setSponsors(data.sponsors);
      window.dispatchEvent(new Event('festival_sponsors_updated'));
      showToast(language === 'te' ? 'దాతల జాబితా డిఫాల్ట్ స్థితికి రీసెట్ చేయబడింది.' : 'Reset to default sponsors successfully.');
    } catch (err: any) {
      alert(err.message || 'Error resetting sponsors');
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

      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-red-950 via-amber-950 to-red-950 text-white shadow-xl border-3 border-amber-400">
        <div>
          <div className="flex items-center gap-2.5">
            <HeartHandshake className="w-7 h-7 text-amber-300" />
            <h3 className="font-serif font-black text-xl sm:text-2xl text-yellow-100">
              {language === 'te' ? 'దాతలు & స్పాన్సర్ల నిర్వహణ (Sponsors Management)' : 'Sponsors & Donors Management'}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-amber-200/90 mt-1.5 max-w-2xl leading-relaxed">
            {language === 'te'
              ? 'దాతల పెద్ద ఫోటోలు, పేర్లు మరియు వారి సహకారాన్ని (CONTRIBUTION / విగ్రహ దాత / బహుమతి) ఇక్కడ సులభంగా సవరించవచ్చు.'
              : 'Manage sponsors with large photos, donor names, and easily edit their CONTRIBUTION and prize sponsorships.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Photo Size View Switcher */}
          <div className="inline-flex rounded-xl bg-black/40 p-1 border border-amber-400/40 text-xs font-bold">
            <button
              type="button"
              onClick={() => setImageSizeView('standard')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                imageSizeView === 'standard'
                  ? 'bg-amber-400 text-stone-950 shadow-sm'
                  : 'text-amber-200 hover:text-white'
              }`}
            >
              <Maximize2 className="w-3 h-3" />
              <span>{language === 'te' ? 'సైజు: పెద్దది' : 'Size: Large'}</span>
            </button>
            <button
              type="button"
              onClick={() => setImageSizeView('extra_large')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                imageSizeView === 'extra_large'
                  ? 'bg-amber-400 text-stone-950 shadow-sm'
                  : 'text-amber-200 hover:text-white'
              }`}
            >
              <Maximize2 className="w-3 h-3" />
              <span>{language === 'te' ? 'మహా పెద్దది (Extra Large)' : 'Extra Large'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="py-2.5 px-3.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-amber-200 border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Reset to official default sponsors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'te' ? 'డిఫాల్ట్‌లకు రీసెట్' : 'Reset Defaults'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="py-2.5 px-5 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4.5 h-4.5 text-stone-950" />
            <span>{language === 'te' ? '+ కొత్త దాతను చేర్చండి' : '+ Add New Sponsor'}</span>
          </button>
        </div>
      </div>

      {/* Sponsors Cards List with GREATLY INCREASED IMAGE SIZES & INLINE EDITABLE CONTRIBUTION */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center text-stone-400 space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
          <span className="text-sm font-medium">Loading sponsors...</span>
        </div>
      ) : sponsors.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border-2 border-stone-200 p-8 space-y-4 shadow-sm">
          <HeartHandshake className="w-16 h-16 text-stone-300 mx-auto" />
          <p className="text-base font-bold text-stone-700">
            {language === 'te' ? 'ఇంకా ఎటువంటి దాతలు జోడించబడలేదు' : 'No sponsors added yet'}
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="py-2.5 px-5 rounded-xl text-xs font-bold bg-amber-500 text-stone-950 cursor-pointer shadow-md"
          >
            {language === 'te' ? 'మొదటి దాతను చేర్చండి' : 'Add First Sponsor'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sponsors.map((sponsor) => {
            const isFeatured = Boolean(sponsor.isFeatured);
            const isEditingInline = inlineEditingSponsorId === sponsor.id;
            const displayName = (language === 'te' && sponsor.nameTe) ? sponsor.nameTe : sponsor.name;
            const displayTitle = (language === 'te' && sponsor.titleTe) ? sponsor.titleTe : sponsor.title;

            const cardImageDimensions =
              imageSizeView === 'extra_large'
                ? 'w-44 h-44 sm:w-48 sm:h-48'
                : 'w-36 h-36 sm:w-40 sm:h-40';

            return (
              <div
                key={sponsor.id}
                className={`p-6 bg-white rounded-3xl border-3 transition-all space-y-5 shadow-md hover:shadow-xl flex flex-col justify-between ${
                  isFeatured
                    ? 'border-amber-400 bg-gradient-to-b from-amber-50/50 via-white to-white ring-2 ring-amber-300/40'
                    : 'border-stone-200 hover:border-amber-400'
                }`}
              >
                <div className="space-y-5 flex flex-col items-center text-center">
                  {/* PROMINENT, GREATLY INCREASED SPONSOR IMAGE */}
                  <div className="relative">
                    <div
                      onClick={() => setPreviewPhotoModal(sponsor)}
                      className={`${cardImageDimensions} rounded-3xl overflow-hidden border-4 border-amber-400 bg-stone-100 shadow-xl p-1 relative group/img cursor-pointer ring-4 ring-amber-300/30 hover:scale-105 transition-all`}
                      title="Click to zoom photo"
                    >
                      {sponsor.imageUrl ? (
                        <img
                          src={sponsor.imageUrl}
                          alt={sponsor.name}
                          className="w-full h-full object-cover rounded-2xl"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full rounded-2xl bg-gradient-to-br from-amber-100 via-amber-200 to-amber-300 flex flex-col items-center justify-center text-amber-900 p-2">
                          <KalasamIcon className="w-14 h-14 text-amber-700" />
                          <span className="text-xs font-black mt-1 uppercase tracking-wider">
                            {displayName.slice(0, 3)}
                          </span>
                        </div>
                      )}

                      {/* Zoom hint overlay */}
                      <div className="absolute inset-0 bg-black/25 rounded-2xl opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <ZoomIn className="w-6 h-6 text-amber-300" />
                      </div>
                    </div>

                    {isFeatured && (
                      <span
                        className="absolute -top-2 -right-2 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 border-2 border-white text-stone-950 flex items-center gap-1 text-[11px] font-black shadow-md uppercase tracking-wider"
                        title="Maha Daata"
                      >
                        <Sparkles className="w-3 h-3 text-red-900" />
                        <span>{language === 'te' ? 'ముఖ్య దాత' : 'Maha Daata'}</span>
                      </span>
                    )}
                  </div>

                  {/* Donor Names & Location */}
                  <div className="w-full space-y-1 px-1">
                    <h4 className="font-serif font-black text-stone-900 text-lg sm:text-xl leading-tight">
                      {displayName}
                    </h4>

                    {sponsor.nameTe && sponsor.nameTe !== sponsor.name && language === 'en' && (
                      <p className="text-xs text-amber-950 font-bold">{sponsor.nameTe}</p>
                    )}

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-stone-500">
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 font-medium border border-stone-200">
                        <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span>{sponsor.location || 'Edullagudem'}</span>
                      </div>

                      {sponsor.phone && (
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 font-mono text-[11px] border border-stone-200">
                          <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>+91 {sponsor.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* HIGHLIGHTED DEDICATED CONTRIBUTION BOX (WITH INLINE EDITING SUPPORT) */}
                  <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 space-y-2 text-left shadow-2xs">
                    {!isEditingInline && sponsor.amount && (
                      <div className="flex items-center justify-end">
                        <span className="font-mono font-black text-red-700 text-xs bg-white px-2.5 py-0.5 rounded-md border border-amber-300 shadow-2xs">
                          {sponsor.amount}
                        </span>
                      </div>
                    )}

                    {/* INLINE EDIT MODE FOR CONTRIBUTION */}
                    {isEditingInline ? (
                      <div className="space-y-3 pt-1">
                        {/* 1-Click Preset chips */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-amber-900 block">
                            {language === 'te' ? 'సూచించిన సహకారాలు (Presets):' : 'Quick Presets:'}
                          </span>
                          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-white rounded-lg border border-amber-300">
                            {CONTRIBUTION_PRESETS.map((preset, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setInlineTitleTe(preset.te);
                                  setInlineTitleEn(preset.en);
                                  setInlineAmount(preset.amount);
                                }}
                                className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-950 text-[10px] font-medium border border-amber-200 cursor-pointer text-left"
                              >
                                {preset.te.slice(0, 20)}...
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Title Input Telugu */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-stone-700 block">
                            {language === 'te' ? 'సహకారం పేరు (తెలుగు):' : 'Contribution Title (Telugu):'}
                          </label>
                          <input
                            type="text"
                            value={inlineTitleTe}
                            onChange={(e) => setInlineTitleTe(e.target.value)}
                            placeholder="ఉదా: విగ్రహ దాత: లేదా ప్రథమ బహుమతి ప్రధాన దాతలు"
                            className="w-full px-2.5 py-1.5 rounded-lg border-2 border-amber-300 text-xs font-semibold focus:border-amber-500 focus:outline-none bg-white"
                          />
                        </div>

                        {/* Title Input English */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-stone-700 block">
                            {language === 'te' ? 'సహకారం పేరు (ఇంగ్లీష్):' : 'Contribution Title (English):'}
                          </label>
                          <input
                            type="text"
                            value={inlineTitleEn}
                            onChange={(e) => setInlineTitleEn(e.target.value)}
                            placeholder="e.g. Sacred Devi Idol Sponsor"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold focus:border-amber-500 focus:outline-none bg-white"
                          />
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-stone-700 block">
                            {language === 'te' ? 'మొత్తం / విలువ (₹):' : 'Amount / Value (₹):'}
                          </label>
                          <input
                            type="text"
                            value={inlineAmount}
                            onChange={(e) => setInlineAmount(e.target.value)}
                            placeholder="ఉదా: ₹25,000+ లేదా విగ్రహం"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs font-mono focus:border-amber-500 focus:outline-none bg-white"
                          />
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleCancelInlineEdit}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                          >
                            {language === 'te' ? 'రద్దు' : 'Cancel'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveInlineContribution(sponsor.id)}
                            disabled={isSavingInline}
                            className="px-3.5 py-1 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-sm flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {isSavingInline ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            )}
                            <span>{language === 'te' ? 'భద్రపరచు (Save)' : 'Save'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* NORMAL CONTRIBUTION DISPLAY WITH 1-CLICK EDIT BUTTON */
                      <div className="space-y-2">
                        <div className="p-2.5 rounded-xl bg-white border border-amber-300">
                          <p className="font-bold text-stone-900 text-sm leading-snug">
                            {displayTitle}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => handleStartInlineEdit(sponsor)}
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-200 hover:bg-amber-300 text-amber-950 transition-colors flex items-center gap-1.5 cursor-pointer border border-amber-300 shadow-2xs hover:scale-105 active:scale-95"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-amber-900" />
                            <span>{language === 'te' ? 'సహకారం సవరించండి (Edit Contribution)' : 'Edit Contribution'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenContributionModal(sponsor)}
                            className="text-[11px] text-amber-800 hover:text-stone-900 underline font-medium cursor-pointer"
                          >
                            {language === 'te' ? 'విండోలో మార్చు' : 'Open in Modal'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Full Edit & Delete Buttons */}
                <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-stone-400 font-mono">
                    ID: {sponsor.id.slice(-6)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(sponsor)}
                      className="py-1.5 px-3 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{language === 'te' ? 'పూర్తి వివరాలు (Full Edit)' : 'Full Edit'}</span>
                    </button>

                    {deleteConfirmId === sponsor.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteSponsor(sponsor.id)}
                          className="py-1 px-2.5 rounded-xl text-xs font-bold bg-red-600 text-white cursor-pointer"
                        >
                          {language === 'te' ? 'అవును' : 'Yes'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="py-1 px-2 rounded-xl text-xs text-stone-600 bg-stone-100 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(sponsor.id)}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete Sponsor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: QUICK EDIT CONTRIBUTION MODAL */}
      {contributionModalSponsor && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border-3 border-amber-400 shadow-2xl overflow-hidden animate-scaleUp">
            <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-300" />
                <h4 className="font-bold text-base">
                  {language === 'te'
                    ? 'సహకారం వివరాలను సవరించండి (Edit Contribution)'
                    : 'Edit Contribution Details'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setContributionModalSponsor(null)}
                className="text-amber-200 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContributionQuick} className="p-6 space-y-4 text-xs">
              {/* Sponsor info card */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center gap-3">
                {contributionModalSponsor.imageUrl ? (
                  <img
                    src={contributionModalSponsor.imageUrl}
                    alt={contributionModalSponsor.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center font-bold text-amber-800">
                    {contributionModalSponsor.name.slice(0, 2)}
                  </div>
                )}
                <div>
                  <h5 className="font-bold text-stone-900 text-sm">{contributionModalSponsor.name}</h5>
                  <p className="text-xs text-stone-500">{contributionModalSponsor.location || 'Edullagudem'}</p>
                </div>
              </div>

              {/* 1-Click Contribution Presets */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">
                  {language === 'te' ? 'త్వరిత సూచనలు (క్లిక్ చేయండి):' : 'Quick Contribution Presets (Click to Fill):'}
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-stone-50 rounded-xl border border-stone-200">
                  {CONTRIBUTION_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setQuickTitleTe(preset.te);
                        setQuickTitleEn(preset.en);
                        setQuickAmount(preset.amount);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-stone-800 font-semibold text-[11px] border border-stone-200 hover:border-amber-300 transition-colors text-left cursor-pointer"
                    >
                      <span>{preset.te}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Contribution Title (Telugu) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">
                  {language === 'te' ? 'సహకారం / బహుమతి పేరు (తెలుగు)' : 'Contribution Title (Telugu)'} *
                </label>
                <input
                  type="text"
                  required
                  value={quickTitleTe}
                  onChange={(e) => setQuickTitleTe(e.target.value)}
                  placeholder="ఉదా: విగ్రహ దాత: లేదా ప్రథమ బహుమతి ప్రధాన దాతలు"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-amber-300 text-xs sm:text-sm font-semibold focus:border-amber-500 focus:outline-none bg-white"
                />
              </div>

              {/* Contribution Title (English) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">
                  {language === 'te' ? 'సహకారం / బహుమతి పేరు (ఇంగ్లీష్)' : 'Contribution Title (English)'}
                </label>
                <input
                  type="text"
                  value={quickTitleEn}
                  onChange={(e) => setQuickTitleEn(e.target.value)}
                  placeholder="e.g. Sacred Devi Idol Sponsor or 1st Prize Sponsor"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm font-semibold focus:border-amber-500 focus:outline-none bg-white"
                />
              </div>

              {/* Value / Amount */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">
                  {language === 'te' ? 'విలువ / మొత్తం (Amount / Value)' : 'Amount / Value (₹)'}
                </label>
                <input
                  type="text"
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  placeholder="ఉదా: ₹25,000+ లేదా విగ్రహ వితరణ"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm font-mono focus:border-amber-500 focus:outline-none bg-white"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setContributionModalSponsor(null)}
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

      {/* MODAL 2: FULL ADD / EDIT SPONSOR MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border-3 border-amber-400 shadow-2xl overflow-hidden animate-scaleUp max-h-[92vh] flex flex-col">
            <div className="bg-gradient-to-r from-red-900 via-amber-800 to-red-950 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-amber-300" />
                <h4 className="font-bold text-base">
                  {editingSponsor
                    ? (language === 'te' ? 'దాత వివరాలను సవరించండి' : 'Edit Sponsor Details')
                    : (language === 'te' ? '+ కొత్త దాతను చేర్చండి' : '+ Add New Sponsor')}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-amber-200 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSponsor} className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* LARGE SPONSOR PHOTO UPLOADER & PREVIEW */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-300 space-y-3">
                <label className="block text-xs font-bold text-stone-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-700" />
                    <span>{language === 'te' ? 'దాత పెద్ద ఫోటో / చిత్రం (Large Sponsor Image)' : 'Sponsor Photo / Image (Large Size)'}</span>
                  </span>
                  <span className="text-[10px] text-amber-800 font-semibold">Upload Photo</span>
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* GREATLY INCREASED PHOTO PREVIEW IN MODAL */}
                  <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-3xl border-4 border-amber-400 bg-white overflow-hidden shrink-0 flex items-center justify-center shadow-lg">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-stone-400 space-y-1 p-2 text-center">
                        <ImageIcon className="w-12 h-12 text-stone-300" />
                        <span className="text-[10px]">No image selected</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 w-full space-y-2.5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="py-2 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        {isUploadingImage ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        <span>{language === 'te' ? 'ఫోటో ఎంచుకోండి (Upload Photo)' : 'Upload Sponsor Photo'}</span>
                      </button>

                      {imageUrl && (
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>

                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Or paste image URL (https://...)"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono focus:border-amber-500 focus:outline-none bg-white"
                    />
                    <p className="text-[10px] text-stone-500 leading-relaxed">
                      Supports JPG, PNG, WebP up to 8MB. Photos are displayed prominently in large festive temple frames.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sponsor Name (Telugu & English) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">
                    {language === 'te' ? 'దాత పేరు (తెలుగులో)' : 'Sponsor Name (Telugu)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={nameTe}
                    onChange={(e) => setNameTe(e.target.value)}
                    placeholder="ఉదా: శ్రీ కందాల కిరణ్ రెడ్డి"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm font-semibold focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">
                    {language === 'te' ? 'దాత పేరు (ఇంగ్లీష్‌లో)' : 'Sponsor Name (English)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sri Kandala Kiran Reddy"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm font-semibold focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* DEDICATED CONTRIBUTION SECTION */}
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-700" />
                    <span>{language === 'te' ? 'సహకారం / బహుమతి వివరాలు' : 'Contribution Details'}</span>
                  </span>
                  <span className="text-[10px] text-amber-800 font-semibold">Editable</span>
                </div>

                {/* 1-Click Preset Buttons */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-stone-600 block">
                    {language === 'te' ? 'సూచించిన సహకారాలు (Presets):' : 'Click to auto-fill preset:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-white rounded-xl border border-amber-200">
                    {CONTRIBUTION_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setTitleTe(preset.te);
                          setTitle(preset.en);
                          setAmount(preset.amount);
                        }}
                        className="px-2 py-0.5 rounded-md bg-amber-100/70 hover:bg-amber-200 text-amber-950 font-medium text-[10px] border border-amber-200 transition-colors cursor-pointer"
                      >
                        {preset.te.slice(0, 24)}...
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contribution Title in Telugu & English */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-stone-700">
                    {language === 'te' ? 'సహకారం వివరాలు / బహుమతి పేరు (తెలుగు)' : 'Contribution / Prize Title (Telugu)'}
                  </label>
                  <input
                    type="text"
                    value={titleTe}
                    onChange={(e) => setTitleTe(e.target.value)}
                    placeholder="ఉదా: విగ్రహ దాత: లేదా ప్రథమ బహుమతి (బంగారు నాణెం / బైక్) ప్రధాన దాతలు"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-amber-500 focus:outline-none bg-white font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-stone-700">
                    {language === 'te' ? 'సహకారం వివరాలు (ఇంగ్లీష్)' : 'Contribution / Prize Title (English)'}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Sacred Devi Idol Sponsor or 1st Prize Sponsor"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-amber-500 focus:outline-none bg-white font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-stone-700">
                    {language === 'te' ? 'మొత్తం / విలువ (Amount / Value)' : 'Amount / Value (₹)'}
                  </label>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="ఉదా: ₹25,000+ లేదా విగ్రహ వితరణ"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-amber-500 focus:outline-none bg-white font-mono"
                  />
                </div>
              </div>

              {/* Location & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">
                    {language === 'te' ? 'గ్రామం / ప్రాంతం' : 'Village / Location'}
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Edullagudem"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">
                    {language === 'te' ? 'మొబైల్ నంబర్ (ఐచ్ఛికం)' : 'Phone Number (Optional)'}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Featured / Maha Daata Toggle */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <div className="flex-1">
                  <span className="font-bold text-amber-950 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    <span>{language === 'te' ? 'ముఖ్య దాతగా హైలైట్ చేయండి (Maha Daata Badge)' : 'Highlight as Maha Daata (Featured)'}</span>
                  </span>
                  <p className="text-[10px] text-amber-800">
                    Displays prominent golden badge and top visual priority.
                  </p>
                </div>
              </label>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                >
                  {language === 'te' ? 'రద్దు చేయి' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{editingSponsor ? (language === 'te' ? 'నవీకరించు' : 'Update Sponsor') : (language === 'te' ? 'చేర్చండి' : 'Add Sponsor')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PHOTO ZOOM MODAL */}
      {previewPhotoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewPhotoModal(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full border-4 border-amber-400 shadow-2xl overflow-hidden p-6 text-center space-y-4 animate-scaleUp cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h4 className="font-serif font-black text-lg text-stone-900">
                {previewPhotoModal.name}
              </h4>
              <button
                type="button"
                onClick={() => setPreviewPhotoModal(null)}
                className="p-1 rounded-full text-stone-500 hover:text-stone-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full max-h-[60vh] rounded-2xl overflow-hidden border-4 border-amber-400 bg-stone-100 flex items-center justify-center">
              {previewPhotoModal.imageUrl ? (
                <img
                  src={previewPhotoModal.imageUrl}
                  alt={previewPhotoModal.name}
                  className="w-full h-full object-contain max-h-[60vh]"
                />
              ) : (
                <div className="py-16 flex flex-col items-center text-amber-900">
                  <KalasamIcon className="w-20 h-20 text-amber-700" />
                  <span className="text-sm font-bold mt-2">{previewPhotoModal.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
