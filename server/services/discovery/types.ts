export type TargetAudience = 'B2B' | 'B2C' | 'Any';
export type CompanySize = 'Small' | 'Medium' | 'Large' | 'Any';
export type WebsiteAvailability = 'with_website' | 'without_website' | 'any';

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

export type VerificationStatus = 'verified' | 'partially_verified' | 'unverified';

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
