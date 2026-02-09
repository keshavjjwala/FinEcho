import { Call, CallSummary, DashboardStats, Client } from '@/types';

export const mockClients: Client[] = [
  { id: 'client-1', name: 'Rajesh Sharma', email: 'rajesh.sharma@email.com', phone: '+91 98765 43210', totalCalls: 5 },
  { id: 'client-2', name: 'Priya Patel', email: 'priya.patel@email.com', phone: '+91 87654 32109', totalCalls: 3 },
  { id: 'client-3', name: 'Amit Kumar', email: 'amit.kumar@email.com', phone: '+91 76543 21098', totalCalls: 2 },
  { id: 'client-4', name: 'Sneha Gupta', email: 'sneha.gupta@email.com', phone: '+91 65432 10987', totalCalls: 4 },
  { id: 'client-5', name: 'Vikram Singh', email: 'vikram.singh@email.com', phone: '+91 54321 09876', totalCalls: 1 },
];

export const mockCalls: Call[] = [
  {
    id: 'call-1',
    clientName: 'Rajesh Sharma',
    clientId: 'client-1',
    callDate: '2026-02-08',
    callDuration: 1245,
    languageDetected: 'Hindi',
    aiProcessingStatus: 'processed',
    complianceStatus: 'clear',
    advisorName: 'Arun Mehta',
  },
  {
    id: 'call-2',
    clientName: 'Priya Patel',
    clientId: 'client-2',
    callDate: '2026-02-08',
    callDuration: 890,
    languageDetected: 'English',
    aiProcessingStatus: 'processed',
    complianceStatus: 'needs_review',
    advisorName: 'Arun Mehta',
  },
  {
    id: 'call-3',
    clientName: 'Amit Kumar',
    clientId: 'client-3',
    callDate: '2026-02-07',
    callDuration: 2100,
    languageDetected: 'Hindi',
    aiProcessingStatus: 'pending',
    complianceStatus: 'clear',
    advisorName: 'Arun Mehta',
  },
  {
    id: 'call-4',
    clientName: 'Sneha Gupta',
    clientId: 'client-4',
    callDate: '2026-02-07',
    callDuration: 1560,
    languageDetected: 'English',
    aiProcessingStatus: 'processed',
    complianceStatus: 'clear',
    advisorName: 'Arun Mehta',
  },
  {
    id: 'call-5',
    clientName: 'Vikram Singh',
    clientId: 'client-5',
    callDate: '2026-02-06',
    callDuration: 980,
    languageDetected: 'Hindi',
    aiProcessingStatus: 'processed',
    complianceStatus: 'needs_review',
    advisorName: 'Arun Mehta',
  },
  {
    id: 'call-6',
    clientName: 'Rajesh Sharma',
    clientId: 'client-1',
    callDate: '2026-02-05',
    callDuration: 1890,
    languageDetected: 'Hindi',
    aiProcessingStatus: 'processed',
    complianceStatus: 'clear',
    advisorName: 'Arun Mehta',
  },
];

export const mockCallSummaries: Record<string, CallSummary> = {
  'call-1': {
    id: 'summary-1',
    callId: 'call-1',
    callDate: '2026-02-08',
    callDuration: 1245,
    advisorName: 'Arun Mehta',
    clientName: 'Rajesh Sharma',
    languageUsed: 'Hindi',
    conversationSummary: 'The advisor discussed retirement planning options with Mr. Sharma. The client expressed interest in starting a systematic investment plan for long-term wealth creation. The advisor explained different mutual fund categories suitable for retirement goals and emphasized the importance of staying invested for the long term. Mr. Sharma showed particular interest in hybrid funds due to their balanced risk profile.',
    clientUnderstanding: {
      financialGoals: ['Retirement', 'Wealth Creation'],
      timeHorizon: 'long',
      riskComfortLevel: 'moderate',
      investmentAwarenessLevel: 'moderate',
    },
    sipDiscussions: [
      {
        id: 'sip-1',
        sipType: 'new',
        sipAmount: 25000,
        sipFrequency: 'monthly',
        expectedDuration: 15,
        fundCategory: 'hybrid',
        goalBasedReason: 'Retirement corpus building with moderate risk exposure',
        riskExplanationGiven: 'yes',
        clientDecisionState: 'proceeded',
      },
    ],
    clientResponseSummary: 'proceeded',
  },
  'call-2': {
    id: 'summary-2',
    callId: 'call-2',
    callDate: '2026-02-08',
    callDuration: 890,
    advisorName: 'Arun Mehta',
    clientName: 'Priya Patel',
    languageUsed: 'English',
    conversationSummary: 'Ms. Patel inquired about tax-saving investment options. The advisor explained ELSS funds and their lock-in period. The client was interested but wanted to discuss with family members before making a decision. The advisor also touched upon the benefits of starting early in the financial year for tax planning.',
    clientUnderstanding: {
      financialGoals: ['Tax Saving'],
      timeHorizon: 'medium',
      riskComfortLevel: 'low',
      investmentAwarenessLevel: 'basic',
    },
    sipDiscussions: [
      {
        id: 'sip-2',
        sipType: 'new',
        sipAmount: 12500,
        sipFrequency: 'monthly',
        expectedDuration: 3,
        fundCategory: 'elss',
        goalBasedReason: 'Tax saving under Section 80C with potential growth',
        riskExplanationGiven: 'yes',
        clientDecisionState: 'deferred',
        deferralNote: 'SIP was discussed. Client did not provide immediate consent.',
      },
    ],
    clientResponseSummary: 'deferred',
  },
  'call-4': {
    id: 'summary-4',
    callId: 'call-4',
    callDate: '2026-02-07',
    callDuration: 1560,
    advisorName: 'Arun Mehta',
    clientName: 'Sneha Gupta',
    languageUsed: 'English',
    conversationSummary: 'The call focused on building an education fund for Ms. Gupta\'s daughter. The advisor explained the power of long-term equity investments and suggested a combination of equity and debt funds. The client agreed to start with a moderate amount and increase it annually. Discussion also covered the importance of reviewing the portfolio periodically.',
    clientUnderstanding: {
      financialGoals: ['Education', 'Child Future'],
      timeHorizon: 'long',
      riskComfortLevel: 'moderate',
      investmentAwarenessLevel: 'moderate',
    },
    sipDiscussions: [
      {
        id: 'sip-4',
        sipType: 'new',
        sipAmount: 15000,
        sipFrequency: 'monthly',
        expectedDuration: 12,
        fundCategory: 'equity',
        goalBasedReason: 'Long-term education fund for child with growth focus',
        riskExplanationGiven: 'yes',
        clientDecisionState: 'proceeded',
      },
      {
        id: 'sip-5',
        sipType: 'new',
        sipAmount: 10000,
        sipFrequency: 'monthly',
        expectedDuration: 12,
        fundCategory: 'debt',
        goalBasedReason: 'Stability component for education fund',
        riskExplanationGiven: 'yes',
        clientDecisionState: 'proceeded',
      },
    ],
    clientResponseSummary: 'proceeded',
  },
  'call-5': {
    id: 'summary-5',
    callId: 'call-5',
    callDate: '2026-02-06',
    callDuration: 980,
    advisorName: 'Arun Mehta',
    clientName: 'Vikram Singh',
    languageUsed: 'Hindi',
    conversationSummary: 'Mr. Singh called to discuss modifying his existing SIP. He expressed concerns about market volatility and wanted to reduce his equity exposure. The advisor explained the benefits of staying invested during volatility but respected the client\'s decision to pause the SIP temporarily.',
    clientUnderstanding: {
      financialGoals: ['Wealth Creation'],
      timeHorizon: 'medium',
      riskComfortLevel: 'low',
      investmentAwarenessLevel: 'basic',
    },
    sipDiscussions: [
      {
        id: 'sip-6',
        sipType: 'pause',
        sipAmount: 20000,
        sipFrequency: 'monthly',
        fundCategory: 'equity',
        goalBasedReason: 'Client concerned about market conditions',
        riskExplanationGiven: 'yes',
        clientDecisionState: 'deferred',
        deferralNote: 'SIP was discussed. Client did not provide immediate consent.',
      },
    ],
    clientResponseSummary: 'deferred',
  },
  'call-6': {
    id: 'summary-6',
    callId: 'call-6',
    callDate: '2026-02-05',
    callDuration: 1890,
    advisorName: 'Arun Mehta',
    clientName: 'Rajesh Sharma',
    languageUsed: 'Hindi',
    conversationSummary: 'Follow-up call with Mr. Sharma regarding his investment portfolio. The advisor reviewed the existing SIPs and discussed adding a debt component for better diversification. The client appreciated the comprehensive review and agreed to add a debt fund SIP.',
    clientUnderstanding: {
      financialGoals: ['Retirement', 'Diversification'],
      timeHorizon: 'long',
      riskComfortLevel: 'moderate',
      investmentAwarenessLevel: 'advanced',
    },
    sipDiscussions: [
      {
        id: 'sip-7',
        sipType: 'new',
        sipAmount: 15000,
        sipFrequency: 'monthly',
        expectedDuration: 10,
        fundCategory: 'debt',
        goalBasedReason: 'Portfolio diversification with stable returns component',
        riskExplanationGiven: 'yes',
        clientDecisionState: 'proceeded',
      },
    ],
    clientResponseSummary: 'proceeded',
  },
};

export const getDashboardStats = (startDate: string, endDate: string): DashboardStats => {
  const filteredCalls = mockCalls.filter(call => {
    const callDate = new Date(call.callDate);
    return callDate >= new Date(startDate) && callDate <= new Date(endDate);
  });

  return {
    totalCallsRecorded: filteredCalls.length,
    callsProcessedByAI: filteredCalls.filter(c => c.aiProcessingStatus === 'processed').length,
    callsPendingReview: filteredCalls.filter(c => c.complianceStatus === 'needs_review').length,
    complianceFlagsRaised: filteredCalls.filter(c => c.complianceStatus === 'needs_review').length,
    followUpsRequired: filteredCalls.filter(c => {
      const summary = mockCallSummaries[c.id];
      return summary?.clientResponseSummary === 'deferred';
    }).length,
  };
};

export const getCallsByDateRange = (startDate: string, endDate: string): Call[] => {
  return mockCalls.filter(call => {
    const callDate = new Date(call.callDate);
    return callDate >= new Date(startDate) && callDate <= new Date(endDate);
  });
};
