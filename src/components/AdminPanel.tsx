import React, { useState, useEffect, useRef } from 'react';
import { Language, Entry, WhatsAppDeliveryStatus, WhatsAppDeliveryInfo } from '../types';
import { getTranslation } from '../lib/translations';
import {
  formatWhatsAppMessage,
  createWhatsAppUrl,
  createClientWhatsAppUrl,
  createCoordinatorWhatsAppUrl,
  TARGET_WHATSAPP_NUMBER
} from '../lib/whatsapp';
import {
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Send,
  Copy,
  ExternalLink,
  Download,
  AlertCircle,
  FileSpreadsheet,
  Check,
  CheckCheck,
  Loader2,
  X,
  Sparkles,
  Radio,
  Settings,
  AlertTriangle,
  Info,
  RotateCcw,
  Eye,
  SlidersHorizontal,
  Wifi,
  WifiOff,
  Trash2,
  Upload,
  Ticket,
  Image as ImageIcon,
  MapPin,
  Calendar,
  Phone,
  ShieldCheck,
  KeyRound,
  Smartphone,
  Gift,
  PlusCircle,
  HeartHandshake
} from 'lucide-react';
import { DiyaIcon, KalasamIcon } from './FestiveIcons';
import { DeviProfileAvatar, DEFAULT_DEVI_PROFILE_STORAGE_KEY } from './DeviProfileAvatar';
import { AdminSecurityModal } from './AdminSecurityModal';
import { AdminPrizesManager } from './AdminPrizesManager';
import { AdminTokenBooking } from './AdminTokenBooking';
import { AdminSponsorsManager } from './AdminSponsorsManager';
import { AdminProfileManager } from './AdminProfileManager';
import { AdminDailyEventsManager } from './AdminDailyEventsManager';

interface AdminPanelProps {
  language: Language;
  onOpenProfile?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ language, onOpenProfile }) => {
  const t = getTranslation(language);

  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Tab state within Admin Panel
  const [adminTab, setAdminTab] = useState<'entries' | 'profile' | 'whatsapp' | 'security' | 'prizes' | 'register_token' | 'sponsors' | 'events'>('entries');
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityToast, setSecurityToast] = useState<string | null>(null);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [sheetStatus, setSheetStatus] = useState<any>(null);
  const [whatsappApiStatus, setWhatsappApiStatus] = useState<any>(null);

  // Delete State & Token Sequence Reclaim
  const [deleteModalEntry, setDeleteModalEntry] = useState<Entry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteToast, setDeleteToast] = useState<string | null>(null);

  // Reset All Tokens State
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [isResettingTokens, setIsResettingTokens] = useState(false);

  // Admin Profile Section State
  const [adminProfilePhoto, setAdminProfilePhoto] = useState<string | null>(() => {
    try {
      return localStorage.getItem(DEFAULT_DEVI_PROFILE_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [adminPhotoUrl, setAdminPhotoUrl] = useState('');
  const [adminPhotoToast, setAdminPhotoToast] = useState<string | null>(null);
  const adminFileInputRef = useRef<HTMLInputElement | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'wa_failed' | 'wa_delivered'>('all');

  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Real-time SSE Stream status
  const [isSseConnected, setIsSseConnected] = useState(false);
  const [lastLiveEvent, setLastLiveEvent] = useState<string | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  // Modals
  const [whatsAppModalData, setWhatsAppModalData] = useState<{
    entry: Entry;
    message: string;
    clientUrl: string;
    coordinatorUrl: string;
  } | null>(null);
  const [receiptModalEntry, setReceiptModalEntry] = useState<Entry | null>(null);
  const [receiptModalTab, setReceiptModalTab] = useState<'client' | 'coordinator'>('client');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [dualDispatchToast, setDualDispatchToast] = useState<string | null>(null);

  // Setup Server-Sent Events (SSE) for Real-Time WhatsApp Delivery Receipts
  useEffect(() => {
    if (!token) return;

    fetchEntries(token);

    // Establish real-time SSE stream
    const eventSourceUrl = `/api/admin/whatsapp/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(eventSourceUrl);
    sseRef.current = eventSource;

    eventSource.onopen = () => {
      setIsSseConnected(true);
    };

    eventSource.addEventListener('delivery-update', (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { entryId, targetType, status, info, fullEntry } = payload;

        // Update the entry in the table real-time!
        setEntries((prevEntries) =>
          prevEntries.map((e) => {
            if (e.id === entryId) {
              if (targetType === 'coordinator') {
                return {
                  ...e,
                  coordinatorWhatsAppStatus: status,
                  coordinatorWhatsAppInfo: info
                };
              } else {
                return {
                  ...e,
                  whatsAppStatus: status,
                  whatsAppInfo: info
                };
              }
            }
            return e;
          })
        );

        // Also update receipt modal if currently inspecting this entry
        setReceiptModalEntry((prev) => {
          if (prev && prev.id === entryId) {
            if (targetType === 'coordinator') {
              return {
                ...prev,
                coordinatorWhatsAppStatus: status,
                coordinatorWhatsAppInfo: info
              };
            } else {
              return {
                ...prev,
                whatsAppStatus: status,
                whatsAppInfo: info
              };
            }
          }
          return prev;
        });

        const targetLabel = targetType === 'coordinator' ? '6305729387' : 'Client';
        setLastLiveEvent(`Updated ${targetLabel} → ${status.toUpperCase()}`);
        setTimeout(() => setLastLiveEvent(null), 4000);
      } catch (err) {
        console.error('Error handling SSE delivery event:', err);
      }
    });

    eventSource.onerror = () => {
      setIsSseConnected(false);
    };

    return () => {
      eventSource.close();
      sseRef.current = null;
    };
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok || !data.authenticated) {
        throw new Error(data.error || t.wrongPassword);
      }
      setToken(data.token);
      sessionStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_token', data.token);
      window.dispatchEvent(new Event('admin_auth_changed'));
      fetchEntries(data.token);
    } catch (err: any) {
      setLoginError(err.message || t.wrongPassword);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    setToken(null);
    sessionStorage.removeItem('admin_token');
    localStorage.removeItem('admin_token');
    window.dispatchEvent(new Event('admin_auth_changed'));
    setEntries([]);
  };

  const fetchEntries = async (authToken: string) => {
    setIsLoadingEntries(true);
    try {
      const res = await fetch('/api/admin/entries', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setEntries(data.entries || []);
        if (data.sheetStatus) setSheetStatus(data.sheetStatus);
      } else if (res.status === 401) {
        handleLogout();
      }

      // Fetch config info for WhatsApp status
      const configRes = await fetch('/api/config/info');
      if (configRes.ok) {
        const configData = await configRes.json();
        setWhatsappApiStatus(configData.whatsappStatus);
      }
    } catch (err) {
      console.error('Error fetching admin entries:', err);
    } finally {
      setIsLoadingEntries(false);
    }
  };

  const handleResetAllTokens = async () => {
    if (!token || isResettingTokens) return;
    setIsResettingTokens(true);
    try {
      const res = await fetch('/api/admin/tokens/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset tokens');
      }
      setEntries([]);
      setShowResetConfirmModal(false);
      setSecurityToast(
        language === 'te'
          ? 'అన్ని టోకెన్లు తొలగించబడ్డాయి! తదుపరి టోకెన్ #1 తో ప్రారంభమవుతుంది.'
          : 'All tokens count removed! Next token sequence will start from Token #1.'
      );
      setTimeout(() => setSecurityToast(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Error resetting tokens');
    } finally {
      setIsResettingTokens(false);
    }
  };

  // Approve & Generate Token
  const handleApprove = async (entry: Entry) => {
    if (!token || approvingId) return;
    setApprovingId(entry.id);

    try {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: entry.id,
          phone: entry.phone,
          rowIndex: entry.rowIndex,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to approve');
      }

      // Update state with newly approved entry
      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? data.entry : e))
      );

      // Open WhatsApp modal with both clientUrl and coordinatorUrl
      setWhatsAppModalData({
        entry: data.entry,
        message: data.whatsAppMessage,
        clientUrl: data.clientWhatsAppUrl,
        coordinatorUrl: data.coordinatorWhatsAppUrl,
      });
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setApprovingId(null);
    }
  };

  // Dispatch WhatsApp message via API with real-time delivery receipt tracking
  // Can send to both client & coordinator simultaneously, or individually
  const handleSendWhatsAppApi = async (entry: Entry, recipientType: 'both' | 'client' | 'coordinator' = 'both') => {
    if (!token || actionLoadingId) return;
    setActionLoadingId(entry.id);

    try {
      const res = await fetch('/api/admin/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          entryId: entry.id,
          recipientType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch WhatsApp message');
      }

      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? data.entry : e))
      );
    } catch (err: any) {
      alert(`Dispatch error: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Single-Click Send Exact Message to BOTH User & Admin (6305729387)
  const handleSingleClickSendBoth = async (entry: Entry, openTabs = true) => {
    if (!token) return;

    const clientUrl = createClientWhatsAppUrl(entry);
    const coordinatorUrl = createCoordinatorWhatsAppUrl(entry);
    const message = formatWhatsAppMessage(entry);

    // 1. Immediately show the Dual WhatsApp Dispatcher Modal for visual confirmation & 1-tap fallback
    setWhatsAppModalData({
      entry,
      message,
      clientUrl,
      coordinatorUrl,
    });

    // 2. Open tabs SYNCHRONOUSLY before any asynchronous fetch (prevents browser popup blocker)
    if (openTabs) {
      try {
        window.open(clientUrl, '_blank', 'noopener,noreferrer');
        window.open(coordinatorUrl, '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.error('Browser blocked popup:', e);
      }
    }

    setActionLoadingId(entry.id);

    try {
      // 3. Dispatch through API to BOTH recipients simultaneously
      const res = await fetch('/api/admin/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          entryId: entry.id,
          recipientType: 'both',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch WhatsApp message');
      }

      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? data.entry : e))
      );

      if (receiptModalEntry && receiptModalEntry.id === entry.id) {
        setReceiptModalEntry(data.entry);
      }
      if (whatsAppModalData && whatsAppModalData.entry.id === entry.id) {
        setWhatsAppModalData((prev) => (prev ? { ...prev, entry: data.entry } : null));
      }

      const toast =
        language === 'te'
          ? `టోకెన్ #${entry.tokenNo} ఖచ్చితమైన వాట్సాప్ సందేశం భక్తునికి (+91 ${entry.phone}) మరియు అడ్మిన్ (+91 ${TARGET_WHATSAPP_NUMBER}) కు ఒకే క్లిక్‌తో పంపబడింది!`
          : `Exact WhatsApp message dispatched with single click to both User (+91 ${entry.phone}) and Admin (+91 ${TARGET_WHATSAPP_NUMBER})!`;

      setDualDispatchToast(toast);
      setTimeout(() => setDualDispatchToast(null), 5000);
    } catch (err: any) {
      console.error('Dispatch error:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Retry failed WhatsApp message
  const handleRetryDelivery = async (entry: Entry, targetRole: 'client' | 'coordinator' = 'client') => {
    if (!token || actionLoadingId) return;
    setActionLoadingId(entry.id);

    try {
      const targetPhone = targetRole === 'coordinator' ? TARGET_WHATSAPP_NUMBER : entry.phone;
      const res = await fetch('/api/admin/whatsapp/retry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ entryId: entry.id, targetPhone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to retry delivery');

      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? data.entry : e))
      );
      if (receiptModalEntry && receiptModalEntry.id === entry.id) {
        setReceiptModalEntry(data.entry);
      }
    } catch (err: any) {
      alert(`Retry error: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Simulate Delivery Receipt (for testing real-time receipts & failure states)
  const handleSimulateStatus = async (entry: Entry, targetRole: 'client' | 'coordinator', status: WhatsAppDeliveryStatus, reason?: string) => {
    if (!token) return;

    try {
      const res = await fetch('/api/admin/whatsapp/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          entryId: entry.id,
          targetRole,
          status,
          failureReason: reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Simulation failed');

      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? data.entry : e))
      );
      if (receiptModalEntry && receiptModalEntry.id === entry.id) {
        setReceiptModalEntry(data.entry);
      }
    } catch (err: any) {
      alert(`Simulation error: ${err.message}`);
    }
  };

  const handleExportCsv = () => {
    if (entries.length === 0) return;
    const headers = ['Token No', 'Name', 'Phone', 'Address', 'Status', 'Submitted At', 'Approved At', 'Client WhatsApp', 'Coordinator WhatsApp', 'Notes'];
    const rows = entries.map((e) => [
      e.tokenNo ?? '',
      `"${e.name.replace(/"/g, '""')}"`,
      `"${e.phone}"`,
      `"${(e.address || '').replace(/"/g, '""')}"`,
      e.status,
      `"${e.submittedAt}"`,
      `"${e.approvedAt || ''}"`,
      e.whatsAppStatus || 'not_sent',
      e.coordinatorWhatsAppStatus || 'not_sent',
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Edullagudem_Devi_Lucky_Draw_Entries_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sequential Token Gap Reclaim Calculation
  // Finds lowest unused positive integer >= 1 among Paid entries
  const computeNextToken = (entriesList: Entry[]): number => {
    const used = new Set<number>();
    for (const e of entriesList) {
      if (typeof e.tokenNo === 'number' && e.tokenNo > 0 && e.status === 'Paid') {
        used.add(e.tokenNo);
      }
    }
    let candidate = 1;
    while (used.has(candidate)) {
      candidate++;
    }
    return candidate;
  };

  const nextAvailableTokenNo = computeNextToken(entries);

  // Handle Entry Deletion & Slot Release
  const confirmDeleteEntry = async () => {
    if (!deleteModalEntry || !token) return;
    setIsDeleting(true);

    try {
      const res = await fetch('/api/admin/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: deleteModalEntry.id, phone: deleteModalEntry.phone }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete entry');
      }

      // Remove from entries list
      setEntries(prev => prev.filter(e => e.id !== deleteModalEntry.id));

      const freedMsg = deleteModalEntry.tokenNo
        ? (language === 'te'
            ? `ఎంట్రీ తొలగించబడింది! టోకెన్ #${deleteModalEntry.tokenNo} విడుదల చేయబడింది. తదుపరి ఆమోదించే ఎంట్రీకి #${deleteModalEntry.tokenNo} కేటాయించబడుతుంది (సీక్వెన్స్ గ్యాప్ భర్తీ చేయబడింది).`
            : `Entry deleted! Token #${deleteModalEntry.tokenNo} freed. The next approved user will now receive Token #${deleteModalEntry.tokenNo}, followed by the subsequent sequence.`)
        : (language === 'te' ? 'ఎంట్రీ విజయవంతంగా తొలగించబడింది.' : 'Entry deleted successfully.');

      setDeleteToast(freedMsg);
      setTimeout(() => setDeleteToast(null), 5000);
      setDeleteModalEntry(null);
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Admin Profile Photo Controls
  const handleAdminPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        try {
          localStorage.setItem(DEFAULT_DEVI_PROFILE_STORAGE_KEY, result);
          setAdminProfilePhoto(result);
          window.dispatchEvent(new Event('devi_profile_updated'));

          // Securely sync with backend server using admin token
          if (token) {
            fetch('/api/admin/profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ profileImage: result })
            }).catch(err => console.error('Failed to sync profile to server:', err));
          }

          setAdminPhotoToast(language === 'te' ? 'అమ్మవారి ప్రొఫైల్ ఫోటో అప్‌డేట్ చేయబడింది!' : 'Festival profile photo updated successfully!');
          setTimeout(() => setAdminPhotoToast(null), 4000);
        } catch {
          alert('Photo file size too large for local cache');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAdminPhotoUrlApply = () => {
    if (!adminPhotoUrl.trim()) return;
    try {
      const url = adminPhotoUrl.trim();
      localStorage.setItem(DEFAULT_DEVI_PROFILE_STORAGE_KEY, url);
      setAdminProfilePhoto(url);
      setAdminPhotoUrl('');
      window.dispatchEvent(new Event('devi_profile_updated'));

      // Securely sync with backend server using admin token
      if (token) {
        fetch('/api/admin/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ profileImage: url })
        }).catch(err => console.error('Failed to sync profile URL to server:', err));
      }

      setAdminPhotoToast(language === 'te' ? 'ప్రొఫైల్ ఫోటో లింక్ వర్తింపజేయబడింది!' : 'Profile photo URL applied!');
      setTimeout(() => setAdminPhotoToast(null), 4000);
    } catch {
      alert('Failed to save photo URL');
    }
  };

  const handleAdminResetPhoto = () => {
    try {
      localStorage.removeItem(DEFAULT_DEVI_PROFILE_STORAGE_KEY);
      setAdminProfilePhoto(null);
      window.dispatchEvent(new Event('devi_profile_updated'));

      // Securely sync reset with backend server using admin token
      if (token) {
        fetch('/api/admin/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ profileImage: null })
        }).catch(err => console.error('Failed to sync profile reset to server:', err));
      }

      setAdminPhotoToast(language === 'te' ? 'అమ్మవారి దివ్య చిత్రం పునరుద్ధరించబడింది!' : 'Reset to Divine Sri Durga portrait!');
      setTimeout(() => setAdminPhotoToast(null), 4000);
    } catch {}
  };

  // Helper renderer for WhatsApp Delivery Badge
  const renderDeliveryBadge = (entry: Entry, targetRole: 'client' | 'coordinator' = 'client') => {
    const isCoordinator = targetRole === 'coordinator';
    const status = isCoordinator ? (entry.coordinatorWhatsAppStatus || 'not_sent') : (entry.whatsAppStatus || 'not_sent');
    const info = isCoordinator ? entry.coordinatorWhatsAppInfo : entry.whatsAppInfo;
    const label = isCoordinator ? '6305729387' : 'Client';

    const openReceipt = () => {
      setReceiptModalEntry(entry);
      setReceiptModalTab(targetRole);
    };

    switch (status) {
      case 'read':
        return (
          <button
            onClick={openReceipt}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-300 hover:bg-sky-100 transition-colors shadow-2xs group cursor-pointer"
            title={`${label}: Opened & read by recipient`}
          >
            <CheckCheck className="w-3 h-3 text-sky-600 group-hover:scale-110 transition-transform" />
            <span>Read (✓✓)</span>
          </button>
        );
      case 'delivered':
        return (
          <button
            onClick={openReceipt}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors shadow-2xs group cursor-pointer"
            title={`${label}: Delivered to handset`}
          >
            <CheckCheck className="w-3 h-3 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span>Delivered (✓✓)</span>
          </button>
        );
      case 'sent':
        return (
          <button
            onClick={openReceipt}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-300 hover:bg-blue-100 transition-colors shadow-2xs group cursor-pointer"
            title={`${label}: Sent to WhatsApp network`}
          >
            <Check className="w-3 h-3 text-blue-600 group-hover:scale-110 transition-transform" />
            <span>Sent (✓)</span>
          </button>
        );
      case 'queued':
        return (
          <button
            onClick={openReceipt}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs animate-pulse cursor-pointer"
            title={`${label}: Queued for dispatch`}
          >
            <Clock className="w-3 h-3 animate-spin text-amber-600" />
            <span>Queued...</span>
          </button>
        );
      case 'failed':
        return (
          <button
            onClick={openReceipt}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-800 border border-red-300 hover:bg-red-100 transition-colors shadow-2xs group cursor-pointer"
            title={`${label}: Failed - ${info?.failureReason || 'Click to inspect & retry'}`}
          >
            <AlertTriangle className="w-3 h-3 text-red-600 group-hover:scale-110 transition-transform" />
            <span>Failed ❌</span>
          </button>
        );
      default:
        return (
          <button
            onClick={() => handleSendWhatsAppApi(entry, targetRole)}
            disabled={actionLoadingId === entry.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-100 text-stone-600 hover:bg-emerald-50 hover:text-emerald-800 border border-stone-300 hover:border-emerald-300 transition-colors cursor-pointer"
            title={`Send token message to ${label}`}
          >
            <Send className="w-2.5 h-2.5 text-stone-500" />
            <span>Send</span>
          </button>
        );
    }
  };

  // Login Screen if not authenticated
  if (!token) {
    return (
      <div className="max-w-md mx-auto my-8 bg-white rounded-2xl border-2 border-stone-200 shadow-xl overflow-hidden animate-fadeIn">
        <div className="bg-gradient-to-r from-stone-900 to-stone-800 px-6 py-5 text-white flex items-center justify-between border-b-2 border-amber-500">
          <div className="flex items-center gap-3">
            <DeviProfileAvatar size="md" showHalo={true} onClick={onOpenProfile} />
            <div>
              <h2 className="text-xl font-bold font-serif text-amber-300">
                {t.adminLoginTitle}
              </h2>
              <p className="text-xs text-stone-300">
                {language === 'te'
                  ? 'ఎదుల్లగూడెం దేవి నవరాత్రులు నిర్వహణ డాష్‌బోర్డ్'
                  : 'Edullagudem Devi Navarathulu Management'}
              </p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-amber-300" />
          </div>
        </div>

        <form onSubmit={handleLogin} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Enter password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              autoFocus
            />
          </div>

          {loginError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoggingIn || !password}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 transition-all shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Unlock className="w-4 h-4" />
            <span>{t.loginButton}</span>
          </button>

          {/* Forgot Password / OTP Option to 6305729387 */}
          <div className="pt-2 text-center border-t border-stone-200">
            <button
              type="button"
              onClick={() => setShowSecurityModal(true)}
              className="text-xs font-semibold text-amber-800 hover:text-amber-950 flex items-center justify-center gap-1.5 mx-auto cursor-pointer p-1"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-700" />
              <span>
                {language === 'te'
                  ? 'పాస్‌వర్డ్ మర్చిపోయారా? 6305729387 కు OTP ద్వారా రీసెట్ చేయండి'
                  : 'Forgot Password? Reset via OTP to 6305729387'}
              </span>
            </button>
          </div>
        </form>

        <AdminSecurityModal
          isOpen={showSecurityModal}
          onClose={() => setShowSecurityModal(false)}
          language={language}
          onPasswordChanged={(newToken) => {
            if (newToken) {
              setToken(newToken);
              fetchEntries(newToken);
            }
          }}
          isLoggedIn={false}
        />
      </div>
    );
  }

  // Filter & Search Logic
  const filteredEntries = entries.filter((e) => {
    if (statusFilter === 'pending' && e.status !== 'Pending') return false;
    if (statusFilter === 'paid' && e.status !== 'Paid') return false;
    if (statusFilter === 'wa_delivered' && !(e.whatsAppStatus === 'delivered' || e.whatsAppStatus === 'read')) return false;
    if (statusFilter === 'wa_failed' && e.whatsAppStatus !== 'failed') return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = e.name.toLowerCase().includes(q);
      const matchPhone = e.phone.includes(q);
      const matchToken = e.tokenNo?.toString() === q;
      const matchAddress = (e.address || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchToken || matchAddress;
    }
    return true;
  });

  const pendingCount = entries.filter((e) => e.status === 'Pending').length;
  const approvedCount = entries.filter((e) => e.status === 'Paid').length;
  const deliveredCount = entries.filter((e) => e.whatsAppStatus === 'delivered' || e.whatsAppStatus === 'read').length;
  const failedCount = entries.filter((e) => e.whatsAppStatus === 'failed').length;

  return (
    <div className="max-w-6xl mx-auto my-6 px-3 sm:px-6 space-y-6 animate-fadeIn">
      {/* Top Banner / Actions Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <DeviProfileAvatar size="lg" showHalo={true} onClick={onOpenProfile} />
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl sm:text-2xl font-bold font-serif text-stone-900">
                {t.adminPortal}
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>{isSseConnected ? 'Live Stream Active' : 'Connecting Stream...'}</span>
              </div>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Google Sheet: <span className="font-mono text-stone-700">1AiIcdMBMOu5BVLf3Tvhekn5K4etuXrOgrMjmc_MicSw</span>
              <span className="mx-1.5">·</span>
              WhatsApp Gateway: <span className="text-emerald-700 font-semibold">{whatsappApiStatus?.configured ? 'Meta Cloud API' : 'Delivery Simulator (Live Receipts)'}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add Prizes Button */}
          <button
            onClick={() => setAdminTab('prizes')}
            className={`px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              adminTab === 'prizes'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
            }`}
            title="Add and Manage Prizes"
          >
            <Gift className="w-3.5 h-3.5 text-amber-700" />
            <span>{language === 'te' ? 'బహుమతులు (+ Add Prizes)' : 'Prizes (+ Add)'}</span>
          </button>

          {/* Direct Token Registration Button */}
          <button
            onClick={() => setAdminTab('register_token')}
            className={`px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              adminTab === 'register_token'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300'
            }`}
            title="Direct Lucky Draw Token Registration for Devotees"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-700" />
            <span>{language === 'te' ? 'టోకెన్ బుకింగ్ (Buy Token)' : 'Buy / Issue Token'}</span>
          </button>

          {/* Profile Photo / Details Button */}
          <button
            onClick={() => setAdminTab('profile')}
            className={`px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              adminTab === 'profile'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-300'
            }`}
            title="Manage Official Festival Profile"
          >
            <DeviProfileAvatar size="xs" showHalo={false} showBorder={false} />
            <span>{language === 'te' ? 'ఉత్సవ ప్రొఫైల్' : 'Profile'}</span>
          </button>

          {/* Security Password Change Button */}
          <button
            onClick={() => setShowSecurityModal(true)}
            className={`px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              adminTab === 'security'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-red-50 hover:bg-red-100 text-red-900 border border-red-300'
            }`}
            title="Change Security Password (Old Password or OTP to 6305729387)"
          >
            <KeyRound className="w-3.5 h-3.5 text-red-700" />
            <span>{language === 'te' ? 'సెక్యూరిటీ పాస్‌వర్డ్' : 'Security'}</span>
          </button>

          {/* Reset All Tokens to Token 1 Button */}
          <button
            onClick={() => setShowResetConfirmModal(true)}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-950 border border-orange-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Remove all tokens count and start fresh from Token 1"
          >
            <RotateCcw className="w-3.5 h-3.5 text-orange-700" />
            <span>{language === 'te' ? 'రీసెట్ (#1)' : 'Reset (#1)'}</span>
          </button>

          {/* WhatsApp API & Webhook Configuration Button */}
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={() => fetchEntries(token)}
            disabled={isLoadingEntries}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEntries ? 'animate-spin' : ''}`} />
            <span>{t.syncSheet}</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.exportCsv}</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors cursor-pointer"
          >
            {t.logout}
          </button>
        </div>
      </div>

      {/* Main Tab Switcher Bar */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-stone-100 rounded-2xl border border-stone-200">
        <button
          type="button"
          onClick={() => setAdminTab('entries')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            adminTab === 'entries'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-stone-700 hover:bg-white hover:text-stone-900'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>{language === 'te' ? 'భక్తుల ఎంట్రీలు & టోకెన్లు' : 'Devotee Entries & Tokens'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${adminTab === 'entries' ? 'bg-amber-700 text-amber-100' : 'bg-stone-200 text-stone-700'}`}>
            {entries.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('prizes')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            adminTab === 'prizes'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-stone-700 hover:bg-white hover:text-stone-900'
          }`}
        >
          <Gift className="w-4 h-4 text-amber-600" />
          <span>{language === 'te' ? 'బహుమతుల నిర్వహణ (+ Add Prizes)' : 'Prizes Management (+ Add Prizes)'}</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('sponsors')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            adminTab === 'sponsors'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-stone-700 hover:bg-white hover:text-stone-900'
          }`}
        >
          <HeartHandshake className="w-4 h-4 text-rose-600" />
          <span>{language === 'te' ? 'దాతలు & స్పాన్సర్లు (+ Add Sponsors)' : 'Sponsors & Donors (+ Add Sponsors)'}</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('register_token')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            adminTab === 'register_token'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-stone-700 hover:bg-white hover:text-stone-900'
          }`}
        >
          <PlusCircle className="w-4 h-4 text-emerald-600" />
          <span>{language === 'te' ? 'టోకెన్ రిజిస్ట్రేషన్ (Buy Token for Devotee)' : 'Lucky Draw Token Registration (Buy Token)'}</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('profile')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            adminTab === 'profile'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-stone-700 hover:bg-white hover:text-stone-900'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>{language === 'te' ? 'ఉత్సవ ప్రొఫైల్' : 'Festival Profile'}</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('security')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            adminTab === 'security'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-stone-700 hover:bg-white hover:text-stone-900'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>{language === 'te' ? 'సెక్యూరిటీ పాస్‌వర్డ్' : 'Security Password'}</span>
        </button>
      </div>

      {/* Live WhatsApp Status Stream Banner */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-900 to-teal-900 text-white text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          {isSseConnected ? (
            <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>
            <strong>{t.waDeliveryReceipts}:</strong> Real-time push updates for Queued ➔ Sent (✓) ➔ Delivered (✓✓) ➔ Read (✓✓) or Failures.
          </span>
        </div>

        {lastLiveEvent && (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[11px] font-mono border border-emerald-400/40 animate-pulse">
            ⚡ {lastLiveEvent}
          </span>
        )}
      </div>

      {/* Dual Dispatch Toast Banner */}
      {dualDispatchToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 text-xs sm:text-sm font-bold flex items-center justify-between shadow-md animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{dualDispatchToast}</span>
          </div>
          <button
            onClick={() => setDualDispatchToast(null)}
            className="text-emerald-800 hover:text-stone-900 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Delete / Action Toast Banner */}
      {deleteToast && (
        <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-400 text-amber-950 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-amber-700 shrink-0" />
            <span>{deleteToast}</span>
          </div>
          <button
            onClick={() => setDeleteToast(null)}
            className="text-amber-800 hover:text-stone-900 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Security Toast Banner */}
      {securityToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>{securityToast}</span>
          </div>
          <button
            onClick={() => setSecurityToast(null)}
            className="text-emerald-800 hover:text-stone-900 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Admin Section Primary Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setAdminTab('entries')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            adminTab === 'entries'
              ? 'bg-stone-900 text-amber-300 shadow-md ring-2 ring-stone-900/20'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Ticket className="w-4 h-4 text-amber-400" />
          <span>{language === 'te' ? 'భక్తుల ఎంట్రీలు & టోకెన్లు' : 'Devotee Entries & Tokens'}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400/20 text-amber-300 font-mono">
            {entries.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('profile')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            adminTab === 'profile'
              ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md ring-2 ring-amber-500/30'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <DeviProfileAvatar size="xs" showHalo={false} showBorder={false} />
          <span>{language === 'te' ? 'ఉత్సవ ప్రొఫైల్ విభాగం' : 'Festival Profile Section'}</span>
          <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('events')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            adminTab === 'events'
              ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md ring-2 ring-orange-400'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Calendar className="w-4 h-4 text-amber-500" />
          <span>{language === 'te' ? 'ఈవెంట్ స్లాట్లు (Daily Events)' : 'Daily Events Slots'}</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('sponsors')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            adminTab === 'sponsors'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md ring-2 ring-amber-400'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <HeartHandshake className="w-4 h-4 text-amber-700" />
          <span>{language === 'te' ? 'దాతలు & స్పాన్సర్లు (Sponsors)' : 'Sponsors & Donors'}</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('prizes')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            adminTab === 'prizes'
              ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-stone-950 shadow-md ring-2 ring-yellow-400'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Gift className="w-4 h-4 text-amber-700" />
          <span>{language === 'te' ? 'బహుమతులు (Prizes)' : 'Prizes'}</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('register_token')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            adminTab === 'register_token'
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md ring-2 ring-emerald-500/30'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <PlusCircle className="w-4 h-4 text-emerald-600" />
          <span>{language === 'te' ? 'టోకెన్ బుకింగ్ (Book Token)' : 'Book Token'}</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('security')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            adminTab === 'security'
              ? 'bg-gradient-to-r from-red-700 to-amber-800 text-white shadow-md ring-2 ring-red-500/30'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <KeyRound className="w-4 h-4 text-amber-300" />
          <span>{language === 'te' ? 'సెక్యూరిటీ పాస్‌వర్డ్' : 'Security Password'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowConfigModal(true)}
          className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ml-auto"
        >
          <Settings className="w-4 h-4 text-emerald-700" />
          <span>WhatsApp API Config</span>
        </button>
      </div>

      {/* TAB 1: ENTRIES & TOKEN MANAGEMENT */}
      {adminTab === 'entries' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Metrics Cards with Next Sequential Token */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <p className="text-xs text-stone-500 font-medium">{t.totalEntries}</p>
              <p className="text-2xl font-bold text-stone-900 mt-1 tabular-nums">
                {entries.length}
              </p>
            </div>

            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-300 shadow-xs">
              <p className="text-xs text-amber-800 font-medium">{t.pendingEntries}</p>
              <p className="text-2xl font-bold text-amber-900 mt-1 tabular-nums flex items-center gap-2">
                <span>{pendingCount}</span>
                {pendingCount > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    Action required
                  </span>
                )}
              </p>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-300 shadow-xs">
              <p className="text-xs text-emerald-800 font-medium">{t.filterApproved} (Paid)</p>
              <p className="text-2xl font-bold text-emerald-900 mt-1 tabular-nums flex items-center gap-2">
                <span>{approvedCount}</span>
                <span className="text-xs text-emerald-700 font-normal">Tokens issued</span>
              </p>
            </div>

            {/* Next Sequential Token with Gap Reclaim Notice */}
            <div className="bg-gradient-to-br from-red-50 to-amber-50 p-4 rounded-xl border-2 border-red-300 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-xs text-red-900 font-bold uppercase tracking-wider">
                  Next Token #
                </p>
                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(true)}
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-200 hover:bg-red-300 text-red-900 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Remove all tokens and start fresh from Token 1"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>{language === 'te' ? 'రీసెట్ #1' : 'Reset #1'}</span>
                </button>
              </div>
              <p className="text-2xl font-black text-red-700 mt-1 tabular-nums flex items-center gap-2">
                <span>#{nextAvailableTokenNo}</span>
              </p>
              <p className="text-[10px] text-stone-500 mt-0.5 leading-tight">
                {language === 'te'
                  ? 'తొలగించిన నంబర్ల ఖాళీలను తిరిగి భర్తీ చేస్తుంది'
                  : 'Automatically reclaims deleted token slots'}
              </p>
            </div>
          </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {t.filterAll} ({entries.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {t.filterPending} ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'paid'
                ? 'bg-emerald-700 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {t.filterApproved} ({approvedCount})
          </button>
          <button
            onClick={() => setStatusFilter('wa_delivered')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'wa_delivered'
                ? 'bg-teal-700 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Delivered ({deliveredCount})
          </button>
          {failedCount > 0 && (
            <button
              onClick={() => setStatusFilter('wa_failed')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'wa_failed'
                  ? 'bg-red-700 text-white'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              Failed ({failedCount})
            </button>
          )}
        </div>
      </div>

      {/* Entries Table / List */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-stone-500 text-xs sm:text-sm">
            ఎలాంటి రికార్డులు కనిపించలేదు.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100/90 text-stone-700 border-b border-stone-200 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Token #</th>
                  <th className="py-3 px-4">Devotee Name</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Address / Village</th>
                  <th className="py-3 px-4">Entry Status</th>
                  <th className="py-3 px-4">WhatsApp Delivery</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredEntries.map((entry) => {
                  const isPending = entry.status === 'Pending';
                  return (
                    <tr
                      key={entry.id}
                      className={`hover:bg-stone-50/80 transition-colors ${
                        isPending ? 'bg-amber-50/30 font-medium' : ''
                      }`}
                    >
                      {/* Token No */}
                      <td className="py-3.5 px-4 font-bold tabular-nums">
                        {entry.tokenNo !== null ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-100 text-red-900 border border-red-300 font-mono text-sm">
                            #{entry.tokenNo}
                          </span>
                        ) : (
                          <span className="text-stone-400 font-mono">-</span>
                        )}
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4 font-semibold text-stone-900">
                        {entry.name}
                      </td>

                      {/* Mobile Phone */}
                      <td className="py-3.5 px-4 font-mono text-stone-800">
                        +91 {entry.phone}
                      </td>

                      {/* Address */}
                      <td className="py-3.5 px-4 text-stone-600 max-w-xs truncate">
                        {entry.address || <span className="text-stone-400">Not provided</span>}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3" />
                            <span>Pending</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Paid</span>
                          </span>
                        )}
                      </td>

                      {/* WhatsApp Real-time Delivery Status for Both Recipients */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {entry.status === 'Paid' ? (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-stone-500 font-semibold w-12">Client:</span>
                              {renderDeliveryBadge(entry, 'client')}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-stone-500 font-semibold w-12">630572...:</span>
                              {renderDeliveryBadge(entry, 'coordinator')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-stone-400 text-[11px] italic">Awaiting Approval</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApprove(entry)}
                              disabled={approvingId === entry.id}
                              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{t.approveBtn}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteModalEntry(entry)}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                              title={language === 'te' ? 'ఎంట్రీని తొలగించండి' : 'Delete client entry'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Single Click: Send to Both WhatsApps (User & Admin) */}
                            <button
                              type="button"
                              disabled={actionLoadingId === entry.id}
                              onClick={() => handleSingleClickSendBoth(entry, true)}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              title={
                                language === 'te'
                                  ? `ఒకే క్లిక్‌తో భక్తునికి (+91 ${entry.phone}) మరియు అడ్మిన్ (+91 ${TARGET_WHATSAPP_NUMBER}) కు ఖచ్చితమైన వాట్సాప్ సందేశం పంపండి`
                                  : `Single click dispatch exact WhatsApp message to both User (+91 ${entry.phone}) and Admin (+91 ${TARGET_WHATSAPP_NUMBER})`
                              }
                            >
                              {actionLoadingId === entry.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                              ) : (
                                <Send className="w-3.5 h-3.5 text-white" />
                              )}
                              <span>
                                {language === 'te' ? 'ఇద్దరికీ వాట్సాప్ (1-Click)' : 'Both WhatsApp (1-Click)'}
                              </span>
                            </button>

                            {/* Direct User WhatsApp link */}
                            <a
                              href={createClientWhatsAppUrl(entry)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-1.5 py-1 text-[11px] font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 transition-colors inline-flex items-center"
                              title={`Direct WhatsApp to User (+91 ${entry.phone})`}
                            >
                              <span>User</span>
                            </a>

                            {/* Direct Admin WhatsApp link */}
                            <a
                              href={createCoordinatorWhatsAppUrl(entry)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-1.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors inline-flex items-center"
                              title={`Direct WhatsApp to Admin (+91 ${TARGET_WHATSAPP_NUMBER})`}
                            >
                              <span>Admin</span>
                            </a>

                            {/* View Detailed Delivery Receipts */}
                            <button
                              onClick={() => {
                                setReceiptModalEntry(entry);
                                setReceiptModalTab('client');
                              }}
                              className="px-2 py-1 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 transition-colors cursor-pointer"
                              title="Inspect Delivery Logs & Receipt"
                            >
                              <Info className="w-3 h-3" />
                            </button>

                            {/* Delete Entry: Frees & Reclaims Token Sequence Slot! */}
                            <button
                              type="button"
                              onClick={() => setDeleteModalEntry(entry)}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                              title={
                                entry.tokenNo
                                  ? (language === 'te'
                                      ? `టోకెన్ #${entry.tokenNo} విడుదల చేసి ఎంట్రీని తొలగించండి`
                                      : `Delete entry & release Token #${entry.tokenNo} for next devotee`)
                                  : 'Delete entry'
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
      )}

      {/* TAB: PRIZES MANAGEMENT IN ADMIN SECTION */}
      {adminTab === 'prizes' && (
        <AdminPrizesManager
          language={language}
          token={token}
        />
      )}

      {/* TAB: SPONSORS & DONORS MANAGEMENT IN ADMIN SECTION */}
      {adminTab === 'sponsors' && (
        <AdminSponsorsManager
          language={language}
          token={token}
        />
      )}

      {/* TAB: DIRECT LUCKY DRAW TOKEN REGISTRATION IN ADMIN SECTION */}
      {adminTab === 'register_token' && (
        <AdminTokenBooking
          language={language}
          token={token}
          nextAvailableTokenNo={nextAvailableTokenNo}
          onSuccess={(newEntries) => {
            setEntries((prev) => [...newEntries, ...prev]);
            setAdminTab('entries');
            if (token) fetchEntries(token);
          }}
        />
      )}

      {/* TAB: DAILY EVENTS & PUJA SLOTS IN ADMIN SECTION */}
      {adminTab === 'events' && (
        <AdminDailyEventsManager
          language={language}
          token={token}
        />
      )}

      {/* TAB 2: PROFILE SECTION IN ADMIN SECTION */}
      {adminTab === 'profile' && (
        <AdminProfileManager
          language={language}
          token={token}
        />
      )}

      {/* TAB 3: SECURITY PASSWORD MANAGEMENT */}
      {adminTab === 'security' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Section Header */}
          <div className="bg-gradient-to-r from-red-950 via-[#7F1D1D] to-amber-900 p-6 rounded-2xl border-2 border-red-500 text-amber-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-600/30 border-2 border-amber-400 flex items-center justify-center shrink-0">
                <Lock className="w-8 h-8 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold font-serif text-yellow-200">
                    {language === 'te' ? 'అడ్మిన్ సెక్యూరిటీ పాస్‌వర్డ్ నిర్వహణ' : 'Admin Security Password Management'}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold">
                    Protected
                  </span>
                </div>
                <p className="text-xs text-amber-200/80 mt-1 max-w-xl leading-relaxed">
                  {language === 'te'
                    ? 'ఈ విభాగంలో అడ్మిన్ పాస్‌వర్డ్‌ను పాత పాస్‌వర్డ్ ద్వారా మార్చవచ్చు లేదా పాస్‌వర్డ్ మర్చిపోతే అధికారిక కోఆర్డినేటర్ నంబర్ +91 6305729387 కు వాట్సాప్ OTP పంపడం ద్వారా సురక్షితంగా రీసెట్ చేయవచ్చు.'
                    : 'Change admin security password using your old password, or if forgotten, reset securely via WhatsApp OTP sent to coordinator number +91 6305729387.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSecurityModal(true)}
                className="px-4 py-2.5 text-xs font-bold rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 flex items-center gap-1.5 shadow transition-all cursor-pointer whitespace-nowrap"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{language === 'te' ? 'పాస్‌వర్డ్ మార్పు విండో తెరవండి' : 'Open Password Dialog'}</span>
              </button>
            </div>
          </div>

          {/* Security Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Option 1: Change with Old Password */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">
                    {language === 'te' ? 'ఎంపిక 1: పాత పాస్‌వర్డ్ ద్వారా మార్పు' : 'Option 1: Using Old Password'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {language === 'te' ? 'ప్రస్తుత పాస్‌వర్డ్ తెలిస్తే ఇక్కడ మార్చండి' : 'Change password if you know your current password'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-stone-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'te' ? 'సురక్షిత ప్రమాణీకరణ' : 'Direct Authentication'}</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  {language === 'te'
                    ? 'మీ ప్రస్తుత పాత పాస్‌వర్డ్‌ను సరిచూసి, నేరుగా నూతన పాస్‌వర్డ్‌ను అప్‌డేట్ చేస్తుంది. అప్‌డేట్ చేసిన వెంటనే సెషన్ సురక్షితంగా కొనసాగుతుంది.'
                    : 'Verifies your current active password and immediately updates to the new credentials.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSecurityModal(true)}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-amber-500 hover:bg-amber-400 text-stone-950 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Lock className="w-4 h-4" />
                <span>{language === 'te' ? 'పాత పాస్‌వర్డ్‌తో మార్చండి' : 'Change with Old Password'}</span>
              </button>
            </div>

            {/* Option 2: Forgot Password via OTP to 6305729387 */}
            <div className="bg-white rounded-2xl border-2 border-red-300 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-300 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-red-700" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">
                    {language === 'te' ? 'ఎంపిక 2: పాస్‌వర్డ్ మర్చిపోయారా? (OTP)' : 'Option 2: Forgot Password (OTP)'}
                  </h3>
                  <p className="text-xs text-red-700 font-semibold font-mono">
                    WhatsApp OTP: +91 6305729387
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-red-50/70 border border-red-200 text-xs text-stone-700 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-red-950">
                  <ShieldCheck className="w-4 h-4 text-red-700" />
                  <span>{language === 'te' ? 'రక్షిత కోఆర్డినేటర్ ధృవీకరణ' : 'Protected Coordinator Verification'}</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  {language === 'te'
                    ? 'మీరు పాత పాస్‌వర్డ్ మర్చిపోయినట్లయితే, రక్షిత కోఆర్డినేటర్ మొబైల్ +91 6305729387 కు వాట్సాప్ ద్వారా 6 అంకెల OTP వెళ్తుంది. వచ్చిన OTP కోడ్ సరిగ్గా సరిపోలిన తర్వాత మాత్రమే పాస్‌వర్డ్ రీసెట్ అవుతుంది.'
                    : 'If you forgot your old password, a 6-digit verification OTP is sent to coordinator number +91 6305729387 via WhatsApp. The OTP must match to reset.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSecurityModal(true)}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-red-600 to-amber-700 hover:from-red-500 hover:to-amber-600 text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Smartphone className="w-4 h-4" />
                <span>{language === 'te' ? '6305729387 కు OTP పంపి రీసెట్ చేయండి' : 'Send OTP to 6305729387 & Reset'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal with Gap-reclaim explanation */}
      {deleteModalEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-red-300 overflow-hidden">
            <div className="bg-red-700 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-200" />
                <h3 className="font-bold text-base">
                  {language === 'te' ? 'ఎంట్రీని తొలగించాలా?' : 'Delete Devotee Entry?'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalEntry(null)}
                className="text-red-200 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1.5">
                <p className="text-stone-500">
                  {language === 'te' ? 'భక్తుని పేరు' : 'Devotee'}: <strong className="text-stone-900 text-sm">{deleteModalEntry.name}</strong>
                </p>
                <p className="text-stone-500">
                  {language === 'te' ? 'ఫోన్ నంబర్' : 'Phone'}: <span className="font-mono text-stone-900 font-bold">+91 {deleteModalEntry.phone}</span>
                </p>
                {deleteModalEntry.tokenNo && (
                  <p className="text-stone-500">
                    {language === 'te' ? 'కేటాయించిన టోకెన్' : 'Assigned Token'}: <span className="font-mono text-red-700 font-black text-sm">#{deleteModalEntry.tokenNo}</span>
                  </p>
                )}
              </div>

              {deleteModalEntry.tokenNo ? (
                <div className="p-3.5 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {language === 'te' ? 'టోకెన్ సీక్వెన్స్ రీప్లేస్మెంట్ నియమం:' : 'Sequential Token Gap Reclaim:'}
                    </span>
                  </div>
                  <p className="leading-relaxed">
                    {language === 'te'
                      ? `ఈ ఎంట్రీని తొలగిస్తే టోకెన్ #${deleteModalEntry.tokenNo} సీక్వెన్స్‌లో తిరిగి అందుబాటులోకి వస్తుంది. తదుపరి ఆమోదించబడే భక్తునికి ఆటోమేటిక్‌గా #${deleteModalEntry.tokenNo} కేటాయించబడుతుంది (ఉదాహరణకు 5 తీసివేస్తే తదుపరి ఎంట్రీ 5 తో మొదలవుతుంది, తర్వాత 6 వస్తుంది).`
                      : `Deleting this entry will free Token #${deleteModalEntry.tokenNo}. The next approved devotee will automatically receive Token #${deleteModalEntry.tokenNo}, followed by the subsequent numbers without skipping.`}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-stone-600">
                  {language === 'te'
                    ? 'ఈ పెండింగ్ ఎంట్రీని శాశ్వతంగా తొలగించాలనుకుంటున్నారా?'
                    : 'Are you sure you want to permanently delete this pending registration?'}
                </p>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalEntry(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                >
                  {language === 'te' ? 'రద్దు చేయి' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteEntry}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    {isDeleting
                      ? (language === 'te' ? 'తొలగిస్తోంది...' : 'Deleting...')
                      : (language === 'te' ? 'అవును, తొలగించు' : 'Yes, Delete Entry')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dual WhatsApp Message Confirmation Modal */}
      {whatsAppModalData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border-2 border-emerald-500 shadow-2xl overflow-hidden animate-scaleUp">
            <div className="bg-emerald-800 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-base">
                  Token Approved! Sent to Both Recipients at a Time
                </h3>
              </div>
              <button
                onClick={() => setWhatsAppModalData(null)}
                className="text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-500">Allocated Token:</span>
                  <p className="text-2xl font-black text-red-700">
                    #{whatsAppModalData.entry.tokenNo}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-500">Devotee Name:</span>
                  <p className="font-bold text-stone-900 text-sm">
                    {whatsAppModalData.entry.name}
                  </p>
                  <p className="text-xs text-stone-500 font-mono">
                    +91 {whatsAppModalData.entry.phone}
                  </p>
                </div>
              </div>

              {/* SINGLE CLICK DISPATCH TO BOTH WHATSAPP'S HERO BUTTON */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span className="font-extrabold text-xs uppercase tracking-wide text-emerald-100">
                      {language === 'te' ? 'సింగిల్ క్లిక్ డ్యూయల్ వాట్సాప్ పంపకం' : 'Single Click Dual WhatsApp Dispatch'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-white/20 text-emerald-100 px-2 py-0.5 rounded-full border border-white/20">
                    User + Admin (6305729387)
                  </span>
                </div>

                <p className="text-xs text-emerald-50 leading-relaxed">
                  {language === 'te'
                    ? 'ఒకే క్లిక్‌తో ఈ అధికారిక ఖచ్చితమైన టోకెన్ సందేశాన్ని భక్తునికి మరియు అడ్మిన్ వాట్సాప్‌కు ఒకేసారి పంపండి:'
                    : 'Dispatch the exact same token message to both Devotee and Admin (6305729387) WhatsApp with a single click:'}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    try {
                      window.open(whatsAppModalData.clientUrl, '_blank', 'noopener,noreferrer');
                      window.open(whatsAppModalData.coordinatorUrl, '_blank', 'noopener,noreferrer');
                    } catch (e) {
                      console.error('Popup blocked:', e);
                    }
                    handleSendWhatsAppApi(whatsAppModalData.entry, 'both');
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] border border-amber-200"
                >
                  <Send className="w-4 h-4 text-stone-950 stroke-[2.5]" />
                  <span>
                    {language === 'te'
                      ? 'ఒకే క్లిక్‌తో ఇద్దరికీ వాట్సాప్ పంపండి (Launch Both WhatsApp)'
                      : 'Single Click: Send to Both WhatsApps (User & Admin)'}
                  </span>
                </button>
                <p className="text-[11px] text-emerald-200/90 text-center">
                  {language === 'te'
                    ? 'గమనిక: బ్రౌజర్ ఒకే ట్యాబ్ మాత్రమే తెరిస్తే, క్రింది 1 & 2 బటన్లను క్లిక్ చేసి నేరుగా వాట్సాప్‌లో పంపవచ్చు.'
                    : 'Tip: If browser popup blocker opens only 1 tab, click the buttons below to open each directly.'}
                </p>
              </div>

              {/* Both Recipients Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Client Destination */}
                <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-stone-500 uppercase">1. Client Mobile Number:</span>
                    <p className="font-mono font-bold text-stone-900 text-sm mt-0.5">
                      +91 {whatsAppModalData.entry.phone}
                    </p>
                    <div className="mt-1">
                      {renderDeliveryBadge(whatsAppModalData.entry, 'client')}
                    </div>
                  </div>
                  <a
                    href={whatsAppModalData.clientUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 py-2 px-3 rounded-lg font-bold text-xs bg-stone-900 hover:bg-stone-800 text-white text-center flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>WhatsApp Client</span>
                    <ExternalLink className="w-3 h-3 text-stone-400" />
                  </a>
                </div>

                {/* 2. Coordinator Destination */}
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 uppercase">2. Coordinator Number:</span>
                    <p className="font-mono font-bold text-emerald-950 text-sm mt-0.5">
                      +91 6305729387
                    </p>
                    <div className="mt-1">
                      {renderDeliveryBadge(whatsAppModalData.entry, 'coordinator')}
                    </div>
                  </div>
                  <a
                    href={whatsAppModalData.coordinatorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 py-2 px-3 rounded-lg font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white text-center flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>WhatsApp 6305729387</span>
                    <ExternalLink className="w-3 h-3 text-emerald-200" />
                  </a>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Exact WhatsApp Message Dispatched to Both:
                </label>
                <div className="relative">
                  <pre className="p-3.5 rounded-xl bg-stone-100 border border-stone-300 font-sans text-xs text-stone-900 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                    {whatsAppModalData.message}
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(whatsAppModalData.message);
                      setCopiedMessage(true);
                      setTimeout(() => setCopiedMessage(false), 2000);
                    }}
                    className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded bg-white border border-stone-300 hover:bg-stone-50 text-[11px] font-semibold text-stone-700 flex items-center gap-1 shadow-xs"
                  >
                    {copiedMessage ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs">
                <span className="text-emerald-800 font-semibold flex items-center gap-1">
                  <CheckCheck className="w-4 h-4 text-emerald-600" />
                  <span>Dual dispatch initiated simultaneously</span>
                </span>

                <button
                  onClick={() => setWhatsAppModalData(null)}
                  className="w-full sm:w-auto py-2.5 px-5 rounded-xl font-bold bg-stone-900 hover:bg-stone-800 text-white transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Delivery Receipt Inspection Modal with Client & Coordinator Tabs */}
      {receiptModalEntry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border-2 border-stone-300 shadow-2xl overflow-hidden animate-scaleUp">
            <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                <h3 className="font-bold text-base">
                  WhatsApp Delivery Receipt & Status Audit
                </h3>
              </div>
              <button
                onClick={() => setReceiptModalEntry(null)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient Tabs: Client vs Coordinator */}
            <div className="flex border-b border-stone-200 bg-stone-100/80 px-4 pt-2 gap-2 text-xs">
              <button
                onClick={() => setReceiptModalTab('client')}
                className={`py-2 px-3.5 font-bold rounded-t-lg transition-colors flex items-center gap-1.5 ${
                  receiptModalTab === 'client'
                    ? 'bg-white text-stone-900 border-t-2 border-amber-500 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>📱 Client ({receiptModalEntry.phone})</span>
                {renderDeliveryBadge(receiptModalEntry, 'client')}
              </button>

              <button
                onClick={() => setReceiptModalTab('coordinator')}
                className={`py-2 px-3.5 font-bold rounded-t-lg transition-colors flex items-center gap-1.5 ${
                  receiptModalTab === 'coordinator'
                    ? 'bg-white text-emerald-950 border-t-2 border-emerald-600 shadow-xs'
                    : 'text-stone-600 hover:text-emerald-900'
                }`}
              >
                <span>🏛️ Coordinator (6305729387)</span>
                {renderDeliveryBadge(receiptModalEntry, 'coordinator')}
              </button>
            </div>

            {(() => {
              const isCoord = receiptModalTab === 'coordinator';
              const currentInfo = isCoord ? receiptModalEntry.coordinatorWhatsAppInfo : receiptModalEntry.whatsAppInfo;
              const currentStatus = isCoord ? (receiptModalEntry.coordinatorWhatsAppStatus || 'not_sent') : (receiptModalEntry.whatsAppStatus || 'not_sent');
              const currentRecipientPhone = isCoord ? TARGET_WHATSAPP_NUMBER : receiptModalEntry.phone;

              return (
                <div className="p-6 space-y-5 text-xs">
                  {/* Devotee & Token Info */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                    <div>
                      <span className="text-stone-500">Recipient Target:</span>
                      <h4 className="font-bold text-stone-900 text-sm">
                        {isCoord ? `Event Coordinator (${TARGET_WHATSAPP_NUMBER})` : receiptModalEntry.name}
                      </h4>
                      <p className="font-mono text-stone-600">+91 {currentRecipientPhone}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-stone-500">Token Number:</span>
                      <p className="text-xl font-black text-red-700">#{receiptModalEntry.tokenNo}</p>
                      <div>{renderDeliveryBadge(receiptModalEntry, receiptModalTab)}</div>
                    </div>
                  </div>

                  {/* Status Details Overview */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-2.5 rounded-lg bg-stone-100 border border-stone-200">
                      <span className="text-[10px] uppercase font-bold text-stone-500">Message ID</span>
                      <p className="font-mono text-[11px] truncate text-stone-800 mt-0.5" title={currentInfo?.messageId || 'N/A'}>
                        {currentInfo?.messageId ? currentInfo.messageId.slice(0, 14) + '...' : 'Not Dispatched'}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                      <span className="text-[10px] uppercase font-bold text-blue-800">Sent At (✓)</span>
                      <p className="font-mono text-[11px] text-blue-950 mt-0.5">
                        {currentInfo?.sentAt || '-'}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                      <span className="text-[10px] uppercase font-bold text-emerald-800">Delivered (✓✓)</span>
                      <p className="font-mono text-[11px] text-emerald-950 mt-0.5">
                        {currentInfo?.deliveredAt || '-'}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-200">
                      <span className="text-[10px] uppercase font-bold text-sky-800">Read At (👁)</span>
                      <p className="font-mono text-[11px] text-sky-950 mt-0.5">
                        {currentInfo?.readAt || '-'}
                      </p>
                    </div>
                  </div>

                  {/* Failure Alert Banner (if failed) */}
                  {currentStatus === 'failed' && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-900 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-sm text-red-800">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span>Delivery Failure Detected for {isCoord ? 'Coordinator' : 'Client'}</span>
                      </div>
                      <p className="text-xs leading-relaxed">
                        <strong>Reason:</strong> {currentInfo?.failureReason || 'Handset unreachable or number not registered on WhatsApp.'}
                      </p>
                      <button
                        onClick={() => handleRetryDelivery(receiptModalEntry, receiptModalTab)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retry Delivery to {isCoord ? 'Coordinator' : 'Client'}</span>
                      </button>
                    </div>
                  )}

                  {/* Audit Logs */}
                  <div>
                    <span className="font-bold text-stone-700 block mb-1.5">Delivery Audit Trail:</span>
                    <div className="max-h-36 overflow-y-auto rounded-xl border border-stone-200 bg-stone-50 p-2.5 space-y-2 font-mono text-[11px]">
                      {currentInfo?.logs && currentInfo.logs.length > 0 ? (
                        currentInfo.logs.map((log, i) => (
                          <div key={i} className="flex items-start gap-2 border-b border-stone-200/60 pb-1.5 last:border-0 last:pb-0">
                            <span className="text-stone-400 shrink-0">{log.timestamp}</span>
                            <span className="font-bold uppercase text-stone-700 shrink-0">[{log.status}]</span>
                            <span className="text-stone-800">{log.note}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-stone-400 italic">No delivery events logged yet for this recipient.</div>
                      )}
                    </div>
                  </div>

                  {/* Simulation Controls for testing live receipts */}
                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2">
                    <span className="font-bold text-amber-900 block text-xs flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-amber-700" />
                      <span>Test Real-Time Receipts for {isCoord ? 'Coordinator' : 'Client'} (Simulator Mode):</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => handleSimulateStatus(receiptModalEntry, receiptModalTab, 'sent')}
                        className="px-2.5 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-900 font-semibold text-[11px]"
                      >
                        Simulate Sent (✓)
                      </button>
                      <button
                        onClick={() => handleSimulateStatus(receiptModalEntry, receiptModalTab, 'delivered')}
                        className="px-2.5 py-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-semibold text-[11px]"
                      >
                        Simulate Delivered (✓✓)
                      </button>
                      <button
                        onClick={() => handleSimulateStatus(receiptModalEntry, receiptModalTab, 'read')}
                        className="px-2.5 py-1 rounded bg-sky-100 hover:bg-sky-200 text-sky-900 font-semibold text-[11px]"
                      >
                        Simulate Read (👁)
                      </button>
                      <button
                        onClick={() => handleSimulateStatus(receiptModalEntry, receiptModalTab, 'failed', `${isCoord ? 'Coordinator' : 'Client'} handset unreachable`)}
                        className="px-2.5 py-1 rounded bg-red-100 hover:bg-red-200 text-red-900 font-semibold text-[11px]"
                      >
                        Simulate Failure ❌
                      </button>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                    <button
                      onClick={() => handleSendWhatsAppApi(receiptModalEntry, 'both')}
                      className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send to Both (API)</span>
                    </button>
                    <button
                      onClick={() => setReceiptModalEntry(null)}
                      className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold"
                    >
                      Close
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* WhatsApp Configuration & Webhook Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border-2 border-stone-300 shadow-2xl overflow-hidden animate-scaleUp">
            <div className="bg-emerald-800 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-base">WhatsApp API & Real-time Webhook Setup</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-3">
                <p className="text-stone-600 leading-relaxed">
                  This portal includes an end-to-end delivery tracking engine for WhatsApp. It works in dual mode:
                </p>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                  <h5 className="font-bold text-stone-900">1. Meta WhatsApp Business Cloud API (Production)</h5>
                  <p className="text-stone-600">
                    When configured with your Meta Cloud API keys, delivery receipts flow in automatically from Meta via the webhook below.
                  </p>
                  <div className="space-y-1">
                    <span className="text-stone-500 block">Webhook Callback URL:</span>
                    <code className="block p-2 bg-stone-100 rounded text-stone-800 font-mono text-[11px] select-all">
                      {window.location.origin}/api/webhook/whatsapp
                    </code>
                    <span className="text-stone-500 block mt-1">Webhook Verify Token:</span>
                    <code className="block p-2 bg-stone-100 rounded text-stone-800 font-mono text-[11px] select-all">
                      edullagudem_devi_token
                    </code>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                  <h5 className="font-bold text-amber-900">2. Intelligent Live Delivery Simulator (Zero-Config)</h5>
                  <p className="text-amber-800/90 leading-relaxed">
                    Even before you set up a Meta WhatsApp Cloud API account, the portal provides a real-time lifecycle stream:
                    transitions from <strong>Queued</strong> ➔ <strong>Sent (✓)</strong> ➔ <strong>Delivered (✓✓)</strong> ➔ <strong>Read (👁)</strong>, and handles failure testing with live alerts.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                  <span className="text-stone-500 block font-semibold">Environment Variables:</span>
                  <p className="font-mono text-[11px] text-stone-700">
                    ADMIN_PASSWORD="edu@123"<br />
                    WHATSAPP_ADMIN_NUMBER="6305729387"<br />
                    WHATSAPP_API_TOKEN="EAA..."<br />
                    WHATSAPP_PHONE_NUMBER_ID="10..."<br />
                    WHATSAPP_VERIFY_TOKEN="edullagudem_devi_token"
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="px-5 py-2.5 rounded-xl font-bold bg-stone-900 hover:bg-stone-800 text-white transition-colors"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Security Password Modal */}
      <AdminSecurityModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        language={language}
        onPasswordChanged={(newToken) => {
          if (newToken) {
            setToken(newToken);
          }
          setSecurityToast(
            language === 'te'
              ? 'సెక్యూరిటీ పాస్‌వర్డ్ విజయవంతంగా మార్చబడింది!'
              : 'Security password changed successfully!'
          );
          setTimeout(() => setSecurityToast(null), 5000);
        }}
        isLoggedIn={Boolean(token)}
      />

      {/* Reset All Tokens Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-red-500 overflow-hidden">
            <div className="bg-gradient-to-r from-red-800 to-amber-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">
                  {language === 'te'
                    ? 'టోకెన్లను తొలగించి #1 తో ప్రారంభించాలా?'
                    : 'Remove All Tokens and Start from Token 1?'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="text-amber-200 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-2">
                <p className="font-bold text-sm">
                  {language === 'te'
                    ? '⚠️ టోకెన్ల కౌంట్ పునఃప్రారంభం'
                    : '⚠️ Reset Token Count to Token 1'}
                </p>
                <p className="leading-relaxed">
                  {language === 'te'
                    ? 'ఈ బటన్ నొక్కితే ఇప్పటివరకు ఉన్న అన్ని టోకెన్లు క్లియర్ చేయబడతాయి. తదుపరి నమోదయ్యే మరియు ఆమోదించబడే భక్తునికి ఖచ్చితంగా టోకెన్ నంబర్ 1 (Token #1) కేటాయించబడుతుంది.'
                    : 'This action will clear all existing token counts. The next approved devotee will receive Token #1, continuing sequentially (1, 2, 3...).'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(false)}
                  disabled={isResettingTokens}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                >
                  {language === 'te' ? 'రద్దు చేయి' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleResetAllTokens}
                  disabled={isResettingTokens}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isResettingTokens ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isResettingTokens
                      ? (language === 'te' ? 'రీసెట్ చేస్తోంది...' : 'Resetting...')
                      : (language === 'te' ? 'అవును, అన్ని టోకెన్లు తొలగించి #1 తో ప్రారంభించు' : 'Yes, Reset to Token 1')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
