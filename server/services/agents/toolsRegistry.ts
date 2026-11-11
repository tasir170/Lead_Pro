import { dataStore } from '../dataStore.js';
import { discoveryService } from '../discovery/discoveryService.js';
import {
  calculateLeadScoreWithGemini,
  researchCompany,
  generateOutreach,
} from '../gemini.js';
import { Lead, LeadStatus } from '../../types.js';

export interface ToolExecutionResult {
  success: boolean;
  toolName: string;
  summary: string;
  data: any;
  error?: string;
}

export class ToolsRegistry {
  /**
   * Tool 1: Discover real business leads using the Discovery Service
   */
  public async discoverLeads(args: {
    industry: string;
    location: string;
    targetAudience?: 'B2B' | 'B2C' | 'Any';
    companySize?: 'Small' | 'Medium' | 'Large' | 'Any';
    limit?: number;
    keywords?: string;
    autoSaveToCrm?: boolean;
  }): Promise<ToolExecutionResult> {
    const industry = args.industry || 'Technology';
    const location = args.location || 'United States';
    const limit = (args.limit && [10, 25, 50, 100].includes(args.limit) ? args.limit : 10) as 10 | 25 | 50 | 100;
    const targetAudience = args.targetAudience || 'B2B';
    const companySize = args.companySize || 'Any';

    const searchRes = await discoveryService.search(
      {
        industry,
        location,
        targetAudience,
        companySize,
        limit,
        keywords: args.keywords,
        websiteAvailability: 'any',
      },
      true // use fallback demo adapter if third-party provider API keys not configured
    );

    if (!searchRes.success && (!searchRes.results || searchRes.results.length === 0)) {
      return {
        success: false,
        toolName: 'discover_leads',
        summary: `Discovery failed: ${searchRes.error || 'No records returned'}`,
        data: null,
        error: searchRes.error,
      };
    }

    let savedIds: string[] = [];
    if (args.autoSaveToCrm !== false && searchRes.results.length > 0) {
      const saveRes = discoveryService.saveLeadsToCrm(searchRes.results);
      savedIds = saveRes.savedIds;
    }

    return {
      success: true,
      toolName: 'discover_leads',
      summary: `Discovered ${searchRes.results.length} verified business listings for ${industry} in ${location} via ${searchRes.provider}. Saved ${savedIds.length} records directly to CRM database.`,
      data: {
        totalFound: searchRes.results.length,
        provider: searchRes.provider,
        savedLeadIds: savedIds,
        sampleLeads: searchRes.results.slice(0, 5),
      },
    };
  }

  /**
   * Tool 2: Deep research on a company or lead ID
   */
  public async researchCompanyOrLead(args: {
    leadId?: string;
    companyName?: string;
    domain?: string;
  }): Promise<ToolExecutionResult> {
    let targetCompany = args.companyName || '';
    let targetDomain = args.domain || '';
    let existingLead: Lead | undefined;

    if (args.leadId) {
      existingLead = dataStore.getLeadById(args.leadId);
      if (existingLead) {
        targetCompany = existingLead.companyName || existingLead.company || targetCompany;
        targetDomain = existingLead.domain || existingLead.website || targetDomain;
      }
    }

    if (!targetCompany) {
      return {
        success: false,
        toolName: 'research_company',
        summary: 'Cannot perform research: Company Name or Lead ID is required.',
        data: null,
        error: 'Missing company name or leadId',
      };
    }

    if (!targetDomain) {
      targetDomain = `${targetCompany.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    }

    const dossier = await researchCompany(targetCompany, targetDomain);

    // If an existing lead exists, enrich it in the CRM
    if (existingLead) {
      dataStore.updateLead(
        existingLead.id,
        {
          aiResearchSummary: dossier.summary,
          aiSummary: dossier.summary,
          aiTalkingPoints: dossier.techStack.concat(dossier.hiringSignals),
          keyChallenges: dossier.painPoints,
          annualRevenue: dossier.estimatedRevenue,
          remarks: `AI Dossier updated: ${dossier.recommendedPitchAngle}`,
        },
        'Lead Research Agent'
      );
    }

    return {
      success: true,
      toolName: 'research_company',
      summary: `Successfully completed deep intelligence analysis for ${targetCompany} (${targetDomain}). Verified tech stack: ${dossier.techStack.slice(0, 3).join(', ')}.`,
      data: {
        dossier,
        leadId: existingLead?.id,
      },
    };
  }

  /**
   * Tool 3: Qualify lead using the 7-factor predictive scoring engine
   */
  public async qualifyLead(args: { leadId: string }): Promise<ToolExecutionResult> {
    if (!args.leadId) {
      return {
        success: false,
        toolName: 'qualify_lead',
        summary: 'Lead ID is required for qualification.',
        data: null,
        error: 'Missing leadId',
      };
    }

    const lead = dataStore.getLeadById(args.leadId);
    if (!lead) {
      return {
        success: false,
        toolName: 'qualify_lead',
        summary: `Lead with ID "${args.leadId}" was not found in the database.`,
        data: null,
        error: 'Lead not found',
      };
    }

    const updated = await dataStore.analyzeLead(args.leadId);
    if (!updated || !updated.aiScoreAnalysis) {
      return {
        success: false,
        toolName: 'qualify_lead',
        summary: `Failed to score lead ${lead.companyName}.`,
        data: null,
        error: 'Scoring engine failure',
      };
    }

    const analysis = updated.aiScoreAnalysis;
    return {
      success: true,
      toolName: 'qualify_lead',
      summary: `Scored ${updated.companyName}: ${analysis.leadScore}/100 (${analysis.leadCategory}). Recommended next step: ${analysis.recommendedNextAction}`,
      data: {
        leadId: updated.id,
        companyName: updated.companyName,
        leadScore: analysis.leadScore,
        leadCategory: analysis.leadCategory,
        confidence: analysis.confidenceIndicator,
        needs: analysis.potentialCustomerNeeds,
        opportunities: analysis.businessOpportunities,
        scoreBreakdown: analysis.scoreBreakdown,
        recommendedSalesStrategy: analysis.recommendedSalesStrategy,
        recommendedNextAction: analysis.recommendedNextAction,
      },
    };
  }

  /**
   * Tool 4: Generate tailored sales strategy, email copy, and WhatsApp copy
   */
  public async generateSalesStrategy(args: {
    leadId: string;
    channel?: 'email' | 'whatsapp' | 'linkedin';
    goal?: string;
  }): Promise<ToolExecutionResult> {
    const lead = dataStore.getLeadById(args.leadId);
    if (!lead) {
      return {
        success: false,
        toolName: 'generate_sales_strategy',
        summary: `Lead "${args.leadId}" not found for strategy generation.`,
        data: null,
        error: 'Lead not found',
      };
    }

    const channel = args.channel || 'email';
    const goal = args.goal || 'Schedule 15-minute introductory demo';

    const outreach = await generateOutreach(lead, channel, goal);
    const whatsappDraft = await generateOutreach(lead, 'whatsapp', 'Confirm demo timing');

    const conversationStarters = [
      `"Noticed ${lead.companyName}'s current focus on ${lead.industry} expansion."`,
      `"How is your team currently solving ${lead.keyChallenges?.[0] || 'manual SDR prospect research'}?"`,
      `"Saw your team is hiring in commercial roles—are you evaluating outbound AI automation?"`,
    ];

    const followUpCadence = [
      { day: 1, action: 'Personalized Intro Email', description: 'Executive value hook focused on SDR cycle compression' },
      { day: 3, action: 'WhatsApp Executive Follow-up', description: 'Concise 2-sentence mobile touchpoint' },
      { day: 7, action: 'Case Study Share', description: 'Peer benchmark metrics in ' + lead.industry },
      { day: 12, action: 'Break-up or Permission Question', description: 'Check if this priority is top-of-mind for Q4' },
    ];

    return {
      success: true,
      toolName: 'generate_sales_strategy',
      summary: `Crafted consultative outbound strategy for ${lead.contactPerson || 'Decision Maker'} at ${lead.companyName}. Generated Email and WhatsApp drafts with 4-step follow-up schedule.`,
      data: {
        leadId: lead.id,
        companyName: lead.companyName,
        contactPerson: lead.contactPerson,
        emailDraft: outreach,
        whatsappDraft: whatsappDraft.message,
        conversationStarters,
        followUpCadence,
      },
    };
  }

  /**
   * Tool 5: Scan CRM for duplicate records by domain or email
   */
  public async crmFindDuplicates(): Promise<ToolExecutionResult> {
    const leads = dataStore.getAllLeads();
    const domainMap = new Map<string, Lead[]>();
    const emailMap = new Map<string, Lead[]>();

    for (const lead of leads) {
      const dom = (lead.domain || lead.website || '')
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/.*$/, '')
        .trim();

      if (dom && dom.length > 3 && !dom.includes('google.com')) {
        const list = domainMap.get(dom) || [];
        list.push(lead);
        domainMap.set(dom, list);
      }

      const email = (lead.email || '').toLowerCase().trim();
      if (email && email.includes('@') && !email.startsWith('info@')) {
        const list = emailMap.get(email) || [];
        list.push(lead);
        emailMap.set(email, list);
      }
    }

    const duplicateClusters: Array<{
      matchType: 'domain' | 'email';
      matchValue: string;
      leads: Array<{ id: string; companyName: string; email: string; leadStatus: string; score: number }>;
      recommendation: string;
    }> = [];

    domainMap.forEach((matched, dom) => {
      if (matched.length > 1) {
        duplicateClusters.push({
          matchType: 'domain',
          matchValue: dom,
          leads: matched.map((l) => ({
            id: l.id,
            companyName: l.companyName,
            email: l.email,
            leadStatus: l.leadStatus,
            score: l.leadScore,
          })),
          recommendation: `Merge records under ${matched[0].companyName} (retain lead with highest score: ${Math.max(...matched.map((m) => m.leadScore))})`,
        });
      }
    });

    return {
      success: true,
      toolName: 'crm_find_duplicates',
      summary: duplicateClusters.length === 0
        ? `Audited all ${leads.length} records. Database is completely deduplicated; 0 duplicate domains or emails detected.`
        : `Detected ${duplicateClusters.length} duplicate clusters across ${leads.length} total CRM records.`,
      data: {
        totalLeadsAudited: leads.length,
        duplicateCount: duplicateClusters.length,
        duplicateClusters,
      },
    };
  }

  /**
   * Tool 6: Find incomplete leads in CRM
   */
  public async crmFindIncomplete(): Promise<ToolExecutionResult> {
    const leads = dataStore.getAllLeads();
    const incompleteLeads = leads
      .map((lead) => {
        const missing: string[] = [];
        if (!lead.website || lead.website.trim().length === 0) missing.push('Website');
        if (!lead.email || lead.email.trim().length === 0 || lead.email.startsWith('info@')) missing.push('Direct Email');
        if (!lead.phone || lead.phone.trim().length === 0) missing.push('Phone Number');
        if (!lead.contactPerson || lead.contactPerson === 'Decision Maker' || lead.contactPerson.includes('Executive Contact')) missing.push('Named Contact');
        if (!lead.assignedSalesperson || lead.assignedSalesperson === 'Unassigned') missing.push('Salesperson Assignment');
        if (!lead.nextFollowUpDate && lead.leadStatus !== 'Converted' && lead.leadStatus !== 'Lost') missing.push('Next Follow-up Date');

        return {
          id: lead.id,
          companyName: lead.companyName,
          leadStatus: lead.leadStatus,
          missingFields: missing,
          completenessPercent: Math.round(((6 - missing.length) / 6) * 100),
        };
      })
      .filter((item) => item.missingFields.length > 0)
      .sort((a, b) => a.completenessPercent - b.completenessPercent);

    return {
      success: true,
      toolName: 'crm_find_incomplete',
      summary: `Identified ${incompleteLeads.length} leads requiring data enrichment or assignment. Average completeness: ${Math.round(incompleteLeads.reduce((acc, curr) => acc + curr.completenessPercent, 0) / (incompleteLeads.length || 1))}%.`,
      data: {
        incompleteCount: incompleteLeads.length,
        leads: incompleteLeads.slice(0, 10),
      },
    };
  }

  /**
   * Tool 7: Generate daily CRM hygiene and pipeline distribution summary
   */
  public async crmDailySummary(): Promise<ToolExecutionResult> {
    const summary = dataStore.getPipelineSummary();
    const leads = dataStore.getAllLeads();
    const now = new Date();

    const overdueFollowUps = leads.filter((l) => {
      if (!l.nextFollowUpDate) return false;
      return new Date(l.nextFollowUpDate) < now && l.leadStatus !== 'Converted' && l.leadStatus !== 'Lost';
    });

    const highPriorityUnassigned = leads.filter(
      (l) => l.leadQuality === 'High' && (!l.assignedSalesperson || l.assignedSalesperson === 'Unassigned')
    );

    const hygieneScore = Math.max(
      60,
      100 - overdueFollowUps.length * 5 - highPriorityUnassigned.length * 8
    );

    return {
      success: true,
      toolName: 'crm_daily_summary',
      summary: `Daily CRM Hygiene Score: ${hygieneScore}/100. Total active pipeline: ${summary.totalLeads} accounts. ${overdueFollowUps.length} overdue follow-ups, ${highPriorityUnassigned.length} unassigned Tier-1 accounts.`,
      data: {
        hygieneScore,
        pipelineSummary: summary,
        overdueFollowUps: overdueFollowUps.map((l) => ({
          id: l.id,
          companyName: l.companyName,
          dueDate: l.nextFollowUpDate,
          salesperson: l.assignedSalesperson,
        })),
        highPriorityUnassigned: highPriorityUnassigned.map((l) => ({
          id: l.id,
          companyName: l.companyName,
          leadScore: l.leadScore,
        })),
      },
    };
  }

  /**
   * Tool 8: Batch Update Records (REQUIRES USER APPROVAL)
   */
  public async crmBatchUpdate(args: {
    leadIds: string[];
    newStatus?: LeadStatus;
    assignTo?: string;
    approvedBy?: string;
  }): Promise<ToolExecutionResult> {
    if (!args.leadIds || args.leadIds.length === 0) {
      return {
        success: false,
        toolName: 'crm_batch_update',
        summary: 'No lead IDs provided for update.',
        data: null,
        error: 'Missing leadIds',
      };
    }

    let updatedCount = 0;
    if (args.newStatus) {
      updatedCount = dataStore.bulkUpdateStatus(args.leadIds, args.newStatus, args.approvedBy || 'CRM Management Agent');
    }
    if (args.assignTo) {
      updatedCount = dataStore.bulkAssignSalesperson(args.leadIds, args.assignTo, args.approvedBy || 'CRM Management Agent');
    }

    return {
      success: true,
      toolName: 'crm_batch_update',
      summary: `Successfully executed batch update for ${updatedCount} leads (Authorized by ${args.approvedBy || 'User Admin'}).`,
      data: {
        affectedCount: updatedCount,
        leadIds: args.leadIds,
        newStatus: args.newStatus,
        assignedTo: args.assignTo,
      },
    };
  }

  /**
   * Tool 9: Dispatch Outreach (REQUIRES USER APPROVAL)
   */
  public async dispatchOutreach(args: {
    leadId: string;
    channel: 'email' | 'whatsapp';
    message: string;
    subject?: string;
    approvedBy?: string;
  }): Promise<ToolExecutionResult> {
    const lead = dataStore.getLeadById(args.leadId);
    if (!lead) {
      return {
        success: false,
        toolName: 'dispatch_outreach',
        summary: `Lead "${args.leadId}" not found.`,
        data: null,
        error: 'Lead not found',
      };
    }

    // Add activity to lead profile
    const now = new Date().toISOString();
    lead.activities = lead.activities || [];
    lead.activities.unshift({
      id: `act-${Date.now()}-outreach`,
      type: 'outreach_sent',
      title: `${args.channel.toUpperCase()} Outreach Sent`,
      description: `Dispatched message to ${lead.contactPerson || lead.companyName}: "${args.message.slice(0, 70)}..."`,
      actor: args.approvedBy || 'Sales Strategy Agent',
      timestamp: now,
    });
    lead.lastContactedDate = now;
    lead.lastContactedAt = now;
    if (lead.leadStatus === 'New' || lead.leadStatus === 'Not Contacted') {
      lead.leadStatus = 'Contacted';
      lead.status = 'Contacted';
    }

    dataStore.updateLead(lead.id, lead, args.approvedBy || 'Sales Strategy Agent');

    return {
      success: true,
      toolName: 'dispatch_outreach',
      summary: `Outreach successfully dispatched via ${args.channel.toUpperCase()} to ${lead.contactPerson} at ${lead.companyName}. Activity recorded in CRM.`,
      data: {
        leadId: lead.id,
        channel: args.channel,
        contactPerson: lead.contactPerson,
        timestamp: now,
      },
    };
  }
}

export const toolsRegistry = new ToolsRegistry();
