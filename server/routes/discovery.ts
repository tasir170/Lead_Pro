import { Router, Request, Response } from 'express';
import { discoveryService } from '../services/discovery/discoveryService.js';
import { DiscoverySearchParams, DiscoveredLead } from '../services/discovery/types.js';

export const discoveryRouter = Router();

// GET /api/discovery/providers - List configured search engines
discoveryRouter.get('/providers', (_req: Request, res: Response) => {
  try {
    const providers = discoveryService.getProviders();
    res.json({ success: true, count: providers.length, data: providers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to list search providers' });
  }
});

// POST /api/discovery/search - Execute business lead search
discoveryRouter.post('/search', async (req: Request, res: Response) => {
  try {
    const params = req.body.params || req.body;
    const useDemoMode = req.body.useDemoMode ?? true;

    if (!params || (!params.industry && !params.location && !params.keywords)) {
      return res.status(400).json({ success: false, error: 'Search parameters are required' });
    }

    const searchParams: DiscoverySearchParams = {
      industry: params.industry || 'Software Companies',
      location: params.location || 'Any',
      targetAudience: params.targetAudience || 'Any',
      companySize: params.companySize || 'Any',
      limit: Number(params.limit) || 25 as any,
      keywords: params.keywords || '',
      websiteAvailability: params.websiteAvailability || 'any',
      providerId: params.providerId || 'google_places',
    };

    const response = await discoveryService.search(searchParams, Boolean(useDemoMode));
    res.json(response);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Discovery search failed' });
  }
});

// POST /api/discovery/save-to-crm - Bulk save discovered leads to CRM pipeline
discoveryRouter.post('/save-to-crm', (req: Request, res: Response) => {
  try {
    const { leads } = req.body;
    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ success: false, error: 'An array of leads is required' });
    }

    const result = discoveryService.saveLeadsToCrm(leads as DiscoveredLead[]);
    res.json({
      success: true,
      message: `Successfully saved ${result.count} leads to CRM pipeline`,
      savedCount: result.count,
      savedIds: result.savedIds,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to save leads to CRM' });
  }
});
