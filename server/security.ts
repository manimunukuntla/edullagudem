import fs from 'fs';
import path from 'path';
import { TARGET_WHATSAPP_NUMBER } from '../src/lib/whatsapp';
import { whatsAppDeliveryManager } from './whatsappDelivery';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const SECURITY_FILE = path.resolve(DATA_DIR, 'security.json');

interface SecurityData {
  adminPassword: string;
  updatedAt: string;
  lastMethod: 'initial' | 'old_password' | 'otp';
}

interface ActiveOtpData {
  otp: string;
  targetPhone: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
}

class SecurityManager {
  private currentPassword: string;
  private activeOtp: ActiveOtpData | null = null;

  constructor() {
    this.currentPassword = this.loadPassword();
  }

  private loadPassword(): string {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(SECURITY_FILE)) {
        const raw = fs.readFileSync(SECURITY_FILE, 'utf8');
        const data: SecurityData = JSON.parse(raw);
        if (data.adminPassword && data.adminPassword.trim().length > 0) {
          return data.adminPassword.trim();
        }
      }
    } catch (err) {
      console.error('Error reading security.json, falling back to env/default:', err);
    }

    const defaultPass = process.env.ADMIN_PASSWORD || 'edu@123';
    this.savePassword(defaultPass, 'initial');
    return defaultPass;
  }

  private savePassword(newPass: string, method: 'initial' | 'old_password' | 'otp') {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      const data: SecurityData = {
        adminPassword: newPass.trim(),
        updatedAt: new Date().toISOString(),
        lastMethod: method
      };

      fs.writeFileSync(SECURITY_FILE, JSON.stringify(data, null, 2), 'utf8');
      this.currentPassword = newPass.trim();
    } catch (err) {
      console.error('Error saving security.json:', err);
      this.currentPassword = newPass.trim();
    }
  }

  public getAdminPassword(): string {
    return this.currentPassword;
  }

  public getAdminToken(): string {
    return `admin-token-${Buffer.from(this.currentPassword).toString('base64')}`;
  }

  public verifyAdminPassword(password: string): boolean {
    return Boolean(password && password.trim() === this.currentPassword);
  }

  public verifyAdminToken(token: string | undefined): boolean {
    if (!token) return false;
    const cleanToken = token.replace('Bearer ', '').trim();
    return cleanToken === this.getAdminToken();
  }

  public getSecurityStatus() {
    let lastUpdated: string | null = null;
    let lastMethod = 'initial';

    try {
      if (fs.existsSync(SECURITY_FILE)) {
        const data: SecurityData = JSON.parse(fs.readFileSync(SECURITY_FILE, 'utf8'));
        lastUpdated = data.updatedAt;
        lastMethod = data.lastMethod;
      }
    } catch {}

    return {
      coordinatorNumber: TARGET_WHATSAPP_NUMBER,
      hasCustomPassword: this.currentPassword !== 'edu@123',
      lastUpdated,
      lastMethod
    };
  }

  /**
   * Option 1: Change password by providing current / old password
   */
  public changeWithOldPassword(oldPassword: string, newPassword: string): {
    success: boolean;
    error?: string;
    message?: string;
    token?: string;
  } {
    if (!oldPassword || oldPassword.trim() !== this.currentPassword) {
      return { success: false, error: 'Current password does not match. Please enter the correct old password.' };
    }

    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, error: 'New password must be at least 4 characters long.' };
    }

    if (newPassword.trim() === oldPassword.trim()) {
      return { success: false, error: 'New password cannot be identical to the old password.' };
    }

    this.savePassword(newPassword, 'old_password');
    return {
      success: true,
      message: 'Admin security password changed successfully!',
      token: this.getAdminToken()
    };
  }

  /**
   * Option 2 (Forgot Password): Send 6-digit OTP to coordinator number 6305729387
   */
  public async sendResetOtp(): Promise<{
    success: boolean;
    targetPhone: string;
    expiresInSeconds: number;
    previewOtp?: string;
    message: string;
  }> {
    // Generate secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresInSeconds = 600; // 10 minutes

    this.activeOtp = {
      otp,
      targetPhone: TARGET_WHATSAPP_NUMBER,
      createdAt: Date.now(),
      expiresAt: Date.now() + expiresInSeconds * 1000,
      attempts: 0
    };

    // Dispatch OTP message to coordinator number (6305729387)
    await whatsAppDeliveryManager.sendOtpMessage(TARGET_WHATSAPP_NUMBER, otp);

    return {
      success: true,
      targetPhone: TARGET_WHATSAPP_NUMBER,
      expiresInSeconds,
      previewOtp: otp, // For convenient verification in dev/demo mode
      message: `Security OTP successfully sent to coordinator number +91 ${TARGET_WHATSAPP_NUMBER}`
    };
  }

  /**
   * Option 2 (Forgot Password): Verify OTP and reset password
   */
  public verifyOtpAndReset(submittedOtp: string, newPassword: string): {
    success: boolean;
    error?: string;
    message?: string;
    token?: string;
  } {
    if (!this.activeOtp) {
      return { success: false, error: 'No active OTP session found. Please click "Send OTP" first.' };
    }

    if (Date.now() > this.activeOtp.expiresAt) {
      this.activeOtp = null;
      return { success: false, error: 'OTP has expired (valid for 10 minutes). Please request a new OTP.' };
    }

    this.activeOtp.attempts += 1;
    if (this.activeOtp.attempts > 5) {
      this.activeOtp = null;
      return { success: false, error: 'Too many incorrect attempts. Please request a new OTP.' };
    }

    const cleanInputOtp = (submittedOtp || '').replace(/\D/g, '').trim();
    if (cleanInputOtp !== this.activeOtp.otp) {
      return {
        success: false,
        error: `The entered OTP does not match the code sent to ${TARGET_WHATSAPP_NUMBER}. Remaining attempts: ${5 - this.activeOtp.attempts}`
      };
    }

    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, error: 'New password must be at least 4 characters long.' };
    }

    // OTP matched! Reset password and invalidate OTP
    this.savePassword(newPassword, 'otp');
    this.activeOtp = null;

    return {
      success: true,
      message: 'OTP verified! Admin security password has been reset successfully.',
      token: this.getAdminToken()
    };
  }
}

export const securityManager = new SecurityManager();
