export interface Call {
  id: string;
  clientName: string;
  clientId: string;
  callDate: string;
  callDuration: number; // in seconds
  languageDetected: string;
  aiProcessingStatus: 'processed' | 'pending';
  complianceStatus: 'clear' | 'needs_review';
  advisorName: string;
}

export interface CallSummary {
  id: string;
  callId: string;
  // Call Overview
  callDate: string;
  callDuration: number;
  advisorName: string;
  clientName: string;
  languageUsed: string;
  
  // Conversation Summary
  conversationSummary: string;
  
  // Client Understanding
  clientUnderstanding: {
    financialGoals: string[];
    timeHorizon: 'short' | 'medium' | 'long';
    riskComfortLevel: 'low' | 'moderate' | 'high';
    investmentAwarenessLevel: 'basic' | 'moderate' | 'advanced';
  };
  
  // SIP Discussions
  sipDiscussions: SIPDiscussion[];
  
  // Client Response Summary
  clientResponseSummary: 'proceeded' | 'deferred';
}

export interface SIPDiscussion {
  id: string;
  // SIP Details
  sipType: 'new' | 'modification' | 'pause' | 'discussion_only';
  sipAmount?: number;
  sipFrequency: 'monthly' | 'quarterly' | 'not_finalized';
  expectedDuration?: number; // in years
  
  // Mutual Fund Context
  fundCategory: 'equity' | 'debt' | 'hybrid' | 'elss';
  goalBasedReason: string;
  riskExplanationGiven: 'yes' | 'no' | 'unclear';
  
  // Client Decision State
  clientDecisionState: 'proceeded' | 'deferred';
  deferralNote?: string;
}

export interface DashboardStats {
  totalCallsRecorded: number;
  callsProcessedByAI: number;
  callsPendingReview: number;
  complianceFlagsRaised: number;
  followUpsRequired: number;
}

export interface Advisor {
  id: string;
  email: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'advisor' | 'admin';
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  totalCalls: number;
}
