import { dataStore } from '../dataStore.js';
import { normalizePhoneNumber } from './phoneNormalizer.js';
import { Lead } from '../../types.js';

export interface WhatsAppCloudConfigStatus {
  isConfigured: boolean;
  phoneNumberId?: string;
  wabaId?: string;
  apiEndpoint: string;
  apiVersion: string;
  webhookConfigured: boolean;
  notice: string;
}

export interface CloudSendResult {
  success: boolean;
  deliveryStatus: 'sent_via_cloud_api' | 'staged_requires_credentials' | 'failed';
  messageId?: string;
  recipientPhone: string;
  recipientName: string;
  error?: string;
  details: string;
}

export class WhatsAppCloudService {
  private phoneNumberId: string;
  private accessToken: string;
  private wabaId: string;
  private apiVersion = 'v19.0';

  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';
  }

  public updateCredentials(creds: { phoneNumberId?: string; accessToken?: string; wabaId?: string }) {
    if (creds.phoneNumberId !== undefined) this.phoneNumberId = creds.phoneNumberId.trim();
    if (creds.accessToken !== undefined) this.accessToken = creds.accessToken.trim();
    if (creds.wabaId !== undefined) this.wabaId = creds.wabaId.trim();
  }

  public getConfigStatus(): WhatsAppCloudConfigStatus {
    const isConfigured = Boolean(
      this.phoneNumberId &&
      this.accessToken &&
      this.accessToken !== 'YOUR_WHATSAPP_ACCESS_TOKEN'
    );

    return {
      isConfigured,
      phoneNumberId: this.phoneNumberId ? `${this.phoneNumberId.slice(0, 4)}...${this.phoneNumberId.slice(-4)}` : undefined,
      wabaId: this.wabaId ? `${this.wabaId.slice(0, 4)}...${this.wabaId.slice(-4)}` : undefined,
      apiEndpoint: `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId || '{PHONE_NUMBER_ID}'}/messages`,
      apiVersion: this.apiVersion,
      webhookConfigured: false,
      notice: isConfigured
        ? 'Official WhatsApp Business Cloud API is connected and authorized.'
        : 'Official WhatsApp Business Platform (Cloud API) is ready for connection. To enable automated programmatic messaging, configure WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN. Freeform 1-click wa.me messaging works immediately for all leads.',
    };
  }

  /**
   * Dispatches automated message via official Meta WhatsApp Business Cloud API.
   * STRICT SAFETY RULE: Requires explicit user approval before execution!
   */
  public async sendAutomatedMessage(params: {
    leadId: string;
    messageText: string;
    approvedBy: string;
    isUserApproved: boolean;
  }): Promise<CloudSendResult> {
    if (!params.isUserApproved) {
      return {
        success: false,
        deliveryStatus: 'failed',
        recipientPhone: '',
        recipientName: '',
        error: 'Safety Gate Enforced: User approval is strictly required before sending any automated message.',
        details: 'Automated dispatch rejected because user approval was not confirmed.',
      };
    }

    const lead = dataStore.getLeadById(params.leadId);
    if (!lead) {
      return {
        success: false,
        deliveryStatus: 'failed',
        recipientPhone: '',
        recipientName: '',
        error: `Lead with ID "${params.leadId}" not found in CRM database.`,
        details: 'Target lead does not exist.',
      };
    }

    const norm = normalizePhoneNumber(lead.phone, lead.country);
    if (!norm.isValid) {
      return {
        success: false,
        deliveryStatus: 'failed',
        recipientPhone: lead.phone || '',
        recipientName: lead.contactPerson || lead.companyName,
        error: norm.validationError || 'Invalid phone number format.',
        details: 'Cannot dispatch: international E.164 phone number could not be determined.',
      };
    }

    const config = this.getConfigStatus();

    // If Cloud API credentials are provided, call Meta Cloud API endpoint
    if (config.isConfigured) {
      try {
        const payload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: norm.e164Digits,
          type: 'text',
          text: {
            preview_url: false,
            body: params.messageText,
          },
        };

        const res = await fetch(
          `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          }
        );

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error?.message || 'Meta Cloud API rejected the message dispatch.');
        }

        const messageId = data.messages?.[0]?.id || `wamid-${Date.now()}`;

        // Record activity in CRM
        this.logSuccessfulOutreach(lead, 'Delivered via WhatsApp Business Cloud API', params.messageText, params.approvedBy);

        return {
          success: true,
          deliveryStatus: 'sent_via_cloud_api',
          messageId,
          recipientPhone: norm.formattedDisplay,
          recipientName: lead.contactPerson || lead.companyName,
          details: `Message successfully dispatched via official WhatsApp Business Cloud API (ID: ${messageId}).`,
        };
      } catch (err: any) {
        return {
          success: false,
          deliveryStatus: 'failed',
          recipientPhone: norm.formattedDisplay,
          recipientName: lead.contactPerson || lead.companyName,
          error: err.message,
          details: `WhatsApp Business API request failed: ${err.message}`,
        };
      }
    }

    // Cloud API not configured on server:
    // Strictly follow rule: Never claim message was delivered without confirmation from authorized integration.
    return {
      success: false,
      deliveryStatus: 'staged_requires_credentials',
      recipientPhone: norm.formattedDisplay,
      recipientName: lead.contactPerson || lead.companyName,
      details: 'WhatsApp Business Cloud API credentials are not set on this server. To send without opening WhatsApp Web, configure WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN. Use the "Send via WhatsApp" button to open wa.me with this prepared message immediately.',
    };
  }

  private logSuccessfulOutreach(lead: Lead, title: string, text: string, actor: string) {
    const now = new Date().toISOString();
    lead.activities = lead.activities || [];
    lead.activities.unshift({
      id: `act-${Date.now()}-wa-cloud`,
      type: 'outreach_sent',
      title,
      description: `Dispatched message to ${lead.contactPerson || lead.companyName}: "${text.slice(0, 80)}..."`,
      actor,
      timestamp: now,
    });
    lead.lastContactedDate = now;
    lead.lastContactedAt = now;
    if (lead.leadStatus === 'New' || lead.leadStatus === 'Not Contacted') {
      lead.leadStatus = 'Contacted';
      lead.status = 'Contacted';
    }
    dataStore.updateLead(lead.id, lead, actor);
  }
}

export const whatsappCloudService = new WhatsAppCloudService();
