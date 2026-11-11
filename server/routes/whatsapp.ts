import { Router, Request, Response } from 'express';
import { dataStore } from '../services/dataStore.js';
import { normalizePhoneNumber, buildWaMeUrl } from '../services/whatsapp/phoneNormalizer.js';
import {
  generatePersonalizedWhatsAppMessage,
  WhatsAppMessageStyle,
} from '../services/whatsapp/whatsappMessageGenerator.js';
import { whatsappCloudService } from '../services/whatsapp/whatsappCloudService.js';
import { LeadStatus } from '../types.js';

export const whatsappRouter = Router();

/**
 * GET /api/whatsapp/metrics
 * Quick metrics overview for WhatsApp Outreach Dashboard
 */
whatsappRouter.get('/metrics', (_req: Request, res: Response) => {
  try {
    const leads = dataStore.getAllLeads();
    const now = new Date();

    const withPhone = leads.filter((l) => {
      const norm = normalizePhoneNumber(l.phone, l.country);
      return norm.isValid;
    });

    const contacted = leads.filter(
      (l) => l.leadStatus === 'Contacted' || l.leadStatus === 'Interested' || l.leadStatus === 'Qualified'
    );

    const overdueFollowUps = leads.filter((l) => {
      if (!l.nextFollowUpDate) return false;
      return new Date(l.nextFollowUpDate) < now && l.leadStatus !== 'Converted' && l.leadStatus !== 'Lost';
    });

    const hotWithPhone = withPhone.filter((l) => l.leadScore >= 80);

    res.json({
      success: true,
      metrics: {
        totalLeads: leads.length,
        withValidPhoneCount: withPhone.length,
        contactedCount: contacted.length,
        overdueCount: overdueFollowUps.length,
        hotLeadsWithPhoneCount: hotWithPhone.length,
        cloudApiConfigured: whatsappCloudService.getConfigStatus().isConfigured,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/whatsapp/leads
 * Get all leads enriched with normalized phone information and WhatsApp contact status
 */
whatsappRouter.get('/leads', (_req: Request, res: Response) => {
  try {
    const leads = dataStore.getAllLeads();
    const enriched = leads.map((lead) => {
      const norm = normalizePhoneNumber(lead.phone, lead.country);
      const defaultMsg = `Hi ${(lead.contactPerson || lead.companyName).split(' ')[0]}, noticed ${lead.companyName}'s work in ${lead.industry}. We help revenue teams automate SDR research and boost reply rates with AI dossiers. Open to a 2-min preview?`;
      const waMeUrl = norm.isValid ? buildWaMeUrl(norm.e164Digits, defaultMsg) : '';

      return {
        ...lead,
        phoneNormalization: norm,
        waMeUrl,
      };
    });

    res.json({ success: true, leads: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/whatsapp/generate-message
 * Generate personalized message in one of 5 styles
 */
whatsappRouter.post('/generate-message', async (req: Request, res: Response) => {
  try {
    const { leadId, style }: { leadId: string; style?: WhatsAppMessageStyle } = req.body;

    if (!leadId) {
      return res.status(400).json({ success: false, error: 'leadId is required' });
    }

    const lead = dataStore.getLeadById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, error: `Lead ${leadId} not found` });
    }

    const generated = await generatePersonalizedWhatsAppMessage(lead, style || 'intro');
    const norm = normalizePhoneNumber(lead.phone, lead.country);
    const waMeUrl = norm.isValid ? buildWaMeUrl(norm.e164Digits, generated.messageText) : '';

    res.json({
      success: true,
      generated,
      waMeUrl,
      phoneNormalization: norm,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/whatsapp/log-outreach
 * Mark lead as contacted via WhatsApp and record CRM timeline activity
 */
whatsappRouter.post('/log-outreach', (req: Request, res: Response) => {
  try {
    const {
      leadId,
      messageText,
      newStatus,
      author = 'Sales Team',
    }: {
      leadId: string;
      messageText?: string;
      newStatus?: LeadStatus;
      author?: string;
    } = req.body;

    if (!leadId) {
      return res.status(400).json({ success: false, error: 'leadId is required' });
    }

    const lead = dataStore.getLeadById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    const now = new Date().toISOString();
    lead.activities = lead.activities || [];
    lead.activities.unshift({
      id: `act-${Date.now()}-wa`,
      type: 'outreach_sent',
      title: 'WhatsApp Outreach Initiated',
      description: messageText
        ? `Opened chat with ${lead.contactPerson}: "${messageText.slice(0, 80)}..."`
        : `Opened direct WhatsApp chat with ${lead.contactPerson}.`,
      actor: author,
      timestamp: now,
    });

    lead.lastContactedDate = now;
    lead.lastContactedAt = now;

    const targetStatus = newStatus || (lead.leadStatus === 'New' || lead.leadStatus === 'Not Contacted' ? 'Contacted' : lead.leadStatus);
    lead.leadStatus = targetStatus;
    lead.status = targetStatus;

    dataStore.updateLead(lead.id, lead, author);

    res.json({
      success: true,
      lead,
      message: `Updated status for ${lead.companyName} to "${targetStatus}".`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/whatsapp/schedule-followup
 * Schedule follow-up date and add follow-up notes
 */
whatsappRouter.post('/schedule-followup', (req: Request, res: Response) => {
  try {
    const {
      leadId,
      nextFollowUpDate,
      notes,
      author = 'Sales Rep',
    }: {
      leadId: string;
      nextFollowUpDate: string;
      notes?: string;
      author?: string;
    } = req.body;

    if (!leadId || !nextFollowUpDate) {
      return res.status(400).json({
        success: false,
        error: 'leadId and nextFollowUpDate are required',
      });
    }

    const lead = dataStore.getLeadById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    if (notes && notes.trim().length > 0) {
      dataStore.addLeadNote(leadId, author, `Follow-up scheduled for ${new Date(nextFollowUpDate).toLocaleDateString()}: ${notes.trim()}`);
    }

    const updated = dataStore.updateLead(
      leadId,
      { nextFollowUpDate },
      author
    );

    res.json({
      success: true,
      lead: updated.lead,
      message: `Follow-up scheduled for ${new Date(nextFollowUpDate).toLocaleDateString()}.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/whatsapp/cloud-api/status
 * Check configuration of official WhatsApp Business Cloud API
 */
whatsappRouter.get('/cloud-api/status', (_req: Request, res: Response) => {
  try {
    const status = whatsappCloudService.getConfigStatus();
    res.json({ success: true, status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/whatsapp/cloud-api/config
 * Dynamically save WhatsApp Cloud API credentials
 */
whatsappRouter.post('/cloud-api/config', (req: Request, res: Response) => {
  try {
    const { phoneNumberId, accessToken, wabaId } = req.body;
    whatsappCloudService.updateCredentials({ phoneNumberId, accessToken, wabaId });
    const status = whatsappCloudService.getConfigStatus();
    res.json({
      success: true,
      status,
      message: 'WhatsApp Business credentials saved successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/whatsapp/cloud-api/send
 * Dispatch automated message via official Meta WhatsApp Business Cloud API.
 * STRICT ENFORCEMENT: Requires user confirmation (isUserApproved: true).
 */
whatsappRouter.post('/cloud-api/send', async (req: Request, res: Response) => {
  try {
    const {
      leadId,
      messageText,
      approvedBy = 'Sales Executive',
      isUserApproved,
    } = req.body;

    if (!leadId || !messageText) {
      return res.status(400).json({ success: false, error: 'leadId and messageText are required' });
    }

    const result = await whatsappCloudService.sendAutomatedMessage({
      leadId,
      messageText,
      approvedBy,
      isUserApproved: Boolean(isUserApproved),
    });

    res.json({
      success: result.success,
      result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
