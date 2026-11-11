import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Sparkles, AlertCircle } from 'lucide-react';
import { Lead, LeadStatus } from '../../types';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadAdded: (lead: Lead) => void;
  onCreateLead: (leadData: Partial<Lead>) => Promise<Lead>;
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

export const AddLeadModal: React.FC<AddLeadModalProps> = ({
  isOpen,
  onClose,
  onLeadAdded,
  onCreateLead,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('B2B SaaS & Enterprise Software');
  const [contactPerson, setContactPerson] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [city, setCity] = useState('Austin');
  const [country, setCountry] = useState('United States');
  const [leadStatus, setLeadStatus] = useState<LeadStatus>('New');
  const [assignedSalesperson, setAssignedSalesperson] = useState('Sarah Jenkins');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [employeeCount, setEmployeeCount] = useState('50-250');
  const [annualRevenue, setAnnualRevenue] = useState('$10M - $25M');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError('Company Name is required.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const created = await onCreateLead({
        companyName: companyName.trim(),
        company: companyName.trim(),
        industry,
        contactPerson: contactPerson.trim() || 'Business Executive',
        name: contactPerson.trim() || 'Business Executive',
        title: title.trim() || 'Executive',
        email: email.trim(),
        phone: phone.trim(),
        website: website.trim(),
        domain: website ? website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        city: city.trim() || 'Austin',
        country: country.trim() || 'United States',
        location: `${city.trim() || 'Austin'}, ${country.trim() || 'United States'}`,
        leadStatus,
        status: leadStatus,
        assignedSalesperson,
        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate).toISOString() : null,
        remarks: remarks.trim(),
        employeeCount,
        annualRevenue,
        leadSource: 'Manual Entry',
      });

      onLeadAdded(created);
      onClose();

      // Reset form
      setCompanyName('');
      setContactPerson('');
      setTitle('');
      setEmail('');
      setPhone('');
      setWebsite('');
      setCity('Austin');
      setCountry('United States');
      setNextFollowUpDate('');
      setRemarks('');
    } catch (err: any) {
      setError(err.message || 'Failed to add lead');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Target Lead to CRM"
      description="Register corporate entity, contact person, sales ownership, and schedule initial follow-up."
      maxWidth="2xl"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isLoading}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Save Lead to CRM
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="leading-relaxed">{error}</span>
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
              placeholder="e.g. Apex Dynamics"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Industry Sector
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="B2B SaaS & Enterprise Software">B2B SaaS & Enterprise Software</option>
              <option value="FinTech & Financial Services">FinTech & Financial Services</option>
              <option value="Real Estate & Brokerage">Real Estate & Brokerage</option>
              <option value="Healthcare & Hospitals">Healthcare & Hospitals</option>
              <option value="Logistics & Supply Chain Tech">Logistics & Supply Chain Tech</option>
              <option value="Construction & Contracting">Construction & Contracting</option>
              <option value="Cybersecurity & Cloud Data">Cybersecurity & Cloud Data</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contact Person
            </label>
            <input
              type="text"
              placeholder="e.g. Rachel Sterling"
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
              placeholder="e.g. VP of Revenue Operations"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Work Email Address
            </label>
            <input
              type="email"
              placeholder="e.g. rachel@apexdynamics.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phone / WhatsApp Number
            </label>
            <input
              type="tel"
              placeholder="e.g. +1 (415) 555-0142"
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
              placeholder="e.g. https://apexdynamics.io"
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
              placeholder="e.g. Austin"
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
              placeholder="e.g. United States"
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
            rows={2}
            placeholder="Add initial notes on business fit, opportunity context, or lead source..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>
    </Modal>
  );
};
