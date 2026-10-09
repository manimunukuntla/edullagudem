import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import { Entry, WhatsAppDeliveryInfo, WhatsAppDeliveryStatus } from '../src/types';
import { readLocalEntries, writeLocalEntries, updateLocalEntry } from './db';
import { formatWhatsAppMessage, TARGET_WHATSAPP_NUMBER } from '../src/lib/whatsapp';

interface SseClient {
  id: string;
  res: Response;
}

class WhatsAppDeliveryManager {
  private sseClients: SseClient[] = [];
  private token: string | undefined;
  private phoneNumberId: string | undefined;
  private isLiveApiConfigured = false;
  private configPath = path.resolve(process.cwd(), 'data', 'whatsapp_config.json');

  constructor() {
    this.token = process.env.WHATSAPP_API_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    try {
      if (fs.existsSync(this.configPath)) {
        const saved = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        if (saved.token) this.token = saved.token;
        if (saved.phoneNumberId) this.phoneNumberId = saved.phoneNumberId;
      }
    } catch {
      // ignore
    }

    this.isLiveApiConfigured = Boolean(this.token && this.phoneNumberId);

    if (this.isLiveApiConfigured) {
      console.log('WhatsApp Business Cloud API configured with Phone Number ID:', this.phoneNumberId);
    } else {
      console.log('WhatsApp Business Cloud API running in Dual-Recipient Intelligent Delivery Simulator mode with real-time receipts.');
    }
  }

  public setApiConfig(token: string, phoneNumberId: string) {
    this.token = token.trim();
    this.phoneNumberId = phoneNumberId.trim();
    this.isLiveApiConfigured = Boolean(this.token && this.phoneNumberId);

    try {
      fs.writeFileSync(
        this.configPath,
        JSON.stringify(
          {
            token: this.token,
            phoneNumberId: this.phoneNumberId,
            updatedAt: new Date().toISOString(),
          },
          null,
          2
        ),
        'utf8'
      );
    } catch (e) {
      console.error('Error saving whatsapp config:', e);
    }
  }

  public getStatus() {
    return {
      configured: this.isLiveApiConfigured,
      phoneNumberId: this.phoneNumberId ? `${this.phoneNumberId.slice(0, 4)}...${this.phoneNumberId.slice(-4)}` : null,
      hasToken: Boolean(this.token),
      targetAdminNumber: TARGET_WHATSAPP_NUMBER,
      activeSseConnections: this.sseClients.length,
      webhookVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'edullagudem_devi_token'
    };
  }

  public addSseClient(clientId: string, res: Response) {
    this.sseClients.push({ id: clientId, res });
    res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Connected to WhatsApp Delivery Stream', clientId })}\n\n`);

    res.on('close', () => {
      this.removeSseClient(clientId);
    });
  }

  public removeSseClient(clientId: string) {
    this.sseClients = this.sseClients.filter(c => c.id !== clientId);
  }

  public broadcastUpdate(
    entryId: string,
    targetType: 'client' | 'coordinator',
    status: WhatsAppDeliveryStatus,
    info: WhatsAppDeliveryInfo,
    fullEntry?: Entry
  ) {
    const payload = JSON.stringify({
      entryId,
      targetType,
      status,
      info,
      whatsAppStatus: fullEntry?.whatsAppStatus,
      whatsAppInfo: fullEntry?.whatsAppInfo,
      coordinatorWhatsAppStatus: fullEntry?.coordinatorWhatsAppStatus,
      coordinatorWhatsAppInfo: fullEntry?.coordinatorWhatsAppInfo,
      timestamp: new Date().toISOString()
    });

    for (const client of this.sseClients) {
      try {
        client.res.write(`event: delivery-update\ndata: ${payload}\n\n`);
      } catch (err) {
        console.error('Error writing to SSE client:', err);
      }
    }
  }

  private getNowStr(): string {
    return new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'medium'
    });
  }

  /**
   * Send WhatsApp message to either client or coordinator
   */
  public async sendTokenMessage(
    entry: Entry,
    options: {
      targetRole?: 'client' | 'coordinator';
      recipientPhone?: string;
      simulateFailure?: boolean;
      failureReason?: string;
    } = {}
  ): Promise<WhatsAppDeliveryInfo> {
    const targetRole = options.targetRole || (options.recipientPhone === TARGET_WHATSAPP_NUMBER ? 'coordinator' : 'client');
    const recipient = options.recipientPhone || (targetRole === 'coordinator' ? TARGET_WHATSAPP_NUMBER : entry.phone);
    const cleanPhone = recipient.replace(/\D/g, '');
    const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const messageText = formatWhatsAppMessage(entry);

    const messageId = `wamid.EDULLA_${targetRole.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowStr = this.getNowStr();

    const previousInfo = targetRole === 'coordinator' ? entry.coordinatorWhatsAppInfo : entry.whatsAppInfo;

    const deliveryInfo: WhatsAppDeliveryInfo = {
      status: 'queued',
      messageId,
      recipientPhone: recipient,
      recipientName: targetRole === 'coordinator' ? `Coordinator (${TARGET_WHATSAPP_NUMBER})` : entry.name,
      sentAt: null,
      deliveredAt: null,
      readAt: null,
      failedAt: null,
      failureReason: null,
      attempts: (previousInfo?.attempts || 0) + 1,
      logs: [
        ...(previousInfo?.logs || []),
        {
          timestamp: nowStr,
          status: 'queued',
          note: `Queued token #${entry.tokenNo} for +${fullPhone} (${targetRole})`
        }
      ]
    };

    if (targetRole === 'coordinator') {
      entry.coordinatorWhatsAppStatus = 'queued';
      entry.coordinatorWhatsAppInfo = deliveryInfo;
    } else {
      entry.whatsAppStatus = 'queued';
      entry.whatsAppInfo = deliveryInfo;
    }

    updateLocalEntry(entry);
    this.broadcastUpdate(entry.id, targetRole, 'queued', deliveryInfo, entry);

    // If Meta WhatsApp Cloud API credentials are provided:
    if (this.isLiveApiConfigured && this.token && this.phoneNumberId && !options.simulateFailure) {
      try {
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: fullPhone,
              type: 'text',
              text: { body: messageText }
            })
          }
        );

        const data: any = await response.json();

        if (response.ok && data.messages?.[0]?.id) {
          const metaMsgId = data.messages[0].id;
          deliveryInfo.messageId = metaMsgId;
          deliveryInfo.status = 'sent';
          deliveryInfo.sentAt = this.getNowStr();
          deliveryInfo.logs?.push({
            timestamp: deliveryInfo.sentAt,
            status: 'sent',
            note: `Accepted by Meta Cloud Gateway (ID: ${metaMsgId})`
          });

          if (targetRole === 'coordinator') {
            entry.coordinatorWhatsAppStatus = 'sent';
            entry.coordinatorWhatsAppInfo = deliveryInfo;
          } else {
            entry.whatsAppStatus = 'sent';
            entry.whatsAppInfo = deliveryInfo;
          }

          updateLocalEntry(entry);
          this.broadcastUpdate(entry.id, targetRole, 'sent', deliveryInfo, entry);
          return deliveryInfo;
        } else {
          const errDetail = data.error?.message || 'Meta API delivery failed';
          deliveryInfo.status = 'failed';
          deliveryInfo.failedAt = this.getNowStr();
          deliveryInfo.failureReason = errDetail;
          deliveryInfo.logs?.push({
            timestamp: deliveryInfo.failedAt,
            status: 'failed',
            note: `Meta API Error: ${errDetail} (Code: ${data.error?.code || 'N/A'})`
          });

          if (targetRole === 'coordinator') {
            entry.coordinatorWhatsAppStatus = 'failed';
            entry.coordinatorWhatsAppInfo = deliveryInfo;
          } else {
            entry.whatsAppStatus = 'failed';
            entry.whatsAppInfo = deliveryInfo;
          }

          updateLocalEntry(entry);
          this.broadcastUpdate(entry.id, targetRole, 'failed', deliveryInfo, entry);
          return deliveryInfo;
        }
      } catch (err: any) {
        deliveryInfo.status = 'failed';
        deliveryInfo.failedAt = this.getNowStr();
        deliveryInfo.failureReason = err.message || 'Network error';
        deliveryInfo.logs?.push({
          timestamp: deliveryInfo.failedAt,
          status: 'failed',
          note: `Network exception: ${err.message}`
        });

        if (targetRole === 'coordinator') {
          entry.coordinatorWhatsAppStatus = 'failed';
          entry.coordinatorWhatsAppInfo = deliveryInfo;
        } else {
          entry.whatsAppStatus = 'failed';
          entry.whatsAppInfo = deliveryInfo;
        }

        updateLocalEntry(entry);
        this.broadcastUpdate(entry.id, targetRole, 'failed', deliveryInfo, entry);
        return deliveryInfo;
      }
    }

    // SIMULATED REAL-TIME DELIVERY LIFECYCLE (Zero-Config Development & Testing)
    if (options.simulateFailure) {
      setTimeout(() => {
        const failTime = this.getNowStr();
        const reason = options.failureReason || `Handset unreachable or invalid WhatsApp registration for +${fullPhone}`;
        deliveryInfo.status = 'failed';
        deliveryInfo.failedAt = failTime;
        deliveryInfo.failureReason = reason;
        deliveryInfo.logs?.push({
          timestamp: failTime,
          status: 'failed',
          note: `Delivery Failure: ${reason}`
        });

        if (targetRole === 'coordinator') {
          entry.coordinatorWhatsAppStatus = 'failed';
          entry.coordinatorWhatsAppInfo = deliveryInfo;
        } else {
          entry.whatsAppStatus = 'failed';
          entry.whatsAppInfo = deliveryInfo;
        }

        updateLocalEntry(entry);
        this.broadcastUpdate(entry.id, targetRole, 'failed', deliveryInfo, entry);
      }, 1000);
      return deliveryInfo;
    }

    // Step 1: Sent (✓) after 700ms
    setTimeout(() => {
      const sentTime = this.getNowStr();
      deliveryInfo.status = 'sent';
      deliveryInfo.sentAt = sentTime;
      deliveryInfo.logs?.push({
        timestamp: sentTime,
        status: 'sent',
        note: `Dispatched to WhatsApp network for +${fullPhone} (Single Tick ✓)`
      });

      if (targetRole === 'coordinator') {
        entry.coordinatorWhatsAppStatus = 'sent';
        entry.coordinatorWhatsAppInfo = deliveryInfo;
      } else {
        entry.whatsAppStatus = 'sent';
        entry.whatsAppInfo = deliveryInfo;
      }

      updateLocalEntry(entry);
      this.broadcastUpdate(entry.id, targetRole, 'sent', deliveryInfo, entry);

      // Step 2: Delivered (✓✓) after 1800ms
      setTimeout(() => {
        const deliveredTime = this.getNowStr();
        deliveryInfo.status = 'delivered';
        deliveryInfo.deliveredAt = deliveredTime;
        deliveryInfo.logs?.push({
          timestamp: deliveredTime,
          status: 'delivered',
          note: `Successfully delivered to ${targetRole} handset (Double Tick ✓✓)`
        });

        if (targetRole === 'coordinator') {
          entry.coordinatorWhatsAppStatus = 'delivered';
          entry.coordinatorWhatsAppInfo = deliveryInfo;
        } else {
          entry.whatsAppStatus = 'delivered';
          entry.whatsAppInfo = deliveryInfo;
        }

        updateLocalEntry(entry);
        this.broadcastUpdate(entry.id, targetRole, 'delivered', deliveryInfo, entry);

        // Step 3: Read (👁) after 2200ms
        setTimeout(() => {
          const readTime = this.getNowStr();
          deliveryInfo.status = 'read';
          deliveryInfo.readAt = readTime;
          deliveryInfo.logs?.push({
            timestamp: readTime,
            status: 'read',
            note: `Opened and read by ${targetRole} (Blue Double Tick 👁)`
          });

          if (targetRole === 'coordinator') {
            entry.coordinatorWhatsAppStatus = 'read';
            entry.coordinatorWhatsAppInfo = deliveryInfo;
          } else {
            entry.whatsAppStatus = 'read';
            entry.whatsAppInfo = deliveryInfo;
          }

          updateLocalEntry(entry);
          this.broadcastUpdate(entry.id, targetRole, 'read', deliveryInfo, entry);
        }, 2200);
      }, 1800);
    }, 700);

    return deliveryInfo;
  }

  /**
   * Dual Send: Dispatches to BOTH the client's registration number AND 6305729387 at a time!
   */
  public async sendDualTokenMessage(
    entry: Entry,
    options: { simulateFailureClient?: boolean; simulateFailureCoordinator?: boolean } = {}
  ): Promise<{ client: WhatsAppDeliveryInfo; coordinator: WhatsAppDeliveryInfo }> {
    const [client, coordinator] = await Promise.all([
      // 1. Send to Client Registration Number
      this.sendTokenMessage(entry, {
        targetRole: 'client',
        recipientPhone: entry.phone,
        simulateFailure: options.simulateFailureClient,
      }),
      // 2. Send to Coordinator Number (6305729387) AT THE SAME TIME
      this.sendTokenMessage(entry, {
        targetRole: 'coordinator',
        recipientPhone: TARGET_WHATSAPP_NUMBER,
        simulateFailure: options.simulateFailureCoordinator,
      }),
    ]);

    return { client, coordinator };
  }

  /**
   * Process Meta Webhook Incoming Delivery Receipts
   */
  public handleIncomingWebhook(payload: any): { processed: number; updates: any[] } {
    const updates: any[] = [];
    const entries = readLocalEntries();

    if (!payload?.entry || !Array.isArray(payload.entry)) {
      return { processed: 0, updates };
    }

    for (const item of payload.entry) {
      const changes = item.changes || [];
      for (const change of changes) {
        const value = change.value;
        const statuses = value?.statuses || [];

        for (const st of statuses) {
          const messageId = st.id;
          const status = st.status; // 'sent' | 'delivered' | 'read' | 'failed'
          const recipientId = st.recipient_id;
          const cleanRecipient = recipientId ? recipientId.replace(/^91/, '') : '';
          const isCoordinator = cleanRecipient === TARGET_WHATSAPP_NUMBER;
          const targetRole = isCoordinator ? 'coordinator' : 'client';

          // Find matching entry
          const target = entries.find(e =>
            (e.whatsAppInfo?.messageId === messageId) ||
            (e.coordinatorWhatsAppInfo?.messageId === messageId) ||
            (!isCoordinator && e.phone === cleanRecipient) ||
            (isCoordinator && e.coordinatorWhatsAppInfo?.recipientPhone === TARGET_WHATSAPP_NUMBER)
          );

          if (target) {
            const nowStr = this.getNowStr();
            const currentInfo = (targetRole === 'coordinator' ? target.coordinatorWhatsAppInfo : target.whatsAppInfo) || {
              status: 'queued',
              recipientPhone: targetRole === 'coordinator' ? TARGET_WHATSAPP_NUMBER : target.phone,
              logs: []
            };

            let validStatus: WhatsAppDeliveryStatus = 'sent';
            if (status === 'delivered') validStatus = 'delivered';
            else if (status === 'read') validStatus = 'read';
            else if (status === 'failed') validStatus = 'failed';
            else if (status === 'sent') validStatus = 'sent';

            currentInfo.status = validStatus;
            if (validStatus === 'sent' && !currentInfo.sentAt) currentInfo.sentAt = nowStr;
            if (validStatus === 'delivered' && !currentInfo.deliveredAt) currentInfo.deliveredAt = nowStr;
            if (validStatus === 'read') {
              if (!currentInfo.deliveredAt) currentInfo.deliveredAt = nowStr;
              currentInfo.readAt = nowStr;
            }
            if (validStatus === 'failed') {
              currentInfo.failedAt = nowStr;
              const errorTitle = st.errors?.[0]?.title || st.errors?.[0]?.message || 'Undeliverable';
              currentInfo.failureReason = `${errorTitle} (Code: ${st.errors?.[0]?.code || 'N/A'})`;
            }

            currentInfo.logs = currentInfo.logs || [];
            currentInfo.logs.push({
              timestamp: nowStr,
              status: validStatus,
              note: `Webhook Receipt (${targetRole}): ${status.toUpperCase()}`
            });

            if (targetRole === 'coordinator') {
              target.coordinatorWhatsAppStatus = validStatus;
              target.coordinatorWhatsAppInfo = currentInfo;
            } else {
              target.whatsAppStatus = validStatus;
              target.whatsAppInfo = currentInfo;
            }

            updateLocalEntry(target);
            this.broadcastUpdate(target.id, targetRole, validStatus, currentInfo, target);

            updates.push({ entryId: target.id, targetRole, status: validStatus, messageId });
          }
        }
      }
    }

    return { processed: updates.length, updates };
  }

  public updateStatusManually(
    entryId: string,
    targetRole: 'client' | 'coordinator',
    status: WhatsAppDeliveryStatus,
    failureReason?: string
  ): Entry | null {
    const entries = readLocalEntries();
    const target = entries.find(e => e.id === entryId);
    if (!target) return null;

    const nowStr = this.getNowStr();
    const info = (targetRole === 'coordinator' ? target.coordinatorWhatsAppInfo : target.whatsAppInfo) || {
      status,
      recipientPhone: targetRole === 'coordinator' ? TARGET_WHATSAPP_NUMBER : target.phone,
      logs: []
    };

    info.status = status;
    if (status === 'sent') info.sentAt = nowStr;
    if (status === 'delivered') {
      if (!info.sentAt) info.sentAt = nowStr;
      info.deliveredAt = nowStr;
    }
    if (status === 'read') {
      if (!info.sentAt) info.sentAt = nowStr;
      if (!info.deliveredAt) info.deliveredAt = nowStr;
      info.readAt = nowStr;
    }
    if (status === 'failed') {
      info.failedAt = nowStr;
      info.failureReason = failureReason || 'Handset unreachable / network timeout';
    } else {
      info.failureReason = null;
    }

    info.logs = info.logs || [];
    info.logs.push({
      timestamp: nowStr,
      status,
      note: `Manual simulation: ${status.toUpperCase()} (${targetRole})`
    });

    if (targetRole === 'coordinator') {
      target.coordinatorWhatsAppStatus = status;
      target.coordinatorWhatsAppInfo = info;
    } else {
      target.whatsAppStatus = status;
      target.whatsAppInfo = info;
    }

    updateLocalEntry(target);
    this.broadcastUpdate(target.id, targetRole, status, info, target);
    return target;
  }

  /**
   * Dispatch security verification OTP to coordinator number (6305729387)
   */
  public async sendOtpMessage(phone: string, otp: string): Promise<{ success: boolean; messageId: string }> {
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const messageId = `wamid.OTP_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const text = `🕉️ *శ్రీ ఎదుల్లగూడెం దేవి శరన్నవరాత్రులు 2026*\n🔒 *అడ్మిన్ సెక్యూరిటీ పాస్‌వర్డ్ OTP ధృవీకరణ*\n\nమీ అడ్మిన్ పాస్‌వర్డ్ రీసెట్ కొరకు ధృవీకరణ కోడ్ (OTP):\n👉 *${otp}*\n\nఈ కోడ్ 10 నిమిషాల వరకు మాత్రమే చెల్లుబాటు అవుతుంది. దయచేసి ఎవరితోనూ పంచుకోకండి.\n- శ్రీ దుర్గా భవానీ ఉత్సవ కమిటీ`;

    if (this.isLiveApiConfigured && this.phoneNumberId && this.token) {
      try {
        const url = `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: fullPhone,
            type: 'text',
            text: { preview_url: false, body: text }
          })
        });
        const data = await res.json();
        console.log('OTP WhatsApp API live dispatch result:', data);
      } catch (err) {
        console.error('Failed to dispatch live OTP message via WhatsApp API:', err);
      }
    } else {
      console.log(`[WhatsApp Simulator] Successfully dispatched Admin Security OTP [${otp}] to Coordinator handset +${fullPhone}`);
    }

    return { success: true, messageId };
  }
}

export const whatsAppDeliveryManager = new WhatsAppDeliveryManager();
