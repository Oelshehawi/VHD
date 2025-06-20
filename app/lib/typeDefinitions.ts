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
  _id?: string;
  clientId: string;
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
