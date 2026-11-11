import { SearchProviderAdapter } from './providerAdapter.js';
import { DiscoverySearchParams, DiscoveredLead } from '../types.js';

export class SerpApiAdapter implements SearchProviderAdapter {
  readonly id = 'serpapi';
  readonly name = 'SerpApi Search Engine Provider';
  readonly description = 'Scrapes verified Google Local & Business Maps entries with official domains, phone numbers, and addresses.';
  readonly envKeyName = 'SERPAPI_API_KEY';
  readonly requiresKey = true;
  readonly supportedAudiences = ['B2B', 'B2C'];

  isConfigured(): boolean {
    const key = process.env.SERPAPI_API_KEY;
    return Boolean(key && key.trim().length > 0 && key !== 'MY_SERPAPI_API_KEY');
  }

  async search(params: DiscoverySearchParams): Promise<DiscoveredLead[]> {
    if (!this.isConfigured()) {
      throw new Error(
        'SerpApi is not configured. Please add SERPAPI_API_KEY to your environment or use the Demo Dataset provider.'
      );
    }

    const apiKey = process.env.SERPAPI_API_KEY;
    const query = `${params.industry} ${params.location} ${params.keywords || ''}`.trim();

    try {
      const url = `https://serpapi.com/search.json?engine=google_local&q=${encodeURIComponent(
        query
      )}&api_key=${apiKey}&hl=en&gl=us`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`SerpApi error: ${res.statusText}`);
      const json = await res.json();

      const results = json.local_results || [];
      const discovered: DiscoveredLead[] = [];

      for (const item of results.slice(0, params.limit)) {
        const website = item.website || null;
        const verifiedFields = ['Company Name', 'Search Source URL'];
        const missingFields: string[] = [];

        if (website) verifiedFields.push('Official Website');
        else missingFields.push('Official Website');

        if (item.phone) verifiedFields.push('Business Phone');
        else missingFields.push('Business Phone');

        if (item.address) verifiedFields.push('Physical Address');
        else missingFields.push('Physical Address');

        missingFields.push('Direct Executive Contact', 'Corporate Email');

        discovered.push({
          id: `serp-${item.place_id || Math.random().toString(36).substr(2, 6)}`,
          companyName: item.title,
          industry: item.type || params.industry,
          website,
          isWebsiteValid: Boolean(website),
          description: item.description || `Commercial listing discovered via Google Local for ${params.industry}.`,
          contactPerson: null, // Never invent
          contactTitle: null,
          email: null, // Never invent
          phone: item.phone || null,
          address: item.address || null,
          city: params.location,
          country: 'United States',
          sourceUrl: item.links?.website || item.link || 'https://google.com/search',
          dateDiscovered: new Date().toISOString(),
          targetAudience: params.targetAudience === 'Any' ? 'B2B' : params.targetAudience,
          companySize: params.companySize === 'Any' ? 'Medium' : params.companySize,
          verificationStatus: website && item.phone ? 'verified' : 'partially_verified',
          verifiedFields,
          missingFields,
          provider: 'SerpApi Google Engine',
          isDemo: false,
        });
      }

      return discovered;
    } catch (err: any) {
      console.error('SerpApi search error:', err);
      throw new Error(`SerpApi provider failed: ${err.message}`);
    }
  }
}
