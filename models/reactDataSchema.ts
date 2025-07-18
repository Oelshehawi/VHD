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
  LocationClusterType,
  MonthlyDistanceMatrixType,
  SchedulingPreferencesType,
  HistoricalSchedulePatternType,
  OptimizationHistoryType,
} from "../app/lib/typeDefinitions";

const { Schema, model, models, Model } = mongoose;
const { ObjectId } = mongoose.Schema.Types;

const ClientSchema = new Schema<ClientType>({
  clientName: { type: String },
  email: { type: String },
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
  paymentEmailSent: { type: Boolean, default: false },
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
});

PayrollPeriodSchema.index({ startDate: 1, endDate: 1 }, { unique: true });

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
      price: { type: Number, required: true },
    },
  ],
  subtotal: { type: Number, required: true },
  gst: { type: Number, required: true },
  total: { type: Number, required: true },
  services: [{ type: String }],
  terms: { type: String },
  notes: { type: String },
  convertedToInvoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice",
    required: false,
  },
});

// Scheduling Optimization Schemas
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
  clusterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LocationCluster",
    required: false,
  },
  lastGeocoded: { type: Date, required: true, default: Date.now },
  source: {
    type: String,
    enum: ["mapbox", "manual"],
    required: true,
    default: "mapbox",
  },
});

const LocationClusterSchema = new Schema<LocationClusterType>({
  clusterName: { type: String, required: true, unique: true },
  centerCoordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  radius: { type: Number, required: true }, // km
  constraints: {
    maxJobsPerDay: { type: Number, required: true, default: 4 },
    preferredDays: [{ type: String }], // ["Monday", "Tuesday"]
    specialRequirements: { type: String },
    bufferTimeMinutes: { type: Number, default: 0 },
  },
  boundingBox: {
    north: { type: Number },
    south: { type: Number },
    east: { type: Number },
    west: { type: Number },
  },
  isActive: { type: Boolean, required: true, default: true },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
});

const MonthlyDistanceMatrixSchema = new Schema<MonthlyDistanceMatrixType>({
  month: {
    type: String,
    required: true,
    unique: true,
    match: /^\d{4}-\d{2}$/, // YYYY-MM format
  },
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
  isActive: { type: Boolean, required: true, default: true },
});

const SchedulingPreferencesSchema = new Schema<SchedulingPreferencesType>({
  globalSettings: {
    defaultBufferMinutes: { type: Number, required: true, default: 30 },
    workDayStart: { type: String, required: true, default: "08:00" },
    workDayEnd: { type: String, required: true, default: "17:00" },
    maxJobsPerDay: { type: Number, required: true, default: 4 },
    maxDriveTimePerDay: { type: Number, required: true, default: 240 }, // 4 hours
    lunchBreakDuration: { type: Number, required: true, default: 60 },
    lunchBreakStart: { type: String, required: true, default: "12:00" },
  },
  jobTypePreferences: [
    {
      jobTitle: { type: String, required: true },
      estimatedDuration: { type: Number, required: true }, // minutes
      bufferAfter: { type: Number, required: true, default: 30 },
      preferredTimeSlots: [{ type: String }], // ["09:00-12:00"]
      difficultyScore: { type: Number, min: 1, max: 5, default: 3 },
      requiresSpecialEquipment: { type: Boolean, default: false },
    },
  ],
  locationPreferences: [
    {
      location: { type: String, required: true }, // normalized address
      accessNotes: { type: String },
      parkingDifficulty: { type: Number, min: 1, max: 5, default: 3 },
      additionalSetupTime: { type: Number, default: 0 }, // extra minutes
    },
  ],
  isDefault: { type: Boolean, required: true, default: false },
  createdBy: { type: String, required: true }, // userId
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
});

const HistoricalSchedulePatternSchema =
  new Schema<HistoricalSchedulePatternType>({
    jobIdentifier: {
      type: String,
      required: true,
      unique: true,
    },
    patterns: {
      preferredHour: { type: Number, min: 0, max: 23 },
      hourConfidence: { type: Number, min: 0, max: 1, default: 0 },
      preferredDayOfWeek: { type: Number, min: 1, max: 7 },
      dayConfidence: { type: Number, min: 0, max: 1, default: 0 },
      preferredTechnicians: [{ type: String }],
      technicianConfidence: { type: Number, min: 0, max: 1, default: 0 },
      averageDuration: { type: Number, required: true },
      seasonalPatterns: [
        {
          month: { type: Number, min: 1, max: 12 },
          frequencyMultiplier: { type: Number, default: 1.0 },
        },
      ],
    },
    historicalData: [
      {
        scheduleId: { type: String, required: true },
        startDateTime: { type: Date, required: true },
        actualDuration: { type: Number }, // minutes
        assignedTechnicians: [{ type: String, required: true }],
        completionNotes: { type: String },
      },
    ],
    lastAnalyzed: { type: Date, required: true, default: Date.now },
    totalOccurrences: { type: Number, required: true, default: 0 },
  });

const OptimizationHistorySchema = new Schema<OptimizationHistoryType>({
  runDate: { type: Date, required: true, default: Date.now },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  strategy: {
    type: String,
    enum: ["efficiency", "balanced", "spread", "historical"],
    required: true,
  },
  inputJobs: [
    {
      jobId: { type: String, required: true },
      location: { type: String, required: true },
      dateDue: { type: Date, required: true },
    },
  ],
  resultingMetrics: {
    totalJobsOptimized: { type: Number, required: true },
    totalDriveTimeMinutes: { type: Number, required: true },
    totalDistanceKm: { type: Number, required: true },
    averageJobsPerDay: { type: Number, required: true },
    efficiencyScore: { type: Number, min: 0, max: 100, required: true },
  },
  userInteractions: [
    {
      jobId: { type: String, required: true },
      suggestedDateTime: { type: Date, required: true },
      userModifiedDateTime: { type: Date },
      wasAccepted: { type: Boolean, required: true },
      rejectionReason: { type: String },
    },
  ],
  runBy: { type: String, required: true }, // userId
});

// Smart indexes for optimization performance
// Core business queries
invoiceSchema.index({ status: 1, dateDue: 1 }); // Pending/overdue invoices by due date
invoiceSchema.index({ clientId: 1, dateIssued: -1 }); // Client invoice history
invoiceSchema.index({ location: 1, status: 1 }); // Location-based scheduling
jobsDueSoonSchema.index({ isScheduled: 1, dateDue: 1 }); // Unscheduled jobs by due date
jobsDueSoonSchema.index({ clientId: 1, dateDue: 1 }); // Client jobs by due date
scheduleSchema.index({ startDateTime: 1, assignedTechnicians: 1 }); // Schedule conflicts
scheduleSchema.index({ assignedTechnicians: 1, startDateTime: 1 }); // Technician schedules
scheduleSchema.index({ location: 1, startDateTime: 1 }); // Location-based queries

// Scheduling optimization indexes
LocationGeocodeSchema.index({ address: 1 }); // Geocoding lookups
LocationGeocodeSchema.index({ normalizedAddress: 1 }); // Normalized address queries
LocationGeocodeSchema.index({ clusterId: 1 }); // Cluster assignments
LocationClusterSchema.index({ isActive: 1 }); // Active clusters only
LocationClusterSchema.index({
  "centerCoordinates.lat": 1,
  "centerCoordinates.lng": 1,
}); // Geospatial queries
MonthlyDistanceMatrixSchema.index({ month: 1, isActive: 1 }); // Matrix cache lookups
SchedulingPreferencesSchema.index({ isDefault: 1 }); // Default preferences
SchedulingPreferencesSchema.index({ createdBy: 1 }); // User preferences
HistoricalSchedulePatternSchema.index({ lastAnalyzed: 1 }); // Pattern freshness
OptimizationHistorySchema.index({ runDate: -1 }); // Recent optimizations
OptimizationHistorySchema.index({ runBy: 1, runDate: -1 }); // User optimization history

// Additional performance indexes
ClientSchema.index({ clientName: 1 }); // Client searches
EstimateSchema.index({ status: 1, createdDate: -1 }); // Estimate queries
ReportSchema.index({ scheduleId: 1 }); // Report lookups
PayrollPeriodSchema.index({ startDate: 1, endDate: 1 }); // Payroll period queries

const Estimate =
  (models.Estimate as typeof Model<EstimateType>) ||
  model("Estimate", EstimateSchema);

// Scheduling Optimization Models
const LocationGeocode =
  (models.LocationGeocode as typeof Model<LocationGeocodeType>) ||
  model("LocationGeocode", LocationGeocodeSchema);

const LocationCluster =
  (models.LocationCluster as typeof Model<LocationClusterType>) ||
  model("LocationCluster", LocationClusterSchema);

const MonthlyDistanceMatrix =
  (models.MonthlyDistanceMatrix as typeof Model<MonthlyDistanceMatrixType>) ||
  model("MonthlyDistanceMatrix", MonthlyDistanceMatrixSchema);

const SchedulingPreferences =
  (models.SchedulingPreferences as typeof Model<SchedulingPreferencesType>) ||
  model("SchedulingPreferences", SchedulingPreferencesSchema);

const HistoricalSchedulePattern =
  (models.HistoricalSchedulePattern as typeof Model<HistoricalSchedulePatternType>) ||
  model("HistoricalSchedulePattern", HistoricalSchedulePatternSchema);

const OptimizationHistory =
  (models.OptimizationHistory as typeof Model<OptimizationHistoryType>) ||
  model("OptimizationHistory", OptimizationHistorySchema);

export {
  Client,
  Invoice,
  JobsDueSoon,
  Schedule,
  PayrollPeriod,
  Report,
  Estimate,
  LocationGeocode,
  LocationCluster,
  MonthlyDistanceMatrix,
  SchedulingPreferences,
  HistoricalSchedulePattern,
  OptimizationHistory,
};
