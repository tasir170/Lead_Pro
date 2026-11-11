import { Router, Request, Response } from 'express';
import { analyzeAndQualifyLead, researchCompany, generateOutreach } from '../services/gemini.js';
import { dataStore } from '../services/dataStore.js';

export const aiRouter = Router();

// GET /api/ai/status - Check AI engine health and configuration
aiRouter.get('/status', (_req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  res.json({
    success: true,
    engine: 'Gemini 2.5 Flash',
    configured: hasKey,
    mode: hasKey ? 'live' : 'heuristic_fallback',
    capabilities: [
      'Automated Lead Qualification & Scoring (0-100)',
      'Deep Account Research & Tech Stack Intelligence',
      'Hyper-Personalized Multi-Channel Outreach (Email, WhatsApp, LinkedIn)',
      'Objection Handling & Talking Point Synthesis'
    ]
  });
});

// POST /api/ai/qualify - Qualify a lead
aiRouter.post('/qualify', async (req: Request, res: Response) => {
  try {
    const { leadId, leadData } = req.body;
    let target = leadData;

    if (leadId) {
      const existing = dataStore.getLeadById(leadId);
      if (existing) {
        target = existing;
      }
    }

    if (!target) {
      return res.status(400).json({ success: false, error: 'Lead data or valid leadId required' });
    }

    const qualification = await analyzeAndQualifyLead(target);

    // If existing lead, update dataStore
    if (leadId) {
      dataStore.updateLead(leadId, {
        aiScore: qualification.aiScore,
        qualityTier: qualification.qualityTier,
        aiSummary: qualification.aiSummary,
        aiTalkingPoints: qualification.aiTalkingPoints,
        keyChallenges: qualification.keyChallenges,
      });
    }

    res.json({ success: true, data: qualification });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'AI qualification failed' });
  }
});

// POST /api/ai/research - Deep research on a company/domain
aiRouter.post('/research', async (req: Request, res: Response) => {
  try {
    const { companyName, domain } = req.body;
    if (!companyName && !domain) {
      return res.status(400).json({ success: false, error: 'companyName or domain required' });
    }

    const cName = companyName || (domain ? domain.split('.')[0] : 'Enterprise');
    const cDomain = domain || `${cName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;

    const dossier = await researchCompany(cName, cDomain);
    res.json({ success: true, data: dossier });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Company research failed' });
  }
});

// POST /api/ai/outreach - Generate tailored message
aiRouter.post('/outreach', async (req: Request, res: Response) => {
  try {
    const { lead, channel, goal } = req.body;
    if (!lead) {
      return res.status(400).json({ success: false, error: 'Lead data required' });
    }

    const draft = await generateOutreach(lead, channel || 'email', goal);
    res.json({ success: true, data: draft });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Outreach generation failed' });
  }
});
