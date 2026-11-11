import { Request, Response, NextFunction } from 'express';
import { auditLogger } from '../services/auditLogger.js';

export type UserRole = 'admin' | 'manager' | 'sdr';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  permissions: string[];
}

// Canonical team directory
export const TEAM_MEMBERS: Record<string, AuthUser> = {
  'sarah.j@leadpulse.ai': {
    id: 'user-admin-1',
    name: 'Sarah Jenkins',
    email: 'sarah.j@leadpulse.ai',
    role: 'admin',
    title: 'Head of Sales & System Admin',
    permissions: ['read', 'create', 'update', 'delete', 'bulk_manage', 'export_reports', 'ai_admin', 'settings'],
  },
  'david.m@leadpulse.ai': {
    id: 'user-mgr-2',
    name: 'David Mercer',
    email: 'david.m@leadpulse.ai',
    role: 'manager',
    title: 'Sales Operations Manager',
    permissions: ['read', 'create', 'update', 'bulk_manage', 'export_reports', 'ai_scoring'],
  },
  'elena.z@leadpulse.ai': {
    id: 'user-sdr-3',
    name: 'Elena Zhou',
    email: 'elena.z@leadpulse.ai',
    role: 'sdr',
    title: 'Enterprise SDR',
    permissions: ['read', 'create', 'update', 'whatsapp_outreach', 'followups'],
  },
};

export const DEFAULT_USER = TEAM_MEMBERS['sarah.j@leadpulse.ai'];

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      clientIp?: string;
    }
  }
}

/**
 * Authentication Middleware: Extracts user identity from headers or session
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  // Capture client IP
  req.clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  const userEmail = (req.headers['x-user-email'] as string)?.toLowerCase();
  const userRole = (req.headers['x-user-role'] as string)?.toLowerCase() as UserRole;

  if (userEmail && TEAM_MEMBERS[userEmail]) {
    req.user = TEAM_MEMBERS[userEmail];
  } else if (userRole) {
    const matching = Object.values(TEAM_MEMBERS).find((m) => m.role === userRole);
    req.user = matching || DEFAULT_USER;
  } else {
    req.user = DEFAULT_USER;
  }

  next();
}

/**
 * Role-Based Access Control (RBAC) Guard
 */
export function requirePermission(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role || 'sdr';
    if (!allowedRoles.includes(userRole)) {
      auditLogger.log({
        actor: req.user?.name || 'Unknown',
        actorRole: userRole,
        action: 'SECURITY_AUTH',
        entityType: 'system',
        details: `Access denied to ${req.method} ${req.path}. Required roles: [${allowedRoles.join(', ')}], user had: "${userRole}"`,
        ipAddress: req.clientIp,
      });

      return res.status(403).json({
        success: false,
        error: `Permission Denied. This administrative operation requires one of: [${allowedRoles.join(', ')}]. Current role: "${userRole}".`,
      });
    }
    next();
  };
}

/**
 * Rate Limiter: In-memory sliding window rate limiter
 * Protects against aggressive scraping and API denial of service.
 */
interface RateLimitBucket {
  count: number;
  resetTime: number;
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();
const RATE_LIMIT_MAX = 200; // requests per minute
const WINDOW_MS = 60 * 1000;

export function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = req.clientIp || '127.0.0.1';
  const now = Date.now();

  let bucket = rateLimitBuckets.get(ip);
  if (!bucket || now > bucket.resetTime) {
    bucket = { count: 1, resetTime: now + WINDOW_MS };
    rateLimitBuckets.set(ip, bucket);
  } else {
    bucket.count += 1;
  }

  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT_MAX - bucket.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(bucket.resetTime / 1000));

  if (bucket.count > RATE_LIMIT_MAX) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Too many requests, please slow down.',
      retryAfterSeconds: Math.ceil((bucket.resetTime - now) / 1000),
    });
  }

  next();
}

/**
 * Input Sanitization Middleware: Clean input strings to prevent XSS and malformed payloads
 */
function sanitizeValue(val: any): any {
  if (typeof val === 'string') {
    return val
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .trim();
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeValue);
  }
  if (val !== null && typeof val === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      cleaned[k] = sanitizeValue(v);
    }
    return cleaned;
  }
  return val;
}

export function sanitizeInputMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  next();
}
