import { Router, Request, Response } from 'express';
import { TEAM_MEMBERS, requirePermission, DEFAULT_USER } from '../middleware/security.js';
import { auditLogger } from '../services/auditLogger.js';

export const authRouter = Router();

// GET /api/auth/me - Current user context
authRouter.get('/me', (req: Request, res: Response) => {
  const user = req.user || DEFAULT_USER;
  res.json({
    success: true,
    user,
  });
});

// GET /api/auth/team - Available team members
authRouter.get('/team', (_req: Request, res: Response) => {
  res.json({
    success: true,
    team: Object.values(TEAM_MEMBERS),
  });
});

// GET /api/auth/audit-logs - View security and data audit trail
authRouter.get('/audit-logs', requirePermission('admin', 'manager'), (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const action = req.query.action as string;
  const logs = auditLogger.getLogs(limit, action);

  res.json({
    success: true,
    count: logs.length,
    logs,
  });
});

// POST /api/auth/audit-logs/clear - Clear audit trail (admin only)
authRouter.post('/audit-logs/clear', requirePermission('admin'), (req: Request, res: Response) => {
  auditLogger.clearLogs();
  auditLogger.log({
    actor: req.user?.name || 'Admin',
    actorRole: req.user?.role || 'admin',
    action: 'SECURITY_AUTH',
    entityType: 'system',
    details: 'Audit logs cleared by administrator',
    ipAddress: req.clientIp,
  });

  res.json({
    success: true,
    message: 'Audit logs successfully cleared',
  });
});
