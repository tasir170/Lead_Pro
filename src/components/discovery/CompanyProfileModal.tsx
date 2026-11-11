import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  Building2,
  Globe,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Plus,
  Check,
  Calendar,
  Layers,
} from 'lucide-react';
import { DiscoveredLead } from '../../types';

interface CompanyProfileModalProps {
  lead: DiscoveredLead | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveToCrm: (lead: DiscoveredLead) => Promise<void>;
  isSaved?: boolean;
}

export const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({
  lead,
  isOpen,
  onClose,
  onSaveToCrm,
  isSaved = false,
}) => {
  const [isSaving, setIsSaving] = useState(false);

  if (!lead) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveToCrm(lead);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lead.companyName}
      description={`${lead.industry} · Discovered in ${lead.city}, ${lead.country}`}
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Provider:</span>
            <span className="font-semibold text-slate-700">{lead.provider}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant={isSaved ? 'outline' : 'primary'}
              size="sm"
              onClick={handleSave}
              disabled={isSaved || isSaving}
              isLoading={isSaving}
              leftIcon={isSaved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Plus className="w-3.5 h-3.5" />}
            >
              {isSaved ? 'Saved to Active CRM' : 'Save to CRM Pipeline'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Verification Overview Ribbon */}
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            lead.verificationStatus === 'verified'
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : lead.verificationStatus === 'partially_verified'
              ? 'bg-amber-50/70 border-amber-200 text-amber-900'
              : 'bg-slate-100 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-start gap-3">
            <ShieldCheck
              className={`w-5 h-5 shrink-0 mt-0.5 ${
                lead.verificationStatus === 'verified'
                  ? 'text-emerald-600'
                  : lead.verificationStatus === 'partially_verified'
                  ? 'text-amber-600'
                  : 'text-slate-500'
              }`}
            />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">
                {lead.verificationStatus === 'verified'
                  ? 'Verified Commercial Record'
                  : lead.verificationStatus === 'partially_verified'
                  ? 'Partially Verified Listing'
                  : 'Unverified Entity'}
              </div>
              <p className="text-xs opacity-90 mt-0.5">
                {lead.isDemo
                  ? 'Demonstration directory entry with authentic, non-hallucinated corporate registry metadata.'
                  : `Retrieved via legitimate ${lead.provider} search adapter.`}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
              Lead Score
            </div>
            <div className="text-xs font-mono font-bold text-slate-700 bg-white/80 px-2 py-1 rounded border border-slate-200/60 inline-block mt-0.5">
              Unscored
            </div>
            <div className="text-[9px] text-slate-400">AI Scoring enabled in next module</div>
          </div>
        </div>

        {/* Business Description */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Business Overview</h4>
          <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
            {lead.description}
          </p>
        </div>

        {/* Core Discovery Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Website */}
          <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-blue-600" /> Official Website
              </span>
              {lead.isWebsiteValid ? (
                <span className="text-emerald-600 font-mono text-[9px] font-bold">Valid URL</span>
              ) : (
                <span className="text-slate-400 font-mono text-[9px]">No Website</span>
              )}
            </span>
            {lead.website ? (
              <a
                href={lead.website}
                target="_blank"
                rel="noreferrer noopener"
                className="text-blue-600 hover:text-blue-800 font-mono font-medium truncate flex items-center gap-1 group"
              >
                <span className="truncate">{lead.website}</span>
                <ExternalLink className="w-3 h-3 shrink-0 opacity-70 group-hover:opacity-100" />
              </a>
            ) : (
              <span className="text-slate-400 italic">No public website found</span>
            )}
          </div>

          {/* Business Phone */}
          <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
              <Phone className="w-3 h-3 text-emerald-600" /> Business Phone
            </span>
            {lead.phone ? (
              <span className="text-slate-800 font-mono font-medium block truncate">{lead.phone}</span>
            ) : (
              <span className="text-slate-400 italic">Unlisted (not publicly verified)</span>
            )}
          </div>

          {/* Contact Person */}
          <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
              <Building2 className="w-3 h-3 text-indigo-600" /> Contact Person
            </span>
            {lead.contactPerson ? (
              <div>
                <span className="text-slate-900 font-semibold block">{lead.contactPerson}</span>
                {lead.contactTitle && <span className="text-slate-500 text-[11px] block">{lead.contactTitle}</span>}
              </div>
            ) : (
              <span className="text-slate-400 italic">Not publicly listed in directory</span>
            )}
          </div>

          {/* Business Email */}
          <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
              <Mail className="w-3 h-3 text-amber-600" /> Business Email
            </span>
            {lead.email ? (
              <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline font-mono truncate block">
                {lead.email}
              </a>
            ) : (
              <span className="text-slate-400 italic">Unlisted · Zero invented contacts policy</span>
            )}
          </div>

          {/* Physical Address */}
          <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1 sm:col-span-2">
            <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
              <MapPin className="w-3 h-3 text-rose-600" /> Physical Address & Jurisdiction
            </span>
            <span className="text-slate-800 font-medium block">
              {lead.address ? `${lead.address}, ${lead.city}, ${lead.country}` : `${lead.city}, ${lead.country}`}
            </span>
          </div>
        </div>

        {/* Data Quality & Source Auditing */}
        <div className="space-y-3 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <h4 className="font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> Data Quality Audit
            </h4>
            <span className="font-mono text-[11px] text-slate-400">
              Discovered {new Date(lead.dateDiscovered).toLocaleDateString()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Verified Fields */}
            <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100 space-y-1.5">
              <span className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Verified Public Fields ({lead.verifiedFields.length})
              </span>
              <ul className="space-y-1 text-[11px] text-emerald-900">
                {lead.verifiedFields.map((field, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{field}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Identified Missing Information */}
            <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-100 space-y-1.5">
              <span className="text-[10px] font-bold text-amber-800 uppercase flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Identified Missing Data ({lead.missingFields.length})
              </span>
              <ul className="space-y-1 text-[11px] text-amber-900">
                {lead.missingFields.map((field, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span>{field}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Source URL & Provenance */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Official Source URL</span>
            <a
              href={lead.sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-blue-600 hover:text-blue-800 font-mono text-[11px] truncate block"
            >
              {lead.sourceUrl}
            </a>
          </div>
          <a
            href={lead.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="p-1.5 bg-white border border-slate-200 rounded text-slate-600 hover:text-blue-600 shrink-0"
            title="Inspect source record"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </Modal>
  );
};
