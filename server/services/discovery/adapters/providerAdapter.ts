import { DiscoverySearchParams, DiscoveredLead } from '../types.js';

export interface SearchProviderAdapter {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly envKeyName?: string;
  readonly requiresKey: boolean;
  readonly supportedAudiences: string[];

  isConfigured(): boolean;
  search(params: DiscoverySearchParams): Promise<DiscoveredLead[]>;
}
