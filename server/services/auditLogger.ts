import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action:
    | 'CREATE_LEAD'
    | 'UPDATE_LEAD'
    | 'DELETE_LEAD'
    | 'BULK_UPDATE_STATUS'
    | 'BULK_ASSIGN'
    | 'BULK_DELETE'
    | 'AI_ANALYSIS'
    | 'WHATSAPP_OUTREACH'
    | 'FOLLOW_UP_SCHEDULED'
    | 'REPORT_EXPORT'
    | 'DISCOVERY_SEARCH'
    | 'AGENT_RUN'
    | 'SECURITY_AUTH';
  entityType: 'lead' | 'report' | 'agent' | 'outreach' | 'system';
  entityId?: string;
  details: string;
  ipAddress?: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const AUDIT_FILE = path.resolve(DATA_DIR, 'audit_logs.json');

class AuditLogger {
  private logs: AuditLogEntry[] = [];
  private maxLogs = 500;

  constructor() {
    this.loadLogs();
  }

  private loadLogs() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(AUDIT_FILE)) {
        const data = fs.readFileSync(AUDIT_FILE, 'utf-8');
        this.logs = JSON.parse(data);
      } else {
        this.logs = [];
      }
    } catch (err) {
      console.warn('Failed to load audit logs from disk, starting empty:', err);
      this.logs = [];
    }
  }

  private saveLogs() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(AUDIT_FILE, JSON.stringify(this.logs, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist audit log to disk:', err);
    }
  }

  public log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const fullEntry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    this.logs.unshift(fullEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    this.saveLogs();
    return fullEntry;
  }

  public getLogs(limit = 100, actionFilter?: string): AuditLogEntry[] {
    let result = [...this.logs];
    if (actionFilter) {
      result = result.filter((l) => l.action === actionFilter);
    }
    return result.slice(0, limit);
  }

  public clearLogs() {
    this.logs = [];
    this.saveLogs();
  }
}

export const auditLogger = new AuditLogger();
