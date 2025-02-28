// @ts-ignore
import { Model, Schema, model, models, mongoose } from "mongoose";
import {
  DueInvoiceType,
  InvoiceType,
  ScheduleType,
  ClientType,
  BankAccountType,
  TransactionType,
  PayrollPeriodType,
  ShiftType,
  SignatureType,
  PhotoType,
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
  signature: {
    type: SignatureSchema,
    required: false,
  },
  photos: {
    before: {
      type: [PhotoSchema],
      default: undefined,
    },
    after: {
      type: [PhotoSchema],
      default: undefined,
    },
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

const bankAccountSchema = new Schema<BankAccountType>({
  userId: {
    type: String,
    required: true,
  },
  bankId: {
    type: String,
    required: true,
  },
  accountId: {
    type: String,
    required: true,
  },
  accessToken: {
    type: String,
    required: true,
  },
  shareableId: {
    type: String,
    required: true,
  },
  cursor: {
    type: String,
    default: null,
  },
});

const transactionSchema = new Schema<TransactionType>(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    bankAccountId: {
      type: String,
      required: true,
    },
    id: String,
    $id: String,
    name: String,
    paymentChannel: String,
    type: String,
    accountId: String,
    amount: Number,
    pending: Boolean,
    category: {
      confidence_level: String,
      detailed: String,
      primary: String,
    },
    date: String,
    image: String,
    $createdAt: String,
    channel: String,
  },
  {
    timestamps: true,
  },
);

bankAccountSchema.index(
  { userId: 1, bankId: 1, accountId: 1 },
  { unique: true },
);

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

const BankAccount =
  (models.BankAccount as Model<BankAccountType>) ||
  model("BankAccount", bankAccountSchema);

const Transaction =
  (models.Transaction as Model<TransactionType>) ||
  model("Transaction", transactionSchema);

const PayrollPeriod =
  (models.PayrollPeriod as Model<PayrollPeriodType>) ||
  model("PayrollPeriod", PayrollPeriodSchema);

export {
  Client,
  Invoice,
  JobsDueSoon,
  Schedule,
  BankAccount,
  Transaction,
  PayrollPeriod,
};
