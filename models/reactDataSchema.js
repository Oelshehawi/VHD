import { Schema, model, models } from 'mongoose';

const reactFormDataSchema = new Schema({
  clientName: {
    type: String,
  },
  jobTitle: {
    type: String,
  },
  email: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
  date: {
    type: Date,
  },
  price: {
    type: Number,
  },
  frequency: {
    type: Number,
  },
  location: {
    type: String,
  },
  notes: {
    type: String,
  },
  invoice: {
    data: Buffer,
    contentType: String,
    filename: String,
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

const Client = models.Client || model('Client', reactFormDataSchema);
const Event = models.Event || model('Event', eventSchema);
const User = models.User || model('User', userSchema);

export { Client, Event, User };
