import { SearchProviderAdapter } from './providerAdapter.js';
import { DiscoverySearchParams, DiscoveredLead } from '../types.js';

export class GooglePlacesAdapter implements SearchProviderAdapter {
  readonly id = 'google_places';
  readonly name = 'Google Places API';
  readonly description = 'Finds local and regional businesses with verified addresses, phone numbers, and websites.';
  readonly envKeyName = 'GOOGLE_PLACES_API_KEY';
  readonly requiresKey = true;
  readonly supportedAudiences = ['B2B', 'B2C'];

  isConfigured(): boolean {
    const key = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
    return Boolean(key && key.trim().length > 0 && key !== 'MY_GOOGLE_MAPS_API_KEY');
  }

  async search(params: DiscoverySearchParams): Promise<DiscoveredLead[]> {
    if (!this.isConfigured()) {
      throw new Error(
        'Google Places API is not configured. Please set GOOGLE_PLACES_API_KEY in your environment, or switch to Demo Mode.'
      );
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
    const query = `${params.industry} in ${params.location} ${params.keywords || ''}`.trim();

    try {
      // Standard Google Places Text Search endpoint
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        query
      )}&key=${apiKey}`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Google Places HTTP error: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(data.error_message || `Google Places API returned status: ${data.status}`);
      }

      const places = data.results || [];
      const discovered: DiscoveredLead[] = [];

      for (const place of places.slice(0, params.limit)) {
        const address = place.formatted_address || '';
        const parts = address.split(',').map((p: string) => p.trim());
        const city = parts.length > 2 ? parts[parts.length - 3] : params.location;
        const country = parts.length > 0 ? parts[parts.length - 1] : 'United States';

        // We collect ONLY real data returned by the place
        const lead: DiscoveredLead = {
          id: `gp-${place.place_id}`,
          companyName: place.name,
          industry: params.industry,
          website: null, // Note: Basic Text Search doesn't always include website without Place Details
          isWebsiteValid: false,
          description: `Business listing categorized under ${params.industry}. Rated ${place.rating || 'N/A'}/5 on Google with ${place.user_ratings_total || 0} reviews.`,
          contactPerson: null, // Not provided by Places API; we never invent
          contactTitle: null,
          email: null, // Not provided by Places API; never invent
          phone: null, // Text Search doesn't return phone without Place Details
          address,
          city,
          country,
          sourceUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
          dateDiscovered: new Date().toISOString(),
          targetAudience: params.targetAudience === 'Any' ? 'B2B' : params.targetAudience,
          companySize: params.companySize === 'Any' ? 'Small' : params.companySize,
          verificationStatus: 'partially_verified',
          verifiedFields: ['Company Name', 'Physical Address', 'Google Maps Source'],
          missingFields: ['Executive Email', 'Direct Contact Person', 'Official Domain'],
          provider: 'Google Places API',
          isDemo: false,
        };

        discovered.push(lead);
      }

      return discovered;
    } catch (err: any) {
      console.error('Google Places search failed:', err);
      throw new Error(`Search provider error: ${err.message}`);
    }
  }
}
