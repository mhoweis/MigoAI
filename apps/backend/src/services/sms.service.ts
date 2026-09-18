import { ReplitConnectors } from '@replit/connectors-sdk';
import type { ProxyOptions } from '@replit/connectors-sdk';
import config from '../config/env';

class SmsService {
  private connectors = new ReplitConnectors();

  private async twilioRequest<T>(path: string, options?: ProxyOptions): Promise<T> {
    const response = await this.connectors.proxy('twilio', path, options);
    const body = await response.text();

    if (!response.ok) {
      let message = 'Twilio request failed';
      try {
        const parsed = JSON.parse(body);
        message = parsed.message || message;
      } catch {
        // Keep the safe generic message when Twilio did not return JSON.
      }
      throw new Error(message);
    }

    return JSON.parse(body) as T;
  }

  async sendVerificationCode(to: string, code: string): Promise<void> {
    if (!config.TWILIO_ACCOUNT_SID || !config.TWILIO_PHONE_NUMBER) {
      throw new Error('Twilio SMS sender configuration is incomplete');
    }

    const form = new URLSearchParams({
      To: to,
      From: config.TWILIO_PHONE_NUMBER,
      Body: `Your Migo verification code is ${code}. It expires in 10 minutes.`,
    });

    await this.twilioRequest(
      `/2010-04-01/Accounts/${config.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      }
    );
  }
}

export const smsService = new SmsService();