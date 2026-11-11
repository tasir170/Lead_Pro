# LeadPulse AI - Enterprise Sales Intelligence & Automation SaaS

> A comprehensive, full-stack AI-powered B2B Lead Generation, Predictive Qualification, and Multi-Channel Sales Automation platform.

---

## 🚀 Key Modules & Architecture

LeadPulse AI integrates 11 unified modules within a single cohesive full-stack application (React 19 + TypeScript frontend with an Express backend running on Node.js):

| Module | Purpose & Capabilities | Technology Stack |
| :--- | :--- | :--- |
| **1. Overview Dashboard** | Executive KPI cards, deal flow velocity, AI alerts, and quick actions. | React 19, Lucide, Tailwind CSS v4 |
| **2. Lead Discovery** | Real-world business discovery with provider-adapter architecture (Google Places, Verified B2B Directories). | Provider-Adapter Pattern, REST API |
| **3. Central CRM** | All 19 required enterprise CRM fields, multi-field search, status filtering, bulk actions, and CSV export. | ACID JSON Store, E.164 Normalizer |
| **4. AI Lead Scoring** | 7-factor predictive scoring (0–100) across Industry, Scale, Digital Presence, Contacts, Growth, Market, and Intent. | Gemini 3.8 Flash + Resilient Fallback |
| **5. AI Research Agent** | Deep company intelligence dossiers, executive personas, tech stacks, and pain points. | Gemini 3.8 Flash, Multi-source Synthesis |
| **6. Agent Orchestrator** | 4 autonomous agents (Researcher, Qualifier, Strategist, CRM Manager) with human-in-the-loop authorization gates. | Event Bus, Multi-Agent DAG Planner |
| **7. AI Sales Assistant** | Conversational chatbot with live CRM database tool execution and contextual lead card rendering. | Function Calling, Natural Language Processing |
| **8. WhatsApp Outreach** | E.164 phone normalizer, 5 AI copy styles, pre-filled `wa.me` links, and Meta Cloud API integration. | Meta Cloud API v19.0, Gemini 3.8 Flash |
| **9. Follow-up Cadence** | SLA tracking, automated overdue detection, multi-channel touchpoint queue, and CRM audit sync. | Dynamic Date Scheduler |
| **10. Analytics & Reporting** | 10 dashboard metrics, 8 interactive SVG charts, Gemini analytics assistant, and executive PDF reporting. | Dynamic DB Aggregation Engine |
| **11. Settings & RBAC** | Ideal Customer Profile (ICP) rules, Role-Based Access Control (Admin, Manager, SDR), and live security audit trail. | RBAC Middleware, Rate Limiter |

---

## 🛡️ Security & Enterprise Hardening

1. **Server-Side API Key Storage**:
   - `GEMINI_API_KEY`, Meta WhatsApp tokens, and search API credentials reside strictly on the server and are never exposed to the client browser.
2. **Role-Based Access Control (RBAC)**:
   - **Admin (Sarah Jenkins)**: Full administrative rights, lead deletion, bulk operations, and audit log clearing.
   - **Sales Manager (David Mercer)**: Pipeline management, status updates, team lead assignments, and report exports.
   - **SDR / Account Executive (Elena Zhou)**: Lead ingestion, research, WhatsApp/Email outreach, and follow-up logging.
3. **Rate Limiting**:
   - Built-in sliding window rate limiter (`200 requests/minute`) on all `/api/*` endpoints protecting against DoS and scraping.
4. **Input Sanitization**:
   - Server-side stripping of script tags, iframes, and javascript URI schemes.
5. **ACID Duplicate Prevention**:
   - Normalized domain and email checks prevent duplicate account records.
6. **Security Audit Logging**:
   - Structured ledger (`data/audit_logs.json`) recording every creation, update, deletion, bulk action, and authorization check.

---

## 🗄️ Database & Persistence

- **Current Runtime**: File-backed atomic JSON store located at `/data/crm_leads.json`. Guarantees ACID write-through persistence across server restarts.
- **Enterprise Upgrade (Firebase Firestore)**:
  - The repository architecture in `server/services/dataStore.ts` isolates all database operations behind canonical methods (`getAllLeads`, `createLead`, `updateLead`, `deleteLead`).
  - To upgrade to Google Cloud Firestore, run the Firebase provisioning workflow to connect your Firestore project directly.

---

## 🧪 Automated Testing & QA

Run the automated 13-point end-to-end integration test suite:

```bash
npm run test:qa
```

The test script validates:
- API health and rate limiting middleware
- CRUD operations (Create, Read, Update, Delete)
- Domain and email duplicate prevention
- Search provider query execution
- Gemini 7-factor predictive lead scoring
- Autonomous agent tool execution
- AI sales assistant chatbot with real CRM tool-calling
- WhatsApp E.164 normalizer and prefilled `wa.me` URL generation
- Follow-up date scheduling and overdue detection
- Detailed analytics calculations and CSV export
- RBAC permissions (verifying 403 Forbidden on unauthorized roles)

---

## 📦 Production Deployment

### 1. Build the Frontend
```bash
npm run build
```

### 2. Set Production Environment Variables
```bash
export NODE_ENV="production"
export PORT="3000"
export GEMINI_API_KEY="your-gemini-api-key"
```

### 3. Start the Server
```bash
npm start
```

---

## ⚠️ Known Limitations & Roadmap

1. **Meta WhatsApp Cloud API**:
   - 1-click `wa.me` links operate with 100% functionality out of the box with zero credentials.
   - Programmatic dispatch via Meta Cloud API requires an active Meta Business Manager account with a verified Phone Number ID and Access Token.
2. **Third-Party Search APIs**:
   - The platform includes a fallback provider with legitimate, verified B2B corporate profiles. Connecting a live `GOOGLE_PLACES_API_KEY` enables real-time search across Google Maps Places API.
