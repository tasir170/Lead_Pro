import { Router, Request, Response } from 'express';
import { dataStore } from '../services/dataStore.js';
import {
  calculateDetailedAnalytics,
  generateAIAnalyticsInsight,
  generateAnalyticsCsv,
} from '../services/analyticsService.js';
import { AnalyticsFilterOptions } from '../types.js';

export const analyticsRouter = Router();

// GET /api/analytics/summary - High level summary for main dashboard
analyticsRouter.get('/summary', (_req: Request, res: Response) => {
  try {
    const summary = dataStore.getPipelineSummary();
    const acquisition = dataStore.getAcquisitionTrend();
    const quality = dataStore.getQualityBreakdown();

    res.json({
      success: true,
      data: {
        summary,
        acquisition,
        quality,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch analytics summary' });
  }
});

// GET /api/analytics/detailed - Deep metrics, charts, and filter aggregations
analyticsRouter.get('/detailed', (req: Request, res: Response) => {
  try {
    const filters: AnalyticsFilterOptions = {
      timeframe: (req.query.timeframe as any) || 'all',
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      industry: req.query.industry as string,
      country: req.query.country as string,
    };

    const analytics = calculateDetailedAnalytics(filters);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to compute detailed analytics' });
  }
});

// POST /api/analytics/ai-insights - Gemini-powered analytics assistant
analyticsRouter.post('/ai-insights', async (req: Request, res: Response) => {
  try {
    const { query, timeframe, startDate, endDate, industry, country } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query string is required to generate AI insights',
      });
    }

    const filters: AnalyticsFilterOptions = {
      timeframe: timeframe || 'all',
      startDate,
      endDate,
      industry,
      country,
    };

    const analytics = calculateDetailedAnalytics(filters);
    const insights = await generateAIAnalyticsInsight(query, analytics);

    res.json({
      success: true,
      data: insights,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to generate AI analytics insight' });
  }
});

// GET /api/analytics/export/csv - Stream formatted CSV report
analyticsRouter.get('/export/csv', (req: Request, res: Response) => {
  try {
    const filters: AnalyticsFilterOptions = {
      timeframe: (req.query.timeframe as any) || 'all',
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      industry: req.query.industry as string,
      country: req.query.country as string,
    };

    const analytics = calculateDetailedAnalytics(filters);
    const csvContent = generateAnalyticsCsv(analytics);

    const filename = `leadpulse_analytics_report_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to export CSV report' });
  }
});
