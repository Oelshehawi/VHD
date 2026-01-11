// @ts-ignore
import mongoose from "mongoose";
import {
  ScheduleType,
  ShiftType,
  SignatureType,
  PhotoType,
  ReportType,
  PayrollPeriodType,
  DueInvoiceType,
} from "../../app/lib/typeDefinitions";
import { CallLogEntrySchema } from "./invoice.schema";

const { Schema, model, models, Model } = mongoose;
const { ObjectId } = mongoose.Schema.Types;

const PhotoSchema = new Schema<PhotoType>({
  url: { type: String, required: true },
  timestamp: { type: Date, required: true },
  technicianId: { type: String, required: true },
  type: { type: String, enum: ["before", "after", "estimate"], required: true },
});

const SignatureSchema = new Schema<SignatureType>({
  url: { type: String, required: true },
  timestamp: { type: Date, required: true },
  signerName: { type: String, required: true, default: "Customer" },
  technicianId: { type: String, required: true },
});

const ShiftSchema = new Schema<ShiftType>({
  technicianId: { type: String, required: true },
  clockIn: { type: Date },
  clockOut: { type: Date },
  jobDetails: { type: String },
  hoursWorked: { type: Number },
});

export const scheduleSchema = new Schema<ScheduleType>({
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
  onSiteContact: {
    name: { type: String },
    phone: { type: String },
    email: { type: String },
  },
  accessInstructions: { type: String },
});

// Schedule indexes
scheduleSchema.index({ startDateTime: 1, confirmed: 1 });
scheduleSchema.index({ assignedTechnicians: 1, startDateTime: 1 });
scheduleSchema.index({ startDateTime: 1, assignedTechnicians: 1 });
scheduleSchema.index({ location: 1, startDateTime: 1 });

export const Schedule =
  (models.Schedule as typeof Model<ScheduleType>) ||
  model("Schedule", scheduleSchema);

export const ReportSchema = new Schema<ReportType>({
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
    ecologyUnitOperational: {
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
  ecologyUnit: {
    exists: { type: Boolean, default: false },
    filterReplacementNeeded: { type: Boolean, default: false },
    notes: { type: String },
  },
  accessPanels: {
    adequate: { type: Boolean, default: true },
    notes: { type: String },
  },
  recommendations: String,
});

// Report index
ReportSchema.index({ scheduleId: 1 });

export const Report =
  (models.Report as typeof Model<ReportType>) || model("Report", ReportSchema);

export const PayrollPeriodSchema = new Schema<PayrollPeriodType>(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    cutoffDate: { type: Date, required: true },
    payDay: { type: Date, required: true },
  },
  { timestamps: true },
);

// PayrollPeriod index
PayrollPeriodSchema.index({ startDate: 1, endDate: 1 });

export const PayrollPeriod =
  (models.PayrollPeriod as typeof Model<PayrollPeriodType>) ||
  model("PayrollPeriod", PayrollPeriodSchema);

export const jobsDueSoonSchema = new Schema<DueInvoiceType>({
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

// JobsDueSoon indexes
jobsDueSoonSchema.index({ isScheduled: 1, dateDue: 1 });
jobsDueSoonSchema.index({ clientId: 1, dateDue: 1 });

export const JobsDueSoon =
  (models.JobsDueSoon as typeof Model<DueInvoiceType>) ||
  model("JobsDueSoon", jobsDueSoonSchema);
