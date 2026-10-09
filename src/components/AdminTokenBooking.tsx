import React, { useState } from 'react';
import { Language, Entry, DevoteeTokenItem } from '../types';
import {
  Ticket,
  User,
  Phone,
  MapPin,
  PlusCircle,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  CreditCard,
  Send,
  ShieldCheck,
  Check
} from 'lucide-react';
import { TARGET_WHATSAPP_NUMBER } from '../lib/whatsapp';

interface AdminTokenBookingProps {
  language: Language;
  token: string | null;
  onSuccess: (newEntries: Entry[]) => void;
  nextAvailableTokenNo: number;
}

export const AdminTokenBooking: React.FC<AdminTokenBookingProps> = ({
  language,
  token,
  onSuccess,
  nextAvailableTokenNo,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('Edullagudem');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Direct Committee'>('Cash');
  const [autoApprove, setAutoApprove] = useState(true);

  // Multiple Tokens
  const [tokens, setTokens] = useState<DevoteeTokenItem[]>([
    { id: 'tok-1', name: '' },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAddToken = () => {
    const nextIdx = tokens.length + 1;
    setTokens((prev) => [
      ...prev,
      { id: `tok-${Date.now()}-${nextIdx}`, name: '' },
    ]);
  };

  const handleRemoveToken = (index: number) => {
    if (tokens.length <= 1) return;
    setTokens((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTokenNameChange = (index: number, val: string) => {
    setTokens((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], name: val };
      return copy;
    });
  };

  const handlePrimaryNameChange = (val: string) => {
    setName(val);
    setTokens((prev) => {
      const copy = [...prev];
      if (copy.length > 0) {
        copy[0] = { ...copy[0], name: val };
      }
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg(language === 'te' ? 'దయచేసి భక్తుని పేరు నమోదు చేయండి' : 'Please enter devotee name');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMsg(language === 'te' ? 'దయచేసి 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి' : 'Please enter valid 10-digit mobile number');
      return;
    }

    if (!token) {
      setErrorMsg('Admin token missing. Please log in.');
      return;
    }

    setIsLoading(true);

    try {
      const sanitizedTokens = tokens.map((tok, idx) => ({
        id: tok.id,
        name: tok.name.trim() || (idx === 0 ? name.trim() : `${name.trim()} (Token #${idx + 1})`),
      }));

      const res = await fetch('/api/admin/register-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: cleanPhone,
          address: address.trim(),
          tokenCount: sanitizedTokens.length,
          tokens: sanitizedTokens,
          paymentMode,
          autoApprove,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to book token');
      }

      setSuccessMsg(
        language === 'te'
          ? `టోకెన్లు విజయవంతంగా జారీ చేయబడ్డాయి! భక్తునికి మరియు కోఆర్డినేటర్ (${TARGET_WHATSAPP_NUMBER}) కు వాట్సాప్ సందేశం పంపబడింది.`
          : `Tokens registered successfully! Dual WhatsApp dispatch initiated to devotee and coordinator (+91 ${TARGET_WHATSAPP_NUMBER}).`
      );

      // Reset form
      setName('');
      setPhone('');
      setAddress('Edullagudem');
      setTokens([{ id: 'tok-1', name: '' }]);

      if (data.entries) {
        onSuccess(data.entries);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error booking token');
    } finally {
      setIsLoading(false);
    }
  };

  const totalFee = tokens.length * 50;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-900 via-stone-900 to-amber-900 text-white p-5 sm:p-6 rounded-2xl border-2 border-amber-500/70 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center shrink-0">
            <Ticket className="w-7 h-7 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-yellow-200">
                {language === 'te' ? 'లక్కీ డ్రా టోకెన్ రిజిస్ట్రేషన్ (అడ్మిన్ బుకింగ్)' : 'Lucky Draw Token Registration (Admin Booking)'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/40">
                Direct Issue
              </span>
            </div>
            <p className="text-xs text-amber-200/80 mt-1 max-w-xl">
              {language === 'te'
                ? 'ఆలయం లేదా కౌంటర్ వద్ద నేరుగా నగదు / యూపీఐ చెల్లించిన భక్తుల కోసం అడ్మిన్ ఇక్కడి నుండే టోకెన్లను తక్షణమే నమోదు చేసి జారీ చేయవచ్చు.'
                : 'Directly register & issue lucky draw tokens for devotees paying at temple counter or offline with continuous sequential numbering.'}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-black/40 border border-amber-400/40 text-center shrink-0">
          <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
            {language === 'te' ? 'తదుపరి టోకెన్' : 'Next Token'}
          </span>
          <span className="text-2xl font-black text-amber-300 font-mono">
            #{nextAvailableTokenNo}
          </span>
        </div>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-800 hover:text-stone-900 p-1 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border-2 border-red-400 text-red-950 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-800 hover:text-stone-900 p-1 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Registration Form */}
      <div className="bg-white rounded-2xl border-2 border-stone-200 shadow-sm p-6 sm:p-8 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Primary Devotee Name */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs sm:text-sm font-bold text-stone-800 flex items-center gap-1.5">
                <User className="w-4 h-4 text-red-700" />
                <span>{language === 'te' ? 'భక్తుని పూర్తి పేరు' : 'Devotee Full Name'}</span>
                <span className="text-red-600 font-bold">*</span>
              </label>
              <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                Token #1
              </span>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => handlePrimaryNameChange(e.target.value)}
              placeholder={language === 'te' ? 'ఉదా: కె. రమేష్ కుమార్' : 'e.g. K. Ramesh Kumar'}
              className="w-full px-4 py-3 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              required
            />
          </div>

          {/* Additional Tokens (Family Members) */}
          {tokens.length > 1 && (
            <div className="space-y-3 pt-1">
              {tokens.slice(1).map((tok, idx) => (
                <div
                  key={tok.id}
                  className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-300 space-y-2 animate-fadeIn"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Token #{idx + 2} - {language === 'te' ? 'కుటుంబ సభ్యుని పేరు' : 'Family Member Name'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveToken(idx + 1)}
                      className="text-[11px] text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{language === 'te' ? 'తొలగించు' : 'Remove'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={tok.name}
                    onChange={(e) => handleTokenNameChange(idx + 1, e.target.value)}
                    placeholder={language === 'te' ? `పేరు (లేదా '${name || 'భక్తుడు'}' Token #${idx + 2})` : `Name (or '${name || 'Devotee'}' Token #${idx + 2})`}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-amber-300 bg-white text-stone-900 text-xs sm:text-sm focus:outline-none"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Add Another Token Button */}
          <div>
            <button
              type="button"
              onClick={handleAddToken}
              className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-amber-500 bg-amber-50/70 hover:bg-amber-100 text-amber-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer group"
            >
              <PlusCircle className="w-4 h-4 text-amber-700 group-hover:scale-110 transition-transform" />
              <span>{language === 'te' ? '+ మరొక టోకెన్ జోడించండి (+ Add Another Token)' : '+ Add Another Token'}</span>
              <span className="text-[11px] font-semibold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                +₹50
              </span>
            </button>
          </div>

          {/* Phone & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-stone-800 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-red-700" />
                <span>{language === 'te' ? 'వాట్సాప్ మొబైల్ నంబర్' : 'WhatsApp Phone'} *</span>
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-stone-300 bg-stone-100 text-stone-700 text-sm font-medium">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-3 rounded-r-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:border-amber-500 tabular-nums font-medium"
                  required
                />
              </div>
              <span className="text-[11px] text-stone-400 mt-1 block">
                {phone.length}/10 {language === 'te' ? 'అంకెలు' : 'digits'}
              </span>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-stone-800 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-700" />
                <span>{language === 'te' ? 'చిరునామా / గ్రామం' : 'Address / Village'}</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Edullagudem"
                className="w-full px-3.5 py-3 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Payment Mode & Auto Approve */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-stone-600" />
                <span>{language === 'te' ? 'చెల్లింపు విధానం (Payment Mode)' : 'Payment Mode'}</span>
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm bg-white text-stone-900 focus:outline-none focus:border-amber-500"
              >
                <option value="Cash">💵 Cash at Temple Counter (నగదు)</option>
                <option value="UPI">📱 Direct UPI (9573454579@postbank)</option>
                <option value="Direct Committee">🏛️ Committee Sponsor / Free Quota</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <div>
                <span className="text-xs font-bold text-emerald-950 block">
                  {language === 'te' ? 'తక్షణ టోకెన్ జారీ & వాట్సాప్ పంపకం' : 'Instant Approve & WhatsApp Dispatch'}
                </span>
                <span className="text-[11px] text-emerald-800">
                  {language === 'te' ? 'వెంటనే సీరియల్ నంబర్ కేటాయిస్తుంది' : 'Instantly assigns sequential token'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-400"
              />
            </div>
          </div>

          {/* Fee Summary */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 flex items-center justify-between text-xs sm:text-sm">
            <div>
              <span className="text-stone-700 font-semibold block">
                {language === 'te' ? 'మొత్తం టోకెన్లు' : 'Total Tokens'}: <strong className="text-stone-900 font-bold">{tokens.length}</strong>
              </span>
              <span className="text-[11px] text-stone-500">
                ₹50 × {tokens.length} {language === 'te' ? 'టోకెన్లు' : 'tokens'}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-stone-500 uppercase font-bold block">
                {language === 'te' ? 'మొత్తం రుసుము' : 'Total Amount'}
              </span>
              <span className="text-xl font-black text-red-700 font-mono">
                ₹{totalFee}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base text-stone-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-[0.99] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Ticket className="w-5 h-5" />
            )}
            <span>
              {isLoading
                ? (language === 'te' ? 'నమోదు చేస్తోంది...' : 'Registering...')
                : (language === 'te'
                    ? `ఇప్పుడే ${tokens.length} టోకెన్లను నమోదు చేసి జారీ చేయండి (₹${totalFee})`
                    : `Issue ${tokens.length} Token(s) & Dispatch WhatsApp (₹${totalFee})`)}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
