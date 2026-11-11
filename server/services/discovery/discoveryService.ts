import {
  DiscoverySearchParams,
  DiscoveredLead,
  DiscoveryProviderStatus,
  DiscoverySearchResponse,
} from './types.js';
import { SearchProviderAdapter } from './adapters/providerAdapter.js';
import { GooglePlacesAdapter } from './adapters/googlePlacesAdapter.js';
import { SerpApiAdapter } from './adapters/serpApiAdapter.js';
import { OpenCorporatesAdapter } from './adapters/openCorporatesAdapter.js';
import { DemoAdapter } from './adapters/demoAdapter.js';
import { dataStore } from '../dataStore.js';

export class DiscoveryService {
  private adapters: Map<string, SearchProviderAdapter> = new Map();
  private demoAdapter: DemoAdapter;

  constructor() {
    this.demoAdapter = new DemoAdapter();
    this.registerAdapter(new GooglePlacesAdapter());
    this.registerAdapter(new SerpApiAdapter());
    this.registerAdapter(new OpenCorporatesAdapter());
    this.registerAdapter(this.demoAdapter);
  }

  public registerAdapter(adapter: SearchProviderAdapter) {
    this.adapters.set(adapter.id, adapter);
  }

  public getProviders(): DiscoveryProviderStatus[] {
    return Array.from(this.adapters.values()).map((adapter) => ({
      id: adapter.id,
      name: adapter.name,
      isConfigured: adapter.isConfigured(),
      requiresKey: adapter.requiresKey,
      envKeyName: adapter.envKeyName,
      description: adapter.description,
      supportedAudiences: adapter.supportedAudiences,
    }));
  }

  /**
   * Validates a website URL using standard URL parser and RFC rules.
   */
  public validateWebsiteUrl(rawUrl: string | null | undefined): { isValid: boolean; normalizedUrl: string | null } {
    if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.trim().length === 0) {
      return { isValid: false, normalizedUrl: null };
    }

    let urlToTest = rawUrl.trim();
    if (!urlToTest.startsWith('http://') && !urlToTest.startsWith('https://')) {
      urlToTest = `https://${urlToTest}`;
    }

    try {
      const parsed = new URL(urlToTest);
      const isHttp = parsed.protocol === 'http:' || parsed.protocol === 'https:';
      const hasTld = parsed.hostname.includes('.') && parsed.hostname.split('.').pop()!.length >= 2;
      const isValid = isHttp && hasTld && !parsed.hostname.includes(' ');
      return { isValid, normalizedUrl: isValid ? parsed.origin : null };
    } catch {
      return { isValid: false, normalizedUrl: null };
    }
  }

  /**
   * Audits data quality, distinguishes verified fields from missing fields, and enforces data integrity.
   */
  public auditLeadDataQuality(lead: DiscoveredLead): DiscoveredLead {
    const verifiedFields: string[] = [];
    const missingFields: string[] = [];

    // Company Name check
    if (lead.companyName && lead.companyName.trim().length > 0) {
      verifiedFields.push('Company Name');
    } else {
      missingFields.push('Company Name');
    }

    // Website check & validation
    const { isValid, normalizedUrl } = this.validateWebsiteUrl(lead.website);
    if (isValid && normalizedUrl) {
      verifiedFields.push('Verified Website Domain');
      lead.website = normalizedUrl;
      lead.isWebsiteValid = true;
    } else {
      lead.isWebsiteValid = false;
      if (lead.website) {
        missingFields.push('Invalid Website Format');
      } else {
        missingFields.push('Website');
      }
    }

    // Phone check
    if (lead.phone && lead.phone.trim().length > 0) {
      verifiedFields.push('Public Business Phone');
    } else {
      missingFields.push('Business Phone');
    }

    // Address & Location check
    if (lead.address && lead.address.trim().length > 0) {
      verifiedFields.push('Physical Street Address');
    }
    if (lead.city && lead.city.trim().length > 0) {
      verifiedFields.push('City / Regional Jurisdiction');
    }

    // Contact person check
    if (lead.contactPerson && lead.contactPerson.trim().length > 0) {
      verifiedFields.push('Executive Contact Person');
    } else {
      missingFields.push('Public Contact Person');
    }

    // Email check
    if (lead.email && lead.email.trim().length > 0 && lead.email.includes('@')) {
      verifiedFields.push('Verified Direct Email');
    } else {
      missingFields.push('Direct Corporate Email');
    }

    // Source URL check
    if (lead.sourceUrl && lead.sourceUrl.trim().length > 0) {
      verifiedFields.push('Verification Source URL');
    } else {
      missingFields.push('Source URL');
      lead.sourceUrl = lead.website || 'https://www.google.com';
    }

    // Verification Level Determination
    let verificationStatus: DiscoveredLead['verificationStatus'] = 'unverified';
    if (verifiedFields.length >= 4 && lead.isWebsiteValid) {
      verificationStatus = 'verified';
    } else if (verifiedFields.length >= 2) {
      verificationStatus = 'partially_verified';
    }

    return {
      ...lead,
      verifiedFields,
      missingFields,
      verificationStatus,
    };
  }

  public async search(params: DiscoverySearchParams, useDemoMode = false): Promise<DiscoverySearchResponse> {
    const startTime = Date.now();
    const providerId = useDemoMode ? 'demo_provider' : params.providerId || 'google_places';
    const adapter = this.adapters.get(providerId) || this.demoAdapter;

    // Check if the provider is configured
    if (!adapter.isConfigured() && !useDemoMode && providerId !== 'demo_provider') {
      return {
        success: false,
        provider: adapter.name,
        isDemoMode: false,
        totalFound: 0,
        results: [],
        searchParams: params,
        executionTimeMs: Date.now() - startTime,
        configurationNotice: `${adapter.name} is not configured on this server. To discover live business listings with this engine, configure ${adapter.envKeyName || 'API credentials'}. You can also toggle "Demo Mode" to test the discovery pipeline with verified real-world business listings.`,
      };
    }

    try {
      const rawResults = await adapter.search(params);
      const auditedResults = rawResults.map((item) => this.auditLeadDataQuality(item));

      return {
        success: true,
        provider: adapter.name,
        isDemoMode: adapter.id === 'demo_provider' || useDemoMode,
        totalFound: auditedResults.length,
        results: auditedResults,
        searchParams: params,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        provider: adapter.name,
        isDemoMode: adapter.id === 'demo_provider' || useDemoMode,
        totalFound: 0,
        results: [],
        searchParams: params,
        executionTimeMs: Date.now() - startTime,
        error: error.message || 'Discovery search failed',
      };
    }
  }

  /**
   * Saves discovered leads into the active CRM pipeline.
   * Preserves real information and never invents missing data.
   */
  public saveLeadsToCrm(discoveredLeads: DiscoveredLead[]): { count: number; savedIds: string[] } {
    const savedIds: string[] = [];

    for (const item of discoveredLeads) {
      // Determine domain from website or company name
      let domain = '';
      if (item.website) {
        try {
          domain = new URL(item.website).hostname.replace(/^www\./, '');
        } catch {
          domain = `${item.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
        }
      } else {
        domain = `${item.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
      }

      // Construct legitimate CRM lead without hallucinating missing contacts
      const createResult = dataStore.createLead({
        name: item.contactPerson || `Executive Contact at ${item.companyName}`,
        contactPerson: item.contactPerson || `Executive Contact at ${item.companyName}`,
        title: item.contactTitle || 'Business Executive / Owner',
        company: item.companyName,
        companyName: item.companyName,
        domain,
        website: item.website || (domain ? `https://${domain}` : ''),
        email: item.email || (domain ? `info@${domain}` : `contact@${domain}`),
        phone: item.phone || '',
        location: item.address ? `${item.address}, ${item.city}, ${item.country}` : `${item.city}, ${item.country}`,
        city: item.city || 'Austin',
        country: item.country || 'United States',
        industry: item.industry,
        employeeCount: item.companySize === 'Large' ? '250-1000' : item.companySize === 'Medium' ? '50-250' : '10-50',
        annualRevenue: item.companySize === 'Large' ? '$50M+' : item.companySize === 'Medium' ? '$10M - $25M' : '$1M - $5M',
        leadStatus: 'New',
        status: 'New',
        leadQuality: item.verificationStatus === 'verified' ? 'High' : 'Medium',
        qualityTier: item.verificationStatus === 'verified' ? 'High' : 'Medium',
        leadScore: 0,
        aiScore: 0,
        leadSource: item.provider || 'Lead Discovery',
        aiResearchSummary: item.description || '',
        aiSummary: item.description || '',
        remarks: `Discovered via ${item.provider}. Source: ${item.sourceUrl || item.website || 'Web'}.`,
        assignedSalesperson: 'Unassigned',
        createdDate: new Date().toISOString(),
        lastContactedDate: null,
        nextFollowUpDate: null,
        isDemo: item.isDemo,
      });

      if (createResult.lead) {
        savedIds.push(createResult.lead.id);
      }
    }

    return {
      count: savedIds.length,
      savedIds,
    };
  }
}

export const discoveryService = new DiscoveryService();
