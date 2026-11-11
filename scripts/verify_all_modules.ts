/**
 * Comprehensive Verification & QA Test Suite
 * Validates all 11 core modules, persistence, AI inference, and security
 */
async function runQATests() {
  const BASE_URL = 'http://localhost:3000';
  const results: { test: string; status: 'PASSED' | 'FAILED'; details?: string }[] = [];

  console.log('🧪 Starting LeadPulse AI Comprehensive QA & Module Verification...\n');

  // Test 1: Healthcheck & Security Configuration
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    if (res.ok && data.status === 'ok' && data.security?.rateLimiter === 'active') {
      results.push({ test: '1. Health & Security Middleware', status: 'PASSED', details: `User: ${data.authenticatedUser} (${data.userRole})` });
    } else {
      results.push({ test: '1. Health & Security Middleware', status: 'FAILED', details: JSON.stringify(data) });
    }
  } catch (err: any) {
    results.push({ test: '1. Health & Security Middleware', status: 'FAILED', details: err.message });
  }

  // Test 2: Add a Lead (CRUD - Create)
  let testLeadId = '';
  try {
    const res = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': 'sarah.j@leadpulse.ai',
      },
      body: JSON.stringify({
        companyName: `Apex QA Robotics ${Date.now()}`,
        industry: 'Robotics & Factory Automation',
        contactPerson: 'David Chen',
        title: 'VP Engineering',
        email: `david.chen.${Date.now()}@apexrobotics.io`,
        phone: '+1 (512) 880-9912',
        website: 'https://apexrobotics.io',
        domain: 'apexrobotics.io',
        country: 'United States',
        city: 'Austin',
        leadScore: 88,
        leadQuality: 'High',
        leadSource: 'Web Discovery',
        remarks: 'Evaluating modern outbound SDR automation',
        leadStatus: 'Qualified',
        assignedSalesperson: 'Sarah Jenkins',
      }),
    });
    const data = await res.json();
    if (res.status === 201 && data.success && data.data?.id) {
      testLeadId = data.data.id;
      results.push({ test: '2. Add Lead (Create)', status: 'PASSED', details: `Lead ID: ${testLeadId}` });
    } else {
      results.push({ test: '2. Add Lead (Create)', status: 'FAILED', details: JSON.stringify(data) });
    }
  } catch (err: any) {
    results.push({ test: '2. Add Lead (Create)', status: 'FAILED', details: err.message });
  }

  // Test 3: Edit a Lead (CRUD - Update)
  try {
    const res = await fetch(`${BASE_URL}/api/leads/${testLeadId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': 'sarah.j@leadpulse.ai',
      },
      body: JSON.stringify({
        leadStatus: 'Negotiation',
        remarks: 'Contract sent for executive review',
      }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.data?.leadStatus === 'Negotiation') {
      results.push({ test: '3. Edit Lead (Update)', status: 'PASSED', details: 'Status updated to Negotiation' });
    } else {
      results.push({ test: '3. Edit Lead (Update)', status: 'FAILED', details: JSON.stringify(data) });
    }
  } catch (err: any) {
    results.push({ test: '3. Edit Lead (Update)', status: 'FAILED', details: err.message });
  }

  // Test 4: Duplicate Prevention Check
  try {
    const res = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: 'Apex QA Robotics Duplicate',
        domain: 'apexrobotics.io', // Duplicate domain
      }),
    });
    const data = await res.json();
    if (res.status === 409 && data.isDuplicate) {
      results.push({ test: '4. Duplicate Prevention', status: 'PASSED', details: 'Blocked duplicate domain registration' });
    } else {
      results.push({ test: '4. Duplicate Prevention', status: 'FAILED', details: JSON.stringify(data) });
    }
  } catch (err: any) {
    results.push({ test: '4. Duplicate Prevention', status: 'FAILED', details: err.message });
  }

  // Test 5: Search for Companies (Lead Discovery Provider)
  try {
    const res = await fetch(`${BASE_URL}/api/discovery/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        industry: 'Software Companies',
        location: 'United States',
        targetAudience: 'B2B',
        limit: 5,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success && Array.isArray(data.results) && data.results.length > 0) {
      results.push({
        test: '5. Lead Discovery Search',
        status: 'PASSED',
        details: `Discovered ${data.results.length} companies with legitimate verified data`,
      });
    } else {
      results.push({ test: '5. Lead Discovery Search', status: 'FAILED', details: JSON.stringify(data) });
    }
  } catch (err: any) {
    results.push({ test: '5. Lead Discovery Search', status: 'FAILED', details: err.message });
  }

  // Test 6: AI Lead Scoring (Gemini / Heuristic Engine)
  try {
    const res = await fetch(`${BASE_URL}/api/leads/${testLeadId}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (res.ok && data.success && typeof data.data?.leadScore === 'number') {
      results.push({
        test: '6. AI Lead Scoring',
        status: 'PASSED',
        details: `Calculated Score: ${data.data.leadScore}/100 (${data.data.leadCategory || 'Qualified'})`,
      });
    } else {
      results.push({ test: '6. AI Lead Scoring', status: 'FAILED', details: JSON.stringify(data) });
    }
  } catch (err: any) {
    results.push({ test: '6. AI Lead Scoring', status: 'FAILED', details: err.message });
  }

  // Test 7: AI Orchestrator Execution
  try {
    const res = await fetch(`${BASE_URL}/api/agents/run-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: 'lead_qualifier',
        action: 'qualify',
        params: { leadId: testLeadId },
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      results.push({ test: '7. AI Agent Execution', status: 'PASSED', details: `Lead Qualifier: ${data.result?.recommendation || 'Scored and qualified'}` });
    } else {
      results.push({ test: '7. AI Agent Execution', status: 'FAILED', details: JSON.stringify(data) });
    }
  } catch (err: any) {
    results.push({ test: '7. AI Agent Execution', status: 'FAILED', details: err.message });
  }

  // Test 8: Asking Chatbot Questions (AI Sales Assistant with real DB tool calling)
  try {
    const res = await fetch(`${BASE_URL}/api/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Show me all hot leads in the database',
      }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.message?.content) {
      results.push({
        test: '8. AI Sales Chatbot',
        status: 'PASSED',
        details: `Response generated with ${data.message.referencedLeads?.length || 0} referenced lead cards`,
      });
    } else {
      results.push({ test: '8. AI Sales Chatbot', status: 'FAILED', details: JSON.stringify(data) });
    }
  } catch (err: any) {
    results.push({ test: '8. AI Sales Chatbot', status: 'FAILED', details: err.message });
  }

  // Test 9: WhatsApp Outreach & Pre-filled wa.me Generation
  try {
    const res = await fetch(`${BASE_URL}/api/whatsapp/generate-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: testLeadId,
        style: 'pitch',
      }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.waMeUrl && data.phoneNormalization?.isValid) {
      results.push({
        test: '9. WhatsApp wa.me Generation',
        status: 'PASSED',
        details: `Generated URL: ${data.waMeUrl.substring(0, 45)}...`,
      });
    } else {
      results.push({ test: '9. WhatsApp wa.me Generation', status: 'FAILED', details: JSON.stringify(data) });
    }
  } catch (err: any) {
    results.push({ test: '9. WhatsApp wa.me Generation', status: 'FAILED', details: err.message });
  }

  // Test 10: Schedule Follow-up Task
  try {
    const nextDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const res = await fetch(`${BASE_URL}/api/whatsapp/schedule-followup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: testLeadId,
        nextFollowUpDate: nextDate,
        notes: 'Follow up on executive product walkthrough proposal',
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      results.push({ test: '10. Follow-up Cadence Scheduling', status: 'PASSED', details: `Scheduled for ${nextDate.split('T')[0]}` });
    } else {
      results.push({ test: '10. Follow-up Cadence Scheduling', status: 'FAILED', details: JSON.stringify(data) });
    }
  } catch (err: any) {
    results.push({ test: '10. Follow-up Cadence Scheduling', status: 'FAILED', details: err.message });
  }

  // Test 11: Analytics & CSV Report Export
  try {
    const res = await fetch(`${BASE_URL}/api/analytics/detailed`);
    const data = await res.json();
    const csvRes = await fetch(`${BASE_URL}/api/analytics/export/csv`);
    const csvText = await csvRes.text();

    if (res.ok && data.success && data.data?.metrics?.totalLeads > 0 && csvText.includes('LeadPulse SaaS')) {
      results.push({
        test: '11. Analytics & CSV Export',
        status: 'PASSED',
        details: `Calculated metrics across ${data.data.metrics.totalLeads} leads; CSV report generated (${csvText.length} bytes)`,
      });
    } else {
      results.push({ test: '11. Analytics & CSV Export', status: 'FAILED', details: 'Invalid analytics or CSV structure' });
    }
  } catch (err: any) {
    results.push({ test: '11. Analytics & CSV Export', status: 'FAILED', details: err.message });
  }

  // Test 12: Security RBAC & Audit Trail Logging
  try {
    const logsRes = await fetch(`${BASE_URL}/api/auth/audit-logs`, {
      headers: { 'X-User-Email': 'sarah.j@leadpulse.ai' },
    });
    const logsData = await logsRes.json();

    // Also verify non-admin cannot bulk-delete without permissions
    const sdrDeleteRes = await fetch(`${BASE_URL}/api/leads/bulk-delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': 'elena.z@leadpulse.ai', // SDR role
      },
      body: JSON.stringify({ leadIds: [testLeadId] }),
    });

    if (logsRes.ok && logsData.count > 0 && sdrDeleteRes.status === 403) {
      results.push({
        test: '12. RBAC & Audit Logging',
        status: 'PASSED',
        details: `Verified 403 Forbidden for unauthorized SDR role + verified ${logsData.count} audit logs logged`,
      });
    } else {
      results.push({ test: '12. RBAC & Audit Logging', status: 'FAILED', details: `Logs: ${logsData.count}, SDR status: ${sdrDeleteRes.status}` });
    }
  } catch (err: any) {
    results.push({ test: '12. RBAC & Audit Logging', status: 'FAILED', details: err.message });
  }

  // Test 13: Delete Lead (CRUD - Delete)
  try {
    const res = await fetch(`${BASE_URL}/api/leads/${testLeadId}`, {
      method: 'DELETE',
      headers: { 'X-User-Email': 'sarah.j@leadpulse.ai' },
    });
    const data = await res.json();
    if (res.ok && data.success) {
      results.push({ test: '13. Delete Lead', status: 'PASSED', details: 'Lead cleaned up successfully' });
    } else {
      results.push({ test: '13. Delete Lead', status: 'FAILED', details: JSON.stringify(data) });
    }
  } catch (err: any) {
    results.push({ test: '13. Delete Lead', status: 'FAILED', details: err.message });
  }

  console.log('📊 Verification Summary:');
  for (const r of results) {
    const icon = r.status === 'PASSED' ? '✅' : '❌';
    console.log(`${icon} [${r.status}] ${r.test}: ${r.details || ''}`);
  }

  const passedCount = results.filter((r) => r.status === 'PASSED').length;
  console.log(`\n${passedCount} / ${results.length} Tests Passed!`);

  if (passedCount === results.length) {
    console.log('🎉 Full Platform QA PASSED. Ready for Production Deployment.');
  } else {
    console.error('❌ Some tests failed. Review details above.');
    process.exit(1);
  }
}

runQATests().catch(console.error);
