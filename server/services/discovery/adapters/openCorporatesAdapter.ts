import { SearchProviderAdapter } from './providerAdapter.js';
import { DiscoverySearchParams, DiscoveredLead } from '../types.js';

export class OpenCorporatesAdapter implements SearchProviderAdapter {
  readonly id = 'opencorporates';
  readonly name = 'OpenCorporates Global Registry';
  readonly description = 'Queries the world’s largest open database of official registered companies, corporate entities, and registered agents.';
  readonly envKeyName = 'OPENCORPORATES_API_KEY';
  readonly requiresKey = true;
  readonly supportedAudiences = ['B2B'];

  isConfigured(): boolean {
    const key = process.env.OPENCORPORATES_API_KEY;
    return Boolean(key && key.trim().length > 0 && key !== 'MY_OPENCORPORATES_KEY');
  }

  async search(params: DiscoverySearchParams): Promise<DiscoveredLead[]> {
    if (!this.isConfigured()) {
      throw new Error(
        'OpenCorporates API is not configured. Please set OPENCORPORATES_API_KEY in your environment, or switch to Demo Mode.'
      );
    }

    const apiKey = process.env.OPENCORPORATES_API_KEY;
    const query = `${params.industry} ${params.keywords || ''}`.trim();

    try {
      const url = `https://api.opencorporates.com/v0.4/companies/search?q=${encodeURIComponent(
        query
      )}&api_token=${apiKey}&per_page=${params.limit}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`OpenCorporates error: ${res.statusText}`);
      const json = await res.json();

      const companies = json.results?.companies || [];
      const discovered: DiscoveredLead[] = [];

      for (const item of companies) {
        const c = item.company;
        const verifiedFields = ['Registered Corporate Name', 'Official Jurisdiction Registry', 'Registry Source URL'];
        const missingFields = ['Direct Corporate Email', 'Executive Phone', 'Official Website'];

        discovered.push({
          id: `oc-${c.company_number || Math.random().toString(36).substr(2, 6)}`,
          companyName: c.name,
          industry: params.industry,
          website: null,
          isWebsiteValid: false,
          description: `Officially incorporated entity in ${c.jurisdiction_code?.toUpperCase() || 'USA'}. Registered company number: ${c.company_number}. Current status: ${c.current_status || 'Active'}.`,
          contactPerson: null,
          contactTitle: null,
          email: null,
          phone: null,
          address: c.registered_address_in_full || null,
          city: params.location,
          country: c.jurisdiction_code?.toUpperCase() || 'USA',
          sourceUrl: c.opencorporates_url || `https://opencorporates.com/companies/${c.jurisdiction_code}/${c.company_number}`,
          dateDiscovered: new Date().toISOString(),
          targetAudience: 'B2B',
          companySize: params.companySize === 'Any' ? 'Medium' : params.companySize,
          verificationStatus: 'verified',
          verifiedFields,
          missingFields,
          provider: 'OpenCorporates Registry',
          isDemo: false,
        });
      }

      return discovered;
    } catch (err: any) {
      console.error('OpenCorporates error:', err);
      throw new Error(`OpenCorporates provider error: ${err.message}`);
    }
  }
}
