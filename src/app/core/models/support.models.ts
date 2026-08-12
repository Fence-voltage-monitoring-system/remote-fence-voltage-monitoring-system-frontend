export interface Faq {
  id?: string;
  category: string;
  question: string;
  answer: string;
}

export interface SupportTicketPayload {
  name: string;
  email: string;
  category: string;
  subject: string;
  description: string;
  priority: 'NORMAL' | 'HIGH' | 'CRITICAL';
}

export interface SystemStatusInfo {
  overallStatus: 'OPERATIONAL' | 'DEGRADED' | 'OFFLINE';
  lastUpdated: string;
  environment: string;
  version: string;
}
