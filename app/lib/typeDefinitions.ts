import { ObjectId } from "mongodb";
import { CallOutcome } from "./callLogConstants";

export interface CallLogEntry {
  _id?: string;
  callerId: string; // User ID from Clerk
  callerName: string; // User display name
  timestamp: Date;
  outcome: CallOutcome;
  notes: string;
  followUpDate?: Date;
  duration?: number; // in minutes, optional for manual entry
}

export interface CleaningReminderEmailHistoryEntry {
  sentAt: Date | string;
  recipient: string;
  includeSchedulingLink: boolean;
  templateAlias?: string;
  messageStream?: string;
  performedBy?: string;
}

export interface InvoiceEmailHistoryEntry {
  sentAt: Date | string;
  recipients: string[];
  includeReport: boolean;
  templateAlias?: string;
  messageStream?: string;
  performedBy?: string;
}

export type SearchParamProps = {
  params: { [key: string]: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export interface ShiftType {
  _id: ObjectId | string;
  technicianId: string;
  clockIn: Date;
  clockOut: Date;
  jobDetails: string;
  hoursWorked: number;
}

export interface OnSiteContactType {
  name: string;
  phone: string;
  email?: string;
}

export interface PendingInvoiceType {
  _id: ObjectId | string;
  invoiceId: string;
  jobTitle: string;
  dateIssued: Date | string;
  status: string;
  amount: number;
  paymentEmailSent?: boolean;
  callHistory?: CallLogEntry[];
  emailDeliveryHistoryCount?: number;
  communicationsCount?: number;
}

export interface ScheduleType {
  _id: ObjectId | string;
  invoiceRef: ObjectId | string;
  jobTitle: string | undefined;
  location: string;
  startDateTime: Date | string;
  assignedTechnicians: string[];
  confirmed: boolean;
  hours: number;
  shifts?: ShiftType[];
  payrollPeriod: ObjectId | string;
  deadRun: boolean;
  technicianNotes?: string;
  onSiteContact?: OnSiteContactType;
  accessInstructions?: string;
  actualServiceDurationMinutes?: number;
  actualServiceDurationSource?: "after_photo" | "mark_completed" | "admin_edit";
  historicalServiceDurationMinutes?: number;
}

export interface AvailabilityType {
  _id?: ObjectId | string;
  technicianId: string;
  dayOfWeek?: number; // 0-6 for recurring patterns, null if specific date
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isFullDay: boolean;
  isRecurring: boolean;
  specificDate?: Date | string; // For one-time blocks
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TimeOffRequestType {
  _id?: ObjectId | string;
  technicianId: string;
  startDate: Date | string;
  endDate: Date | string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string; // Admin Clerk ID
  notes?: string;
}

export interface TechnicianType {
  id: string;
  name: string;
  hourlyRate?: number;
  overtimeRate?: number;
  depotAddress?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
}

export interface PayrollPeriodType {
  _id: ObjectId | string;
  startDate: Date | string;
  endDate: Date | string;
  cutoffDate: Date | string;
  payDay: Date | string;
}

export interface PayrollMissingDurationJobType {
  scheduleId: string;
  jobTitle: string;
  startDateTime: Date | string;
}

export interface PayrollTechnicianDriveMetricsType {
  technicianId: string;
  technicianName: string;
  totalJobs: number;
  scheduledHours: number;
  actualHours: number;
  driveHours: number;
  scheduledPlusDriveHours: number;
  actualPlusDriveHours: number;
  actualVsScheduledPlusDriveHours: number;
  hasDepotAddress: boolean;
  missingActualDurationJobs: PayrollMissingDurationJobType[];
}

export interface PayrollDriveMetricsType {
  totalJobs: number;
  totalScheduledHours: number;
  totalActualHours: number;
  totalDriveHours: number;
  totalScheduledPlusDriveHours: number;
  totalActualPlusDriveHours: number;
  totalActualVsScheduledPlusDriveHours: number;
  totalMissingActualDurationJobs: number;
  technicians: PayrollTechnicianDriveMetricsType[];
}

export interface ClientType {
  _id: ObjectId | string;
  clientName: string;
  email: string; // Keep for backward compatibility
  emails?: {
    primary: string;
    scheduling?: string;
    accounting?: string;
  };
  phoneNumber: string;
  prefix: string;
  notes: string;
  isArchived?: boolean;
  archiveReason?: string;
  archivedAt?: Date;
  // Portal access security fields
  portalAccessToken?: string;
  portalAccessTokenExpiry?: Date;
  clerkUserId?: string;
}

export interface PaymentInfo {
  method:
    | "eft"
    | "e-transfer"
    | "cheque"
    | "credit-card"
    | "stripe-card"
    | "stripe-ach"
    | "stripe-pad"
    | "other";
  datePaid: Date;
  notes?: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  stripeReceiptUrl?: string;
}

export interface StripePaymentSettings {
  enabled: boolean;
  allowCreditCard: boolean;
  allowBankPayment: boolean;
  paymentLinkToken?: string;
  paymentLinkCreatedAt?: Date;
  paymentLinkExpiresAt?: Date;
}

export interface StripePaymentStatusEvent {
  eventType: string;
  timestamp: Date;
  details?: string;
}

export interface StripePaymentStatus {
  status?: "initiated" | "processing" | "pending" | "succeeded" | "failed";
  lastUpdated?: Date;
  paymentMethod?: "card" | "bank";
  events?: StripePaymentStatusEvent[];
}

export interface PaymentReminderSettings {
  enabled: boolean;
  frequency: "none" | "3days" | "5days" | "7days" | "14days";
  nextReminderDate?: Date;
  lastReminderSent?: Date;
  reminderHistory?: {
    sentAt: Date;
    emailTemplate: string;
    success: boolean;
    sequence: number;
    errorMessage?: string;
  }[];
}

export interface AuditLogEntry {
  _id?: ObjectId | string;
  invoiceId?: string;
  action:
    | "reminder_configured"
    | "reminder_sent_auto"
    | "reminder_sent_manual"
    | "reminder_failed"
    | "payment_status_changed"
    | "payment_info_updated"
    | "invoice_created"
    | "invoice_emailed"
    | "schedule_created"
    | "call_logged_job"
    | "call_logged_payment"
    | "availability_created"
    | "availability_updated"
    | "availability_deleted"
    | "timeoff_requested"
    | "timeoff_approved"
    | "timeoff_rejected"
    | "stripe_payment_settings_configured"
    | "stripe_payment_link_generated"
    | "stripe_payment_initiated"
    | "stripe_payment_succeeded"
    | "stripe_payment_failed";
  timestamp: Date;
  performedBy: string;
  details: {
    oldValue?: any;
    newValue?: any;
    reason?: string;
    metadata?: any;
  };
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

export interface InvoiceType {
  _id: ObjectId | string;
  invoiceId: string;
  jobTitle: string;
  dateIssued: Date | string | number;
  dateDue: Date | string;
  items: { description: string; details?: string; price: number }[];
  frequency: number;
  location: string;
  notes?: string;
  status: "pending" | "overdue" | "paid";
  clientId: ObjectId | string;
  paymentReminders?: PaymentReminderSettings;
  paymentInfo?: PaymentInfo;
  stripePaymentSettings?: StripePaymentSettings;
  stripePaymentStatus?: StripePaymentStatus;
  photos?: PhotoType[];
  signature?: SignatureType;
  callHistory?: CallLogEntry[];
  emailDeliveryHistory?: InvoiceEmailHistoryEntry[];
}

export interface InvoiceItem {
  description: string;
  details?: string;
  price: number;
  total: number;
}

export interface PhotoType {
  url: string;
  timestamp: Date;
  technicianId: string;
  _id: ObjectId | string;
  type: "before" | "after" | "estimate";
}

export interface PhotoRecordType {
  _id: ObjectId | string;
  scheduleId: ObjectId | string;
  cloudinaryUrl: string;
  type: "before" | "after" | "estimate" | "signature";
  technicianId: string;
  timestamp: Date | string;
  signerName?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ReportType {
  _id?: ObjectId | string;
  scheduleId: ObjectId | string;
  invoiceId: ObjectId | string;
  reportStatus?: "draft" | "in_progress" | "completed";
  jobTitle?: string;
  location?: string;
  dateCompleted: Date | string;
  technicianId: string;
  lastServiceDate?: Date | string;
  fuelType?: "Natural Gas" | "Propane" | "Electric" | "Solid Fuel" | "Other";
  cookingVolume?: "High" | "Medium" | "Low";
  cookingEquipment?: {
    griddles?: boolean;
    deepFatFryers?: boolean;
    woks?: boolean;
    ovens?: boolean;
    flattopGrills?: boolean;
  };
  inspectionItems?: {
    filtersInPlace?: "Yes" | "No" | "N/A";
    filtersListed?: "Yes" | "No" | "N/A";
    filtersNeedCleaningMoreOften?: "Yes" | "No" | "N/A";
    filtersNeedReplacement?: "Yes" | "No" | "N/A";
    ecologyUnitOperational?: "Yes" | "No" | "N/A";
    washCycleWorking?: "Yes" | "No" | "N/A";
    fireSuppressionNozzlesClear?: "Yes" | "No" | "N/A";
    fanTipAccessible?: "Yes" | "No" | "N/A";
    safeAccessToFan?: "Yes" | "No" | "N/A";
    exhaustFanOperational?: "Yes" | "No" | "N/A";
    ecologyUnitRequiresCleaning?: "Yes" | "No" | "N/A";
    ecologyUnitCost?: string;
    ecologyUnitDeficiencies?: "Yes" | "No" | "N/A";
    greaseBuildupOnRoof?: "Yes" | "No" | "N/A";
    systemCleanedPerCode?: "Yes" | "No" | "N/A";
    systemInteriorAccessible?: "Yes" | "No" | "N/A";
    multiStoreyVerticalCleaning?: "Yes" | "No" | "N/A";
    adequateAccessPanels?: "Yes" | "No" | "N/A";
    accessPanelsRequired?: string;
    accessPanelCost?: string;
  };
  recommendedCleaningFrequency?: number;
  comments?: string;
  equipmentDetails: {
    hoodType?: string;
    filterType?: string;
    ductworkType?: string;
    fanType?: string;
  };
  cleaningDetails: {
    hoodCleaned: boolean;
    filtersCleaned: boolean;
    ductworkCleaned: boolean;
    fanCleaned: boolean;
  };
  ecologyUnit?: {
    exists: boolean;
    operational?: boolean;
    filterReplacementNeeded: boolean;
    notes?: string;
  };
  recommendations?: string;
}

export interface SignatureType {
  _id: string;
  url: string;
  timestamp: Date | string;
  signerName: string;
  technicianId: string;
}

export interface InvoiceData {
  invoiceId: string;
  dateIssued: string;
  jobTitle: string;
  location: string;
  clientName: string;
  email: string;
  phoneNumber: string;
  items: InvoiceItem[];
  subtotal: number;
  gst: number;
  totalAmount: number;
  cheque: string;
  eTransfer: string;
  terms: string;
  thankYou: string;
}

export interface DueInvoiceType {
  _id?: ObjectId | string;
  clientId: ObjectId | string; // ObjectId reference to Client collection
  invoiceId: string;
  jobTitle: string;
  dateDue: Date | string;
  isScheduled: boolean;
  emailSent: boolean;
  emailHistory?: CleaningReminderEmailHistoryEntry[];
  emailExists?: boolean;
  notesExists?: boolean;
  callHistory?: CallLogEntry[];
  schedulingRequestsCount?: number;
  // Client self-scheduling fields
  schedulingToken?: string;
  schedulingTokenExpiry?: Date | string;
  schedulingRequestId?: ObjectId | string;
}

export interface YearlySalesData {
  date: string;
  "Current Year": number;
  "Previous Year": number;
}

export interface SalesAggregation {
  _id: { month: number };
  totalSales: number;
}

export interface MongoMatchStage {
  $match: { dateIssued: { $gte: Date; $lte: Date } };
}

export interface MongoGroupStage {
  $group: {
    _id: { month: { $month: string } };
    totalSales: { $sum: { $sum: string } };
  };
}

export interface MongoSortStage {
  $sort: { [key: string]: 1 | -1 };
}

export interface DashboardSearchParams {
  open?: string;
  month?: string;
  urlName?: string;
  year?: string;
  salesYear?: string;
  scheduled?: string;
  actionsDateFrom?: string;
  actionsDateTo?: string;
  actionsSearch?: string;
  actionsCategory?: string;
  [key: string]: string | undefined;
}

export interface JobsDueType {
  clientId: string;
  invoiceId: string;
  jobTitle: string;
  dateDue: Date;
  isScheduled: boolean;
  emailSent: boolean;
}

export interface Holiday {
  id: number;
  date: string;
  nameEn: string;
  nameFr: string;
  federal: number;
  observedDate: string;
  type?: "statutory" | "observance";
}

export interface HolidayResponse {
  province: {
    id: string;
    nameEn: string;
    nameFr: string;
    sourceLink: string;
    sourceEn: string;
    holidays: Holiday[];
    nextHoliday: Holiday;
  };
}

export const OBSERVANCES: Holiday[] = [
  {
    id: 100,
    date: "2025-03-17",
    nameEn: "St. Patrick's Day",
    nameFr: "Jour de la Saint-Patrick",
    federal: 0,
    observedDate: "2025-03-17",
    type: "observance",
  },
  {
    id: 101,
    date: "2025-03-09", // Second Sunday in March
    nameEn: "Daylight Saving Time Begins",
    nameFr: "Début de l'heure avancée",
    federal: 0,
    observedDate: "2025-03-09",
    type: "observance",
  },
  {
    id: 102,
    date: "2025-04-21",
    nameEn: "Easter Monday",
    nameFr: "Lundi de Pâques",
    federal: 0,
    observedDate: "2025-04-21",
    type: "observance",
  },
  {
    id: 103,
    date: "2025-05-11", // Second Sunday in May
    nameEn: "Mother's Day",
    nameFr: "Fête des Mères",
    federal: 0,
    observedDate: "2025-05-11",
    type: "observance",
  },
  {
    id: 104,
    date: "2025-06-15", // Third Sunday in June
    nameEn: "Father's Day",
    nameFr: "Fête des Pères",
    federal: 0,
    observedDate: "2025-06-15",
    type: "observance",
  },
  {
    id: 105,
    date: "2025-06-21",
    nameEn: "National Indigenous Peoples Day",
    nameFr: "Journée nationale des peuples autochtones",
    federal: 0,
    observedDate: "2025-06-21",
    type: "observance",
  },
  {
    id: 106,
    date: "2025-10-18", // Third Saturday in October
    nameEn: "Healthcare Hero Day",
    nameFr: "Journée des héros de la santé",
    federal: 0,
    observedDate: "2025-10-18",
    type: "observance",
  },
  {
    id: 107,
    date: "2025-10-31",
    nameEn: "Halloween",
    nameFr: "Halloween",
    federal: 0,
    observedDate: "2025-10-31",
    type: "observance",
  },
  {
    id: 108,
    date: "2025-11-08",
    nameEn: "National Aboriginal Veterans Day",
    nameFr: "Journée nationale des anciens combattants autochtones",
    federal: 0,
    observedDate: "2025-11-08",
    type: "observance",
  },
  {
    id: 109,
    date: "2025-12-26",
    nameEn: "Boxing Day",
    nameFr: "Lendemain de Noël",
    federal: 0,
    observedDate: "2025-12-26",
    type: "observance",
  },
];

export interface ClientTokenData {
  clientId: string;
  clientName: string;
  timestamp: number;
  expiresAt: number;
}

export interface EstimateType {
  _id: ObjectId | string;
  estimateNumber: string; // EST-2024-XXXX
  clientId?: ObjectId | string; // Optional - for existing clients
  prospectInfo?: {
    businessName: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    projectLocation?: string;
  };
  status: "draft" | "sent" | "approved" | "rejected";
  createdDate: Date | string;
  items: { description: string; details?: string; price: number }[];
  subtotal: number;
  gst: number;
  total: number;
  services: string[]; // Selected services from the predefined list
  terms?: string;
  notes?: string;
  convertedToInvoice?: ObjectId | string;
}

// Notification Types Enum
export const NOTIFICATION_TYPES = {
  JOB_REMINDER: "job_reminder",
  INVOICE_PAID: "invoice_paid",
  INVOICE_OVERDUE: "invoice_overdue",
  SCHEDULE_UPDATE: "schedule_update",
  ESTIMATE_STATUS: "estimate_status",
  SCHEDULING_REQUEST: "scheduling_request",
  SYSTEM: "system",
  JOB_ASSIGNED: "job_assigned",
} as const;

export type NotificationTypeEnum =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

// Push Subscription Type - for storing web push subscriptions
export interface PushSubscriptionType {
  _id?: string;
  userId: string; // Clerk user ID
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

// Expo Push Token Type - for storing mobile app push tokens
export interface ExpoPushTokenType {
  _id?: string;
  userId: string; // Clerk user ID
  token: string; // ExponentPushToken[xxx]
  platform: "ios" | "android";
  deviceName: string;
  notifyNewJobs: boolean; // Preference: new job assignments
  notifyScheduleChanges: boolean; // Preference: schedule updates
  lastUsedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Notification Type - for in-app notifications
export interface NotificationType {
  _id?: string;
  userId: string; // Clerk user ID
  title: string;
  body: string;
  type: NotificationTypeEnum;
  readAt: Date | null;
  metadata?: {
    invoiceId?: string;
    scheduleId?: string;
    clientId?: string;
    estimateId?: string;
    schedulingRequestId?: string; // For scheduling request notifications
    link?: string; // Direct link to navigate to
  };
  createdAt?: Date;
  updatedAt?: Date;
}

// =============================================================================
// Client Auto-Scheduling Types
// =============================================================================

// Exact time representation (replaces TimeWindow)
export interface RequestedTime {
  hour: number; // 0-23
  minute: number; // 0-59
}

export type SchedulingRequestStatus =
  | "pending"
  | "confirmed"
  | "alternatives_sent"
  | "expired"
  | "cancelled";

export interface TimeSelection {
  date: Date | string;
  requestedTime: RequestedTime; // Exact time requested
}

export interface SuggestedUsual {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  wasSelected: boolean;
}

export interface SchedulingRequestType {
  _id?: ObjectId | string;
  clientId: ObjectId | string | ClientType;
  invoiceId: ObjectId | string | InvoiceType;
  jobsDueSoonId: ObjectId | string;

  // Client selections
  primarySelection: TimeSelection;
  backupSelection: TimeSelection;

  // Confirmation details
  addressConfirmed: boolean;
  parkingNotes?: string;
  accessNotes?: string;
  specialInstructions?: string;
  preferredContact: "phone" | "email" | "either" | "other";
  customContactMethod?: string;
  onSiteContactName?: string;
  onSiteContactPhone?: string;

  // "Your usual" tracking
  suggestedUsual?: SuggestedUsual;

  // Status
  status: SchedulingRequestStatus;
  requestedAt: Date | string;

  // Manager review
  reviewedAt?: Date | string;
  reviewedBy?: string;
  reviewNotes?: string;

  // Confirmation
  confirmedScheduleId?: ObjectId | string;
  confirmedDate?: Date | string;
  confirmedTime?: RequestedTime; // Exact confirmed time

  // Alternatives offered
  alternativesOffered?: TimeSelection[];

  // Notification tracking
  confirmationEmailSent?: boolean;
  confirmationEmailSentAt?: Date | string;

  // Timestamps
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Day availability for exact time + duration
export interface DayAvailability {
  date: string; // YYYY-MM-DD format
  available: boolean;
  conflictReason?: string; // e.g., "Fully booked", "Technicians busy"
  arrivalDelayMinutes?: number; // minutes late if travel-gap conflict
}

export interface ClientSchedulingPattern {
  usualDayOfWeek: number; // 0-6 (Sunday-Saturday)
  usualTime: RequestedTime; // Exact usual time, e.g., { hour: 9, minute: 0 }
  confidence: number; // 0-1 based on consistency of past schedules
}

export interface SchedulingContext {
  valid: boolean;
  jobsDueSoon?: DueInvoiceType;
  client?: ClientType;
  invoice?: InvoiceType;
  pattern?: ClientSchedulingPattern;
  availableDays?: DayAvailability[]; // Days available for the requested time
  requestedEstimatedHours?: number;
  requestedHistoricalServiceDurationMinutes?: number | null;
  error?: string;
  existingRequest?: SchedulingRequestType; // Populated when request already submitted
}

// ── Schedule Insight Types ────────────────────────────────────────────────

export const SCHEDULE_INSIGHT_KINDS = {
  TRAVEL_OVERLOAD_DAY: "travel_overload_day",
  REST_GAP_WARNING: "rest_gap_warning",
  SERVICE_DAY_BOUNDARY_RISK: "service_day_boundary_risk",
  ROUTE_EFFICIENCY_OPPORTUNITY: "route_efficiency_opportunity",
  MOVE_JOB_RECOMMENDATION: "move_job_recommendation",
  DUE_SOON_UNSCHEDULED: "due_soon_unscheduled",
  DUE_SOON_AT_RISK: "due_soon_at_risk",
  DUE_SOON_BEST_SLOT_CANDIDATES: "due_soon_best_slot_candidates",
} as const;

export type ScheduleInsightKind =
  (typeof SCHEDULE_INSIGHT_KINDS)[keyof typeof SCHEDULE_INSIGHT_KINDS];

export type ScheduleInsightSeverity = "info" | "warning" | "critical";

export type ScheduleInsightStatus = "open" | "resolved" | "dismissed";

export type ScheduleInsightSource = "rule" | "ai" | "hybrid";

export interface ScheduleInsightSlotCandidate {
  date: string; // yyyy-MM-dd
  startDateTime: Date | string; // persisted value compatible with schedule storage
  technicianId: string;
  technicianName?: string;
  technicianIds?: string[];
  technicianNames?: string[];
  estimatedJobHours: number;
  incrementalTravelMinutes: number;
  score: number;
  scoreBreakdown?: {
    duePenaltyDays: number;
    duePenaltyPoints: number;
    loadHours: number;
    loadPoints: number;
    travelPoints: number;
    totalScore: number;
    duePolicy?: "hard" | "soft";
  };
  reason: string;
  invoiceRef?: string;
  jobsDueSoonId?: string;
}

export interface ScheduleInsightPayload {
  candidates?: ScheduleInsightSlotCandidate[];
  analysisWindow?: {
    dateFrom: string;
    dateTo: string;
  };
  metadata?: Record<string, string | number | boolean | null>;
}

export interface ScheduleInsightType {
  _id?: ObjectId | string;
  kind: ScheduleInsightKind;
  severity: ScheduleInsightSeverity;
  status: ScheduleInsightStatus;
  title: string;
  message: string;
  dateKey?: string | null;
  technicianId?: string | null;
  scheduleIds?: (ObjectId | string)[];
  jobsDueSoonIds?: (ObjectId | string)[];
  invoiceIds?: (ObjectId | string)[];
  suggestionPayload?: ScheduleInsightPayload;
  fingerprint: string;
  source: ScheduleInsightSource;
  confidence?: number;
  resolvedBy?: string;
  resolvedAt?: Date | string;
  resolutionNote?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type ScheduleInsightTrigger = "auto" | "manual_day" | "manual_range";

export interface ScheduleInsightRunType {
  _id?: ObjectId | string;
  trigger: ScheduleInsightTrigger;
  dateFrom: string;
  dateTo: string;
  technicianIds?: string[];
  generatedCount: number;
  model?: string;
  durationMs?: number;
  createdBy?: string;
  createdAt?: Date | string;
}

// ── Travel Time Types ──────────────────────────────────────────────────────

export interface TravelTimeCacheType {
  _id?: ObjectId | string;
  originAddress: string;
  destinationAddress: string;
  pairHash: string;
  typicalMinutes: number;
  estimatedKm: number;
  travelNotes?: string;
  routePolyline?: string;
  expiresAt: Date;
}

export interface TravelTimeSegment {
  from: string; // "Depot" or job title
  to: string;
  typicalMinutes: number;
  km: number;
  travelNotes?: string;
  routePolyline?: string;
  fromKind?: "depot" | "job";
  toKind?: "depot" | "job";
  fromJobId?: string;
  toJobId?: string;
}

export interface DayTravelTimeSummary {
  date: string; // yyyy-MM-dd
  totalTravelMinutes: number;
  totalTravelKm: number;
  segments: TravelTimeSegment[];
  isPartial: boolean; // true when depot not configured
}

export interface TravelTimeRequest {
  date: string; // yyyy-MM-dd
  jobs: ScheduleType[];
  depotAddress: string | null;
}
