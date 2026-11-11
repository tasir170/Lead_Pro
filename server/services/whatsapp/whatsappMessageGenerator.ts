import { GoogleGenAI } from '@google/genai';
import { Lead } from '../../types.js';

export type WhatsAppMessageStyle =
  | 'intro'
  | 'pitch'
  | 'followup'
  | 'partnership'
  | 'meeting';

export interface GeneratedWhatsAppMessage {
  style: WhatsAppMessageStyle;
  styleLabel: string;
  messageText: string;
  callToAction: string;
  charCount: number;
}

let aiInstance: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (aiInstance) return aiInstance;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  aiInstance = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
  return aiInstance;
}

const STYLE_PROMPTS: Record<
  WhatsAppMessageStyle,
  { label: string; instruction: string }
> = {
  intro: {
    label: 'Professional Introduction',
    instruction:
      'Polite, authoritative introduction. Introduce yourself, reference their company and industry, mention that you noticed their market activity, and ask a respectful opening question.',
  },
  pitch: {
    label: 'Sales Pitch',
    instruction:
      'Value-driven commercial hook. Reference their specific business services, highlight how you solve their potential needs (e.g. SDR pipeline velocity, data enrichment, response rate lift), and present a clear value proposition.',
  },
  followup: {
    label: 'Follow-up Message',
    instruction:
      'Gentle, professional check-in. Recap previous outreach or conversation, reference an executive benchmark, and ask if scaling outbound pipeline is a priority for their team this quarter.',
  },
  partnership: {
    label: 'Partnership Proposal',
    instruction:
      'Strategic synergy angle. Propose collaborative alignment between your respective platforms, highlighting mutual client benefits and enterprise expansion.',
  },
  meeting: {
    label: 'Meeting Request',
    instruction:
      'Low-friction, concise call-to-action. Respect their time, state the concise reason for meeting, and propose a brief 10-15 minute executive conversation or quick demo.',
  },
};

/**
 * Generates personalized WhatsApp messages in 5 styles using Gemini 3.8 Flash
 */
export async function generatePersonalizedWhatsAppMessage(
  lead: Partial<Lead>,
  style: WhatsAppMessageStyle = 'intro'
): Promise<GeneratedWhatsAppMessage> {
  const companyName = lead.companyName || lead.company || 'Enterprise Account';
  const contactPerson = lead.contactPerson || lead.name || 'Decision Maker';
  const firstName = contactPerson.split(' ')[0] || contactPerson;
  const title = lead.title || 'Executive Leader';
  const industry = lead.industry || 'Technology & Commercial Services';
  const services = lead.aiResearchSummary || lead.aiSummary || 'B2B commercial operations and digital solutions';
  const needs = (lead.aiScoreAnalysis?.potentialCustomerNeeds || lead.keyChallenges || [
    'Automated prospect research',
    'Pipeline predictability',
    'Higher response rates on executive outreach',
  ]).join(', ');
  const score = lead.leadScore ?? lead.aiScore ?? 80;

  const styleConfig = STYLE_PROMPTS[style] || STYLE_PROMPTS.intro;
  const client = getAIClient();

  if (client) {
    try {
      const prompt = `You are an elite B2B Sales Director specializing in WhatsApp executive outreach.
Craft a high-converting, hyper-personalized WhatsApp message for a prospective business client.

PROSPECT CONTEXT:
- Company Name: ${companyName}
- Contact Person: ${contactPerson} (${title})
- Industry: ${industry}
- Business Description / Services: ${services}
- Identified Potential Needs: ${needs}
- Predictive Lead Score: ${score}/100

MESSAGE STYLE: "${styleConfig.label}"
STYLE GUIDELINES:
${styleConfig.instruction}

WHATSAPP FORMATTING RULES:
1. Keep the body concise: 2 to 4 punchy sentences max.
2. Tone must be professional, conversational, confident, and zero-fluff (no cheesy sales cliches or artificial hype).
3. Do not use generic email greetings like "Dear Sir/Madam" or formal sign-offs. Start with "Hi ${firstName},".
4. Include a low-friction Call to Action (CTA) at the end.
5. You can use standard WhatsApp formatting: *bold* for emphasis if appropriate.

Return ONLY a valid JSON object matching this schema:
{
  "messageText": "The exact WhatsApp message ready to be sent to the recipient (including the greeting and CTA)",
  "callToAction": "The specific question asked at the end"
}`;

      const response = await Promise.race([
        client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        }),
        new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini WhatsApp message generation timed out')), 9000)
        ),
      ]);

      const text = response.text?.trim();
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed.messageText) {
          return {
            style,
            styleLabel: styleConfig.label,
            messageText: parsed.messageText,
            callToAction: parsed.callToAction || 'Open to a quick 2-minute overview?',
            charCount: parsed.messageText.length,
          };
        }
      }
    } catch (err) {
      console.warn('Gemini WhatsApp generation fallback triggered:', err);
    }
  }

  // Resilient heuristic fallbacks for each of the 5 required styles
  let fallbackText = '';
  let fallbackCta = '';

  switch (style) {
    case 'pitch':
      fallbackText = `Hi ${firstName}, noticed ${companyName}'s work in ${industry}. We help revenue leaders eliminate manual prospect research and double executive reply rates by automating deep company dossiers. Are you currently evaluating modern outbound intelligence for your sales team?`;
      fallbackCta = 'Are you currently evaluating modern outbound intelligence for your sales team?';
      break;

    case 'followup':
      fallbackText = `Hi ${firstName}, following up on my previous note regarding ${companyName}'s outbound pipeline. We just published an enterprise benchmark showing a 3.4x lift in meeting bookings across ${industry} accounts. Would it be helpful if I shared a brief 2-minute recap?`;
      fallbackCta = 'Would it be helpful if I shared a brief 2-minute recap?';
      break;

    case 'partnership':
      fallbackText = `Hi ${firstName}, impressed by ${companyName}'s rapid expansion in ${industry}. We see strong strategic synergy between our platform and your commercial service workflows. Would you be open to exploring a joint partnership preview this month?`;
      fallbackCta = 'Would you be open to exploring a joint partnership preview this month?';
      break;

    case 'meeting':
      fallbackText = `Hi ${firstName}, I know you're busy leading commercial operations at ${companyName}. I have a couple of ideas specifically tailored to accelerate your team's pipeline in ${industry}. Do you have 10 minutes for a brief call this Thursday or Friday?`;
      fallbackCta = 'Do you have 10 minutes for a brief call this Thursday or Friday?';
      break;

    case 'intro':
    default:
      fallbackText = `Hi ${firstName}, noticed ${companyName}'s growth in ${industry}. We built an AI engine that discovers high-intent accounts and qualifies decision-makers before your reps even draft an outreach. Does your team handle SDR prospect research in-house?`;
      fallbackCta = 'Does your team handle SDR prospect research in-house?';
      break;
  }

  return {
    style,
    styleLabel: styleConfig.label,
    messageText: fallbackText,
    callToAction: fallbackCta,
    charCount: fallbackText.length,
  };
}
