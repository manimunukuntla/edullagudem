import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Language, RegistrationFormData, Entry } from '../types';
import { getTranslation } from '../lib/translations';
import {
  Check,
  Copy,
  ArrowLeft,
  Loader2,
  Sparkles,
  Smartphone,
  Ticket,
  ExternalLink,
  Banknote,
  QrCode,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { DiyaIcon } from './FestiveIcons';
import { useFestivalProfile } from '../lib/profile';

interface PaymentModalProps {
  language: Language;
  formData: RegistrationFormData;
  onBack: () => void;
  onSuccess: (entry: Entry, entries?: Entry[]) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  language,
  formData,
  onBack,
  onSuccess,
}) => {
  const t = getTranslation(language);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'offline'>('upi');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { profile } = useFestivalProfile();

  const upiId = profile.upiId || '9573454579@postbank';
  const receiverName = profile.upiName || 'KANDALA KIRAN REDDY';
  const unitTicketPrice = Number(profile.ticketPrice) || 50;

  // Calculate total amount based on token count
  const tokenCount = formData.tokens?.length || formData.tokenCount || 1;
  const totalAmount = tokenCount * unitTicketPrice;
  const transactionNote = `${profile.eventTitleEn || 'Devi Navarathulu 2026'} ${tokenCount} Tokens`;

  // Standard UPI URI format supported by all NPCI certified apps
  const upiParameters = `pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    receiverName
  )}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;

  const upiString = `upi://pay?${upiParameters}`;

  // App-specific UPI deep links
  const gpayUri = `tez://upi/pay?${upiParameters}`;
  const phonePeUri = `phonepe://pay?${upiParameters}`;
  const paytmUri = `paytmmp://pay?${upiParameters}`;
  const bhimUri = `bhim://pay?${upiParameters}`;

  // Generate high-resolution QR Code
  useEffect(() => {
    QRCode.toDataURL(upiString, {
      width: 320,
      margin: 2,
      color: {
        dark: '#1C1917', // stone-900
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [upiString]);

  const handleCopyUpi = () => {
    try {
      navigator.clipboard.writeText(upiId).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    } catch {
      // Fallback if clipboard API is restricted
      const textArea = document.createElement('textarea');
      textArea.value = upiId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenUpiApp = (uri: string) => {
    try {
      window.location.href = uri;
    } catch {
      window.open(uri, '_blank');
    }
  };

  const handleConfirmPayment = async (selectedMethod: 'upi' | 'offline') => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const cleanUtr = utrNumber.trim();
    let paymentNote = '';

    if (selectedMethod === 'offline') {
      paymentNote = `Paid ₹${totalAmount} (${tokenCount} ${
        tokenCount > 1 ? 'Tokens' : 'Token'
      }) Offline / Cash directly to organizer`;
    } else {
      paymentNote = cleanUtr
        ? `Paid ₹${totalAmount} (${tokenCount} ${
            tokenCount > 1 ? 'Tokens' : 'Token'
          }) via UPI (${upiId}) · UTR: ${cleanUtr}`
        : `Paid ₹${totalAmount} (${tokenCount} ${
            tokenCount > 1 ? 'Tokens' : 'Token'
          }) via UPI (${upiId})`;
    }

    try {
      const response = await fetch('/api/payment-confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          tokenCount,
          tokens: formData.tokens,
          paymentMode: selectedMethod,
          notes: paymentNote,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit entry');
      }

      // Persist devotee token details so they NEVER clear after some time
      try {
        const cleanPhone = formData.phone.replace(/\D/g, '').slice(-10);
        localStorage.setItem('devi_last_devotee_phone', cleanPhone);
        localStorage.setItem('devi_last_devotee_name', formData.name);
        const booked = data.entries || [data.entry];
        localStorage.setItem('devi_recent_booked_tokens', JSON.stringify(booked));
        window.dispatchEvent(new Event('devi_tokens_updated'));
      } catch (e) {
        console.warn('LocalStorage save failed:', e);
      }

      onSuccess(data.entry, data.entries || [data.entry]);
    } catch (err: any) {
      console.error('Payment confirmation error:', err);
      setErrorMessage(
        err.message ||
          (language === 'te'
            ? 'ఎంట్రీ సమర్పించడంలో సమస్య ఎదురైంది. దయచేసి ఇంటర్నెట్ సరిచూసి మళ్లీ ప్రయత్నించండి.'
            : 'Error submitting entry. Please check connection and try again.')
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-6 bg-white rounded-2xl border-2 border-amber-300 shadow-2xl overflow-hidden animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-800 via-red-700 to-amber-700 px-6 py-5 text-white flex items-center justify-between border-b-2 border-amber-400">
        <div>
          <button
            onClick={onBack}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 text-xs text-amber-200 hover:text-white mb-1.5 transition-colors disabled:opacity-50 cursor-pointer font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.backToDetails}</span>
          </button>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-amber-200">
            {language === 'te'
              ? `₹${totalAmount} చెల్లింపు విభాగం`
              : `Payment of ₹${totalAmount}`}
          </h2>
        </div>
        <div className="w-11 h-11 rounded-full bg-amber-400/20 border border-amber-300/40 flex items-center justify-center shrink-0">
          <DiyaIcon className="w-6 h-6 text-amber-300" />
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Devotee Summary Badge */}
        <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-2 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-stone-500">{t.yourName}: </span>
              <span className="font-bold text-stone-900">{formData.name}</span>
            </div>
            <div>
              <span className="text-stone-500">{t.yourPhone}: </span>
              <span className="font-bold text-stone-900 font-mono">+91 {formData.phone}</span>
            </div>
          </div>

          {/* Multiple tokens breakdown */}
          {formData.tokens && formData.tokens.length > 1 && (
            <div className="pt-2 border-t border-stone-200">
              <span className="text-stone-500 font-medium">
                {language === 'te' ? 'నమోదైన టోకెన్లు & భక్తులు' : 'Registered Tokens'}:
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {formData.tokens.map((tok, i) => (
                  <span
                    key={tok.id}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-950 font-bold text-[11px] border border-amber-300"
                  >
                    <Ticket className="w-3 h-3 text-amber-700" />
                    <span>#{i + 1} {tok.name || `${formData.name} (Token #${i + 1})`}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
            <span className="text-stone-600 font-medium">
              {language === 'te' ? 'టోకెన్ రుసుము' : 'Total Amount'}:
            </span>
            <span className="text-base font-black text-red-700">
              ₹{totalAmount} <span className="text-xs text-stone-500 font-normal">({tokenCount} {tokenCount > 1 ? (language === 'te' ? 'టోకెన్లు' : 'Tokens') : (language === 'te' ? 'టోకెన్' : 'Token')})</span>
            </span>
          </div>
        </div>

        {/* Payment Method Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-stone-100 rounded-xl border border-stone-200">
          <button
            type="button"
            onClick={() => setPaymentMethod('upi')}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              paymentMethod === 'upi'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-700 hover:text-stone-950 hover:bg-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>{language === 'te' ? 'UPI / QR కోడ్' : 'UPI / QR Code'}</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod('offline')}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              paymentMethod === 'offline'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'text-stone-700 hover:text-stone-950 hover:bg-white'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>{language === 'te' ? 'ఆఫ్‌లైన్ / నగదు' : 'Offline / Cash'}</span>
          </button>
        </div>

        {/* UPI PAYMENT VIEW */}
        {paymentMethod === 'upi' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Amount Banner */}
            <div className="text-center p-4 rounded-xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-300">
              <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider block">
                {language === 'te' ? 'చెల్లించవలసిన మొత్తం' : 'Amount to Pay'}
              </span>
              <div className="text-3xl sm:text-4xl font-black text-red-700 mt-1 tabular-nums font-mono">
                ₹{totalAmount}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                {language === 'te'
                  ? 'క్రింది QR కోడ్ స్కాన్ చేయండి లేదా ఏదైనా UPI యాప్ ద్వారా చెల్లించండి'
                  : 'Scan the QR code below or tap an app button to pay'}
              </p>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center">
              <div className="p-4 bg-white rounded-2xl border-4 border-amber-400 shadow-md relative">
                <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-red-700" />
                <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-red-700" />
                <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-red-700" />
                <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-red-700" />

                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`UPI QR Code - ${upiId} (₹${totalAmount})`}
                    className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center text-stone-400">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                  </div>
                )}
              </div>

              {/* Verified Payee Details & Copy UPI Button */}
              <div className="mt-3.5 text-center space-y-1.5">
                <p className="text-xs sm:text-sm font-bold text-stone-900 tracking-wide">
                  {receiverName}
                </p>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-300 shadow-2xs">
                  <span className="text-xs sm:text-sm font-mono font-bold text-stone-800">
                    {upiId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="px-2 py-0.5 rounded text-xs font-semibold text-amber-900 hover:text-amber-950 hover:bg-amber-200 transition-colors cursor-pointer flex items-center gap-1"
                    title={t.copyUpi}
                  >
                    {copied ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> {t.copiedText}
                      </span>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile UPI App Launchers (Optional Convenience for mobile users) */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-800 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-700" />
                  <span>
                    {language === 'te'
                      ? 'మొబైల్ UPI యాప్ ద్వారా చెల్లించాలా?'
                      : 'Pay directly using UPI App:'}
                  </span>
                </span>
                <span className="text-[11px] text-stone-500 font-medium">Tap to open</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenUpiApp(gpayUri)}
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-blue-50 border border-stone-300 hover:border-blue-400 text-stone-800 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span>Google Pay</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenUpiApp(phonePeUri)}
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-purple-50 border border-stone-300 hover:border-purple-400 text-stone-800 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  <span>PhonePe</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenUpiApp(paytmUri)}
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-sky-50 border border-stone-300 hover:border-sky-400 text-stone-800 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  <span>Paytm</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenUpiApp(bhimUri)}
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-orange-50 border border-stone-300 hover:border-orange-400 text-stone-800 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-600" />
                  <span>BHIM / Other</span>
                </button>
              </div>
            </div>

            {/* Optional UTR / Reference Number Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 flex items-center justify-between">
                <span>
                  {language === 'te'
                    ? 'UPI రెఫరెన్స్ నంబర్ / UTR (Optional)'
                    : 'UPI Reference / UTR Number (Optional)'}
                </span>
                <span className="text-[10px] text-stone-400 font-normal">
                  {language === 'te' ? '12 అంకెల నంబర్' : '12-digit Ref'}
                </span>
              </label>
              <input
                type="text"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder={
                  language === 'te'
                    ? 'ఉదా: 429182910291 (చెల్లింపు తర్వాత రసీదులో ఉంటుంది)'
                    : 'e.g. 429182910291 (shown in your UPI receipt)'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm font-mono focus:border-amber-500 focus:outline-none bg-stone-50/50"
              />
              <p className="text-[10px] text-stone-500 leading-normal">
                {language === 'te'
                  ? 'మీ UPI పేమెంట్ పూర్తయిన తర్వాత కనిపించే UTR నంబర్ నమోదు చేస్తే నిర్వాహకులు వెంటనే ధృవీకరిస్తారు.'
                  : 'Entering your 12-digit UTR number helps the temple committee instantly match and approve your token.'}
              </p>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Primary Confirm Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleConfirmPayment('upi')}
                className="w-full py-4 px-6 rounded-xl font-extrabold text-sm sm:text-base text-stone-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-[0.99] shadow-lg hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-stone-950" />
                    <span>{t.submitting}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 text-stone-950 stroke-[3]" />
                    <span>
                      {language === 'te'
                        ? `నేను ₹${totalAmount} చెల్లించాను — సమర్పించండి`
                        : `I have paid ₹${totalAmount} — Confirm & Submit`}
                    </span>
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-stone-500 mt-2">
                {language === 'te'
                  ? 'సమర్పించిన తర్వాత నిర్వాహకులు పరిశీలించి మీ వాట్సాప్‌కు టోకెన్ పంపుతారు.'
                  : 'After submission, organizers verify and dispatch your token to your WhatsApp.'}
              </p>
            </div>
          </div>
        )}

        {/* OFFLINE / CASH PAYMENT VIEW */}
        {paymentMethod === 'offline' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 space-y-3">
              <div className="flex items-center gap-2.5">
                <Banknote className="w-6 h-6 text-emerald-700" />
                <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                  {language === 'te'
                    ? 'ఆఫ్‌లైన్ / నగదు చెల్లింపు'
                    : 'Offline / Cash at Temple Counter'}
                </h3>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed">
                {language === 'te'
                  ? 'మీరు ఎదుల్లగూడెం దేవి ఆలయ ప్రాంగణంలో లేదా కమిటీ సభ్యులకు నేరుగా నగదు రూపంలో ₹' +
                    totalAmount +
                    ' చెల్లించినట్లయితే, ఈ ఎంట్రీని నమోదు చేసుకోండి. నిర్వాహకులు నగదును ధృవీకరించి మీ టోకెన్ నంబర్‌ను విడుదల చేస్తారు.'
                  : 'If you have paid ₹' +
                    totalAmount +
                    ' in cash directly to the temple committee members or temple counter, submit this entry. The committee will verify the cash and release your token.'}
              </p>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Offline Entry Button */}
            <div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleConfirmPayment('offline')}
                className="w-full py-4 px-6 rounded-xl font-extrabold text-sm sm:text-base text-white bg-stone-900 hover:bg-stone-800 active:scale-[0.99] shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span>{t.submitting}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 text-amber-400 stroke-[3]" />
                    <span>
                      {language === 'te'
                        ? `నగదు చెల్లింపు ఎంట్రీని సమర్పించండి (₹${totalAmount})`
                        : `Submit Offline / Cash Entry (₹${totalAmount})`}
                    </span>
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-stone-500 mt-2">
                {language === 'te'
                  ? 'ఆలయ నిర్వాహకులు నగదును సరిచూసి మీకు అధికారిక టోకెన్ జారీ చేస్తారు.'
                  : 'Temple committee will verify your payment and issue your lucky draw token.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
