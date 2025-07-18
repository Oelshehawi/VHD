import { ObjectId } from "mongodb";

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

export interface PendingInvoiceType {
  _id: ObjectId | string;
  invoiceId: string;
  jobTitle: string;
  dateIssued: Date | string;
  status: string;
  amount: number;
  paymentEmailSent?: boolean;
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
  signature?: SignatureType;
  photos?: PhotoType[];
}

export interface TechnicianType {
  id: string;
  name: string;
  hourlyRate?: number;
  overtimeRate?: number;
}

export interface PayrollPeriodType {
  _id: ObjectId | string;
  startDate: Date | string;
  endDate: Date | string;
  cutoffDate: Date | string;
  payDay: Date | string;
}

export interface ClientType {
  _id: ObjectId | string;
  clientName: string;
  email: string;
  phoneNumber: string;
  prefix: string;
  notes: string;
}

export interface InvoiceType {
  _id: ObjectId | string;
  invoiceId: string;
  jobTitle: string;
  dateIssued: Date | string | number;
  dateDue: Date | string;
  items: { description: string; price: number }[];
  frequency: number;
  location: string;
  notes?: string;
  status: "pending" | "overdue" | "paid";
  clientId: ObjectId | string;
  paymentEmailSent?: boolean;
  photos?: PhotoType[];
  signature?: SignatureType;
}

export interface InvoiceItem {
  description: string;
  price: number;
  total: number;
}

export interface PhotoType {
  url: string;
  timestamp: Date;
  technicianId: string;
  _id: ObjectId | string;
  type: "before" | "after";
}

export interface ReportType {
  _id?: ObjectId | string;
  scheduleId: ObjectId | string;
  invoiceId: ObjectId | string;
  dateCompleted: Date | string;
  technicianId: string;
  lastServiceDate?: Date | string;
  fuelType?: "Natural Gas" | "Electric" | "Solid Fuel" | "Other";
  cookingVolume?: "High" | "Medium" | "Low";
  cookingEquipment?: {
    griddles?: boolean;
    deepFatFryers?: boolean;
    woks?: boolean;
  };
  inspectionItems?: {
    filtersInPlace?: "Yes" | "No" | "N/A";
    filtersListed?: "Yes" | "No" | "N/A";
    filtersNeedCleaningMoreOften?: "Yes" | "No" | "N/A";
    filtersNeedReplacement?: "Yes" | "No" | "N/A";
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
  recommendations?: string;
  jobTitle?: string;
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
  emailExists?: boolean;
  notesExists?: boolean;
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
  items: { description: string; price: number }[];
  subtotal: number;
  gst: number;
  total: number;
  services: string[]; // Selected services from the predefined list
  terms?: string;
  notes?: string;
  convertedToInvoice?: ObjectId | string;
}

// Scheduling Optimization Types
export interface LocationGeocodeType {
  _id: ObjectId | string;
  address: string; // raw address from invoice: "123 Main St, Vancouver, BC"
  normalizedAddress: string; // cleaned version: "123 Main Street, Vancouver, BC V6B 1A1"
  coordinates: [number, number]; // [lng, lat] for OpenRouteService
  clusterId?: ObjectId | string; // which geographic cluster this belongs to
  lastGeocoded: Date;
  source: "openroute" | "manual"; // how coordinates were obtained
}

export interface LocationClusterType {
  _id: ObjectId | string;
  clusterName: string; // "Vancouver Core", "Whistler Area", "Surrey/Langley"
  centerCoordinates: { lat: number; lng: number };
  radius: number; // radius in kilometers
  constraints: {
    maxJobsPerDay: number; // 4 for Vancouver, 2 for Whistler
    preferredDays: string[]; // ["Monday", "Tuesday"] for Whistler bundling
    specialRequirements?: string; // "Ferry required", "Bundle trips", "Early access only"
    bufferTimeMinutes?: number; // extra time needed between jobs in this area
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OptimizationDistanceMatrixType {
  _id: ObjectId | string;
  optimizationId: string; // unique identifier for this optimization run
  locations: string[]; // ordered array of normalized addresses
  coordinates: [number, number][]; // corresponding [lng, lat] pairs
  matrix: {
    durations: number[][]; // travel times in minutes
    distances: number[][]; // distances in kilometers
  };
  calculatedAt: Date;
  isActive: boolean;
  dateRange: {
    start: Date;
    end: Date;
  };
}

export interface SchedulingPreferencesType {
  _id?: string;
  globalSettings: {
    maxJobsPerDay: number;
    workDayStart: string; // "09:00"
    workDayEnd: string; // "17:00"
    preferredBreakDuration: number; // minutes
    startingPointAddress: string; // "123 Main St, Vancouver, BC" - technician depot/office
  };
  schedulingControls?: {
    excludedDays: number[]; // [0=Sunday, 1=Monday, etc.]
    excludedDates: string[]; // ["2025-12-25", "2025-01-01"] - ISO date strings
    allowWeekends: boolean;
    startDate: string; // "2025-08-01" - ISO date string for optimization start
    endDate: string; // "2025-08-31" - ISO date string for optimization end
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HistoricalSchedulePatternType {
  _id?: string;
  jobIdentifier: string; // "clientName|location" or similar unique identifier
  patterns: {
    preferredHour?: number; // 0-23
    hourConfidence: number; // 0-1
    preferredDayOfWeek?: number; // 1-7 (Monday=1, Sunday=7)
    dayConfidence: number; // 0-1
    averageDuration: number; // minutes
  };
  historicalData: Array<{
    scheduleId: string;
    startDateTime: Date;
    actualDuration?: number; // minutes
    assignedTechnicians: string[];
    completionNotes?: string;
  }>;
  lastAnalyzed: Date;
  totalOccurrences: number;
}

// Optimization Result Types (not saved to DB, just for API responses)
export interface JobOptimizationData {
  jobId: string;
  invoiceId: string;
  jobTitle: string;
  location: string;
  normalizedLocation: string;
  clientName: string;
  dateDue: Date;
  estimatedDuration: number; // minutes
  priority: number; // 1-10 scale
  historicalPattern?: {
    preferredHour: number;
    confidence: number;
    preferredTechnicians: string[];
  };
  constraints: {
    earliestStart: Date;
    latestStart: Date;
    bufferAfter: number;
    requiredTechnicians?: string[];
  };
}

export interface OptimizationConstraints {
  dateRange: {
    start: Date;
    end: Date;
  };
  globalSettings: SchedulingPreferencesType["globalSettings"];
  techniciansAvailable: string[];
  existingSchedules: ScheduleType[]; // to avoid conflicts
  priorityWeights: {
    efficiency: number; // 0-1 weight for travel time minimization
    historical: number; // 0-1 weight for following historical patterns
    balance: number; // 0-1 weight for workload distribution
    urgency: number; // 0-1 weight for overdue jobs
  };
}

export interface ScheduleSuggestion {
  jobId: string;
  suggestedDateTime: Date;
  assignedTechnicians: string[];
  estimatedEndTime: Date;
  drivingTimeToNext?: number; // minutes to next job
  drivingTimeToPrevious?: number; // minutes from previous job
  confidence: number; // 0-1 how confident we are in this suggestion
  reasoning: string[]; // ["Matches historical pattern", "Minimizes travel time"]
  clusterId?: string;
  clusterName?: string;
}

export interface OptimizedDaySchedule {
  date: Date;
  clusterId?: string;
  clusterName?: string;
  suggestions: ScheduleSuggestion[];
  metrics: {
    totalJobs: number;
    totalWorkTime: number; // minutes
    totalDriveTime: number; // minutes
    efficiencyRatio: number; // work time / (work time + drive time)
    workloadBalance: number; // 0-1 how balanced technician workload is
  };
  assignedTechnicians: string[];
}

export interface OptimizationResult {
  strategy: "efficiency" | "balanced" | "spread" | "historical";
  totalJobs: number;
  optimizedDays: OptimizedDaySchedule[];
  overallMetrics: {
    totalDriveTime: number; // minutes
    totalWorkTime: number; // minutes
    totalDistance: number; // km
    efficiencyScore: number; // 0-100
    historicalAlignment: number; // 0-100 how well it matches historical patterns
    workloadBalance: number; // 0-100 how evenly distributed workload is
    averageJobsPerDay: number;
  };
  unscheduledJobs: JobOptimizationData[]; // jobs that couldn't be optimally placed
  generatedAt: Date;
}
