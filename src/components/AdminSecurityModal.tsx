import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { X, Lock, KeyRound, Smartphone, ShieldCheck, Check, AlertCircle, Eye, EyeOff, Loader2, RefreshCw } from 'lucide-react';
import { DiyaIcon } from './FestiveIcons';
import { TARGET_WHATSAPP_NUMBER } from '../lib/whatsapp';

interface AdminSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onPasswordChanged: (newToken?: string) => void;
  isLoggedIn?: boolean;
}

export const AdminSecurityModal: React.FC<AdminSecurityModalProps> = ({
  isOpen,
  onClose,
  language,
  onPasswordChanged,
  isLoggedIn = false,
}) => {
  // Tabs: 'old_password' or 'forgot_otp'
  const [activeTab, setActiveTab] = useState<'old_password' | 'forgot_otp'>('old_password');

  // Form states - Method 1 (Old Password)
  const [oldPassword, setOldPassword] = useState('');
  const [newPasswordOld, setNewPasswordOld] = useState('');
  const [confirmPasswordOld, setConfirmPasswordOld] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPassOld, setShowNewPassOld] = useState(false);

  // Form states - Method 2 (Forgot Password via OTP to 6305729387)
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [newPasswordOtp, setNewPasswordOtp] = useState('');
  const [confirmPasswordOtp, setConfirmPasswordOtp] = useState('');
  const [showNewPassOtp, setShowNewPassOtp] = useState(false);
  const [previewOtp, setPreviewOtp] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  // Status & notifications
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setOldPassword('');
      setNewPasswordOld('');
      setConfirmPasswordOld('');
      setOtpCode('');
      setNewPasswordOtp('');
      setConfirmPasswordOtp('');
      setErrorMessage(null);
      setSuccessMessage(null);
      setOtpSent(false);
      setPreviewOtp(null);
    }
  }, [isOpen]);

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  if (!isOpen) return null;

  // Handler for Method 1: Change with Old Password
  const handleChangeWithOldPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!oldPassword.trim()) {
      setErrorMessage(
        language === 'te'
          ? 'దయచేసి ప్రస్తుత పాత పాస్‌వర్డ్ నమోదు చేయండి'
          : 'Please enter your current old password'
      );
      return;
    }

    if (!newPasswordOld.trim() || newPasswordOld.length < 4) {
      setErrorMessage(
        language === 'te'
          ? 'కొత్త పాస్‌వర్డ్ కనీసం 4 అక్షరాలు ఉండాలి'
          : 'New password must be at least 4 characters long'
      );
      return;
    }

    if (newPasswordOld !== confirmPasswordOld) {
      setErrorMessage(
        language === 'te'
          ? 'కొత్త పాస్‌వర్డ్ మరియు నిర్ధారణ పాస్‌వర్డ్ సరిపోలలేదు'
          : 'New password and confirm password do not match'
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/security/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: oldPassword.trim(),
          newPassword: newPasswordOld.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccessMessage(
        language === 'te'
          ? 'అడ్మిన్ సెక్యూరిటీ పాస్‌వర్డ్ విజయవంతంగా మార్చబడింది!'
          : 'Admin security password changed successfully!'
      );

      if (data.token) {
        sessionStorage.setItem('admin_token', data.token);
      }

      setTimeout(() => {
        onPasswordChanged(data.token);
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          (language === 'te'
            ? 'పాస్‌వర్డ్ మార్చడంలో సమస్య ఎదురైంది'
            : 'Error updating password')
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for Method 2 Step 1: Send OTP to 6305729387
  const handleSendOtp = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/security/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setOtpSent(true);
      setCountdown(data.expiresInSeconds || 600);
      if (data.previewOtp) {
        setPreviewOtp(data.previewOtp);
      }

      setSuccessMessage(
        language === 'te'
          ? `ధృవీకరణ OTP నంబర్ +91 ${TARGET_WHATSAPP_NUMBER} కు వాట్సాప్ ద్వారా పంపబడింది!`
          : `Security OTP sent to coordinator number +91 ${TARGET_WHATSAPP_NUMBER} via WhatsApp!`
      );
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          (language === 'te'
            ? 'OTP పంపడంలో సమస్య ఎదురైంది. దయచేసి మళ్లీ ప్రయత్నించండి.'
            : 'Error sending OTP. Please try again.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for Method 2 Step 2: Verify OTP and Reset Password
  const handleVerifyOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanOtp = otpCode.replace(/\D/g, '').trim();
    if (cleanOtp.length !== 6) {
      setErrorMessage(
        language === 'te'
          ? 'దయచేసి 6305729387 కు వచ్చిన 6 అంకెల OTP ని నమోదు చేయండి'
          : 'Please enter the 6-digit OTP sent to 6305729387'
      );
      return;
    }

    if (!newPasswordOtp.trim() || newPasswordOtp.length < 4) {
      setErrorMessage(
        language === 'te'
          ? 'కొత్త పాస్‌వర్డ్ కనీసం 4 అక్షరాలు ఉండాలి'
          : 'New password must be at least 4 characters long'
      );
      return;
    }

    if (newPasswordOtp !== confirmPasswordOtp) {
      setErrorMessage(
        language === 'te'
          ? 'కొత్త పాస్‌వర్డ్ మరియు నిర్ధారణ పాస్‌వర్డ్ సరిపోలలేదు'
          : 'New password and confirm password do not match'
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/security/verify-otp-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otp: cleanOtp,
          newPassword: newPasswordOtp.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify OTP');
      }

      setSuccessMessage(
        language === 'te'
          ? 'OTP విజయవంతంగా ధృవీకరించబడింది! కొత్త పాస్‌వర్డ్ అమర్చబడింది.'
          : 'OTP verified! New security password has been set successfully.'
      );

      if (data.token) {
        sessionStorage.setItem('admin_token', data.token);
      }

      setTimeout(() => {
        onPasswordChanged(data.token);
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          (language === 'te'
            ? 'OTP ధృవీకరణలో సమస్య ఎదురైంది. దయచేసి సరైన కోడ్ ఇవ్వండి.'
            : 'Invalid OTP. Please check the code sent to 6305729387.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-amber-400 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 via-[#7F1D1D] to-amber-900 text-amber-100 p-4 sm:p-5 relative border-b-2 border-amber-500">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-2 rounded-full text-amber-200 hover:text-white hover:bg-black/30 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <DiyaIcon className="w-5 h-5" />
            <span className="text-[11px] font-bold tracking-widest text-amber-300 uppercase">
              {language === 'te' ? 'అడ్మిన్ సెక్యూరిటీ రక్షణ' : 'ADMIN SECURITY SETTINGS'}
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold font-serif text-yellow-200">
            {language === 'te'
              ? 'సెక్యూరిటీ పాస్‌వర్డ్ మార్పు'
              : 'Security Password Management'}
          </h3>
          <p className="text-xs text-amber-200/80">
            {language === 'te'
              ? 'శ్రీ ఎదుల్లగూడెం దేవి శరన్నవరాత్రులు 2026 - నిర్వాహకుల రక్షణ'
              : 'Edullagudem Devi Sharannavarathulu 2026 Administration'}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-stone-200 bg-stone-50 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('old_password');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'old_password'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-600 hover:bg-stone-200/60'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{language === 'te' ? 'పాత పాస్‌వర్డ్ ద్వారా' : 'Using Old Password'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('forgot_otp');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'forgot_otp'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-600 hover:bg-stone-200/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{language === 'te' ? 'OTP ద్వారా రీసెట్ (6305729387)' : 'Forgot Password (OTP)'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Notifications */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2 shadow-2xs animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-start gap-2 shadow-2xs animate-fadeIn">
              <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: Change with Old Password */}
          {activeTab === 'old_password' && (
            <form onSubmit={handleChangeWithOldPassword} className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-stone-700 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  {language === 'te'
                    ? 'మీ ప్రస్తుత పాత పాస్‌వర్డ్ నమోదు చేసి, కొత్త సెక్యూరిటీ పాస్‌వర్డ్‌ను సెట్ చేసుకోండి.'
                    : 'Enter your current old password to set a new admin security password.'}
                </span>
              </div>

              {/* Current Old Password */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  {language === 'te' ? 'ప్రస్తుత పాత పాస్‌వర్డ్ (Old Password):' : 'Current Old Password:'}
                  <span className="text-red-600 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-stone-50/50 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-3 top-2.5 text-stone-500 hover:text-stone-800 cursor-pointer"
                  >
                    {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  {language === 'te' ? 'కొత్త పాస్‌వర్డ్ (New Password):' : 'New Password:'}
                  <span className="text-red-600 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassOld ? 'text' : 'password'}
                    value={newPasswordOld}
                    onChange={(e) => setNewPasswordOld(e.target.value)}
                    placeholder="Enter new password (min 4 chars)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-stone-50/50 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassOld(!showNewPassOld)}
                    className="absolute right-3 top-2.5 text-stone-500 hover:text-stone-800 cursor-pointer"
                  >
                    {showNewPassOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  {language === 'te' ? 'కొత్త పాస్‌వర్డ్ నిర్ధారించండి (Confirm):' : 'Confirm New Password:'}
                  <span className="text-red-600 ml-0.5">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPasswordOld}
                  onChange={(e) => setConfirmPasswordOld(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-stone-50/50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !oldPassword || !newPasswordOld || !confirmPasswordOld}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 transition-all shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                <span>
                  {language === 'te' ? 'పాస్‌వర్డ్ అప్‌డేట్ చేయండి' : 'Update Security Password'}
                </span>
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('forgot_otp');
                    setErrorMessage(null);
                  }}
                  className="text-xs text-amber-800 hover:text-amber-950 font-semibold underline cursor-pointer"
                >
                  {language === 'te'
                    ? 'పాత పాస్‌వర్డ్ మర్చిపోయారా? 6305729387 కు OTP పంపండి'
                    : 'Forgot old password? Reset via OTP to 6305729387'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Forgot Password / OTP to 6305729387 */}
          {activeTab === 'forgot_otp' && (
            <div className="space-y-4">
              {/* Coordinator OTP Info Box */}
              <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-300 space-y-1.5 text-xs text-stone-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-amber-700" />
                    <span>{language === 'te' ? 'రక్షిత కోఆర్డినేటర్ మొబైల్' : 'Authorized Coordinator Number'}</span>
                  </span>
                  <span className="font-mono font-black text-stone-900 bg-amber-200/90 px-2 py-0.5 rounded-md text-xs">
                    +91 {TARGET_WHATSAPP_NUMBER}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  {language === 'te'
                    ? 'పాస్‌వర్డ్ రీసెట్ చేయడానికి అధికారిక నంబర్ 6305729387 కు వాట్సాప్ ద్వారా 6 అంకెల ధృవీకరణ OTP పంపబడుతుంది. వచ్చిన OTP కోడ్ సరిగ్గా సరిపోలినప్పుడు మాత్రమే పాస్‌వర్డ్ రీసెట్ చేయవచ్చు.'
                    : 'To reset the password, a 6-digit OTP will be sent to the coordinator number +91 6305729387 via WhatsApp. The OTP must match to reset the password.'}
                </p>
              </div>

              {/* Step 1: Send OTP Button */}
              {!otpSent ? (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                    ) : (
                      <Smartphone className="w-4 h-4" />
                    )}
                    <span>
                      {language === 'te'
                        ? '6305729387 కు OTP పంపండి'
                        : `Send OTP to ${TARGET_WHATSAPP_NUMBER}`}
                    </span>
                  </button>
                </div>
              ) : (
                /* Step 2: Enter OTP & New Password */
                <form onSubmit={handleVerifyOtpAndReset} className="space-y-4 pt-1">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs">
                    <span className="text-emerald-900 font-semibold flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{language === 'te' ? 'OTP పంపబడింది (+91 6305729387)' : 'OTP Sent to +91 6305729387'}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {countdown > 0 ? (
                        <span className="text-xs font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                          {formatSeconds(countdown)}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          className="text-[11px] font-bold text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>{language === 'te' ? 'మళ్లీ పంపండి' : 'Resend OTP'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dev / Simulator Preview Banner */}
                  {previewOtp && (
                    <div className="p-2.5 rounded-xl bg-amber-100/70 border border-amber-300 flex items-center justify-between text-xs font-semibold text-stone-800">
                      <span>WhatsApp OTP (Demo/Simulator):</span>
                      <span className="font-mono text-sm font-extrabold text-red-700 tracking-widest bg-white px-2 py-0.5 rounded-md border border-amber-300">
                        {previewOtp}
                      </span>
                    </div>
                  )}

                  {/* 6-Digit OTP Field */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      {language === 'te' ? '6 అంకెల OTP కోడ్ నమోదు చేయండి:' : 'Enter 6-Digit OTP:'}
                      <span className="text-red-600 ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="e.g. 123456"
                      className="w-full px-4 py-3 rounded-xl border-2 border-amber-400 text-stone-900 text-center font-mono text-xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/30"
                      autoFocus
                      required
                    />
                    <p className="text-[11px] text-stone-500 mt-1">
                      {language === 'te'
                        ? '6305729387 నంబర్‌కు వచ్చిన కోడ్ తప్పనిసరిగా సరిపోలాలి'
                        : 'The OTP must match the code sent to 6305729387'}
                    </p>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      {language === 'te' ? 'కొత్త పాస్‌వర్డ్ (New Password):' : 'New Password:'}
                      <span className="text-red-600 ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassOtp ? 'text' : 'password'}
                        value={newPasswordOtp}
                        onChange={(e) => setNewPasswordOtp(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-stone-50/50 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassOtp(!showNewPassOtp)}
                        className="absolute right-3 top-2.5 text-stone-500 hover:text-stone-800 cursor-pointer"
                      >
                        {showNewPassOtp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      {language === 'te' ? 'కొత్త పాస్‌వర్డ్ నిర్ధారించండి:' : 'Confirm New Password:'}
                      <span className="text-red-600 ml-0.5">*</span>
                    </label>
                    <input
                      type="password"
                      value={confirmPasswordOtp}
                      onChange={(e) => setConfirmPasswordOtp(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-stone-50/50"
                      required
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="py-3 px-3 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100 cursor-pointer"
                    >
                      {language === 'te' ? 'మళ్లీ ప్రారంభించు' : 'Back'}
                    </button>

                    <button
                      type="submit"
                      disabled={isLoading || otpCode.length !== 6 || !newPasswordOtp || !confirmPasswordOtp}
                      className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white transition-all shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                      <span>
                        {language === 'te'
                          ? 'OTP ధృవీకరించి పాస్‌వర్డ్ మార్చండి'
                          : 'Verify OTP & Reset Password'}
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-100 border-t border-stone-200 flex items-center justify-between text-xs">
          <span className="text-stone-500 text-[11px]">
            {language === 'te'
              ? 'కోఆర్డినేటర్ నంబర్: +91 6305729387'
              : 'Coordinator: +91 6305729387'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-800 text-white text-xs font-bold hover:bg-stone-700 cursor-pointer"
          >
            {language === 'te' ? 'రద్దు చేయి' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};
