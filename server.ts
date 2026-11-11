import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { leadsRouter } from './server/routes/leads.js';
import { aiRouter } from './server/routes/ai.js';
import { analyticsRouter } from './server/routes/analytics.js';
import { discoveryRouter } from './server/routes/discovery.js';
import { agentsRouter } from './server/routes/agents.js';
import { chatbotRouter } from './server/routes/chatbot.js';
import { whatsappRouter } from './server/routes/whatsapp.js';
import { authRouter } from './server/routes/auth.js';
import {
  authMiddleware,
  rateLimiterMiddleware,
  sanitizeInputMiddleware,
} from './server/middleware/security.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Security & Parsing Middlewares
app.use(express.json({ limit: '2mb' }));
app.use(authMiddleware);
app.use(rateLimiterMiddleware);
app.use(sanitizeInputMiddleware);

// API health & readiness check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'LeadPulse AI SaaS Platform',
    environment: process.env.NODE_ENV || 'development',
    authenticatedUser: req.user?.name,
    userRole: req.user?.role,
    security: {
      rateLimiter: 'active',
      auditLogging: 'active',
      geminiServerSideProxy: 'active',
    },
  });
});

// Mount modular API routes
app.use('/api/auth', authRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/discovery', discoveryRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/chatbot', chatbotRouter);
app.use('/api/whatsapp', whatsappRouter);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // Serve production static build
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Development mode: mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 LeadPulse AI server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
