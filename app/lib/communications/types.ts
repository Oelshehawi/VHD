export type CommunicationItemType =
  | "call_payment"
  | "call_scheduling"
  | "email_invoice_delivery"
  | "email_cleaning_reminder"
  | "email_payment_reminder";

export type CommunicationSource = "invoice" | "jobsDueSoon";

export interface CommunicationRecordRefs {
  invoiceId?: string;
  jobsDueSoonId?: string;
  clientId?: string;
}

export interface CommunicationItem {
  id: string;
  type: CommunicationItemType;
  source: CommunicationSource;
  timestamp: string;
  actor?: string;
  summary: string;
  details?: Record<string, unknown>;
  followUpDate?: string | null;
  refs: CommunicationRecordRefs;
}

export type CommunicationsContextInput =
  | {
      contextType: "invoice";
      invoiceId: string;
    }
  | {
      contextType: "jobsDueSoon";
      jobsDueSoonId?: string;
      invoiceId?: string;
    };

export interface JobsDueSoonContextSnapshot {
  jobsDueSoonId: string;
  invoiceId: string;
  clientId: string;
  jobTitle: string;
  dateDue?: string;
  isScheduled?: boolean;
  emailSent?: boolean;
  emailHistory: Array<{
    sentAt: string;
    recipient: string;
    includeSchedulingLink: boolean;
    templateAlias?: string;
    messageStream?: string;
    performedBy?: string;
  }>;
}

export interface CommunicationsContextPayload {
  contextType: "invoice" | "jobsDueSoon";
  title: string;
  refs: CommunicationRecordRefs & {
    invoiceNumber?: string;
  };
  emailExists: boolean;
  jobsDueSoon?: JobsDueSoonContextSnapshot;
  items: CommunicationItem[];
}

export interface UrgentFollowUpItem {
  id: string;
  source: CommunicationSource;
  title: string;
  latestOutcome: string;
  followUpDate: string;
  contextBadge: "Invoice" | "Jobs";
  href: string;
  refs: CommunicationRecordRefs;
}
