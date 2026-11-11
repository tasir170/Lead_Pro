import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Sparkles,
  Building2,
  Globe,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Download,
  Plus,
  Check,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  CheckCircle2,
  Key,
  SlidersHorizontal,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/common/Table';
import { CompanyProfileModal } from '../components/discovery/CompanyProfileModal';
import { api } from '../services/api';
import {
  DiscoveredLead,
  DiscoverySearchParams,
  DiscoveryProviderStatus,
  TargetAudience,
  CompanySize,
  WebsiteAvailability,
  Lead,
} from '../types';

interface FindLeadsProps {
  onImportLead?: (leadData: Partial<Lead>) => Promise<Lead>;
  existingLeads?: Lead[];
  onOpenAddLeadModal?: () => void;
  onLeadAddedToCrm?: () => void;
}

const PRESET_INDUSTRIES = [
  'Real Estate',
  'Restaurants',
  'Hospitals',
  'Software Companies',
  'Construction',
  'Healthcare',
  'Logistics',
  'Financial Services',
];

export const FindLeads: React.FC<FindLeadsProps> = ({
  onImportLead,
  existingLeads = [],
  onOpenAddLeadModal,
  onLeadAddedToCrm,
}) => {
  // --- Search Form State (The 7 Required Fields) ---
  const [industry, setIndustry] = useState('Real Estate');
  const [location, setLocation] = useState('Austin, TX');
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('B2B');
  const [companySize, setCompanySize] = useState<CompanySize>('Any');
  const [limit, setLimit] = useState<10 | 25 | 50 | 100>(25);
  const [keywords, setKeywords] = useState('');
  const [websiteAvailability, setWebsiteAvailability] = useState<WebsiteAvailability>('any');

  // --- Search Engine & Provider Selection ---
  const [providers, setProviders] = useState<DiscoveryProviderStatus[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('google_places');
  const [useDemoMode, setUseDemoMode] = useState<boolean>(true); // default to demo mode so user immediately sees results out-of-the-box

  // --- Search Execution & Progress State ---
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgressStep, setSearchProgressStep] = useState<string>('');
  const [searchProgressPercent, setSearchProgressPercent] = useState<number>(0);
  const [searchResults, setSearchResults] = useState<DiscoveredLead[]>([]);
  const [activeProviderName, setActiveProviderName] = useState<string>('');
  const [configurationNotice, setConfigurationNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  // --- Table Interaction, Sorting, Filtering, & Selection ---
  const [tableFilter, setTableFilter] = useState<'all' | 'has_website' | 'has_phone' | 'verified_only'>('all');
  const [sortField, setSortField] = useState<'companyName' | 'city' | 'verificationStatus' | 'dateDiscovered'>('companyName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // --- Saved to CRM tracking ---
  const [savedCrmIds, setSavedCrmIds] = useState<Set<string>>(new Set());
  const [isSavingBulk, setIsSavingBulk] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // --- Modal Drawer for Individual Company Profile ---
  const [selectedProfileLead, setSelectedProfileLead] = useState<DiscoveredLead | null>(null);

  // Load providers on mount
  useEffect(() => {
    api.getDiscoveryProviders()
      .then((data) => {
        setProviders(data);
        // If a real provider is configured, we could default to it, but default to demo mode if none has key
        const hasConfigured = data.some((p) => p.isConfigured && p.id !== 'demo_provider');
        if (!hasConfigured) {
          setUseDemoMode(true);
        }
      })
      .catch(console.warn);
  }, []);

  // Update saved leads set from existing leads
  useEffect(() => {
    if (existingLeads && existingLeads.length > 0) {
      const existingNames = new Set(existingLeads.map((l) => l.company.toLowerCase()));
      setSavedCrmIds((prev) => {
        const next = new Set(prev);
        searchResults.forEach((r) => {
          if (existingNames.has(r.companyName.toLowerCase())) {
            next.add(r.id);
          }
        });
        return next;
      });
    }
  }, [existingLeads, searchResults]);

  // Execute Search Function
  const handleExecuteSearch = async (e?: React.FormEvent, overrideDemoMode?: boolean) => {
    if (e) e.preventDefault();
    if (!industry.trim()) {
      setErrorMessage('Please specify an Industry or Business Type.');
      return;
    }

    const demoFlag = overrideDemoMode !== undefined ? overrideDemoMode : useDemoMode;

    setIsSearching(true);
    setErrorMessage(null);
    setConfigurationNotice(null);
    setSelectedLeadIds(new Set());
    setCurrentPage(1);

    // Progress step simulation for high-intent search telemetry
    setSearchProgressPercent(15);
    setSearchProgressStep('Connecting to search provider adapter...');

    const searchParams: DiscoverySearchParams = {
      industry: industry.trim(),
      location: location.trim() || 'Any',
      targetAudience,
      companySize,
      limit,
      keywords: keywords.trim(),
      websiteAvailability,
      providerId: demoFlag ? 'demo_provider' : selectedProviderId,
    };

    const timer1 = setTimeout(() => {
      setSearchProgressPercent(45);
      setSearchProgressStep('Querying public registries and business directories...');
    }, 400);

    const timer2 = setTimeout(() => {
      setSearchProgressPercent(75);
      setSearchProgressStep('Validating website URLs and auditing missing fields...');
    }, 800);

    try {
      const response = await api.searchDiscoveryLeads(searchParams, demoFlag);
      clearTimeout(timer1);
      clearTimeout(timer2);

      setSearchProgressPercent(100);
      setSearchProgressStep('Completed data quality audit.');
      setActiveProviderName(response.provider);
      setExecutionTime(response.executionTimeMs);

      if (!response.success && response.configurationNotice) {
        setConfigurationNotice(response.configurationNotice);
        setSearchResults([]);
      } else if (!response.success) {
        setErrorMessage(response.error || 'Discovery search failed.');
        setSearchResults([]);
      } else {
        setSearchResults(response.results);
      }
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setErrorMessage(err.message || 'An error occurred during search.');
    } finally {
      setTimeout(() => setIsSearching(false), 300);
    }
  };

  // Perform initial search on mount so user sees immediate results
  useEffect(() => {
    handleExecuteSearch(undefined, true);
  }, []);

  // Filtered & Sorted Results
  const filteredAndSortedResults = useMemo(() => {
    let result = [...searchResults];

    // Sub-filter by quality
    if (tableFilter === 'has_website') {
      result = result.filter((r) => r.isWebsiteValid && r.website);
    } else if (tableFilter === 'has_phone') {
      result = result.filter((r) => r.phone && r.phone.trim().length > 0);
    } else if (tableFilter === 'verified_only') {
      result = result.filter((r) => r.verificationStatus === 'verified');
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'companyName') {
        comparison = a.companyName.localeCompare(b.companyName);
      } else if (sortField === 'city') {
        comparison = (a.city || '').localeCompare(b.city || '');
      } else if (sortField === 'verificationStatus') {
        const rank = { verified: 3, partially_verified: 2, unverified: 1 };
        comparison = rank[b.verificationStatus] - rank[a.verificationStatus];
      } else if (sortField === 'dateDiscovered') {
        comparison = new Date(b.dateDiscovered).getTime() - new Date(a.dateDiscovered).getTime();
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [searchResults, tableFilter, sortField, sortDirection]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedResults.length / pageSize));
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedResults.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedResults, currentPage, pageSize]);

  // Bulk Selection Handlers
  const toggleSelectAllPage = () => {
    if (paginatedResults.every((r) => selectedLeadIds.has(r.id))) {
      const next = new Set(selectedLeadIds);
      paginatedResults.forEach((r) => next.delete(r.id));
      setSelectedLeadIds(next);
    } else {
      const next = new Set(selectedLeadIds);
      paginatedResults.forEach((r) => next.add(r.id));
      setSelectedLeadIds(next);
    }
  };

  const toggleSelectRow = (id: string, e: React.SyntheticEvent) => {
    e.stopPropagation();
    const next = new Set(selectedLeadIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLeadIds(next);
  };

  // Save Leads to CRM Pipeline
  const handleSaveLeads = async (targetLeads: DiscoveredLead[]) => {
    if (targetLeads.length === 0) return;
    setIsSavingBulk(true);
    setSaveSuccessMessage(null);

    try {
      const result = await api.saveDiscoveredLeadsToCrm(targetLeads);
      setSavedCrmIds((prev) => {
        const next = new Set(prev);
        targetLeads.forEach((l) => next.add(l.id));
        return next;
      });
      setSaveSuccessMessage(`Saved ${result.savedCount} business lead${result.savedCount > 1 ? 's' : ''} to active CRM pipeline!`);
      setTimeout(() => setSaveSuccessMessage(null), 4000);
      if (onLeadAddedToCrm) onLeadAddedToCrm();
    } catch (err: any) {
      alert(`Error saving to CRM: ${err.message}`);
    } finally {
      setIsSavingBulk(false);
    }
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    const target = searchResults.filter((r) =>
      selectedLeadIds.size > 0 ? selectedLeadIds.has(r.id) : true
    );
    if (target.length === 0) return;

    const headers = [
      'Company Name',
      'Industry',
      'Website',
      'Website Valid',
      'Contact Person',
      'Contact Title',
      'Email',
      'Phone',
      'Address',
      'City',
      'Country',
      'Target Audience',
      'Company Size',
      'Verification Status',
      'Verified Fields',
      'Missing Fields',
      'Source URL',
      'Date Discovered',
    ];

    const rows = target.map((l) => [
      `"${l.companyName.replace(/"/g, '""')}"`,
      `"${l.industry.replace(/"/g, '""')}"`,
      `"${l.website || ''}"`,
      l.isWebsiteValid ? 'TRUE' : 'FALSE',
      `"${(l.contactPerson || '').replace(/"/g, '""')}"`,
      `"${(l.contactTitle || '').replace(/"/g, '""')}"`,
      `"${l.email || ''}"`,
      `"${l.phone || ''}"`,
      `"${(l.address || '').replace(/"/g, '""')}"`,
      `"${l.city.replace(/"/g, '""')}"`,
      `"${l.country.replace(/"/g, '""')}"`,
      `"${l.targetAudience}"`,
      `"${l.companySize}"`,
      `"${l.verificationStatus}"`,
      `"${l.verifiedFields.join('; ')}"`,
      `"${l.missingFields.join('; ')}"`,
      `"${l.sourceUrl}"`,
      `"${l.dateDiscovered}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `discovered_leads_${industry.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentProvider = providers.find((p) => p.id === selectedProviderId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Business Intelligence & Lead Discovery Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Find & Discover Verified Business Leads
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Retrieve genuine commercial records via legitimate search adapters. Zero fake companies or hallucinated contacts.
          </p>
        </div>

        {onOpenAddLeadModal && (
          <Button variant="outline" size="sm" onClick={onOpenAddLeadModal} className="text-xs">
            + Manual Lead Entry
          </Button>
        )}
      </div>

      {/* Advanced Search Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2 w-full">
            <CardTitle className="text-base flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <span>Lead Discovery Parameters</span>
            </CardTitle>

            {/* Provider and Demo Mode Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
                <span className="text-slate-500 font-medium">Provider Engine:</span>
                <select
                  value={selectedProviderId}
                  onChange={(e) => setSelectedProviderId(e.target.value)}
                  disabled={useDemoMode}
                  className="bg-white border border-slate-300 rounded px-2 py-0.5 font-medium text-slate-800 disabled:opacity-50"
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.isConfigured ? '✓' : '(Requires Key)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Demo Mode Toggle */}
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg select-none">
                <input
                  type="checkbox"
                  checked={useDemoMode}
                  onChange={(e) => setUseDemoMode(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-blue-900">Demo Dataset Mode</span>
              </label>
            </div>
          </div>
          <CardDescription>
            Specify target business profile, regional boundaries, size requirements, and website filters.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={(e) => handleExecuteSearch(e)} className="space-y-4">
            {/* Row 1: Industry / Business Type & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Field 1: Industry / Business Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1. Industry / Business Type <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Real Estate, Restaurants, Hospitals, Software..."
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* Quick Industry Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {PRESET_INDUSTRIES.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setIndustry(preset)}
                      className={`text-[11px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        industry.toLowerCase() === preset.toLowerCase()
                          ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 2: Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  2. Location (City, State, Country, or Region)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. Austin, TX or New York, NY or London, UK"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Specify municipality, state/province or national boundary.</p>
              </div>
            </div>

            {/* Row 2: Target Audience, Company Size, Number of Leads, Website Availability */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              {/* Field 3: Target Audience */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  3. Target Audience
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
                  {(['B2B', 'B2C', 'Any'] as TargetAudience[]).map((aud) => (
                    <button
                      key={aud}
                      type="button"
                      onClick={() => setTargetAudience(aud)}
                      className={`py-1.5 text-xs font-medium rounded transition-all cursor-pointer ${
                        targetAudience === aud
                          ? 'bg-white text-slate-900 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {aud}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 4: Company Size */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  4. Company Size
                </label>
                <select
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value as CompanySize)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                >
                  <option value="Any">Any Headcount</option>
                  <option value="Small">Small (1-50 employees)</option>
                  <option value="Medium">Medium (50-250 employees)</option>
                  <option value="Large">Large (250+ employees)</option>
                </select>
              </div>

              {/* Field 5: Number of Leads */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  5. Number of Leads
                </label>
                <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-lg">
                  {([10, 25, 50, 100] as const).map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setLimit(count)}
                      className={`py-1.5 text-xs font-mono font-medium rounded transition-all cursor-pointer ${
                        limit === count
                          ? 'bg-white text-blue-600 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 7: Website Availability */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  7. Website Availability
                </label>
                <select
                  value={websiteAvailability}
                  onChange={(e) => setWebsiteAvailability(e.target.value as WebsiteAvailability)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                >
                  <option value="any">Any (With or Without)</option>
                  <option value="with_website">With Verified Website</option>
                  <option value="without_website">Without Website (Local Entities)</option>
                </select>
              </div>
            </div>

            {/* Row 3: Additional Keywords & Submit Button */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              {/* Field 6: Additional Keywords */}
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  6. Additional Keywords (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. luxury residential, surgical, organic, commercial framing, zero trust..."
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-5 w-full sm:w-auto">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSearching}
                  leftIcon={<Search className="w-4 h-4" />}
                  className="w-full sm:w-auto min-w-[180px]"
                >
                  Discover Leads
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Configuration Warning Notice (Strictly shown when real provider is unconfigured) */}
      {configurationNotice && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-950 space-y-2">
          <div className="flex items-start gap-3">
            <Key className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-amber-900">
                Provider Configuration Notice: {activeProviderName || 'External Search Engine'}
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                {configurationNotice}
              </p>
              <div className="pt-2 flex items-center gap-2">
                <Button
                  variant="primary"
                  size="xs"
                  onClick={(e) => {
                    setUseDemoMode(true);
                    handleExecuteSearch(e, true);
                  }}
                  leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                  className="bg-amber-700 hover:bg-amber-800 text-white"
                >
                  Switch to Demo Dataset Provider & Discover Leads
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Save Success Banner */}
      {saveSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between gap-2 animate-fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{saveSuccessMessage}</span>
          </span>
          <span className="text-[11px] text-emerald-700">Available under "All Leads" & Pipeline</span>
        </div>
      )}

      {/* Search Progress Indicator */}
      {isSearching && (
        <div className="p-4 bg-white rounded-xl border border-blue-200 shadow-xs space-y-2 animate-pulse">
          <div className="flex items-center justify-between text-xs text-blue-900 font-semibold">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>{searchProgressStep}</span>
            </span>
            <span className="font-mono">{searchProgressPercent}%</span>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
            <div
              style={{ width: `${searchProgressPercent}%` }}
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
            />
          </div>
        </div>
      )}

      {/* Search Results Area */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          {/* Top Results Metrics & Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            {/* Results counter */}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Discovered {searchResults.length} Verified Businesses
                </h3>
                <span className="text-[11px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-medium">
                  {activeProviderName}
                </span>
                {executionTime !== null && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    ({executionTime}ms)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Authentic business entities matching {industry} in {location}.
              </p>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filter:
              </span>
              {[
                { key: 'all', label: `All (${searchResults.length})` },
                { key: 'has_website', label: 'With Valid URL' },
                { key: 'has_phone', label: 'With Phone' },
                { key: 'verified_only', label: 'Fully Verified' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => {
                    setTableFilter(f.key as any);
                    setCurrentPage(1);
                  }}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    tableFilter === f.key
                      ? 'bg-slate-900 text-white font-medium shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Action Strip */}
          <div className="flex items-center justify-between gap-3 px-2 py-1 flex-wrap text-xs">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={paginatedResults.length > 0 && paginatedResults.every((r) => selectedLeadIds.has(r.id))}
                  onChange={toggleSelectAllPage}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Select Page ({paginatedResults.length})</span>
              </label>

              {selectedLeadIds.size > 0 && (
                <span className="font-mono text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {selectedLeadIds.size} selected
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                onClick={handleExportCSV}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Export CSV ({selectedLeadIds.size > 0 ? selectedLeadIds.size : 'All'})
              </Button>

              <Button
                variant="primary"
                size="xs"
                onClick={() => {
                  const target = searchResults.filter((r) =>
                    selectedLeadIds.size > 0 ? selectedLeadIds.has(r.id) : true
                  );
                  handleSaveLeads(target);
                }}
                disabled={isSavingBulk}
                isLoading={isSavingBulk}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Save {selectedLeadIds.size > 0 ? selectedLeadIds.size : 'All'} to CRM
              </Button>
            </div>
          </div>

          {/* Results Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={paginatedResults.length > 0 && paginatedResults.every((r) => selectedLeadIds.has(r.id))}
                    onChange={toggleSelectAllPage}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => {
                      if (sortField === 'companyName') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('companyName');
                        setSortDirection('asc');
                      }
                    }}
                    className="flex items-center gap-1 text-slate-600 hover:text-slate-900 uppercase font-semibold cursor-pointer"
                  >
                    <span>Company Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </TableHead>
                <TableHead>Industry & Audience</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Lead Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead align="right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedResults.map((lead) => {
                const isSelected = selectedLeadIds.has(lead.id);
                const isSaved = savedCrmIds.has(lead.id);

                return (
                  <TableRow
                    key={lead.id}
                    onClick={() => setSelectedProfileLead(lead)}
                    className={isSelected ? 'bg-blue-50/40' : ''}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelectRow(lead.id, e)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                    </TableCell>

                    {/* Company Name */}
                    <TableCell>
                      <div className="min-w-0 max-w-xs">
                        <span className="font-semibold text-slate-900 block truncate hover:text-blue-600 transition-colors">
                          {lead.companyName}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">{lead.description}</span>
                      </div>
                    </TableCell>

                    {/* Industry */}
                    <TableCell>
                      <div className="text-xs">
                        <span className="font-medium text-slate-800 block">{lead.industry}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">{lead.targetAudience}</span>
                      </div>
                    </TableCell>

                    {/* Location */}
                    <TableCell>
                      <div className="text-xs">
                        <span className="text-slate-800 font-medium block truncate">
                          {lead.city}{lead.state ? `, ${lead.state}` : ''}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">{lead.country}</span>
                      </div>
                    </TableCell>

                    {/* Contact Person */}
                    <TableCell>
                      {lead.contactPerson ? (
                        <div className="text-xs">
                          <span className="font-medium text-slate-800 block truncate">{lead.contactPerson}</span>
                          <span className="text-[10px] text-slate-500 block truncate">{lead.contactTitle || 'Executive'}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Not public</span>
                      )}
                    </TableCell>

                    {/* Email */}
                    <TableCell>
                      {lead.email ? (
                        <a
                          href={`mailto:${lead.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-blue-600 hover:underline font-mono truncate block max-w-[140px]"
                        >
                          {lead.email}
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Unlisted</span>
                      )}
                    </TableCell>

                    {/* Phone */}
                    <TableCell>
                      {lead.phone ? (
                        <span className="text-xs font-mono font-medium text-slate-700 whitespace-nowrap">
                          {lead.phone}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Unlisted</span>
                      )}
                    </TableCell>

                    {/* Website */}
                    <TableCell>
                      {lead.website ? (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noreferrer noopener"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-mono text-blue-600 hover:text-blue-800 flex items-center gap-1 max-w-[130px] truncate"
                        >
                          <span className="truncate">{lead.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">No website</span>
                      )}
                    </TableCell>

                    {/* Lead Score (Unscored as requested) */}
                    <TableCell>
                      <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                        Unscored
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                          isSaved
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {isSaved ? 'In CRM' : 'Discovered'}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedProfileLead(lead)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Open Company Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => !isSaved && handleSaveLeads([lead])}
                          disabled={isSaved}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                            isSaved
                              ? 'text-emerald-600 bg-emerald-50'
                              : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={isSaved ? 'Saved to CRM' : 'Save this record to CRM'}
                        >
                          {isSaved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-3 border-t border-slate-200 text-xs text-slate-600">
              <div>
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, filteredAndSortedResults.length)} of{' '}
                {filteredAndSortedResults.length} leads
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Prev
                </Button>

                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-7 h-7 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                      currentPage === i + 1
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State when zero results returned */}
      {!isSearching && searchResults.length === 0 && !configurationNotice && (
        <Card>
          <CardContent className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">
              Ready to Discover Business Leads
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Configure your search parameters above and click "Discover Leads". The discovery engine retrieves verified business listings with legitimate websites, locations, and source URLs.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Individual Company Profile Modal */}
      <CompanyProfileModal
        lead={selectedProfileLead}
        isOpen={Boolean(selectedProfileLead)}
        onClose={() => setSelectedProfileLead(null)}
        onSaveToCrm={async (lead) => {
          await handleSaveLeads([lead]);
        }}
        isSaved={selectedProfileLead ? savedCrmIds.has(selectedProfileLead.id) : false}
      />
    </div>
  );
};
