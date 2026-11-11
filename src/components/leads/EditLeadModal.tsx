import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Save, AlertCircle } from 'lucide-react';
import { Lead, LeadStatus, QualityTier } from '../../types';

interface EditLeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveLead: (leadId: string, updates: Partial<Lead>) => Promise<void>;
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

export const EditLeadModal: React.FC<EditLeadModalProps> = ({
  lead,
  isOpen,
  onClose,
  onSaveLead,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('United States');
  const [leadStatus, setLeadStatus] = useState<LeadStatus>('New');
  const [leadQuality, setLeadQuality] = useState<QualityTier>('Medium');
  const [assignedSalesperson, setAssignedSalesperson] = useState('Sarah Jenkins');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (lead) {
      setCompanyName(lead.companyName || lead.company || '');
      setIndustry(lead.industry || '');
      setContactPerson(lead.contactPerson || lead.name || '');
      setTitle(lead.title || '');
      setEmail(lead.email || '');
      setPhone(lead.phone || '');
      setWebsite(lead.website || (lead.domain ? `https://${lead.domain}` : ''));
      setCity(lead.city || '');
      setCountry(lead.country || 'United States');
      setLeadStatus(lead.leadStatus || (lead.status as any) || 'New');
      setLeadQuality(lead.leadQuality || 'Medium');
      setAssignedSalesperson(lead.assignedSalesperson || 'Unassigned');
      setNextFollowUpDate(lead.nextFollowUpDate ? lead.nextFollowUpDate.slice(0, 10) : '');
      setRemarks(lead.remarks || '');
      setErrorMessage(null);
    }
  }, [lead]);

  if (!lead) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setErrorMessage('Company Name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onSaveLead(lead.id, {
        companyName: companyName.trim(),
        company: companyName.trim(),
        industry: industry.trim(),
        contactPerson: contactPerson.trim(),
        name: contactPerson.trim(),
        title: title.trim(),
        email: email.trim(),
        phone: phone.trim(),
        website: website.trim(),
        domain: website ? website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : lead.domain,
        city: city.trim(),
        country: country.trim(),
        location: `${city.trim()}, ${country.trim()}`,
        leadStatus,
        status: leadStatus,
        leadQuality,
        qualityTier: leadQuality,
        assignedSalesperson,
        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate).toISOString() : null,
        remarks: remarks.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save lead updates');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Lead: ${lead.companyName || lead.company}`}
      description="Update corporate records, assign sales ownership, and schedule follow-up cadence."
      maxWidth="2xl"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Changes
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Company Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Industry Sector
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contact Person
            </label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Job Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Business Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phone Number / WhatsApp
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Official Website URL
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Country
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Lead Status
            </label>
            <select
              value={leadStatus}
              onChange={(e) => setLeadStatus(e.target.value as LeadStatus)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {CRM_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assigned Salesperson
            </label>
            <select
              value={assignedSalesperson}
              onChange={(e) => setAssignedSalesperson(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SALES_REPS.map((rep) => (
                <option key={rep} value={rep}>
                  {rep}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Next Follow-up Date
            </label>
            <input
              type="date"
              value={nextFollowUpDate}
              onChange={(e) => setNextFollowUpDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Internal Remarks & Deal Notes
          </label>
          <textarea
            rows={3}
            placeholder="Add internal notes on account requirements, conversation history, or deal blockers..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>
    </Modal>
  );
};
