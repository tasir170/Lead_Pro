import { Lead, LeadCategory, QualityTier } from '../../types.js';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  referencedLeads?: Lead[];
  suggestedQuestions?: string[];
  actionExecuted?: {
    toolName: string;
    description: string;
    success: boolean;
    requiresConfirmation?: boolean;
    pendingAction?: {
      actionType: 'update_remarks' | 'create_followup' | 'analyze_lead';
      leadId: string;
      leadName: string;
      payload: any;
    };
  };
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface ChatbotRequest {
  message: string;
  sessionId?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  confirmedAction?: {
    actionType: string;
    payload: any;
  };
}

export interface ChatbotResponse {
  success: boolean;
  message: ChatMessage;
  sessionId: string;
  error?: string;
}
