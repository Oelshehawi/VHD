// @ts-ignore
import mongoose from "mongoose";
import {
  DueInvoiceType,
  InvoiceType,
  ScheduleType,
  ClientType,
  PayrollPeriodType,
  ShiftType,
  SignatureType,
  PhotoType,
  ReportType,
  EstimateType,
  LocationGeocodeType,
  DistanceMatrixCacheType,
  AuditLogEntry,
  CallLogEntry,
  TechnicianLocationType,
} from "../app/lib/typeDefinitions";
import { CALL_OUTCOMES } from "../app/lib/callLogConstants";

const { Schema, model, models, Model } = mongoose;
const { ObjectId } = mongoose.Schema.Types;

const CallLogEntrySchema = new Schema<CallLogEntry>({
  callerId: { type: String, required: true },
  callerName: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
  outcome: {
    type: String,
    required: true,
    enum: Object.values(CALL_OUTCOMES)
  },
  notes: { type: String, required: true },
  followUpDate: { type: Date },
  duration: { type: Number }, // in minutes
});

const ClientSchema = new Schema<ClientType>({
  clientName: { type: String },
  email: { type: String }, // Keep for backward compatibility
  emails: {
    primary: { type: String },
    scheduling: { type: String },
    accounting: { type: String },
  },
  phoneNumber: { type: String },
  prefix: { type: String },
  notes: { type: String },
});

const PhotoSchema = new Schema<PhotoType>({
  url: { type: String, required: true },
  timestamp: { type: Date, required: true },
  technicianId: { type: String, required: true },
  type: { type: String, enum: ["before", "after"], required: true },
});

const SignatureSchema = new Schema<SignatureType>({
  url: { type: String, required: true },
  timestamp: { type: Date, required: true },
  signerName: { type: String, required: true, default: "Customer" },
  technicianId: { type: String, required: true },
});

const invoiceSchema = new Schema<InvoiceType>({
  invoiceId: { type: String, required: true },
  jobTitle: { type: String, required: true },
  dateIssued: { type: Date, required: true },
  dateDue: { type: Date, required: true },
  items: [
    {
      description: { type: String, required: true },
      details: { type: String },
      price: { type: Number, required: true },
    },
  ],
  frequency: { type: Number, required: true },
  location: { type: String, required: true },
  notes: String,
  status: {
    type: String,
    enum: ["pending", "overdue", "paid"],
    default: "pending",
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  paymentReminders: {
    enabled: { type: Boolean, default: false },
    frequency: {
      type: String,
      enum: ["none", "3days", "7days", "14days"],
      default: "none",
    },
    nextReminderDate: { type: Date },
    lastReminderSent: { type: Date },
    reminderHistory: [
      {
        sentAt: { type: Date, required: true },
        emailTemplate: { type: String, required: true },
        success: { type: Boolean, default: true },
        sequence: { type: Number, default: 1 },
        errorMessage: { type: String },
      },
    ],
  },
  paymentInfo: {
    method: {
      type: String,
      enum: ["eft", "e-transfer", "cheque", "credit-card", "other"],
    },
    datePaid: { type: Date },
    notes: { type: String },
  },
  callHistory: { type: [CallLogEntrySchema], default: [] },
});

const ShiftSchema = new Schema<ShiftType>({
  technicianId: { type: String, required: true },
  clockIn: { type: Date },
  clockOut: { type: Date },
  jobDetails: { type: String },
  hoursWorked: { type: Number },
});

const scheduleSchema = new Schema<ScheduleType>({
  invoiceRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice",
    required: true,
  },
  jobTitle: { type: String, required: true },
  location: { type: String, required: true },
  startDateTime: { type: Date, required: true },
  assignedTechnicians: [{ type: String, required: true }],
  confirmed: { type: Boolean, default: false },
  hours: { type: Number, default: 4 },
  shifts: { type: [ShiftSchema], default: [] },
  payrollPeriod: { type: mongoose.Schema.Types.ObjectId, ref: "PayrollPeriod" },
  deadRun: { type: Boolean, default: false },
  signature: { type: SignatureSchema, required: false },
  photos: { type: [PhotoSchema], default: undefined },
  technicianNotes: { type: String, default: "" },
});

const ReportSchema = new Schema<ReportType>({
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Schedule",
    required: true,
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice",
    required: true,
  },
  dateCompleted: { type: Date, required: true },
  technicianId: { type: String, required: true },
  lastServiceDate: { type: Date },
  fuelType: {
    type: String,
    enum: ["Natural Gas", "Electric", "Solid Fuel", "Other"],
  },
  cookingVolume: { type: String, enum: ["High", "Medium", "Low"] },
  cookingEquipment: {
    griddles: Boolean,
    deepFatFryers: Boolean,
    woks: Boolean,
    ovens: Boolean,
    flattopGrills: Boolean,
  },
  inspectionItems: {
    filtersInPlace: {
      type: String,
      enum: ["Yes", "No", "N/A"],
      default: "N/A",
    },
    filtersListed: { type: String, enum: ["Yes", "No", "N/A"], default: "N/A" },
    filtersNeedCleaningMoreOften: {
      type: String,
      enum: ["Yes", "No", "N/A"],
      default: "N/A",
    },
    filtersNeedReplacement: {
      type: String,
      enum: ["Yes", "No", "N/A"],
      default: "N/A",
    },
    washCycleWorking: {
      type: String,
      enum: ["Yes", "No", "N/A"],
      default: "N/A",
    },
    fireSuppressionNozzlesClear: {
      type: String,
      enum: ["Yes", "No", "N/A"],
      default: "N/A",
    },
    fanTipAccessible: {
      type: String,
      enum: ["Yes", "No", "N/A"],
      default: "N/A",
    },
    safeAccessToFan: {
      type: String,
      enum: ["Yes", "No", "N/A"],
      default: "N/A",
    },
    exhaustFanOperational: {
      type: String,
      enum: ["Yes", "No", "N/A"],
      default: "N/A",
    },
    ecologyUnitRequiresCleaning: {
      type: String,
      enum: ["Yes", "No", "N/A"],
      default: "N/A",
    },
    ecologyUnitCost: { type: String },
    ecologyUnitDeficiencies: {
      type: String,
      enum: ["Yes", "No", "N/A"],
      default: "N/A",
    },
    greaseBuildupOnRoof: {
      type: String,
      enum: ["Yes", "No", "N/A"],
      default: "N/A",
    },
    systemCleanedPerCode: {
      type: String,
      enum: ["Yes", "No", "N/A"],
      default: "N/A",
    },
    systemInteriorAccessible: {
      type: String,
      enum: ["Yes", "No", "N/A"],
      default: "N/A",
    },
    multiStoreyVerticalCleaning: {
      type: String,
      enum: ["Yes", "No", "N/A"],
      default: "N/A",
    },
    adequateAccessPanels: {
      type: String,
      enum: ["Yes", "No", "N/A"],
      default: "N/A",
    },
    accessPanelsRequired: { type: String },
    accessPanelCost: { type: String },
  },
  recommendedCleaningFrequency: { type: Number },
  comments: { type: String },
  equipmentDetails: {
    hoodType: String,
    filterType: String,
    ductworkType: String,
    fanType: String,
  },
  cleaningDetails: {
    hoodCleaned: { type: Boolean, default: true },
    filtersCleaned: { type: Boolean, default: true },
    ductworkCleaned: { type: Boolean, default: true },
    fanCleaned: { type: Boolean, default: true },
  },
  recommendations: String,
});

const PayrollPeriodSchema = new Schema<PayrollPeriodType>(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    cutoffDate: { type: Date, required: true },
    payDay: { type: Date, required: true },
  },
  { timestamps: true },
);

const jobsDueSoonSchema = new Schema<DueInvoiceType>({
  invoiceId: { type: String, required: true, unique: true },
  jobTitle: { type: String, required: true },
  dateDue: { type: Date, required: true },
  isScheduled: { type: Boolean, default: false },
  emailSent: { type: Boolean, default: false },
  clientId: {
    type: ObjectId,
    ref: "Client",
    required: true,
  },
  callHistory: { type: [CallLogEntrySchema], default: [] },
});

const TechnicianLocationSchema = new Schema<TechnicianLocationType>({
  technicianId: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
  isActive: { type: Boolean, required: true, default: true },
  currentJobId: { type: String },
  accuracy: { type: Number },
});

const Client =
  (models.Client as typeof Model<ClientType>) || model("Client", ClientSchema);
const Invoice =
  (models.Invoice as typeof Model<InvoiceType>) ||
  model("Invoice", invoiceSchema);
const JobsDueSoon =
  (models.JobsDueSoon as typeof Model<DueInvoiceType>) ||
  model("JobsDueSoon", jobsDueSoonSchema);
const Schedule =
  (models.Schedule as typeof Model<ScheduleType>) ||
  model("Schedule", scheduleSchema);

const PayrollPeriod =
  (models.PayrollPeriod as typeof Model<PayrollPeriodType>) ||
  model("PayrollPeriod", PayrollPeriodSchema);

const Report =
  (models.Report as typeof Model<ReportType>) || model("Report", ReportSchema);

const EstimateSchema = new Schema<EstimateType>({
  estimateNumber: { type: String, required: true, unique: true },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: false,
  },
  prospectInfo: {
    businessName: { type: String, required: false },
    contactPerson: { type: String, required: false },
    email: { type: String, required: false },
    phone: { type: String, required: false },
    address: { type: String, required: false },
    projectLocation: { type: String, required: false },
  },
  status: {
    type: String,
    enum: ["draft", "sent", "approved", "rejected"],
    default: "draft",
  },
  createdDate: { type: Date, default: Date.now },
  items: [
    {
      description: { type: String, required: true },
      details: { type: String },
      price: { type: Number, required: true },
    },
  ],
  services: [{ type: String }],
  terms: { type: String },
  notes: { type: String },
  convertedToInvoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice",
    required: false,
  },
});

const LocationGeocodeSchema = new Schema<LocationGeocodeType>({
  address: { type: String, required: true },
  normalizedAddress: { type: String, required: true },
  coordinates: {
    type: [Number],
    required: true,
    validate: {
      validator: function (v: number[]) {
        return v.length === 2;
      },
      message: "Coordinates must be [lng, lat] pair",
    },
  },
  lastGeocoded: { type: Date, required: true, default: Date.now },
  source: {
    type: String,
    enum: ["openroute", "manual"],
    required: true,
    default: "openroute",
  },
});

// Simple distance matrix cache for OR Tools VRP
const DistanceMatrixCacheSchema = new Schema<DistanceMatrixCacheType>({
  locationHash: { type: String, required: true, unique: true },
  locations: [{ type: String, required: true }],
  coordinates: [
    {
      type: [Number],
      required: true,
      validate: {
        validator: function (v: number[]) {
          return v.length === 2;
        },
        message: "Each coordinate must be [lng, lat] pair",
      },
    },
  ],
  matrix: {
    durations: {
      type: [[Number]],
      required: true,
    },
    distances: {
      type: [[Number]],
      required: true,
    },
  },
  calculatedAt: { type: Date, required: true, default: Date.now },
  expiresAt: { type: Date, required: true },
});

// Smart indexes for optimization performance
// Core business queries
invoiceSchema.index({ status: 1, dateDue: 1 }); // Pending/overdue invoices by due date
invoiceSchema.index({ status: 1, dateIssued: 1, dateDue: 1 }); // Enhanced pending invoices query
invoiceSchema.index({ dateIssued: 1, status: 1 }); // For sales aggregation
scheduleSchema.index({ startDateTime: 1, confirmed: 1 }); // For schedule queries
scheduleSchema.index({ assignedTechnicians: 1, startDateTime: 1 }); // For technician filtering
invoiceSchema.index({ clientId: 1, dateIssued: -1 }); // Client invoice history
invoiceSchema.index({ location: 1, status: 1 }); // Location-based scheduling
jobsDueSoonSchema.index({ isScheduled: 1, dateDue: 1 }); // Unscheduled jobs by due date
jobsDueSoonSchema.index({ clientId: 1, dateDue: 1 }); // Client jobs by due date
scheduleSchema.index({ startDateTime: 1, assignedTechnicians: 1 }); // Schedule conflicts
scheduleSchema.index({ location: 1, startDateTime: 1 }); // Location-based queries

// Simplified geocoding and distance matrix indexes
LocationGeocodeSchema.index({ address: 1 }); // Geocoding lookups
LocationGeocodeSchema.index({ normalizedAddress: 1 }); // Normalized address queries
DistanceMatrixCacheSchema.index({ expiresAt: 1 }); // TTL cleanup

// Additional performance indexes
ClientSchema.index({ clientName: 1 }); // Client searches
EstimateSchema.index({ status: 1, createdDate: -1 }); // Estimate queries
ReportSchema.index({ scheduleId: 1 }); // Report lookups
PayrollPeriodSchema.index({ startDate: 1, endDate: 1 }); // Payroll period queries


TechnicianLocationSchema.index({ technicianId: 1, timestamp: -1 }); // For technician location history
TechnicianLocationSchema.index({ isActive: 1, timestamp: -1 }); // For active technicians


const Estimate =
  (models.Estimate as typeof Model<EstimateType>) ||
  model("Estimate", EstimateSchema);

const DistanceMatrixCache =
  (models.DistanceMatrixCache as typeof Model<DistanceMatrixCacheType>) ||
  model("DistanceMatrixCache", DistanceMatrixCacheSchema);

const LocationGeocode =
  (models.LocationGeocode as typeof Model<LocationGeocodeType>) ||
  model("LocationGeocode", LocationGeocodeSchema);

// Separate AuditLog collection
const AuditLogSchema = new Schema<AuditLogEntry>({
  invoiceId: { type: String, required: true, index: true },
  action: {
    type: String,
    enum: [
      "reminder_configured",
      "reminder_sent_auto",
      "reminder_sent_manual",
      "reminder_failed",
      "payment_status_changed",
      "payment_info_updated",
      "invoice_created",
      "invoice_emailed",
      "schedule_created",
      "call_logged_job",
      "call_logged_payment",
    ],
    required: true,
  },
  timestamp: { type: Date, default: Date.now, required: true, index: true },
  performedBy: { type: String, required: true },
  details: {
    oldValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    reason: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  ipAddress: { type: String },
  userAgent: { type: String },
  success: { type: Boolean, default: true },
  errorMessage: { type: String },
});

// Indexes for efficient querying
AuditLogSchema.index({ invoiceId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });

const AuditLog =
  (models.AuditLog as typeof Model<AuditLogEntry>) ||
  model("AuditLog", AuditLogSchema);

  const TechnicianLocation =
  (models.TechnicianLocation as typeof Model<TechnicianLocationType>) ||
  model("TechnicianLocation", TechnicianLocationSchema);

export {
  Client,
  Invoice,
  JobsDueSoon,
  Schedule,
  PayrollPeriod,
  Report,
  Estimate,
  LocationGeocode,
  DistanceMatrixCache,
  AuditLog,
  TechnicianLocation,
};
