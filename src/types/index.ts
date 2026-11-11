export type LeadStatus =
  | 'New'
  | 'Not Contacted'
  | 'Contacted'
  | 'Interested'
  | 'Qualified'
  | 'Negotiation'
  | 'Converted'
  | 'Lost'
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'converted'
  | 'unresponsive';

export type QualityTier = 'High' | 'Medium' | 'Low' | 'high' | 'medium' | 'low';
export type OutreachChannel = 'email' | 'whatsapp' | 'linkedin';

export interface LeadNote {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface LeadActivity {
  id: string;
  type: 'created' | 'status_change' | 'note_added' | 'outreach_sent' | 'assigned' | 'edited' | 'follow_up_scheduled';
  title: string;
  description: string;
  actor: string;
  timestamp: string;
}

export type LeadCategory = 'Hot Lead' | 'Warm Lead' | 'Potential Lead' | 'Cold Lead';

export interface ScoringFactor {
  factorKey: string;
  factorName: string;
  score: number;
  maxScore: number;
  explanation: string;
}

export interface ScoreBreakdown {
  industryRelevance: ScoringFactor;        // 0–20
  businessSizeAndPotential: ScoringFactor; // 0–15
  websiteAndOnlinePresence: ScoringFactor; // 0–10
  contactQuality: ScoringFactor;           // 0–15
  growthSignals: ScoringFactor;            // 0–15
  targetMarketRelevance: ScoringFactor;    // 0–15
  buyingIntentSignals: ScoringFactor;      // 0–10
}

export interface AIScoreAnalysis {
  leadScore: number;                       // 0–100 (sum of all 7 factors)
  leadCategory: LeadCategory;              // Hot Lead (80-100), Warm Lead (60-79), Potential Lead (40-59), Cold Lead (0-39)
  confidenceIndicator: 'High' | 'Medium' | 'Low';
  confidenceScore: number;                 // e.g. 88
  qualificationExplanation: string;        // Short rationale for the score based on actual available data
  scoreBreakdown: ScoreBreakdown;          // Comprehensive 7-factor breakdown
  businessOpportunities: string[];         // List of concrete commercial opportunities
  potentialCustomerNeeds: string[];        // List of likely customer needs
  recommendedSalesStrategy: string;        // Recommended consultative outreach approach
  mainRisks: string[];                     // Key risks or deal blockers
  missingInformation: string[];            // Missing or unverified data points
  recommendedNextAction: string;           // Actionable next step for sales rep
  scoredAt: string;                        // ISO timestamp of scoring
}

export interface Lead {
  // 19 Required Database Fields
  id: string;                        // 1. Unique Lead ID
  companyName: string;               // 2. Company Name
  company: string;                   // alias
  industry: string;                  // 3. Industry
  contactPerson: string;             // 4. Contact Person
  name: string;                      // alias
  title?: string;
  email: string;                     // 5. Email Address
  phone?: string;                    // 6. Phone Number
  website?: string;                  // 7. Website
  domain?: string;                   // alias
  country: string;                   // 8. Country
  city: string;                      // 9. City
  location?: string;
  leadScore: number;                 // 10. Lead Score (0 - 100)
  aiScore: number;                   // alias
  leadQuality: QualityTier;          // 11. Lead Quality
  qualityTier: QualityTier;          // alias
  leadSource: string;                // 12. Lead Source
  aiResearchSummary?: string;        // 13. AI Research Summary
  aiSummary?: string;                // alias
  remarks?: string;                  // 14. Remarks
  leadStatus: LeadStatus;            // 15. Lead Status
  status: LeadStatus;                // alias
  assignedSalesperson: string;       // 16. Assigned Salesperson
  createdDate: string;               // 17. Created Date
  createdAt: string;                 // alias
  lastContactedDate?: string | null; // 18. Last Contacted Date
  lastContactedAt?: string;          // alias
  nextFollowUpDate?: string | null;  // 19. Next Follow-up Date

  // AI Scoring Engine extensions
  leadCategory?: LeadCategory;
  aiScoreAnalysis?: AIScoreAnalysis;

  // Timeline & CRM details
  activities?: LeadActivity[];
  notes?: LeadNote[];
  aiTalkingPoints?: string[];
  keyChallenges?: string[];
  employeeCount?: string;
  annualRevenue?: string;
  linkedinUrl?: string;
  isDemo?: boolean;
}

export interface PipelineSummary {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  highQualityLeads: number;
  contactedLeads: number;
  convertedLeads: number;
  unresponsiveLeads: number;
  conversionRate: number;
  qualifiedRate: number;
  avgAiScore: number;
}

export interface AcquisitionDataPoint {
  period: string;
  leadsAdded: number;
  leadsQualified: number;
  leadsConverted: number;
}

export interface QualityBreakdown {
  tier: QualityTier;
  label: string;
  count: number;
  percentage: number;
}

export interface CompanyResearchDossier {
  companyName: string;
  domain: string;
  industry: string;
  summary: string;
  foundedYear?: string;
  headquarters?: string;
  estimatedRevenue?: string;
  techStack: string[];
  painPoints: string[];
  hiringSignals: string[];
  recommendedPitchAngle: string;
  icpFitRating: 'Exceptional' | 'Strong' | 'Moderate' | 'Poor';
}

export type NavigationItemKey =
  | 'overview'
  | 'find-leads'
  | 'all-leads'
  | 'ai-agents'
  | 'ai-research'
  | 'ai-assistant'
  | 'whatsapp-outreach'
  | 'follow-ups'
  | 'analytics'
  | 'settings';

export interface NavigationItem {
  key: NavigationItemKey;
  label: string;
  badge?: string | number;
}

export type TargetAudience = 'B2B' | 'B2C' | 'Any';
export type CompanySize = 'Small' | 'Medium' | 'Large' | 'Any';
export type WebsiteAvailability = 'with_website' | 'without_website' | 'any';
export type VerificationStatus = 'verified' | 'partially_verified' | 'unverified';

export interface DiscoverySearchParams {
  industry: string;
  location: string;
  targetAudience: TargetAudience;
  companySize: CompanySize;
  limit: 10 | 25 | 50 | 100;
  keywords?: string;
  websiteAvailability: WebsiteAvailability;
  providerId?: string;
}

export interface DiscoveredLead {
  id: string;
  companyName: string;
  industry: string;
  website: string | null;
  isWebsiteValid: boolean;
  description: string;
  contactPerson: string | null;
  contactTitle: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string;
  state?: string | null;
  country: string;
  sourceUrl: string;
  dateDiscovered: string;
  targetAudience: 'B2B' | 'B2C';
  companySize: 'Small' | 'Medium' | 'Large';
  verificationStatus: VerificationStatus;
  verifiedFields: string[];
  missingFields: string[];
  isSavedToCrm?: boolean;
  provider: string;
  isDemo?: boolean;
}

export interface DiscoveryProviderStatus {
  id: string;
  name: string;
  isConfigured: boolean;
  requiresKey: boolean;
  envKeyName?: string;
  description: string;
  supportedAudiences: string[];
}

export interface DiscoverySearchResponse {
  success: boolean;
  provider: string;
  isDemoMode: boolean;
  totalFound: number;
  results: DiscoveredLead[];
  searchParams: DiscoverySearchParams;
  executionTimeMs: number;
  error?: string;
  configurationNotice?: string;
}

// AI Agent Subsystem Types
export type AgentId =
  | 'lead_researcher'
  | 'lead_qualifier'
  | 'sales_strategist'
  | 'crm_manager';

export type AgentStatus = 'idle' | 'running' | 'paused' | 'error';

export interface AgentInfo {
  id: AgentId;
  name: string;
  role: string;
  description: string;
  status: AgentStatus;
  currentTask: string;
  progressPercent: number;
  processedLeads: number;
  successCount: number;
  failureCount: number;
  lastRunAt: string | null;
  capabilities: string[];
}

export type StepStatus =
  | 'pending'
  | 'running'
  | 'waiting_approval'
  | 'completed'
  | 'failed'
  | 'skipped';

export interface WorkflowStep {
  id: string;
  stepIndex: number;
  title: string;
  agentId: AgentId;
  toolName: string;
  inputArgs: Record<string, any>;
  status: StepStatus;
  outputSummary?: string;
  outputData?: any;
  requiresApproval?: boolean;
  isApproved?: boolean;
  approvedBy?: string;
  approvedAt?: string;
  retryCount: number;
  maxRetries: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export type TaskStatus =
  | 'queued'
  | 'running'
  | 'waiting_approval'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface WorkflowTask {
  id: string;
  prompt: string;
  planSummary: string;
  selectedAgents: AgentId[];
  status: TaskStatus;
  steps: WorkflowStep[];
  currentStepIndex: number;
  finalReport?: string;
  deliverables?: {
    discoveredLeadCount?: number;
    qualifiedLeadCount?: number;
    strategiesGenerated?: number;
    duplicatesFound?: number;
    recordsUpdated?: number;
    data?: any;
  };
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface AgentAuditLog {
  id: string;
  timestamp: string;
  taskId?: string;
  stepId?: string;
  agentId: AgentId | 'orchestrator';
  toolName?: string;
  action: string;
  details: string;
  level: 'info' | 'warn' | 'error';
  requiresApproval?: boolean;
  wasApproved?: boolean;
}

export interface ApprovalRequest {
  id: string;
  taskId: string;
  stepId: string;
  agentId: AgentId;
  actionType: string;
  description: string;
  payload: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  decidedAt?: string;
  decidedBy?: string;
}

// Chatbot Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  referencedLeads?: Lead[];
  suggestedQuestions?: string[];
  actionExecuted?: {
    toolName: string;
    description: string;
    success: boolean;
    requiresConfirmation?: boolean;
    pendingAction?: {
      actionType: 'update_remarks' | 'create_followup' | 'analyze_lead';
      leadId: string;
      leadName: string;
      payload: any;
    };
  };
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface ChatbotRequest {
  message: string;
  sessionId?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  confirmedAction?: {
    actionType: string;
    payload: any;
  };
}

export interface ChatbotResponse {
  success: boolean;
  message: ChatMessage;
  sessionId: string;
  error?: string;
}

// WhatsApp Outreach Module Types
export type WhatsAppMessageStyle =
  | 'intro'
  | 'pitch'
  | 'followup'
  | 'partnership'
  | 'meeting';

export interface GeneratedWhatsAppMessage {
  style: WhatsAppMessageStyle;
  styleLabel: string;
  messageText: string;
  callToAction: string;
  charCount: number;
}

export interface PhoneNormalizationResult {
  raw: string;
  isValid: boolean;
  e164Digits: string;
  formattedDisplay: string;
  country: string;
  detectedDialCode?: string;
  validationError?: string;
}

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

export interface WhatsAppMetrics {
  totalLeads: number;
  withValidPhoneCount: number;
  contactedCount: number;
  overdueCount: number;
  hotLeadsWithPhoneCount: number;
  cloudApiConfigured: boolean;
}

// Analytics and Reporting Module Types
export type AnalyticsTimeframe = 'today' | '7d' | '30d' | '90d' | 'custom' | 'all';

export interface AnalyticsFilterOptions {
  timeframe?: AnalyticsTimeframe;
  startDate?: string;
  endDate?: string;
  industry?: string;
  country?: string;
}

export interface AnalyticsMetrics {
  totalLeads: number;
  newLeadsThisMonth: number;
  hotLeads: number;
  warmLeads: number;
  qualifiedLeads: number;
  contactedLeads: number;
  convertedLeads: number;
  conversionRate: number;
  avgLeadScore: number;
  followUpsPending: number;
  overdueFollowUps: number;
}

export interface TimelineDataPoint {
  period: string;
  date: string;
  leadsAdded: number;
  cumulativeLeads: number;
  qualifiedCount: number;
}

export interface IndustryStat {
  industry: string;
  count: number;
  percentage: number;
  avgScore: number;
  convertedCount: number;
  conversionRate: number;
}

export interface CountryStat {
  country: string;
  count: number;
  percentage: number;
  qualifiedCount: number;
  conversionRate: number;
}

export interface QualityTierStat {
  tier: string;
  label: string;
  count: number;
  percentage: number;
  scoreRange: string;
  color: string;
}

export interface StatusStat {
  status: LeadStatus;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ConversionTrendPoint {
  period: string;
  totalLeads: number;
  convertedCount: number;
  conversionRate: number;
}

export interface LeadSourceStat {
  source: string;
  totalLeads: number;
  avgScore: number;
  contactedCount: number;
  convertedCount: number;
  conversionRate: number;
}

export interface FunnelStage {
  stage: string;
  label: string;
  description: string;
  count: number;
  percentageOfTotal: number;
  stepConversionRate: number;
  dropOffCount: number;
  color: string;
}

export interface DetailedAnalyticsResult {
  filtersApplied: AnalyticsFilterOptions;
  dateRangeLabel: string;
  metrics: AnalyticsMetrics;
  charts: {
    leadsOverTime: TimelineDataPoint[];
    byIndustry: IndustryStat[];
    byCountry: CountryStat[];
    qualityDistribution: QualityTierStat[];
    statusDistribution: StatusStat[];
    monthlyConversionTrend: ConversionTrendPoint[];
    sourcePerformance: LeadSourceStat[];
    salesFunnel: FunnelStage[];
  };
  availableIndustries: string[];
  availableCountries: string[];
  filteredLeadsCount: number;
  totalDatabaseLeadsCount: number;
}

export interface AIAnalyticsInsight {
  question: string;
  answer: string;
  keyFindings: string[];
  actionItems: string[];
  analyzedAt: string;
}





