import React, { useState } from 'react';
import { Language, Entry } from '../types';
import { getTranslation } from '../lib/translations';
import { Search, Loader2, Phone, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { DiyaIcon } from './FestiveIcons';
import { DeviProfileAvatar } from './DeviProfileAvatar';

interface TokenLookupProps {
  language: Language;
  onGoToRegister: () => void;
}

export const TokenLookup: React.FC<TokenLookupProps> = ({
  language,
  onGoToRegister,
}) => {
  const t = getTranslation(language);
  const [phone, setPhone] = useState(() => {
    try {
      return localStorage.getItem('devi_last_devotee_phone') || '';
    } catch {
      return '';
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<Entry[]>(() => {
    try {
      const stored = localStorage.getItem('devi_recent_booked_tokens');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchStatusForPhone = async (targetPhone: string) => {
    const cleanPhone = targetPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) return;

    setIsLoading(true);
    setHasSearched(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/status/lookup?phone=${cleanPhone}&t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to search');
      }
      const fetched = data.entries || [];
      setResults(fetched);
      if (fetched.length > 0) {
        try {
          localStorage.setItem('devi_last_devotee_phone', cleanPhone);
          localStorage.setItem('devi_recent_booked_tokens', JSON.stringify(fetched));
        } catch {}
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error checking token status');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-search on mount if phone is already saved
  React.useEffect(() => {
    const savedPhone = phone.replace(/\D/g, '').slice(-10);
    if (savedPhone.length === 10) {
      fetchStatusForPhone(savedPhone);
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMessage(
        language === 'te'
          ? 'దయచేసి సరైన 10 అంకెల మొబైల్ నంబర్ ఇవ్వండి'
          : 'Please enter a valid 10-digit mobile number'
      );
      return;
    }

    await fetchStatusForPhone(cleanPhone);
  };

  return (
    <div className="max-w-xl mx-auto my-6 bg-white rounded-2xl border-2 border-amber-300 shadow-xl overflow-hidden animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-800 via-red-700 to-amber-700 px-6 py-5 text-white flex items-center justify-between border-b-2 border-amber-400">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-amber-200">
            {t.lookupTitle}
          </h2>
          <p className="text-xs sm:text-sm text-amber-100/90 mt-0.5">
            {t.lookupSubtitle}
          </p>
        </div>
        <DeviProfileAvatar size="md" showHalo={true} />
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-stone-800 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-red-700" />
              <span>{t.phoneLabel}</span>
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder={t.phonePlaceholder}
                className="w-full px-4 py-3 rounded-xl border border-stone-300 text-stone-900 placeholder:text-stone-400 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 bg-stone-50/40 font-mono"
              />
              <button
                type="submit"
                disabled={isLoading || phone.length !== 10}
                className="px-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 transition-all shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>{t.lookupButton}</span>
              </button>
            </div>
            {errorMessage && (
              <p className="text-xs text-red-600 mt-1 font-medium">{errorMessage}</p>
            )}
          </div>
        </form>

        {/* Search Results Display */}
        {hasSearched && (
          <div className="pt-2 border-t border-stone-200">
            {results.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-stone-50 border border-stone-200 text-stone-600 text-xs sm:text-sm space-y-3">
                <p>{t.noTokenFound}</p>
                <button
                  onClick={onGoToRegister}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors"
                >
                  {t.navRegister} (₹50)
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-stone-600">
                  {language === 'te'
                    ? `లభించిన ఎంట్రీలు (${results.length}):`
                    : `Entries found (${results.length}):`}
                </p>

                {results.map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      entry.status === 'Paid'
                        ? 'bg-amber-50/70 border-amber-400 shadow-sm'
                        : 'bg-stone-50 border-stone-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-stone-900 text-sm sm:text-base">
                          {entry.name}
                        </h4>
                        <p className="text-xs text-stone-500 font-mono">
                          +91 {entry.phone}
                        </p>
                      </div>

                      {entry.status === 'Paid' && entry.tokenNo ? (
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">
                            {t.tokenAssigned}
                          </span>
                          <div className="text-2xl font-black text-red-700 tabular-nums">
                            #{entry.tokenNo}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{t.statusPending}</span>
                        </span>
                      )}
                    </div>

                    {entry.status === 'Paid' && entry.tokenNo ? (
                      <div className="mt-3 pt-3 border-t border-amber-200/80 flex items-center justify-between text-xs text-emerald-800 font-semibold">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{t.statusPaid}</span>
                        </span>
                        <span className="text-stone-500 font-normal text-[11px]">
                          అక్టోబర్ 21 డ్రాకు చెల్లుబాటు
                        </span>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-stone-600 leading-relaxed">
                        {t.awaitingVerification}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
