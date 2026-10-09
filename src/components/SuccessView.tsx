import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Language, Entry } from '../types';
import { getTranslation } from '../lib/translations';
import { CheckCircle2, Clock, PlusCircle, Search, ShieldCheck, Ticket } from 'lucide-react';
import { DiyaIcon, KalasamIcon } from './FestiveIcons';
import { DeviProfileAvatar } from './DeviProfileAvatar';

interface SuccessViewProps {
  language: Language;
  entry: Entry;
  entries?: Entry[];
  onRegisterAnother: () => void;
  onCheckStatus: () => void;
}

export const SuccessView: React.FC<SuccessViewProps> = ({
  language,
  entry,
  entries,
  onRegisterAnother,
  onCheckStatus,
}) => {
  const t = getTranslation(language);
  const allEntries = entries && entries.length > 0 ? entries : [entry];
  const isMultiple = allEntries.length > 1;
  const totalAmount = allEntries.length * 50;
  const isOfflinePayment = Boolean(entry.notes && entry.notes.toLowerCase().includes('offline'));
  const paymentMethodLabel = isOfflinePayment
    ? language === 'te'
      ? 'ఆఫ్‌లైన్ (Offline)'
      : 'Offline'
    : 'UPI';

  useEffect(() => {
    // Launch festive confetti
    try {
      confetti({
        particleCount: isMultiple ? 120 : 80,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#DC2626', '#16A34A', '#EAB308'],
      });
    } catch (e) {
      // ignore
    }
  }, [isMultiple]);

  return (
    <div className="max-w-xl mx-auto my-6 bg-white rounded-2xl border-2 border-emerald-400 shadow-2xl overflow-hidden animate-fadeIn">
      {/* Festive celebration banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 px-6 py-6 text-white text-center border-b-2 border-emerald-400 relative">
        <div className="flex items-center justify-center gap-3 mb-2">
          <DiyaIcon className="w-6 h-6" />
          <div className="w-12 h-12 rounded-full bg-emerald-400/20 border-2 border-emerald-300 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-300" />
          </div>
          <KalasamIcon className="w-6 h-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold font-serif text-emerald-100">
          {isMultiple
            ? (language === 'te'
                ? `ధన్యవాదాలు! మీ ${allEntries.length} టోకెన్లు విజయవంతంగా సమర్పించబడ్డాయి`
                : `Thank you! Your ${allEntries.length} Tokens Have Been Submitted`)
            : t.successTitle}
        </h2>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Success Message Banner */}
        <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-stone-900 text-center shadow-xs">
          <p className="font-bold text-sm sm:text-base leading-relaxed text-amber-950">
            {isMultiple
              ? (language === 'te'
                  ? `ధన్యవాదాలు! మీ ${allEntries.length} టోకెన్ల ఎంట్రీలు సమర్పించబడ్డాయి. చెల్లింపు ధృవీకరణ తర్వాత అధికారిక వాట్సాప్ ద్వారా ప్రత్యేక టోకెన్ నంబర్లు పంపబడుతుంది.`
                  : `Thank you! All ${allEntries.length} token entries are submitted. Token numbers will be sent after payment verification.`)
              : t.successMessage}
          </p>
          <p className="text-xs text-amber-800/90 mt-1 font-medium">
            (ఎదుల్లగూడెం దేవి శరన్నవరాత్రులు 2026 లక్కీ డ్రా)
          </p>
        </div>

        {/* Entry Receipt Card */}
        <div className="border border-stone-200 rounded-xl overflow-hidden shadow-xs">
          <div className="bg-stone-100/80 px-4 py-2.5 border-b border-stone-200 flex items-center justify-between text-xs font-semibold text-stone-700">
            <div className="flex items-center gap-2">
              <DeviProfileAvatar size="xs" showHalo={false} />
              <span>
                {language === 'te'
                  ? `ఎంట్రీ రసీదు (${allEntries.length} టోకెన్లు)`
                  : `Submission Receipt (${allEntries.length} ${allEntries.length > 1 ? 'Tokens' : 'Token'})`}
              </span>
            </div>
            <span className="flex items-center gap-1 text-amber-700 font-bold bg-amber-100 px-2.5 py-0.5 rounded-full">
              <Clock className="w-3.5 h-3.5" /> {entry.status}
            </span>
          </div>

          <div className="p-4 space-y-3 text-xs sm:text-sm">
            {/* List of Devotee Names */}
            <div className="py-1 border-b border-stone-100">
              <span className="text-stone-500 block mb-1">
                {isMultiple
                  ? (language === 'te' ? 'నమోదైన భక్తుల వివరాలు:' : 'Registered Devotees & Tokens:')
                  : `${t.yourName}:`}
              </span>
              {isMultiple ? (
                <div className="space-y-1.5 pl-1">
                  {allEntries.map((e, idx) => (
                    <div key={e.id} className="flex items-center justify-between bg-stone-50 p-2 rounded-lg border border-stone-200">
                      <div className="flex items-center gap-1.5 font-bold text-stone-900">
                        <Ticket className="w-3.5 h-3.5 text-amber-600" />
                        <span>#{idx + 1} {e.name}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="font-bold text-stone-900">{entry.name}</span>
              )}
            </div>

            <div className="flex items-center justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500">{t.yourPhone}:</span>
              <span className="font-mono font-bold text-stone-900">+91 {entry.phone}</span>
            </div>

            {entry.address && (
              <div className="flex items-center justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">{t.addressLabel}:</span>
                <span className="text-stone-800 text-right">{entry.address}</span>
              </div>
            )}

            <div className="flex items-center justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500">చెల్లించిన మొత్తం (Total Amount):</span>
              <span className="font-extrabold text-emerald-700">
                ₹{totalAmount} ({allEntries.length} {allEntries.length > 1 ? (language === 'te' ? 'టోకెన్లు' : 'Tokens') : (language === 'te' ? 'టోకెన్' : 'Token')} - {paymentMethodLabel})
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-stone-500">{t.submittedOn}:</span>
              <span className="text-stone-700 font-mono text-[11px] sm:text-xs">
                {entry.submittedAt}
              </span>
            </div>
          </div>
        </div>

        {/* Verification Note */}
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {isMultiple
              ? (language === 'te'
                  ? `ముఖ్య గమనిక: మా నిర్వాహకులు మీ ₹${totalAmount} చెల్లింపును ధృవీకరించిన తర్వాత అధికారిక వాట్సాప్ (+91 ${entry.phone}) ద్వారా ${allEntries.length} ప్రత్యేక టోకెన్ నంబర్లు జారీ చేస్తారు.`
                  : `Important Notice: Once organizers verify your payment of ₹${totalAmount}, ${allEntries.length} distinct lucky draw token numbers will be assigned and notified to +91 ${entry.phone}.`)
              : t.importantNotice}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={onRegisterAnother}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-stone-900 bg-amber-400 hover:bg-amber-300 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.registerAnother}</span>
          </button>

          <button
            onClick={onCheckStatus}
            className="w-full py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm text-stone-800 bg-stone-100 hover:bg-stone-200 border border-stone-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4 text-stone-600" />
            <span>{t.lookupTitle}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
