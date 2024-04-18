// @ts-ignore
import { Schema, model, models, mongoose } from "mongoose";

const ClientSchema = new Schema({
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

const invoiceSchema = new Schema({
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

const eventSchema = new Schema({
  jobTitle: {
    type: String,
  },
  location: {
    type: String,
  },
  number: {
    type: String,
  },
  time: {
    type: Date,
  },
});

const jobsDueSoonSchema = new Schema({
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

const Client = models.Client || model("Client", ClientSchema);
const Invoice = models.Invoice || model("Invoice", invoiceSchema);
const JobsDueSoon =
  models.JobsDueSoon || model("JobsDueSoon", jobsDueSoonSchema);

export { Client, Invoice, JobsDueSoon };
