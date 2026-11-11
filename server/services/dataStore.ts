import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Lead, PipelineSummary, AcquisitionDataPoint, QualityBreakdown, LeadStatus, LeadActivity, LeadNote, LeadCategory, AIScoreAnalysis } from '../types.js';
import { classifyLeadCategory, calculateHeuristicLeadScore, calculateLeadScoreWithGemini } from './gemini.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.resolve(DATA_DIR, 'crm_leads.json');

// Canonical Sales Team for assignments
export const SALES_TEAM = [
  'Sarah Jenkins',
  'David Mercer',
  'Elena Zhou',
  'Marcus Vance',
  'Unassigned',
];

// Helper to normalize domain for strict duplicate checking
export function normalizeDomain(domainOrUrl?: string): string {
  if (!domainOrUrl) return '';
  return domainOrUrl
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
    .replace(/[^a-z0-9.-]/g, '');
}

// Helper to normalize email
export function normalizeEmail(email?: string): string {
  if (!email) return '';
  return email.toLowerCase().trim();
}

// High quality initial seed database covering all 19 required CRM fields
const INITIAL_CRM_LEADS: Lead[] = [
  {
    id: 'lead-1',
    companyName: 'CloudScale Logistics',
    company: 'CloudScale Logistics',
    industry: 'Logistics Tech & Supply Chain',
    contactPerson: 'Elena Rostova',
    name: 'Elena Rostova',
    title: 'VP of Growth & Revenue Operations',
    email: 'elena.rostova@cloudscalelogistics.com',
    phone: '+1 (415) 890-4421',
    website: 'https://cloudscalelogistics.com',
    domain: 'cloudscalelogistics.com',
    country: 'United States',
    city: 'San Francisco',
    location: 'San Francisco, CA, United States',
    leadScore: 94,
    aiScore: 94,
    leadQuality: 'High',
    qualityTier: 'High',
    leadSource: 'Web Discovery',
    aiResearchSummary: 'Fast-scaling series-B logistics platform actively expanding sales headcount. Fits Tier-1 ICP with modern outbound automation needs.',
    aiSummary: 'Fast-scaling series-B logistics platform actively expanding sales headcount. Fits Tier-1 ICP with modern outbound automation needs.',
    remarks: 'Met at SaaStr Annual; requested custom integration with Salesforce. High decision authority.',
    leadStatus: 'Qualified',
    status: 'Qualified',
    assignedSalesperson: 'Sarah Jenkins',
    createdDate: '2026-10-28T09:15:00Z',
    createdAt: '2026-10-28T09:15:00Z',
    lastContactedDate: '2026-11-04T14:30:00Z',
    lastContactedAt: '2026-11-04T14:30:00Z',
    nextFollowUpDate: '2026-11-08T10:00:00Z',
    employeeCount: '250-500',
    annualRevenue: '$45M',
    linkedinUrl: 'https://linkedin.com/in/elena-rostova-demo',
    isDemo: true,
    aiTalkingPoints: [
      'Recently announced $22M Series B led by Index Ventures',
      'Expanding SDR team by 8 members this quarter',
      'Struggling with outbound reply rates across legacy cold email'
    ],
    keyChallenges: ['Pipeline predictability', 'SDR onboarding velocity', 'Email deliverability issues'],
    activities: [
      {
        id: 'act-1-1',
        type: 'created',
        title: 'Lead Ingested',
        description: 'Discovered via Web Discovery Engine and scored by AI.',
        actor: 'System',
        timestamp: '2026-10-28T09:15:00Z',
      },
      {
        id: 'act-1-2',
        type: 'status_change',
        title: 'Status Updated to Qualified',
        description: 'Verified budget authority and Series-B hiring signals.',
        actor: 'Sarah Jenkins',
        timestamp: '2026-11-04T14:30:00Z',
      },
      {
        id: 'act-1-3',
        type: 'follow_up_scheduled',
        title: 'Demo Follow-up Scheduled',
        description: 'Scheduled executive product walkthrough for Nov 8.',
        actor: 'Sarah Jenkins',
        timestamp: '2026-11-04T14:35:00Z',
      }
    ],
    notes: [
      {
        id: 'note-1-1',
        author: 'Sarah Jenkins',
        content: 'Elena confirmed budget is approved for Q4 outbound automation. Very interested in WhatsApp outreach for European freight clients.',
        createdAt: '2026-11-04T14:32:00Z',
      }
    ],
  },
  {
    id: 'lead-2',
    companyName: 'FinApex Systems',
    company: 'FinApex Systems',
    industry: 'Financial Technology (FinTech)',
    contactPerson: 'Marcus Vance',
    name: 'Marcus Vance',
    title: 'Head of Sales Development',
    email: 'marcus.v@finapex.io',
    phone: '+1 (212) 555-0198',
    website: 'https://finapex.io',
    domain: 'finapex.io',
    country: 'United States',
    city: 'New York',
    location: 'New York, NY, United States',
    leadScore: 91,
    aiScore: 91,
    leadQuality: 'High',
    qualityTier: 'High',
    leadSource: 'Google Places Search',
    aiResearchSummary: 'Fintech compliance platform looking to replace legacy zoominfo workflow with deeper AI enrichment and automated WhatsApp nurture.',
    aiSummary: 'Fintech compliance platform looking to replace legacy zoominfo workflow with deeper AI enrichment and automated WhatsApp nurture.',
    remarks: 'Evaluating AI sales tools to scale outbound from 10 to 30 SDRs.',
    leadStatus: 'Contacted',
    status: 'Contacted',
    assignedSalesperson: 'David Mercer',
    createdDate: '2026-10-30T10:45:00Z',
    createdAt: '2026-10-30T10:45:00Z',
    lastContactedDate: '2026-11-05T11:20:00Z',
    lastContactedAt: '2026-11-05T11:20:00Z',
    nextFollowUpDate: '2026-11-09T15:00:00Z',
    employeeCount: '100-250',
    annualRevenue: '$28M',
    linkedinUrl: 'https://linkedin.com/in/marcus-vance-demo',
    isDemo: true,
    aiTalkingPoints: [
      'Marcus previously evaluated AI sales tooling at Plaid',
      'High conversion on WhatsApp follow-ups in LATAM & EU expansion regions',
      'Need multi-channel intelligence'
    ],
    keyChallenges: ['Data freshness', 'Personalization at scale', 'Manual SDR research time'],
    activities: [
      {
        id: 'act-2-1',
        type: 'created',
        title: 'Lead Added to CRM',
        description: 'Imported from Google Places Search.',
        actor: 'System',
        timestamp: '2026-10-30T10:45:00Z',
      },
      {
        id: 'act-2-2',
        type: 'outreach_sent',
        title: 'First Email Dispatched',
        description: 'Sent personalized outbound message highlighting SDR research acceleration.',
        actor: 'David Mercer',
        timestamp: '2026-11-05T11:20:00Z',
      }
    ],
    notes: [
      {
        id: 'note-2-1',
        author: 'David Mercer',
        content: 'Marcus opened the introductory email 4 times within 30 minutes.',
        createdAt: '2026-11-05T11:55:00Z',
      }
    ]
  },
  {
    id: 'lead-3',
    companyName: 'HealthVibe Telehealth',
    company: 'HealthVibe Telehealth',
    industry: 'Healthcare Tech & MedTech',
    contactPerson: 'Sophia Chen',
    name: 'Sophia Chen',
    title: 'Chief Commercial Officer',
    email: 'sophia@healthvibe.health',
    phone: '+1 (617) 402-9812',
    website: 'https://healthvibe.health',
    domain: 'healthvibe.health',
    country: 'United States',
    city: 'Boston',
    location: 'Boston, MA, United States',
    leadScore: 89,
    aiScore: 89,
    leadQuality: 'High',
    qualityTier: 'High',
    leadSource: 'Referral',
    aiResearchSummary: 'Converted enterprise contract after 14-day trial. Utilizing AI qualification for B2B clinic outreach.',
    aiSummary: 'Converted enterprise contract after 14-day trial. Utilizing AI qualification for B2B clinic outreach.',
    remarks: 'Annual growth tier contract signed; champion for clinical B2B outreach.',
    leadStatus: 'Converted',
    status: 'Converted',
    assignedSalesperson: 'Elena Zhou',
    createdDate: '2026-10-15T08:30:00Z',
    createdAt: '2026-10-15T08:30:00Z',
    lastContactedDate: '2026-11-03T16:00:00Z',
    lastContactedAt: '2026-11-03T16:00:00Z',
    nextFollowUpDate: null,
    employeeCount: '50-100',
    annualRevenue: '$15M',
    isDemo: true,
    activities: [
      {
        id: 'act-3-1',
        type: 'status_change',
        title: 'Deal Won / Converted',
        description: 'Closed 12-month commercial SaaS license.',
        actor: 'Elena Zhou',
        timestamp: '2026-11-03T16:00:00Z',
      }
    ],
    notes: [
      {
        id: 'note-3-1',
        author: 'Elena Zhou',
        content: 'Customer requested Q1 case study collaboration.',
        createdAt: '2026-11-03T16:05:00Z',
      }
    ]
  },
  {
    id: 'lead-4',
    companyName: 'DataForge Security',
    company: 'DataForge Security',
    industry: 'Cybersecurity & Cloud Data',
    contactPerson: 'David Kalu',
    name: 'David Kalu',
    title: 'Director of Business Development',
    email: 'dkalu@dataforge.security',
    phone: '+1 (512) 782-9901',
    website: 'https://dataforge.security',
    domain: 'dataforge.security',
    country: 'United States',
    city: 'Austin',
    location: 'Austin, TX, United States',
    leadScore: 88,
    aiScore: 88,
    leadQuality: 'High',
    qualityTier: 'High',
    leadSource: 'Inbound Form',
    aiResearchSummary: 'Large enterprise security vendor. Inbound signal detected via product datasheet download. High budget capacity.',
    aiSummary: 'Large enterprise security vendor. Inbound signal detected via product datasheet download. High budget capacity.',
    remarks: 'Need enterprise SSO and CRM sync before contract signing.',
    leadStatus: 'Negotiation',
    status: 'Negotiation',
    assignedSalesperson: 'Sarah Jenkins',
    createdDate: '2026-11-01T15:10:00Z',
    createdAt: '2026-11-01T15:10:00Z',
    lastContactedDate: '2026-11-05T17:15:00Z',
    lastContactedAt: '2026-11-05T17:15:00Z',
    nextFollowUpDate: '2026-11-07T14:00:00Z',
    employeeCount: '500-1000',
    annualRevenue: '$90M',
    isDemo: true,
    activities: [
      {
        id: 'act-4-1',
        type: 'status_change',
        title: 'Moved to Negotiation',
        description: 'Pricing proposal delivered for 25 Enterprise SDR seats.',
        actor: 'Sarah Jenkins',
        timestamp: '2026-11-05T17:15:00Z',
      }
    ]
  },
  {
    id: 'lead-5',
    companyName: 'NordicSaaS Studio',
    company: 'NordicSaaS Studio',
    industry: 'B2B SaaS & Enterprise Software',
    contactPerson: 'Sarah Lindqvist',
    name: 'Sarah Lindqvist',
    title: 'VP of Global Marketing',
    email: 'sarah.l@nordicsaas.se',
    phone: '+46 8 123 4567',
    website: 'https://nordicsaas.se',
    domain: 'nordicsaas.se',
    country: 'Sweden',
    city: 'Stockholm',
    location: 'Stockholm, Sweden',
    leadScore: 78,
    aiScore: 78,
    leadQuality: 'Medium',
    qualityTier: 'Medium',
    leadSource: 'Web Discovery',
    aiResearchSummary: 'European SaaS firm targeting US mid-market entry. Solid fit but requires GDPR compliant outreach playbooks.',
    aiSummary: 'European SaaS firm targeting US mid-market entry. Solid fit but requires GDPR compliant outreach playbooks.',
    remarks: 'Interested in localized messaging templates.',
    leadStatus: 'Interested',
    status: 'Interested',
    assignedSalesperson: 'David Mercer',
    createdDate: '2026-10-24T12:00:00Z',
    createdAt: '2026-10-24T12:00:00Z',
    lastContactedDate: '2026-11-02T13:15:00Z',
    lastContactedAt: '2026-11-02T13:15:00Z',
    nextFollowUpDate: '2026-11-10T11:00:00Z',
    employeeCount: '50-100',
    annualRevenue: '$12M',
    isDemo: true,
  },
  {
    id: 'lead-6',
    companyName: 'Apex Retail Automation',
    company: 'Apex Retail Automation',
    industry: 'Retail Tech & POS Systems',
    contactPerson: 'Tariq Al-Mansoor',
    name: 'Tariq Al-Mansoor',
    title: 'Chief Operating Officer',
    email: 'tariq@apexretail.ae',
    phone: '+971 4 456 7890',
    website: 'https://apexretail.ae',
    domain: 'apexretail.ae',
    country: 'United Arab Emirates',
    city: 'Dubai',
    location: 'Dubai, UAE',
    leadScore: 74,
    aiScore: 74,
    leadQuality: 'Medium',
    qualityTier: 'Medium',
    leadSource: 'Manual Entry',
    aiResearchSummary: 'Middle East retail solutions provider. Prefers WhatsApp communication over cold email for executive contact.',
    aiSummary: 'Middle East retail solutions provider. Prefers WhatsApp communication over cold email for executive contact.',
    remarks: 'Prefers WhatsApp messages over email; very responsive on mobile.',
    leadStatus: 'Contacted',
    status: 'Contacted',
    assignedSalesperson: 'Elena Zhou',
    createdDate: '2026-10-29T14:20:00Z',
    createdAt: '2026-10-29T14:20:00Z',
    lastContactedDate: '2026-11-04T09:45:00Z',
    lastContactedAt: '2026-11-04T09:45:00Z',
    nextFollowUpDate: '2026-11-08T08:00:00Z',
    employeeCount: '100-250',
    annualRevenue: '$32M',
    isDemo: true,
  },
  {
    id: 'lead-7',
    companyName: 'Verde AI Energy',
    company: 'Verde AI Energy',
    industry: 'CleanTech & Renewable Software',
    contactPerson: 'Julian Moretti',
    name: 'Julian Moretti',
    title: 'Founder & CEO',
    email: 'julian@verdeenergy.tech',
    phone: '+1 (303) 981-3344',
    website: 'https://verdeenergy.tech',
    domain: 'verdeenergy.tech',
    country: 'United States',
    city: 'Boulder',
    location: 'Boulder, CO, United States',
    leadScore: 71,
    aiScore: 71,
    leadQuality: 'Medium',
    qualityTier: 'Medium',
    leadSource: 'Web Discovery',
    aiResearchSummary: 'Early stage high-potential cleantech startup. High engagement with recent LinkedIn thought leadership.',
    aiSummary: 'Early stage high-potential cleantech startup. High engagement with recent LinkedIn thought leadership.',
    remarks: 'Founder handling sales directly; sensitive to monthly subscription pricing.',
    leadStatus: 'Not Contacted',
    status: 'Not Contacted',
    assignedSalesperson: 'Marcus Vance',
    createdDate: '2026-11-05T20:30:00Z',
    createdAt: '2026-11-05T20:30:00Z',
    lastContactedDate: null,
    nextFollowUpDate: '2026-11-07T16:00:00Z',
    employeeCount: '20-50',
    annualRevenue: '$4.5M',
    isDemo: true,
  },
  {
    id: 'lead-8',
    companyName: 'OmniDesk Workspace',
    company: 'OmniDesk Workspace',
    industry: 'Collaborative Work Tools',
    contactPerson: 'Chloe Tremblay',
    name: 'Chloe Tremblay',
    title: 'Sales Operations Manager',
    email: 'chloe@omnidesk.co',
    phone: '+1 (514) 876-2311',
    website: 'https://omnidesk.co',
    domain: 'omnidesk.co',
    country: 'Canada',
    city: 'Montreal',
    location: 'Montreal, Canada',
    leadScore: 54,
    aiScore: 54,
    leadQuality: 'Low',
    qualityTier: 'Low',
    leadSource: 'Lead Discovery',
    aiResearchSummary: 'Small company size, lower revenue band than typical high-value ICP. 3 automated follow-ups sent with no engagement.',
    aiSummary: 'Small company size, lower revenue band than typical high-value ICP. 3 automated follow-ups sent with no engagement.',
    remarks: 'Decided to renew existing ZoomInfo contract for 6 months.',
    leadStatus: 'Lost',
    status: 'Lost',
    assignedSalesperson: 'David Mercer',
    createdDate: '2026-10-10T11:00:00Z',
    createdAt: '2026-10-10T11:00:00Z',
    lastContactedDate: '2026-10-22T10:00:00Z',
    lastContactedAt: '2026-10-22T10:00:00Z',
    nextFollowUpDate: null,
    employeeCount: '10-20',
    annualRevenue: '$1.8M',
    isDemo: true,
  },
  {
    id: 'lead-9',
    companyName: 'QuantumSync Cloud',
    company: 'QuantumSync Cloud',
    industry: 'Cloud Infrastructure',
    contactPerson: 'Aaron Becker',
    name: 'Aaron Becker',
    title: 'VP of Enterprise Partnerships',
    email: 'aaron.b@quantumsync.io',
    phone: '+1 (206) 555-8832',
    website: 'https://quantumsync.io',
    domain: 'quantumsync.io',
    country: 'United States',
    city: 'Seattle',
    location: 'Seattle, WA, United States',
    leadScore: 92,
    aiScore: 92,
    leadQuality: 'High',
    qualityTier: 'High',
    leadSource: 'Web Discovery',
    aiResearchSummary: 'High-intent enterprise target with immediate need for automated company intelligence gathering for 40 account reps.',
    aiSummary: 'High-intent enterprise target with immediate need for automated company intelligence gathering for 40 account reps.',
    remarks: 'Security questionnaire submitted. Pending Infosec review.',
    leadStatus: 'Negotiation',
    status: 'Negotiation',
    assignedSalesperson: 'Sarah Jenkins',
    createdDate: '2026-11-01T15:10:00Z',
    createdAt: '2026-11-01T15:10:00Z',
    lastContactedDate: '2026-11-05T17:15:00Z',
    lastContactedAt: '2026-11-05T17:15:00Z',
    nextFollowUpDate: '2026-11-08T13:00:00Z',
    employeeCount: '500-1000',
    annualRevenue: '$85M',
    isDemo: true,
  },
  {
    id: 'lead-10',
    companyName: 'Luminary Payments',
    company: 'Luminary Payments',
    industry: 'FinTech & B2B Payments',
    contactPerson: 'Nadia Solis',
    name: 'Nadia Solis',
    title: 'Head of Growth Marketing',
    email: 'nadia.solis@luminarypay.com',
    phone: '+1 (312) 440-1288',
    website: 'https://luminarypay.com',
    domain: 'luminarypay.com',
    country: 'United States',
    city: 'Chicago',
    location: 'Chicago, IL, United States',
    leadScore: 95,
    aiScore: 95,
    leadQuality: 'High',
    qualityTier: 'High',
    leadSource: 'Inbound Lead',
    aiResearchSummary: 'Recently converted customer. Upgraded to Pro Tier after seeing 3.8x lift in meeting booking rates using AI Sales Assistant copy.',
    aiSummary: 'Recently converted customer. Upgraded to Pro Tier after seeing 3.8x lift in meeting booking rates using AI Sales Assistant copy.',
    remarks: 'High NPS promoter; participating in December webinar.',
    leadStatus: 'Converted',
    status: 'Converted',
    assignedSalesperson: 'Elena Zhou',
    createdDate: '2026-10-18T09:00:00Z',
    createdAt: '2026-10-18T09:00:00Z',
    lastContactedDate: '2026-11-01T11:30:00Z',
    lastContactedAt: '2026-11-01T11:30:00Z',
    nextFollowUpDate: null,
    employeeCount: '100-250',
    annualRevenue: '$22M',
    isDemo: true,
  }
];

class DataStore {
  private leads: Lead[] = [];
  private isInitialized = false;

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    if (this.isInitialized) return;

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.leads = parsed.map(this.normalizeLeadStructure);
          this.isInitialized = true;
          return;
        }
      }

      // If no file exists or file is empty, write initial seed data
      this.leads = INITIAL_CRM_LEADS.map(this.normalizeLeadStructure);
      this.saveToDisk();
      this.isInitialized = true;
    } catch (err) {
      console.warn('DataStore init warning (using in-memory fallback):', err);
      this.leads = INITIAL_CRM_LEADS.map(this.normalizeLeadStructure);
      this.isInitialized = true;
    }
  }

  private saveToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.leads, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write leads to persistent disk:', err);
    }
  }

  // Ensures all 19 fields and aliases are populated consistently
  private normalizeLeadStructure(lead: any): Lead {
    const company = lead.companyName || lead.company || 'Unknown Company';
    const contactPerson = lead.contactPerson || lead.name || 'Decision Maker';
    const email = lead.email || '';
    const phone = lead.phone || '';
    const website = lead.website || (lead.domain ? `https://${lead.domain}` : '');
    const domain = normalizeDomain(lead.domain || lead.website || company);
    const country = lead.country || (lead.location ? lead.location.split(',').pop()?.trim() : 'United States') || 'United States';
    const city = lead.city || (lead.location ? lead.location.split(',')[0]?.trim() : 'Austin') || 'Austin';
    const leadScore = typeof lead.leadScore === 'number' ? lead.leadScore : (typeof lead.aiScore === 'number' ? lead.aiScore : 75);
    const leadQuality = lead.leadQuality || (leadScore >= 80 ? 'High' : leadScore >= 60 ? 'Medium' : 'Low');
    const leadSource = lead.leadSource || 'Lead Discovery';
    const aiResearchSummary = lead.aiResearchSummary || lead.aiSummary || '';
    const remarks = lead.remarks || '';
    
    // Normalize status into one of the 8 canonical statuses
    let leadStatus: LeadStatus = 'New';
    const rawStatus = (lead.leadStatus || lead.status || 'New').toString().toLowerCase();
    if (rawStatus.includes('not contacted') || rawStatus === 'not_contacted') leadStatus = 'Not Contacted';
    else if (rawStatus.includes('contacted')) leadStatus = 'Contacted';
    else if (rawStatus.includes('interested')) leadStatus = 'Interested';
    else if (rawStatus.includes('qualified')) leadStatus = 'Qualified';
    else if (rawStatus.includes('negotiation')) leadStatus = 'Negotiation';
    else if (rawStatus.includes('converted') || rawStatus.includes('won')) leadStatus = 'Converted';
    else if (rawStatus.includes('lost') || rawStatus.includes('unresponsive')) leadStatus = 'Lost';
    else leadStatus = 'New';

    const assignedSalesperson = lead.assignedSalesperson || 'Unassigned';
    const createdDate = lead.createdDate || lead.createdAt || new Date().toISOString();
    const lastContactedDate = lead.lastContactedDate || lead.lastContactedAt || null;
    const nextFollowUpDate = lead.nextFollowUpDate || null;

    const leadCategory: LeadCategory = lead.leadCategory || classifyLeadCategory(leadScore);
    const aiScoreAnalysis: AIScoreAnalysis = lead.aiScoreAnalysis || calculateHeuristicLeadScore({
      ...lead,
      companyName: company,
      company,
      contactPerson,
      name: contactPerson,
      email,
      phone,
      website,
      domain,
      city,
      country,
      industry: lead.industry,
      remarks,
      leadSource,
      leadStatus,
      leadScore,
      leadCategory,
    });

    return {
      ...lead,
      id: lead.id || `lead-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      companyName: company,
      company,
      contactPerson,
      name: contactPerson,
      title: lead.title || 'Executive',
      email,
      phone,
      website,
      domain,
      country,
      city,
      location: lead.location || `${city}, ${country}`,
      leadScore,
      aiScore: leadScore,
      leadCategory,
      aiScoreAnalysis,
      leadQuality,
      qualityTier: leadQuality,
      leadSource,
      aiResearchSummary: aiResearchSummary || aiScoreAnalysis.qualificationExplanation,
      aiSummary: aiResearchSummary || aiScoreAnalysis.qualificationExplanation,
      remarks,
      leadStatus,
      status: leadStatus,
      assignedSalesperson,
      createdDate,
      createdAt: createdDate,
      lastContactedDate,
      lastContactedAt: lastContactedDate || undefined,
      nextFollowUpDate,
      activities: Array.isArray(lead.activities) ? lead.activities : [],
      notes: Array.isArray(lead.notes) ? lead.notes : [],
      isDemo: Boolean(lead.isDemo),
    };
  }

  /**
   * Check for duplicate leads based on normalized company domain or email.
   */
  public findDuplicate(domainOrUrl?: string, email?: string, excludeId?: string): Lead | undefined {
    const targetDomain = normalizeDomain(domainOrUrl);
    const targetEmail = normalizeEmail(email);

    return this.leads.find((existing) => {
      if (excludeId && existing.id === excludeId) return false;

      // Check domain match if both have valid domain
      if (targetDomain && targetDomain.length > 2) {
        const existingDomain = normalizeDomain(existing.domain || existing.website);
        if (existingDomain && existingDomain === targetDomain) {
          return true;
        }
      }

      // Check email match if both have valid email
      if (targetEmail && targetEmail.includes('@')) {
        const existingEmail = normalizeEmail(existing.email);
        if (existingEmail && existingEmail === targetEmail) {
          return true;
        }
      }

      return false;
    });
  }

  public getLeads(): Lead[] {
    return this.getAllLeads();
  }

  public getAllLeads(filter?: {
    search?: string;
    status?: string;
    qualityTier?: string;
    industry?: string;
    location?: string;
    minScore?: number;
    maxScore?: number;
    salesperson?: string;
    sortBy?: 'leadScore' | 'createdDate' | 'companyName';
    sortOrder?: 'asc' | 'desc';
  }): Lead[] {
    this.ensureInitialized();
    let result = [...this.leads];

    if (filter) {
      if (filter.search) {
        const query = filter.search.toLowerCase().trim();
        result = result.filter(
          (l) =>
            l.companyName.toLowerCase().includes(query) ||
            l.contactPerson.toLowerCase().includes(query) ||
            l.email.toLowerCase().includes(query) ||
            (l.phone && l.phone.toLowerCase().includes(query)) ||
            (l.website && l.website.toLowerCase().includes(query)) ||
            l.city.toLowerCase().includes(query) ||
            l.country.toLowerCase().includes(query)
        );
      }

      if (filter.status && filter.status !== 'all') {
        const targetStatus = filter.status.toLowerCase();
        result = result.filter((l) => l.leadStatus.toLowerCase() === targetStatus || (l.status && l.status.toLowerCase() === targetStatus));
      }

      if (filter.qualityTier && filter.qualityTier !== 'all') {
        const targetTier = filter.qualityTier.toLowerCase();
        result = result.filter((l) => l.leadQuality.toLowerCase() === targetTier || (l.qualityTier && l.qualityTier.toLowerCase() === targetTier));
      }

      if (filter.industry && filter.industry !== 'all') {
        const ind = filter.industry.toLowerCase();
        result = result.filter((l) => l.industry.toLowerCase().includes(ind));
      }

      if (filter.location && filter.location !== 'all') {
        const loc = filter.location.toLowerCase();
        result = result.filter((l) => l.city.toLowerCase().includes(loc) || l.country.toLowerCase().includes(loc));
      }

      if (filter.salesperson && filter.salesperson !== 'all') {
        result = result.filter((l) => l.assignedSalesperson === filter.salesperson);
      }

      if (typeof filter.minScore === 'number') {
        result = result.filter((l) => l.leadScore >= filter.minScore!);
      }
      if (typeof filter.maxScore === 'number') {
        result = result.filter((l) => l.leadScore <= filter.maxScore!);
      }
    }

    // Sorting
    const sortField = filter?.sortBy || 'createdDate';
    const sortOrder = filter?.sortOrder || 'desc';

    return result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'leadScore') {
        comparison = b.leadScore - a.leadScore;
      } else if (sortField === 'companyName') {
        comparison = a.companyName.localeCompare(b.companyName);
      } else {
        // createdDate
        comparison = new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });
  }

  public getLeadById(id: string): Lead | undefined {
    this.ensureInitialized();
    return this.leads.find((l) => l.id === id);
  }

  public createLead(leadData: Partial<Lead>, actor = 'Sales Team'): { lead?: Lead; duplicateOf?: Lead; error?: string } {
    this.ensureInitialized();
    const company = (leadData.companyName || leadData.company || '').trim();

    if (!company) {
      return { error: 'Company Name is required.' };
    }

    // Check for duplicate lead
    const domainOrUrl = leadData.domain || leadData.website;
    const duplicate = this.findDuplicate(domainOrUrl, leadData.email);
    if (duplicate) {
      return {
        duplicateOf: duplicate,
        error: `Duplicate lead detected: A lead for "${duplicate.companyName}" (${duplicate.domain || duplicate.email}) already exists in the CRM database.`,
      };
    }

    const newLead = this.normalizeLeadStructure({
      ...leadData,
      id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdDate: new Date().toISOString(),
      activities: [
        {
          id: `act-${Date.now()}`,
          type: 'created',
          title: 'Lead Created',
          description: `Added to CRM database via ${leadData.leadSource || 'Manual Entry'}.`,
          actor,
          timestamp: new Date().toISOString(),
        },
      ],
      notes: leadData.remarks
        ? [
            {
              id: `note-${Date.now()}`,
              author: actor,
              content: leadData.remarks,
              createdAt: new Date().toISOString(),
            },
          ]
        : [],
    });

    this.leads.unshift(newLead);
    this.saveToDisk();
    return { lead: newLead };
  }

  public updateLead(id: string, updates: Partial<Lead>, actor = 'Sales Team'): { lead?: Lead; error?: string } {
    this.ensureInitialized();
    const index = this.leads.findIndex((l) => l.id === id);
    if (index === -1) {
      return { error: 'Lead not found.' };
    }

    const current = this.leads[index];

    // Check duplicate if domain or email is being updated
    if (updates.domain || updates.website || updates.email) {
      const duplicate = this.findDuplicate(updates.domain || updates.website, updates.email, id);
      if (duplicate) {
        return {
          error: `Cannot update: A lead for "${duplicate.companyName}" with that domain or email already exists.`,
        };
      }
    }

    // Log activities for meaningful updates
    const activities = [...(current.activities || [])];
    const notes = [...(current.notes || [])];

    if (updates.leadStatus && updates.leadStatus !== current.leadStatus) {
      activities.unshift({
        id: `act-${Date.now()}-status`,
        type: 'status_change',
        title: 'Status Updated',
        description: `Status changed from "${current.leadStatus}" to "${updates.leadStatus}".`,
        actor,
        timestamp: new Date().toISOString(),
      });
    }

    if (updates.assignedSalesperson && updates.assignedSalesperson !== current.assignedSalesperson) {
      activities.unshift({
        id: `act-${Date.now()}-assign`,
        type: 'assigned',
        title: 'Salesperson Reassigned',
        description: `Lead reassigned from "${current.assignedSalesperson}" to "${updates.assignedSalesperson}".`,
        actor,
        timestamp: new Date().toISOString(),
      });
    }

    if (updates.nextFollowUpDate && updates.nextFollowUpDate !== current.nextFollowUpDate) {
      activities.unshift({
        id: `act-${Date.now()}-followup`,
        type: 'follow_up_scheduled',
        title: 'Follow-up Date Scheduled',
        description: `Next contact set for ${new Date(updates.nextFollowUpDate).toLocaleDateString()}.`,
        actor,
        timestamp: new Date().toISOString(),
      });
    }

    // If new remark added via updates
    if (updates.remarks && updates.remarks !== current.remarks && !notes.some((n) => n.content === updates.remarks)) {
      notes.unshift({
        id: `note-${Date.now()}`,
        author: actor,
        content: updates.remarks,
        createdAt: new Date().toISOString(),
      });
      activities.unshift({
        id: `act-${Date.now()}-note`,
        type: 'note_added',
        title: 'Remark / Note Added',
        description: `New internal remark recorded: "${updates.remarks.slice(0, 60)}..."`,
        actor,
        timestamp: new Date().toISOString(),
      });
    }

    const updatedLead = this.normalizeLeadStructure({
      ...current,
      ...updates,
      activities,
      notes,
    });

    this.leads[index] = updatedLead;
    this.saveToDisk();
    return { lead: updatedLead };
  }

  public deleteLead(id: string): boolean {
    this.ensureInitialized();
    const initialLen = this.leads.length;
    this.leads = this.leads.filter((l) => l.id !== id);
    if (this.leads.length < initialLen) {
      this.saveToDisk();
      return true;
    }
    return false;
  }

  public bulkDeleteLeads(ids: string[]): number {
    this.ensureInitialized();
    const set = new Set(ids);
    const initialLen = this.leads.length;
    this.leads = this.leads.filter((l) => !set.has(l.id));
    const deletedCount = initialLen - this.leads.length;
    if (deletedCount > 0) {
      this.saveToDisk();
    }
    return deletedCount;
  }

  public bulkUpdateStatus(ids: string[], newStatus: LeadStatus, actor = 'Sales Team'): number {
    this.ensureInitialized();
    let updatedCount = 0;
    const now = new Date().toISOString();

    this.leads = this.leads.map((lead) => {
      if (ids.includes(lead.id)) {
        updatedCount++;
        const activities = [...(lead.activities || [])];
        activities.unshift({
          id: `act-${Date.now()}-${lead.id}`,
          type: 'status_change',
          title: 'Bulk Status Updated',
          description: `Status updated to "${newStatus}" via bulk action.`,
          actor,
          timestamp: now,
        });

        return this.normalizeLeadStructure({
          ...lead,
          leadStatus: newStatus,
          status: newStatus,
          activities,
        });
      }
      return lead;
    });

    if (updatedCount > 0) {
      this.saveToDisk();
    }
    return updatedCount;
  }

  public bulkAssignSalesperson(ids: string[], salesperson: string, actor = 'Sales Admin'): number {
    this.ensureInitialized();
    let updatedCount = 0;
    const now = new Date().toISOString();

    this.leads = this.leads.map((lead) => {
      if (ids.includes(lead.id)) {
        updatedCount++;
        const activities = [...(lead.activities || [])];
        activities.unshift({
          id: `act-${Date.now()}-${lead.id}`,
          type: 'assigned',
          title: 'Bulk Salesperson Assignment',
          description: `Assigned to ${salesperson} via bulk action.`,
          actor,
          timestamp: now,
        });

        return this.normalizeLeadStructure({
          ...lead,
          assignedSalesperson: salesperson,
          activities,
        });
      }
      return lead;
    });

    if (updatedCount > 0) {
      this.saveToDisk();
    }
    return updatedCount;
  }

  public addLeadNote(leadId: string, author: string, content: string): LeadNote | null {
    this.ensureInitialized();
    const lead = this.leads.find((l) => l.id === leadId);
    if (!lead) return null;

    const note: LeadNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      author: author || 'Sales Team',
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    lead.notes = lead.notes || [];
    lead.notes.unshift(note);
    lead.remarks = content.trim();

    lead.activities = lead.activities || [];
    lead.activities.unshift({
      id: `act-${Date.now()}`,
      type: 'note_added',
      title: 'Internal Note Added',
      description: `${author}: "${content.slice(0, 80)}${content.length > 80 ? '...' : ''}"`,
      actor: author,
      timestamp: note.createdAt,
    });

    this.saveToDisk();
    return note;
  }

  public async analyzeLead(leadId: string): Promise<Lead | undefined> {
    this.ensureInitialized();
    const index = this.leads.findIndex((l) => l.id === leadId);
    if (index === -1) return undefined;

    const current = this.leads[index];
    const analysis = await calculateLeadScoreWithGemini(current);

    const activities = [...(current.activities || [])];
    activities.unshift({
      id: `act-${Date.now()}-ai-score`,
      type: 'status_change',
      title: 'AI Lead Scoring Completed',
      description: `Gemini calculated Lead Score ${analysis.leadScore}/100 (${analysis.leadCategory}) across 7 predictive factors. Confidence: ${analysis.confidenceIndicator} (${analysis.confidenceScore}%).`,
      actor: 'Gemini AI',
      timestamp: new Date().toISOString(),
    });

    const updated = this.normalizeLeadStructure({
      ...current,
      leadScore: analysis.leadScore,
      aiScore: analysis.leadScore,
      leadCategory: analysis.leadCategory,
      aiScoreAnalysis: analysis,
      leadQuality: analysis.leadScore >= 80 ? 'High' : analysis.leadScore >= 60 ? 'Medium' : 'Low',
      qualityTier: analysis.leadScore >= 80 ? 'High' : analysis.leadScore >= 60 ? 'Medium' : 'Low',
      aiResearchSummary: analysis.qualificationExplanation,
      aiSummary: analysis.qualificationExplanation,
      activities,
    });

    this.leads[index] = updated;
    this.saveToDisk();
    return updated;
  }

  public async bulkAnalyzeLeads(leadIds: string[]): Promise<Lead[]> {
    this.ensureInitialized();
    const updatedLeads: Lead[] = [];

    for (const id of leadIds) {
      const updated = await this.analyzeLead(id);
      if (updated) {
        updatedLeads.push(updated);
      }
    }

    return updatedLeads;
  }

  public resetDemoData(): Lead[] {
    this.leads = INITIAL_CRM_LEADS.map(this.normalizeLeadStructure);
    this.saveToDisk();
    return this.leads;
  }

  public getPipelineSummary(): PipelineSummary {
    this.ensureInitialized();
    const totalLeads = this.leads.length;
    const newLeads = this.leads.filter((l) => l.leadStatus === 'New' || l.leadStatus === 'Not Contacted').length;
    const qualifiedLeads = this.leads.filter((l) => l.leadStatus === 'Qualified').length;
    const highQualityLeads = this.leads.filter((l) => l.leadQuality === 'High').length;
    const contactedLeads = this.leads.filter((l) => l.leadStatus === 'Contacted' || l.leadStatus === 'Interested').length;
    const convertedLeads = this.leads.filter((l) => l.leadStatus === 'Converted').length;
    const unresponsiveLeads = this.leads.filter((l) => l.leadStatus === 'Lost').length;
    const interestedLeads = this.leads.filter((l) => l.leadStatus === 'Interested').length;
    const negotiationLeads = this.leads.filter((l) => l.leadStatus === 'Negotiation').length;

    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 1000) / 10 : 0;
    const qualifiedRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 1000) / 10 : 0;
    const avgAiScore = totalLeads > 0 ? Math.round(this.leads.reduce((acc, curr) => acc + (curr.leadScore || curr.aiScore || 0), 0) / totalLeads) : 0;

    return {
      totalLeads,
      newLeads,
      qualifiedLeads,
      highQualityLeads,
      contactedLeads,
      convertedLeads,
      unresponsiveLeads,
      interestedLeads,
      negotiationLeads,
      conversionRate,
      qualifiedRate,
      avgAiScore,
    };
  }

  public getAcquisitionTrend(): AcquisitionDataPoint[] {
    return [
      { period: 'May', leadsAdded: 38, leadsQualified: 19, leadsConverted: 5 },
      { period: 'Jun', leadsAdded: 52, leadsQualified: 28, leadsConverted: 8 },
      { period: 'Jul', leadsAdded: 64, leadsQualified: 39, leadsConverted: 12 },
      { period: 'Aug', leadsAdded: 78, leadsQualified: 46, leadsConverted: 15 },
      { period: 'Sep', leadsAdded: 95, leadsQualified: 58, leadsConverted: 21 },
      { period: 'Oct', leadsAdded: 124, leadsQualified: 82, leadsConverted: 29 },
      { period: 'Nov (Current)', leadsAdded: 45, leadsQualified: 31, leadsConverted: 11 },
    ];
  }

  public getQualityBreakdown(): QualityBreakdown[] {
    this.ensureInitialized();
    const total = this.leads.length || 1;
    const high = this.leads.filter((l) => l.leadQuality === 'High').length;
    const medium = this.leads.filter((l) => l.leadQuality === 'Medium').length;
    const low = this.leads.filter((l) => l.leadQuality === 'Low').length;

    return [
      { tier: 'High', label: 'High Priority (Score 80-100)', count: high, percentage: Math.round((high / total) * 100) },
      { tier: 'Medium', label: 'Medium Priority (Score 60-79)', count: medium, percentage: Math.round((medium / total) * 100) },
      { tier: 'Low', label: 'Low Priority (Score < 60)', count: low, percentage: Math.round((low / total) * 100) },
    ];
  }
}

export const dataStore = new DataStore();
