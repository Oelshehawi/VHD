import { Schema, model, models } from 'mongoose';

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
    enum: ['pending', 'overdue', 'paid'],
    default: 'pending',
  },
  isDue: {
    type: Boolean,
    default: false,
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

const userSchema = new Schema({
  username: {
    type: String,
  },
  password: {
    type: String,
  },
  isAdmin: {
    type: Boolean,
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
});

const Client = models.Client || model('Client', ClientSchema);
const Invoice = models.Invoice || model('Invoice', invoiceSchema);
const Event = models.Event || model('Event', eventSchema);
const User = models.User || model('User', userSchema);
const JobsDueSoon = models.JobsDueSoon || model('JobsDueSoon', jobsDueSoonSchema);

export { Client, Event, User, Invoice, JobsDueSoon };
