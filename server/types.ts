export type LeadStatus =
  | 'New'
  | 'Not Contacted'
  | 'Contacted'
  | 'Interested'
  | 'Qualified'
  | 'Negotiation'
  | 'Converted'
  | 'Lost';

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
  // 19 Standard Database Fields
  id: string;                        // 1. Unique Lead ID
  companyName: string;               // 2. Company Name
  company?: string;                  // alias for backward compatibility
  industry: string;                  // 3. Industry
  contactPerson: string;             // 4. Contact Person
  name?: string;                     // alias for backward compatibility
  title?: string;                    // Job Title
  email: string;                     // 5. Email Address
  phone?: string;                    // 6. Phone Number
  website?: string;                  // 7. Website
  domain?: string;                   // alias for backward compatibility
  country: string;                   // 8. Country
  city: string;                      // 9. City
  location?: string;                 // Combined Location
  leadScore: number;                 // 10. Lead Score (0 - 100)
  aiScore?: number;                  // alias for backward compatibility
  leadQuality: QualityTier;          // 11. Lead Quality (High, Medium, Low)
  qualityTier?: QualityTier | 'high' | 'medium' | 'low'; // alias for backward compatibility
  leadSource: string;                // 12. Lead Source (e.g. Lead Discovery, Inbound, Manual Entry)
  aiResearchSummary?: string;        // 13. AI Research Summary
  aiSummary?: string;                // alias for backward compatibility
  remarks?: string;                  // 14. Remarks
  leadStatus: LeadStatus;            // 15. Lead Status (New, Not Contacted, Contacted, Interested, Qualified, Negotiation, Converted, Lost)
  status?: any;                      // alias for backward compatibility
  assignedSalesperson: string;       // 16. Assigned Salesperson
  createdDate: string;               // 17. Created Date
  createdAt?: string;                // alias for backward compatibility
  lastContactedDate?: string | null; // 18. Last Contacted Date
  lastContactedAt?: string;          // alias for backward compatibility
  nextFollowUpDate?: string | null;  // 19. Next Follow-up Date

  // AI Scoring Engine extensions
  leadCategory?: LeadCategory;
  aiScoreAnalysis?: AIScoreAnalysis;

  // Enhanced CRM tracking & history
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
  interestedLeads?: number;
  negotiationLeads?: number;
  conversionRate: number; // Percentage
  qualifiedRate: number; // Percentage
  avgAiScore: number;
}

export interface AcquisitionDataPoint {
  period: string;
  leadsAdded: number;
  leadsQualified: number;
  leadsConverted: number;
}

export interface QualityBreakdown {
  tier: 'High' | 'Medium' | 'Low' | 'high' | 'medium' | 'low';
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

