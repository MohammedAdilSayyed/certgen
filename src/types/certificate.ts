export type TemplateId = 'classic' | 'modern' | 'premium' | 'custom';

export interface Signature {
  id: string;
  name: string;
  designation: string;
  image: string | null;
}

export interface CertificateData {
  title: string;
  departmentName?: string;
  recipientName: string;
  eventName: string;
  completionText: string;
  description: string;
  leftLogo: string | null;
  rightLogo: string | null;
  signatures: Signature[];
  templateId: TemplateId;
  backgroundImage: string | null;
  styles: {
    fontFamily: string;
    fontSize: number;
    color: string;
    titleColor?: string;
    recipientColor?: string;
    eventColor?: string;
    completionTextColor?: string;
    descriptionColor?: string;
    idColor?: string;
    textAlign: 'left' | 'center' | 'right';
    spacing: number;
    fieldStyles?: Record<string, { x?: number; y?: number; fontSize?: number; bold?: boolean }>;
  };
  qrCodeValue?: string;
  uniqueId?: string;
  templateName?: string;
}

export const DEFAULT_CERTIFICATE_DATA: CertificateData = {
  title: 'CERTIFICATE OF ACHIEVEMENT',
  departmentName: '',
  recipientName: 'Recipient Name',
  eventName: 'Professional Development Seminar',
  completionText: 'in recognition of successful completion of',
  description: 'In recognition of their outstanding performance and dedication to excellence shown during the completion of the program.',
  leftLogo: null,
  rightLogo: null,
  signatures: [
    { id: '1', name: 'John Doe', designation: 'Director', image: null }
  ],
  templateId: 'classic',
  backgroundImage: null,
  styles: {
    fontFamily: 'serif',
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
    spacing: 1,
  }
};
