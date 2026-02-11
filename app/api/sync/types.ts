export type SyncTable =
  | "schedules"
  | "invoices"
  | "photos"
  | "availabilities"
  | "timeoffrequests"
  | "payrollperiods"
  | "reports"
  | "expopushtokens";

export interface SyncRequest {
  table: SyncTable;
  data: Record<string, unknown> | Record<string, unknown>[];
}

export interface HandlerResult {
  success: boolean;
  status: number;
  data?: Record<string, unknown>;
  error?: string;
  message?: string;
}

export interface SkippedItem {
  id: string;
  reason: string;
  code: "VALIDATION_ERROR" | "NOT_FOUND" | "MISSING_REFERENCE" | "EMPTY_UPDATE";
}

export interface TableHandler {
  put(data: Record<string, unknown>): Promise<HandlerResult>;
  batchPut(data: Record<string, unknown>): Promise<HandlerResult>;
  batchPatch?: (
    data: Record<string, unknown> | Record<string, unknown>[],
  ) => Promise<HandlerResult>;
  patch(data: Record<string, unknown>): Promise<HandlerResult>;
  delete(id: string): Promise<HandlerResult>;
}

// Photo-specific types
export type PhotoType = "before" | "after" | "estimate" | "signature";

export interface PhotoData {
  id: string;
  scheduleId: string;
  cloudinaryUrl?: string | null;
  type: PhotoType;
  technicianId: string;
  timestamp?: string;
  signerName?: string;
}

// Invoice payment data
export interface ChequePaymentData {
  id: string;
  paymentMethod: "cheque";
  datePaid?: string;
  notes?: string;
}

// Schedule update data
export interface TechnicianNotesData {
  id: string;
  technicianNotes: string;
  actualServiceDurationMinutes?: number;
}

// Availability data
export interface AvailabilityData {
  id: string;
  technicianId: string;
  startTime: string;
  endTime: string;
  isFullDay?: boolean;
  isRecurring?: boolean;
  dayOfWeek?: number;
  specificDate?: string;
}

// Time-off request data
export interface TimeOffRequestData {
  id: string;
  technicianId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status?: "pending" | "approved" | "rejected";
}

// Payroll period data
export interface PayrollPeriodData {
  id: string;
  startDate: string;
  endDate: string;
  cutoffDate: string;
  payDay: string;
}

// Report sync data from mobile app
export interface ReportSyncData {
  id: string;
  scheduleId: string;
  invoiceId: string;
  technicianId: string;
  dateCompleted: string;
  reportStatus: "draft" | "in_progress" | "completed";
  jobTitle?: string | null;
  location?: string | null;
  cookingVolume?: "High" | "Medium" | "Low" | null;
  recommendedCleaningFrequency?: number | null;
  comments?: string | null;
  cleaningDetails?: {
    hoodCleaned?: boolean;
    filtersCleaned?: boolean;
    ductworkCleaned?: boolean;
    fanCleaned?: boolean;
  };
  inspectionItems?: {
    adequateAccessPanels?: "Yes" | "No" | "N/A";
  };
}

// Expo Push Token data
export interface ExpoPushTokenData {
  id: string;
  userId: string;
  token: string;
  platform: "ios" | "android";
  deviceName: string;
  notifyNewJobs: 0 | 1;
  notifyScheduleChanges: 0 | 1;
  lastUsedAt: string;
}
