// @ts-ignore
import { Model, Schema, model, models, mongoose } from "mongoose";
import {
  DueInvoiceType,
  InvoiceType,
  ScheduleType,
  ClientType,
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
    unique: true,
  },
  notes: {
    type: String,
  },
});

const invoiceSchema = new Schema<InvoiceType>({
  invoiceId: {
    type: String,
    required: true,
    unique: true,
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

const Client =
  (models.Client as Model<ClientType>) || model("Client", ClientSchema);
const Invoice =
  (models.Invoice as Model<InvoiceType>) || model("Invoice", invoiceSchema);
const JobsDueSoon =
  (models.JobsDueSoon as Model<DueInvoiceType>) ||
  model("JobsDueSoon", jobsDueSoonSchema);
const Schedule =
  (models.Schedule as Model<ScheduleType>) || model("Schedule", scheduleSchema);

export { Client, Invoice, JobsDueSoon, Schedule };
