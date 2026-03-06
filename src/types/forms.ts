// Type definitions for the Order Parts form
export interface PartOrder {
  customerName: string;
  email: string;
  companyName: string;
  partNumber: string;
  partDescription: string;
  quantity: number;
  urgency: 'standard' | 'expedited' | 'rush';
  deliveryAddress: string;
  additionalNotes: string;
}

// Type definitions for the Contact form
export interface ContactForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  category: 'technical' | 'billing' | 'general' | 'complaint';
  message: string;
  preferredContactMethod: 'email' | 'phone';
}

// Validation error type
export interface ValidationErrors {
  [key: string]: string;
}

// Form submission status
export type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

// Form submission result
export interface SubmissionResult {
  success: boolean;
  message: string;
  orderId?: string;
  ticketId?: string;
}
