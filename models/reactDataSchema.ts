// @ts-ignore
import { Model, Schema, model, models, mongoose } from "mongoose";
import {
  DueInvoiceType,
  InvoiceType,
  ScheduleType,
  ClientType,
  BankAccountType,
  TransactionType,
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
  assignedTechnician: {
    type: String,
    required: true,
  },
  confirmed: {
    type: Boolean,
    default: false,
  },
});

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
});

const transactionSchema = new Schema<TransactionType>(
  {
    senderBankId: {
      type: String,
      required: true,
    },
    receiverBankId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    name: String,
    channel: {
      type: String,
      default: "online",
    },
    category: {
      type: String,
      default: "Transfer",
    },
  },
  {
    timestamps: true,
  },
);

bankAccountSchema.index(
  { userId: 1, bankId: 1, accountId: 1 },
  { unique: true },
);

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

export { Client, Invoice, JobsDueSoon, Schedule, BankAccount, Transaction };
