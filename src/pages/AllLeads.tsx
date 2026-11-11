import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  Filter,
  ArrowUpDown,
  Building2,
  Users,
  CheckCircle2,
  Calendar,
  UserCheck,
  Globe,
  Phone,
  Mail,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/common/Table';
import { Button } from '../components/common/Button';
import { StatusBadge, TierBadge } from '../components/common/Badge';
import { LeadScoreBadge } from '../components/leads/LeadScoreBadge';
import { EmptyState } from '../components/common/EmptyState';
import { Lead, LeadStatus, NavigationItemKey } from '../types';

interface AllLeadsProps {
  leads: Lead[];
  isLoading: boolean;
  onSelectLead: (lead: Lead) => void;
  onOpenAddLeadModal: () => void;
  onOpenEditLeadModal: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => Promise<void>;
  onBulkUpdateStatus: (leadIds: string[], status: LeadStatus) => Promise<void>;
  onBulkAssignSalesperson: (leadIds: string[], rep: string) => Promise<void>;
  onBulkDeleteLeads: (leadIds: string[]) => Promise<void>;
  onAnalyzeLead?: (leadId: string) => Promise<void>;
  onBulkAnalyzeLeads?: (leadIds: string[]) => Promise<void>;
  onNavigateToOutreach: (view: NavigationItemKey, lead: Lead) => void;
}

const CRM_STATUSES: LeadStatus[] = [
  'New',
  'Not Contacted',
  'Contacted',
  'Interested',
  'Qualified',
  'Negotiation',
  'Converted',
  'Lost',
];

const SALES_REPS = [
  'Sarah Jenkins',
  'David Mercer',
  'Elena Zhou',
  'Marcus Vance',
  'Unassigned',
];

export const AllLeads: React.FC<AllLeadsProps> = ({
  leads,
  onSelectLead,
  onOpenAddLeadModal,
  onOpenEditLeadModal,
  onDeleteLead,
  onBulkUpdateStatus,
  onBulkAssignSalesperson,
  onBulkDeleteLeads,
  onAnalyzeLead,
  onBulkAnalyzeLeads,
  onNavigateToOutreach,
}) => {
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<string>('all'); // all, hot, warm, potential, cold
  const [salespersonFilter, setSalespersonFilter] = useState<string>('all');

  // Sorting state (lead score and discovery date)
  const [sortBy, setSortBy] = useState<'leadScore' | 'createdDate' | 'companyName'>('createdDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Multi-selection state
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());

  // Bulk actions in flight
  const [bulkStatusValue, setBulkStatusValue] = useState<LeadStatus>('Contacted');
  const [bulkRepValue, setBulkRepValue] = useState<string>('David Mercer');
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
  const [analyzingLeadId, setAnalyzingLeadId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Distinct industries and locations from active dataset
  const distinctIndustries = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.industry) set.add(l.industry);
    });
    return Array.from(set).sort();
  }, [leads]);

  const distinctLocations = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.city) set.add(l.city);
    });
    return Array.from(set).sort();
  }, [leads]);

  // Filtering & Sorting
  const filteredLeads = useMemo(() => {
    let result = leads.filter((lead) => {
      // 1. Search by company, email, phone and contact person
      const q = search.toLowerCase().trim();
      const companyName = (lead.companyName || lead.company || '').toLowerCase();
      const contactPerson = (lead.contactPerson || lead.name || '').toLowerCase();
      const email = (lead.email || '').toLowerCase();
      const phone = (lead.phone || '').toLowerCase();

      const matchesSearch =
        !q ||
        companyName.includes(q) ||
        contactPerson.includes(q) ||
        email.includes(q) ||
        phone.includes(q);

      // 2. Filter by status
      const leadSt = (lead.leadStatus || (lead.status as any) || 'New').toString().toLowerCase();
      const matchesStatus =
        statusFilter === 'all' ||
        leadSt === statusFilter.toLowerCase();

      // 3. Filter by industry
      const matchesIndustry =
        industryFilter === 'all' ||
        lead.industry.toLowerCase().includes(industryFilter.toLowerCase());

      // 4. Filter by location
      const matchesLocation =
        locationFilter === 'all' ||
        (lead.city && lead.city.toLowerCase() === locationFilter.toLowerCase()) ||
        (lead.country && lead.country.toLowerCase() === locationFilter.toLowerCase());

      // 5. Filter by score / category
      const score = lead.leadScore ?? lead.aiScore ?? 0;
      let matchesScore = true;
      if (scoreFilter === '80+' || scoreFilter === 'hot') matchesScore = score >= 80;
      else if (scoreFilter === '60-79' || scoreFilter === 'warm') matchesScore = score >= 60 && score < 80;
      else if (scoreFilter === '40-59' || scoreFilter === 'potential') matchesScore = score >= 40 && score < 60;
      else if (scoreFilter === '<60' || scoreFilter === 'cold') matchesScore = score < 40;

      // 6. Filter by assigned salesperson
      const matchesRep =
        salespersonFilter === 'all' ||
        (lead.assignedSalesperson || 'Unassigned') === salespersonFilter;

      return matchesSearch && matchesStatus && matchesIndustry && matchesLocation && matchesScore && matchesRep;
    });

    // 4. Sort by lead score and discovery date
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'leadScore') {
        const scoreA = a.leadScore ?? a.aiScore ?? 0;
        const scoreB = b.leadScore ?? b.aiScore ?? 0;
        comparison = scoreA - scoreB;
      } else if (sortBy === 'createdDate') {
        const dateA = new Date(a.createdDate || a.createdAt || 0).getTime();
        const dateB = new Date(b.createdDate || b.createdAt || 0).getTime();
        comparison = dateA - dateB;
      } else {
        const nameA = a.companyName || a.company || '';
        const nameB = b.companyName || b.company || '';
        comparison = nameA.localeCompare(nameB);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [
    leads,
    search,
    statusFilter,
    industryFilter,
    locationFilter,
    scoreFilter,
    salespersonFilter,
    sortBy,
    sortOrder,
  ]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, currentPage, pageSize]);

  // Bulk selection toggles
  const toggleSelectAllPage = () => {
    if (paginatedLeads.every((l) => selectedLeadIds.has(l.id))) {
      const next = new Set(selectedLeadIds);
      paginatedLeads.forEach((l) => next.delete(l.id));
      setSelectedLeadIds(next);
    } else {
      const next = new Set(selectedLeadIds);
      paginatedLeads.forEach((l) => next.add(l.id));
      setSelectedLeadIds(next);
    }
  };

  const toggleSelectLead = (id: string, e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(selectedLeadIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLeadIds(next);
  };

  // Bulk action handlers
  const handleBulkStatusApply = async () => {
    const ids = Array.from(selectedLeadIds);
    if (ids.length === 0) return;
    setIsBulkActionLoading(true);
    try {
      await onBulkUpdateStatus(ids, bulkStatusValue);
      setSelectedLeadIds(new Set());
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkRepApply = async () => {
    const ids = Array.from(selectedLeadIds);
    if (ids.length === 0) return;
    setIsBulkActionLoading(true);
    try {
      await onBulkAssignSalesperson(ids, bulkRepValue);
      setSelectedLeadIds(new Set());
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkAnalyzeApply = async () => {
    const ids = Array.from(selectedLeadIds);
    if (ids.length === 0 || !onBulkAnalyzeLeads) return;
    setIsBulkActionLoading(true);
    try {
      await onBulkAnalyzeLeads(ids);
      setSelectedLeadIds(new Set());
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleAnalyzeSingleLead = async (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onAnalyzeLead) return;
    setAnalyzingLeadId(lead.id);
    try {
      await onAnalyzeLead(lead.id);
    } finally {
      setAnalyzingLeadId(null);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedLeadIds);
    if (ids.length === 0) return;
    if (confirm(`Are you sure you want to permanently delete ${ids.length} selected leads from the CRM?`)) {
      setIsBulkActionLoading(true);
      try {
        await onBulkDeleteLeads(ids);
        setSelectedLeadIds(new Set());
      } finally {
        setIsBulkActionLoading(false);
      }
    }
  };

  // Single delete with confirmation
  const handleDeleteSingle = async (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    const company = lead.companyName || lead.company;
    if (confirm(`Are you sure you want to delete lead "${company}"?`)) {
      await onDeleteLead(lead.id);
    }
  };

  // Export selected / all leads to CSV with all 19 database fields
  const handleExportCSV = () => {
    const target = leads.filter((l) => (selectedLeadIds.size > 0 ? selectedLeadIds.has(l.id) : true));
    if (target.length === 0) return;

    const headers = [
      'Lead ID',
      'Company Name',
      'Industry',
      'Contact Person',
      'Email Address',
      'Phone Number',
      'Website',
      'Country',
      'City',
      'Lead Score',
      'Lead Quality',
      'Lead Source',
      'AI Research Summary',
      'Remarks',
      'Lead Status',
      'Assigned Salesperson',
      'Created Date',
      'Last Contacted Date',
      'Next Follow-up Date',
    ];

    const rows = target.map((l) => [
      `"${l.id}"`,
      `"${(l.companyName || l.company || '').replace(/"/g, '""')}"`,
      `"${(l.industry || '').replace(/"/g, '""')}"`,
      `"${(l.contactPerson || l.name || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.website || l.domain || '').replace(/"/g, '""')}"`,
      `"${(l.country || '').replace(/"/g, '""')}"`,
      `"${(l.city || '').replace(/"/g, '""')}"`,
      l.leadScore ?? l.aiScore ?? 0,
      `"${l.leadQuality || l.qualityTier || 'Medium'}"`,
      `"${(l.leadSource || 'Discovery').replace(/"/g, '""')}"`,
      `"${(l.aiResearchSummary || l.aiSummary || '').replace(/"/g, '""')}"`,
      `"${(l.remarks || '').replace(/"/g, '""')}"`,
      `"${l.leadStatus || l.status || 'New'}"`,
      `"${(l.assignedSalesperson || 'Unassigned').replace(/"/g, '""')}"`,
      `"${l.createdDate || l.createdAt || ''}"`,
      `"${l.lastContactedDate || l.lastContactedAt || ''}"`,
      `"${l.nextFollowUpDate || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `crm_leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status counts for top status tab bar
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: leads.length };
    CRM_STATUSES.forEach((st) => {
      counts[st.toLowerCase()] = leads.filter((l) => {
        const current = (l.leadStatus || (l.status as any) || 'New').toString().toLowerCase();
        return current === st.toLowerCase();
      }).length;
    });
    return counts;
  }, [leads]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
      {/* Title & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            CRM Lead Management Database
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Centralized pipeline records with 19 database fields, interaction history, follow-up scheduling, and duplicate protection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Export CSV ({selectedLeadIds.size > 0 ? selectedLeadIds.size : 'All'})
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onOpenAddLeadModal}
            leftIcon={<Plus className="w-4 h-4" />}
            className="text-xs"
          >
            + Add Lead Manually
          </Button>
        </div>
      </div>

      {/* CRM Status Tabs Bar (All 8 Statuses) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-none">
        <button
          onClick={() => {
            setStatusFilter('all');
            setCurrentPage(1);
          }}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>All Leads</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${statusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'}`}>
            {statusCounts.all || 0}
          </span>
        </button>

        {CRM_STATUSES.map((st) => {
          const isActive = statusFilter.toLowerCase() === st.toLowerCase();
          const count = statusCounts[st.toLowerCase()] || 0;
          return (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{st}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Multi-Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        {/* Row 1: Search Across Company, Email, Phone, Contact Person */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by company name, contact person, email, or phone number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sort Controls (Lead Score & Discovery Date) */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold whitespace-nowrap flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="createdDate">Discovery / Created Date</option>
              <option value="leadScore">Lead Score</option>
              <option value="companyName">Company Name</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          </div>
        </div>

        {/* Row 2: Secondary Dropdown Filters (Industry, Location, Score, Salesperson) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
          {/* Industry Filter */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Industry</label>
            <select
              value={industryFilter}
              onChange={(e) => {
                setIndustryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Industries</option>
              {distinctIndustries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Location</label>
            <select
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Locations</option>
              {distinctLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Score Range Filter */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Lead Score / Category</label>
            <select
              value={scoreFilter}
              onChange={(e) => {
                setScoreFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="all">All Scores & Categories</option>
              <option value="hot">Hot Leads (80 - 100)</option>
              <option value="warm">Warm Leads (60 - 79)</option>
              <option value="potential">Potential Leads (40 - 59)</option>
              <option value="cold">Cold Leads (&lt; 40)</option>
            </select>
          </div>

          {/* Salesperson Filter */}
          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Assigned Salesperson</label>
            <select
              value={salespersonFilter}
              onChange={(e) => {
                setSalespersonFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Salespeople</option>
              {SALES_REPS.map((rep) => (
                <option key={rep} value={rep}>
                  {rep}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Ribbon (Appears when leads are checked) */}
      {selectedLeadIds.size > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-900 bg-white border border-blue-200 px-2 py-0.5 rounded font-mono">
              {selectedLeadIds.size} Selected
            </span>
            <span className="text-blue-800">Apply batch actions to selected accounts:</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Bulk Analyze with AI */}
            {onBulkAnalyzeLeads && (
              <Button
                variant="primary"
                size="xs"
                onClick={handleBulkAnalyzeApply}
                isLoading={isBulkActionLoading}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
              >
                Analyze Selected Leads
              </Button>
            )}

            {/* Bulk Update Status */}
            <div className="flex items-center gap-1.5">
              <select
                value={bulkStatusValue}
                onChange={(e) => setBulkStatusValue(e.target.value as LeadStatus)}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-medium text-slate-800"
              >
                {CRM_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    Mark {st}
                  </option>
                ))}
              </select>
              <Button
                variant="primary"
                size="xs"
                onClick={handleBulkStatusApply}
                isLoading={isBulkActionLoading}
              >
                Apply Status
              </Button>
            </div>

            {/* Bulk Assign Salesperson */}
            <div className="flex items-center gap-1.5">
              <select
                value={bulkRepValue}
                onChange={(e) => setBulkRepValue(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-medium text-slate-800"
              >
                {SALES_REPS.map((rep) => (
                  <option key={rep} value={rep}>
                    Assign to {rep}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="xs"
                onClick={handleBulkRepApply}
                isLoading={isBulkActionLoading}
              >
                Assign
              </Button>
            </div>

            {/* Bulk Delete */}
            <Button
              variant="danger"
              size="xs"
              onClick={handleBulkDelete}
              isLoading={isBulkActionLoading}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Main CRM Leads Table */}
      {filteredLeads.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8 text-slate-400" />}
          title="No leads match your search criteria"
          description="Try broadening your keywords, resetting the status tab, or creating a new lead manually."
          actionLabel="+ Add Lead Manually"
          onAction={onOpenAddLeadModal}
        />
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-slate-500 px-1 flex items-center justify-between">
            <span>Showing {filteredLeads.length} of {leads.length} accounts in persistent database</span>
            <span className="font-mono text-[11px] text-slate-400">Database: server/data/crm_leads.json</span>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={paginatedLeads.length > 0 && paginatedLeads.every((l) => selectedLeadIds.has(l.id))}
                    onChange={toggleSelectAllPage}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </TableHead>
                <TableHead>Company & Industry</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Email & Phone</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>City & Country</TableHead>
                <TableHead>Lead Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Rep</TableHead>
                <TableHead>Next Follow-up</TableHead>
                <TableHead align="right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLeads.map((lead) => {
                const isSelected = selectedLeadIds.has(lead.id);
                const score = lead.leadScore ?? lead.aiScore ?? 0;
                const status = lead.leadStatus || (lead.status as any) || 'New';
                const rep = lead.assignedSalesperson || 'Unassigned';

                return (
                  <TableRow
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className={isSelected ? 'bg-blue-50/40' : ''}
                  >
                    {/* Checkbox */}
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelectLead(lead.id, e)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </TableCell>

                    {/* Company & Industry */}
                    <TableCell>
                      <div className="min-w-0 max-w-[190px]">
                        <span className="font-semibold text-slate-900 block truncate hover:text-blue-600 transition-colors">
                          {lead.companyName || lead.company}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate">{lead.industry}</span>
                      </div>
                    </TableCell>

                    {/* Contact Person */}
                    <TableCell>
                      <div className="min-w-0 max-w-[140px]">
                        <span className="font-medium text-slate-800 block truncate">
                          {lead.contactPerson || lead.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">{lead.title || 'Executive'}</span>
                      </div>
                    </TableCell>

                    {/* Email & Phone */}
                    <TableCell>
                      <div className="min-w-0 max-w-[150px] text-xs">
                        {lead.email ? (
                          <span className="text-slate-800 font-mono block truncate" title={lead.email}>
                            {lead.email}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px] block">No email</span>
                        )}
                        {lead.phone ? (
                          <span className="text-[10px] text-slate-500 font-mono block truncate">{lead.phone}</span>
                        ) : (
                          <span className="text-slate-400 italic text-[10px] block">No phone</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Website */}
                    <TableCell>
                      {lead.website || lead.domain ? (
                        <a
                          href={lead.website || `https://${lead.domain}`}
                          target="_blank"
                          rel="noreferrer noopener"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-blue-600 hover:underline font-mono truncate block max-w-[120px]"
                        >
                          {(lead.website || lead.domain || '').replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]}
                        </a>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Unlisted</span>
                      )}
                    </TableCell>

                    {/* City & Country */}
                    <TableCell>
                      <div className="text-xs">
                        <span className="text-slate-800 font-medium block truncate">{lead.city}</span>
                        <span className="text-[10px] text-slate-400 block truncate">{lead.country}</span>
                      </div>
                    </TableCell>

                    {/* Lead Score */}
                    <TableCell>
                      <LeadScoreBadge score={score} category={lead.leadCategory} size="sm" />
                    </TableCell>

                    {/* Lead Status */}
                    <TableCell>
                      <StatusBadge status={status} />
                    </TableCell>

                    {/* Assigned Salesperson */}
                    <TableCell>
                      <span className="text-xs font-medium text-slate-700 whitespace-nowrap block">
                        {rep}
                      </span>
                    </TableCell>

                    {/* Next Follow-up Date */}
                    <TableCell>
                      {lead.nextFollowUpDate ? (
                        <span className="text-xs font-mono font-medium text-amber-700 whitespace-nowrap block">
                          {new Date(lead.nextFollowUpDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">None</span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {onAnalyzeLead && (
                          <button
                            onClick={(e) => handleAnalyzeSingleLead(lead, e)}
                            disabled={analyzingLeadId === lead.id}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                            title="Analyze with AI"
                          >
                            <Sparkles className={`w-4 h-4 ${analyzingLeadId === lead.id ? 'animate-spin text-amber-500' : 'text-blue-600'}`} />
                          </button>
                        )}

                        <button
                          onClick={() => onSelectLead(lead)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Open Complete CRM Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onOpenEditLeadModal(lead)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Edit Lead Details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => handleDeleteSingle(lead, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-4 h-4" />
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
                {Math.min(currentPage * pageSize, filteredLeads.length)} of {filteredLeads.length} leads
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
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
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
