import React, { useState, useEffect } from 'react';
import { Language, RegistrationFormData, Entry } from './types';
import { Header } from './components/Header';
import { TempleHero } from './components/TempleHero';
import { RegistrationForm } from './components/RegistrationForm';
import { PaymentModal } from './components/PaymentModal';
import { SuccessView } from './components/SuccessView';
import { TokenLookup } from './components/TokenLookup';
import { AdminPanel } from './components/AdminPanel';
import { EventDetails } from './components/EventDetails';
import { Footer } from './components/Footer';
import { ProfileModal } from './components/ProfileModal';
import { ArrowRight, Ticket } from 'lucide-react';

export default function App() {
  const [language, setLanguage] = useState<Language>('te');
  const [activeTab, setActiveTab] = useState<'home' | 'register' | 'lookup' | 'admin'>('home');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Registration Flow state
  const [registrationStep, setRegistrationStep] = useState<'form' | 'payment' | 'success'>('form');
  const [formData, setFormData] = useState<RegistrationFormData | null>(null);
  const [submittedEntry, setSubmittedEntry] = useState<Entry | null>(null);
  const [submittedEntries, setSubmittedEntries] = useState<Entry[]>([]);

  // Persistent Devotee Active Phone
  const [savedDevoteePhone, setSavedDevoteePhone] = useState<string | null>(() => {
    try {
      return localStorage.getItem('devi_last_devotee_phone') || null;
    } catch {
      return null;
    }
  });

  // Sync title and html lang attribute when language changes
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const handleTokensUpdated = () => {
      try {
        setSavedDevoteePhone(localStorage.getItem('devi_last_devotee_phone') || null);
      } catch {}
    };
    window.addEventListener('devi_tokens_updated', handleTokensUpdated);
    return () => window.removeEventListener('devi_tokens_updated', handleTokensUpdated);
  }, []);

  const handleStartRegistration = () => {
    setActiveTab('register');
    setRegistrationStep('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormSubmit = (data: RegistrationFormData) => {
    setFormData(data);
    setActiveTab('register');
    setRegistrationStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePaymentSuccess = (entry: Entry, entries?: Entry[]) => {
    setSubmittedEntry(entry);
    setSubmittedEntries(entries || [entry]);
    setRegistrationStep('success');
    if (entry?.phone) {
      const cleanPhone = entry.phone.replace(/\D/g, '').slice(-10);
      setSavedDevoteePhone(cleanPhone);
      try {
        localStorage.setItem('devi_last_devotee_phone', cleanPhone);
        localStorage.setItem('devi_last_devotee_name', entry.name);
        localStorage.setItem('devi_recent_booked_tokens', JSON.stringify(entries || [entry]));
      } catch {}
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegisterAnother = () => {
    setFormData(null);
    setSubmittedEntry(null);
    setSubmittedEntries([]);
    setRegistrationStep('form');
    setActiveTab('register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabChange = (tab: 'home' | 'register' | 'lookup' | 'admin') => {
    setActiveTab(tab);
    if (tab === 'register' && registrationStep === 'success') {
      setRegistrationStep('form');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F2] text-stone-900 font-sans">
      {/* Top Bar with Language Toggle */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        activeTab={activeTab}
        onSelectTab={handleTabChange}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <div>
            <TempleHero
              language={language}
              onStartRegistration={handleStartRegistration}
              onCheckStatus={() => {
                setActiveTab('lookup');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenProfile={() => setIsProfileModalOpen(true)}
            />

            {/* Persistent Active Tokens Quick-Access Banner */}
            {savedDevoteePhone && (
              <div className="max-w-xl mx-auto px-4 pt-4">
                <div className="bg-gradient-to-r from-amber-500/15 via-red-500/10 to-amber-500/15 border-2 border-amber-400/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md backdrop-blur-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 font-black flex items-center justify-center shrink-0 shadow">
                      <Ticket className="w-5 h-5 text-stone-950" />
                    </div>
                    <div>
                      <p className="font-bold text-stone-900 text-xs sm:text-sm">
                        {language === 'te'
                          ? 'మీ బుకింగ్ టోకెన్ వివరాలు భద్రపరచబడ్డాయి!'
                          : 'Your booked tokens are saved & active!'}
                      </p>
                      <p className="text-[11px] text-stone-600 font-mono">
                        {language === 'te' ? 'మొబైల్' : 'Mobile'}: +91 {savedDevoteePhone}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('lookup');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-all shadow shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{language === 'te' ? 'టోకెన్ వివరాలు చూడండి' : 'View My Tokens'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Quick Registration section directly on home for seamless mobile conversion */}
            <div className="py-6 px-4">
              <RegistrationForm
                language={language}
                onSubmit={handleFormSubmit}
                initialData={formData || undefined}
              />
            </div>

            <EventDetails
              language={language}
              onStartRegistration={handleStartRegistration}
            />
          </div>
        )}

        {activeTab === 'register' && (
          <div className="px-4 py-6">
            {registrationStep === 'form' && (
              <RegistrationForm
                language={language}
                onSubmit={handleFormSubmit}
                initialData={formData || undefined}
              />
            )}

            {registrationStep === 'payment' && formData && (
              <PaymentModal
                language={language}
                formData={formData}
                onBack={() => setRegistrationStep('form')}
                onSuccess={handlePaymentSuccess}
              />
            )}

            {registrationStep === 'success' && submittedEntry && (
              <SuccessView
                language={language}
                entry={submittedEntry}
                entries={submittedEntries}
                onRegisterAnother={handleRegisterAnother}
                onCheckStatus={() => {
                  setActiveTab('lookup');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
          </div>
        )}

        {activeTab === 'lookup' && (
          <div className="px-4 py-6">
            <TokenLookup
              language={language}
              onGoToRegister={() => {
                setActiveTab('register');
                setRegistrationStep('form');
              }}
            />
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="py-4">
            <AdminPanel language={language} onOpenProfile={() => setIsProfileModalOpen(true)} />
          </div>
        )}
      </main>

      <Footer language={language} />

      {/* Official Festival Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        language={language}
        onGoToAdmin={() => {
          setIsProfileModalOpen(false);
          handleTabChange('admin');
        }}
      />
    </div>
  );
}
