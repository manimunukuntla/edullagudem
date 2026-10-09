import React, { useState } from 'react';
import { Language, RegistrationFormData, DevoteeTokenItem } from '../types';
import { getTranslation } from '../lib/translations';
import { User, Phone, MapPin, ArrowRight, AlertCircle, Shield, PlusCircle, Trash2, Sparkles, Ticket } from 'lucide-react';
import { DiyaIcon } from './FestiveIcons';

interface RegistrationFormProps {
  language: Language;
  onSubmit: (data: RegistrationFormData) => void;
  initialData?: RegistrationFormData;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  language,
  onSubmit,
  initialData,
}) => {
  const t = getTranslation(language);

  const [name, setName] = useState(() => {
    if (initialData?.name) return initialData.name;
    try {
      return localStorage.getItem('devi_last_devotee_name') || '';
    } catch {
      return '';
    }
  });
  const [phone, setPhone] = useState(() => {
    if (initialData?.phone) return initialData.phone;
    try {
      return localStorage.getItem('devi_last_devotee_phone') || '';
    } catch {
      return '';
    }
  });
  const [address, setAddress] = useState(initialData?.address || '');

  // Tokens state - starts with at least Token 1
  const [tokens, setTokens] = useState<DevoteeTokenItem[]>(() => {
    if (initialData?.tokens && initialData.tokens.length > 0) {
      return initialData.tokens;
    }
    const defaultName = initialData?.name || (() => {
      try { return localStorage.getItem('devi_last_devotee_name') || ''; } catch { return ''; }
    })();
    return [{ id: 'token-1', name: defaultName }];
  });

  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [touched, setTouched] = useState<{ name?: boolean; phone?: boolean }>({});

  const validate = () => {
    const newErrors: { name?: string; phone?: string } = {};

    if (!name.trim()) {
      newErrors.name = t.validationName;
    }

    // Phone must be exactly 10 digits Indian mobile (starts with 6, 7, 8, or 9)
    const cleaned = phone.replace(/\D/g, '');
    if (!cleaned) {
      newErrors.phone = t.validationPhone;
    } else if (cleaned.length !== 10) {
      newErrors.phone = language === 'te'
        ? `మొబైల్ నంబర్ సరిగ్గా 10 అంకెలు ఉండాలి (ప్రస్తుతం: ${cleaned.length} అంకెలు)`
        : `Phone number must be exactly 10 digits (currently ${cleaned.length} digits)`;
    } else if (!/^[6-9]\d{9}$/.test(cleaned)) {
      newErrors.phone = language === 'te'
        ? 'దయచేసి 6, 7, 8 లేదా 9 తో ప్రారంభమయ్యే సరైన మొబైల్ నంబర్ ఇవ్వండి'
        : 'Must be a valid 10-digit Indian mobile number starting with 6-9';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
    if (touched.name && val.trim()) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  const handlePhoneChange = (val: string) => {
    // Only allow digits, max 10
    const digitsOnly = val.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);
    if (touched.phone) {
      if (digitsOnly.length === 10 && /^[6-9]\d{9}$/.test(digitsOnly)) {
        setErrors((prev) => ({ ...prev, phone: undefined }));
      }
    }
  };

  const handleAddAnotherToken = () => {
    const nextIdx = tokens.length + 1;
    const newToken: DevoteeTokenItem = {
      id: `token-${Date.now()}-${nextIdx}`,
      name: '',
    };
    setTokens((prev) => [...prev, newToken]);
  };

  const handleRemoveToken = (indexToRemove: number) => {
    if (tokens.length <= 1) return;
    setTokens((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleTokenNameChange = (index: number, val: string) => {
    setTokens((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], name: val };
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, phone: true });
    if (validate()) {
      const sanitizedTokens = tokens.map((tok, idx) => ({
        id: tok.id,
        name: tok.name.trim() || (idx === 0 ? name.trim() : `${name.trim()} (Token #${idx + 1})`),
      }));

      onSubmit({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        tokenCount: sanitizedTokens.length,
        tokens: sanitizedTokens,
      });
    }
  };

  const totalAmount = tokens.length * 50;

  return (
    <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-xl overflow-hidden max-w-xl mx-auto my-6">
      {/* Decorative Form Top Header */}
      <div className="bg-gradient-to-r from-red-800 via-red-700 to-amber-700 px-6 py-5 text-white flex items-center justify-between border-b-2 border-amber-400">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-amber-200">
            {t.registerTitle}
          </h2>
          <p className="text-xs sm:text-sm text-amber-100/90 mt-0.5">
            {t.registerSubtitle}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-300/40 flex items-center justify-center shrink-0">
          <DiyaIcon className="w-6 h-6" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
        {/* Token 1 / Primary Devotee Name Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs sm:text-sm font-bold text-stone-800 flex items-center gap-1.5">
              <User className="w-4 h-4 text-red-700" />
              <span>{t.nameLabel}</span>
              <span className="text-red-600 font-bold">*</span>
            </label>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-300">
              <Ticket className="w-3 h-3 text-amber-700" />
              <span>{t.tokenNumberTitle} #1</span>
            </span>
          </div>
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => handlePrimaryNameChange(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
              placeholder={t.namePlaceholder}
              className={`w-full px-4 py-3 rounded-xl border text-stone-900 placeholder:text-stone-400 text-sm focus:outline-none transition-all ${
                errors.name
                  ? 'border-red-500 bg-red-50/50 ring-2 ring-red-200'
                  : 'border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 bg-stone-50/40'
              }`}
            />
          </div>
          {errors.name && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.name}</span>
            </p>
          )}
        </div>

        {/* Additional Tokens (Token #2, #3, etc.) */}
        {tokens.length > 1 && (
          <div className="space-y-3 pt-1">
            {tokens.slice(1).map((tok, idx) => {
              const tokenNumber = idx + 2;
              return (
                <div
                  key={tok.id}
                  className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50/90 to-orange-50/60 border border-amber-300 space-y-2 animate-fadeIn shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>{t.tokenNumberTitle} #{tokenNumber} - {t.tokenForDevotee}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveToken(idx + 1)}
                      className="text-[11px] text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 cursor-pointer transition-colors p-1"
                      title={t.removeTokenBtn}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.removeTokenBtn}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={tok.name}
                    onChange={(e) => handleTokenNameChange(idx + 1, e.target.value)}
                    placeholder={
                      language === 'te'
                        ? `కుటుంబ సభ్యుల పేరు (లేదా '${name || 'మీ పేరు'}' కింద టోకెన్ #${tokenNumber})`
                        : `Devotee / Family member name (defaults to '${name || 'Devotee'}' Token #${tokenNumber})`
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg border border-amber-300 bg-white text-stone-900 placeholder:text-stone-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* "Add Another Token" Action Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleAddAnotherToken}
            className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-amber-500 bg-amber-50/80 hover:bg-amber-100 text-amber-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.99] group"
          >
            <PlusCircle className="w-4 h-4 text-amber-700 group-hover:scale-110 transition-transform" />
            <span>{t.addAnotherTokenBtn}</span>
            <span className="ml-1 text-[11px] font-semibold text-amber-900 bg-amber-200/90 px-2 py-0.5 rounded-full">
              +₹50
            </span>
          </button>
          <p className="text-[11px] text-stone-500 text-center mt-1.5">
            {language === 'te'
              ? 'మరొక టోకెన్ కావాలంటే ఇక్కడ నొక్కండి (కుటుంబ సభ్యుల కోసం ఒకేసారి మరిన్ని టోకెన్లు నమోదు చేయవచ్చు)'
              : 'Need another token? Click above to add more tokens for yourself or family members (₹50 each)'}
          </p>
        </div>

        {/* Phone Field */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-stone-800 mb-1.5 flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-red-700" />
            <span>{t.phoneLabel}</span>
            <span className="text-red-600 font-bold">*</span>
          </label>
          <div className="relative flex">
            <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-stone-300 bg-stone-100 text-stone-700 text-sm font-medium">
              +91
            </span>
            <input
              type="tel"
              maxLength={10}
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
              placeholder={t.phonePlaceholder}
              className={`w-full px-4 py-3 rounded-r-xl border text-stone-900 placeholder:text-stone-400 text-sm focus:outline-none transition-all tabular-nums font-medium ${
                errors.phone
                  ? 'border-red-500 bg-red-50/50 ring-2 ring-red-200'
                  : 'border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 bg-stone-50/40'
              }`}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            {errors.phone ? (
              <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.phone}</span>
              </p>
            ) : (
              <p className="text-[11px] text-stone-500">
                {language === 'te'
                  ? 'అన్ని టోకెన్ నంబర్లు మరియు వాట్సాప్ అప్‌డేట్లు ఈ నంబర్‌కు పంపబడతాయి'
                  : 'All token numbers & WhatsApp receipts will be dispatched to this number'}
              </p>
            )}
            <span className="text-[11px] text-stone-400 font-mono">
              {phone.length}/10
            </span>
          </div>
        </div>

        {/* Address Field */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-stone-800 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-red-700" />
            <span>{t.addressLabel}</span>
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t.addressPlaceholder}
            className="w-full px-4 py-3 rounded-xl border border-stone-300 text-stone-900 placeholder:text-stone-400 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 bg-stone-50/40 transition-all"
          />
        </div>

        {/* Summary Pill: Ticket breakdown & Total Amount */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 space-y-1.5 text-xs sm:text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-stone-700">
              <Shield className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {language === 'te' ? 'ఎంపిక చేసుకున్న టోకెన్లు' : 'Selected Tokens'}:
              </span>
            </div>
            <span className="font-bold text-stone-900">
              {tokens.length} {tokens.length > 1 ? (language === 'te' ? 'టోకెన్లు' : 'Tokens') : (language === 'te' ? 'టోకెన్' : 'Token')} (₹50 × {tokens.length})
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-amber-200/80">
            <span className="font-semibold text-stone-700">
              {language === 'te' ? 'మొత్తం చెల్లించవలసిన ఫీజు' : 'Total Amount to Pay'}:
            </span>
            <span className="font-extrabold text-red-700 text-lg tabular-nums">
              ₹{totalAmount}
            </span>
          </div>

          {tokens.length > 1 && (
            <p className="text-[11px] text-emerald-800 font-semibold pt-0.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{t.multipleTokensNotice}</span>
            </p>
          )}
        </div>

        {/* Submit to Payment Button */}
        <button
          type="submit"
          className="w-full py-3.5 px-6 rounded-xl font-bold text-base text-stone-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-[0.99] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>
            {language === 'te'
              ? `${t.submitToPay} (₹${totalAmount}${tokens.length > 1 ? ` - ${tokens.length} టోకెన్లు` : ''})`
              : `${t.submitToPay} (Pay ₹${totalAmount}${tokens.length > 1 ? ` for ${tokens.length} Tokens` : ''})`}
          </span>
          <ArrowRight className="w-5 h-5 text-stone-950" />
        </button>

        <p className="text-center text-[11px] text-stone-500">
          {language === 'te'
            ? `తదుపరి పేజీలో UPI QR కోడ్ ద్వారా ₹${totalAmount} చెల్లించగలరు`
            : `You will be shown the UPI QR Code on the next step to pay ₹${totalAmount}`}
        </p>
      </form>
    </div>
  );
};
