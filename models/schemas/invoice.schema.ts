// @ts-ignore
import mongoose from "mongoose";
import {
  InvoiceType,
  EstimateType,
  CallLogEntry,
} from "../../app/lib/typeDefinitions";
import { CALL_OUTCOMES } from "../../app/lib/callLogConstants";

const { Schema, model, models, Model } = mongoose;

export const CallLogEntrySchema = new Schema<CallLogEntry>({
  callerId: { type: String, required: true },
  callerName: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
  outcome: {
    type: String,
    required: true,
    enum: Object.values(CALL_OUTCOMES),
  },
  notes: { type: String, required: true },
  followUpDate: { type: Date },
  duration: { type: Number }, // in minutes
});

export const invoiceSchema = new Schema<InvoiceType>({
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

// Indexes for invoice queries
invoiceSchema.index({ status: 1, dateDue: 1 });
invoiceSchema.index({ status: 1, dateIssued: 1, dateDue: 1 });
invoiceSchema.index({ dateIssued: 1, status: 1 });
invoiceSchema.index({ clientId: 1, dateIssued: -1 });
invoiceSchema.index({ location: 1, status: 1 });

export const Invoice =
  (models.Invoice as typeof Model<InvoiceType>) ||
  model("Invoice", invoiceSchema);

export const EstimateSchema = new Schema<EstimateType>({
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

// Index for estimate queries
EstimateSchema.index({ status: 1, createdDate: -1 });

export const Estimate =
  (models.Estimate as typeof Model<EstimateType>) ||
  model("Estimate", EstimateSchema);
