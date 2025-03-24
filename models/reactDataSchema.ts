// @ts-ignore
import { Model, Schema, model, models, mongoose } from "mongoose";
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
} from "../app/lib/typeDefinitions";

const ClientSchema = new Schema<ClientType>({
  clientName: {
    type: String,
  },
  email: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
  prefix: {
    type: String,
  },
  notes: {
    type: String,
  },
});

const PhotoSchema = new Schema<PhotoType>({
  url: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
  },
  technicianId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["before", "after"],
    required: true,
  },
});

const SignatureSchema = new Schema<SignatureType>({
  url: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
  },
  signerName: {
    type: String,
    required: true,
    default: "Customer",
  },
  technicianId: {
    type: String,
    required: true,
  },
});

const invoiceSchema = new Schema<InvoiceType>({
  invoiceId: {
    type: String,
    required: true,
  },
  jobTitle: {
    type: String,
    required: true,
  },
  dateIssued: {
    type: Date,
    required: true,
  },
  dateDue: {
    type: Date,
    required: true,
  },
  items: [
    {
      description: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
    },
  ],
  frequency: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
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
  paymentEmailSent: {
    type: Boolean,
    default: false,
  },
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
  jobTitle: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  startDateTime: {
    type: Date,
    required: true,
  },
  assignedTechnicians: [
    {
      type: String,
      required: true,
    },
  ],
  confirmed: {
    type: Boolean,
    default: false,
  },
  hours: { type: Number, default: 4 },
  shifts: { type: [ShiftSchema], default: [] },
  payrollPeriod: { type: mongoose.Schema.Types.ObjectId, ref: "PayrollPeriod" },
  deadRun: { type: Boolean, default: false },
  signature: {
    type: SignatureSchema,
    required: false,
  },
  photos: {
    type: [PhotoSchema],
    default: undefined,
  },
  technicianNotes: {
    type: String,
    default: "",
  },
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
  dateCompleted: {
    type: Date,
    required: true,
  },
  technicianId: {
    type: String,
    required: true,
  },
  lastServiceDate: {
    type: Date,
  },
  fuelType: {
    type: String,
    enum: ["Natural Gas", "Electric", "Solid Fuel", "Other"],
  },
  cookingVolume: {
    type: String,
    enum: ["High", "Medium", "Low"],
  },
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
    filtersListed: {
      type: String,
      enum: ["Yes", "No", "N/A"],
      default: "N/A",
    },
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
    ecologyUnitCost: {
      type: String,
    },
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
    accessPanelsRequired: {
      type: String,
    },
    accessPanelCost: {
      type: String,
    },
  },
  recommendedCleaningFrequency: {
    type: Number,
  },
  comments: {
    type: String,
  },
  equipmentDetails: {
    hoodType: String,
    filterType: String,
    ductworkType: String,
    fanType: String,
  },
  cleaningDetails: {
    hoodCleaned: {
      type: Boolean,
      default: true,
    },
    filtersCleaned: {
      type: Boolean,
      default: true,
    },
    ductworkCleaned: {
      type: Boolean,
      default: true,
    },
    fanCleaned: {
      type: Boolean,
      default: true,
    },
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
  invoiceId: {
    type: String,
    required: true,
    unique: true,
  },
  jobTitle: {
    type: String,
    required: true,
  },
  dateDue: {
    type: Date,
    required: true,
  },
  isScheduled: {
    type: Boolean,
    default: false,
  },
  emailSent: {
    type: Boolean,
    default: false,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
});

PayrollPeriodSchema.index({ startDate: 1, endDate: 1 }, { unique: true });

const Client =
  (models.Client as Model<ClientType>) || model("Client", ClientSchema);
const Invoice =
  (models.Invoice as Model<InvoiceType>) || model("Invoice", invoiceSchema);
const JobsDueSoon =
  (models.JobsDueSoon as Model<DueInvoiceType>) ||
  model("JobsDueSoon", jobsDueSoonSchema);
const Schedule =
  (models.Schedule as Model<ScheduleType>) || model("Schedule", scheduleSchema);

const PayrollPeriod =
  (models.PayrollPeriod as Model<PayrollPeriodType>) ||
  model("PayrollPeriod", PayrollPeriodSchema);

const Report =
  (models.Report as Model<ReportType>) || model("Report", ReportSchema);

export { Client, Invoice, JobsDueSoon, Schedule, PayrollPeriod, Report };
