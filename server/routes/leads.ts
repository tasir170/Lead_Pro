import { Router, Request, Response } from 'express';
import { dataStore } from '../services/dataStore.js';
import { LeadStatus } from '../types.js';
import { auditLogger } from '../services/auditLogger.js';
import { requirePermission } from '../middleware/security.js';

export const leadsRouter = Router();

// GET /api/leads - List leads with multi-field search, filters, and sorting
leadsRouter.get('/', (req: Request, res: Response) => {
  try {
    const {
      search,
      status,
      qualityTier,
      industry,
      location,
      salesperson,
      minScore,
      maxScore,
      sortBy,
      sortOrder,
    } = req.query;

    const leads = dataStore.getAllLeads({
      search: search as string,
      status: status as string,
      qualityTier: qualityTier as string,
      industry: industry as string,
      location: location as string,
      salesperson: salesperson as string,
      minScore: minScore !== undefined ? Number(minScore) : undefined,
      maxScore: maxScore !== undefined ? Number(maxScore) : undefined,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
    });

    res.json({ success: true, count: leads.length, data: leads });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch leads' });
  }
});

// GET /api/leads/:id - Single lead with full history and notes
leadsRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const lead = dataStore.getLeadById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }
    res.json({ success: true, data: lead });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch lead' });
  }
});

// POST /api/leads - Create lead with duplicate prevention
leadsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const {
      companyName,
      company,
      industry,
      contactPerson,
      name,
      title,
      email,
      phone,
      website,
      domain,
      country,
      city,
      leadScore,
      leadQuality,
      leadSource,
      aiResearchSummary,
      remarks,
      leadStatus,
      assignedSalesperson,
      nextFollowUpDate,
    } = req.body;

    const finalCompany = (companyName || company || '').trim();
    if (!finalCompany) {
      return res.status(400).json({
        success: false,
        error: 'Company Name is a required field',
      });
    }

    const result = dataStore.createLead({
      companyName: finalCompany,
      industry: industry || 'B2B SaaS & Technology',
      contactPerson: contactPerson || name || 'Business Executive',
      title: title || 'Executive',
      email: email ? email.trim() : '',
      phone: phone ? phone.trim() : '',
      website: website || (domain ? `https://${domain}` : ''),
      domain: domain || website,
      country: country || 'United States',
      city: city || 'Austin',
      leadScore: typeof leadScore === 'number' ? leadScore : 75,
      leadQuality: leadQuality || 'High',
      leadSource: leadSource || 'Manual Entry',
      aiResearchSummary: aiResearchSummary || '',
      remarks: remarks || '',
      leadStatus: (leadStatus as LeadStatus) || 'New',
      assignedSalesperson: assignedSalesperson || 'Sarah Jenkins',
      nextFollowUpDate: nextFollowUpDate || null,
    });

    if (result.error) {
      return res.status(409).json({
        success: false,
        isDuplicate: Boolean(result.duplicateOf),
        error: result.error,
        duplicateLead: result.duplicateOf,
      });
    }

    auditLogger.log({
      actor: req.user?.name || 'Sales Team',
      actorRole: req.user?.role || 'sdr',
      action: 'CREATE_LEAD',
      entityType: 'lead',
      entityId: result.lead?.id,
      details: `Created lead "${finalCompany}" (${result.lead?.industry})`,
      ipAddress: req.clientIp,
    });

    res.status(201).json({ success: true, data: result.lead });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to create lead' });
  }
});

// PATCH /api/leads/:id - Update lead information
leadsRouter.patch('/:id', (req: Request, res: Response) => {
  try {
    const result = dataStore.updateLead(req.params.id, req.body);
    if (result.error) {
      return res.status(400).json({ success: false, error: result.error });
    }

    auditLogger.log({
      actor: req.user?.name || 'Sales Team',
      actorRole: req.user?.role || 'sdr',
      action: 'UPDATE_LEAD',
      entityType: 'lead',
      entityId: req.params.id,
      details: `Updated fields on lead: ${Object.keys(req.body).join(', ')}`,
      ipAddress: req.clientIp,
    });

    res.json({ success: true, data: result.lead });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to update lead' });
  }
});

// DELETE /api/leads/:id - Delete lead with confirmation
leadsRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const success = dataStore.deleteLead(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    auditLogger.log({
      actor: req.user?.name || 'Sales Team',
      actorRole: req.user?.role || 'sdr',
      action: 'DELETE_LEAD',
      entityType: 'lead',
      entityId: req.params.id,
      details: `Permanently deleted lead ID ${req.params.id}`,
      ipAddress: req.clientIp,
    });

    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to delete lead' });
  }
});

// POST /api/leads/:id/notes - Add internal remark/note
leadsRouter.post('/:id/notes', (req: Request, res: Response) => {
  try {
    const { author, content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Note content cannot be empty' });
    }

    const note = dataStore.addLeadNote(req.params.id, author || 'Sales Team', content);
    if (!note) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    res.status(201).json({ success: true, data: note });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to add note' });
  }
});

// POST /api/leads/:id/analyze - Calculate AI lead score using Gemini API
leadsRouter.post('/:id/analyze', async (req: Request, res: Response) => {
  try {
    const updatedLead = await dataStore.analyzeLead(req.params.id);
    if (!updatedLead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }
    res.json({
      success: true,
      message: `AI analysis completed for ${updatedLead.companyName}`,
      data: updatedLead,
      analysis: updatedLead.aiScoreAnalysis,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to analyze lead' });
  }
});

// POST /api/leads/bulk-analyze - Analyze selected leads with Gemini AI
leadsRouter.post('/bulk-analyze', async (req: Request, res: Response) => {
  try {
    const { leadIds } = req.body;
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ success: false, error: 'leadIds array is required' });
    }

    const results = await dataStore.bulkAnalyzeLeads(leadIds);
    res.json({
      success: true,
      message: `Analyzed ${results.length} leads with Gemini AI`,
      count: results.length,
      data: results,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to bulk analyze leads' });
  }
});

// POST /api/leads/bulk-status - Bulk update lead statuses
leadsRouter.post('/bulk-status', (req: Request, res: Response) => {
  try {
    const { leadIds, status, actor } = req.body;
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ success: false, error: 'leadIds array is required' });
    }
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const count = dataStore.bulkUpdateStatus(leadIds, status as LeadStatus, actor || 'Sales Team');
    auditLogger.log({
      actor: req.user?.name || actor || 'Sales Team',
      actorRole: req.user?.role || 'sdr',
      action: 'BULK_UPDATE_STATUS',
      entityType: 'lead',
      details: `Bulk updated status of ${count} leads to "${status}"`,
      ipAddress: req.clientIp,
    });
    res.json({ success: true, message: `Updated status for ${count} leads to "${status}"`, updatedCount: count });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/leads/bulk-assign - Bulk assign salesperson
leadsRouter.post('/bulk-assign', (req: Request, res: Response) => {
  try {
    const { leadIds, salesperson, actor } = req.body;
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ success: false, error: 'leadIds array is required' });
    }
    if (!salesperson) {
      return res.status(400).json({ success: false, error: 'Salesperson is required' });
    }

    const count = dataStore.bulkAssignSalesperson(leadIds, salesperson, actor || 'Sales Admin');
    auditLogger.log({
      actor: req.user?.name || actor || 'Sales Admin',
      actorRole: req.user?.role || 'admin',
      action: 'BULK_ASSIGN',
      entityType: 'lead',
      details: `Assigned ${count} leads to sales rep "${salesperson}"`,
      ipAddress: req.clientIp,
    });
    res.json({ success: true, message: `Assigned ${count} leads to ${salesperson}`, updatedCount: count });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/leads/bulk-delete - Bulk delete leads (admin / manager only)
leadsRouter.post('/bulk-delete', requirePermission('admin', 'manager'), (req: Request, res: Response) => {
  try {
    const { leadIds } = req.body;
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ success: false, error: 'leadIds array is required' });
    }

    const count = dataStore.bulkDeleteLeads(leadIds);
    auditLogger.log({
      actor: req.user?.name || 'Admin',
      actorRole: req.user?.role || 'admin',
      action: 'BULK_DELETE',
      entityType: 'lead',
      details: `Bulk deleted ${count} leads from CRM database`,
      ipAddress: req.clientIp,
    });
    res.json({ success: true, message: `Deleted ${count} leads from CRM`, deletedCount: count });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/leads/actions/reset-demo - Restore demo dataset
leadsRouter.post('/actions/reset-demo', (_req: Request, res: Response) => {
  try {
    const leads = dataStore.resetDemoData();
    res.json({ success: true, message: 'CRM leads database restored', count: leads.length, data: leads });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
