const mongoose = require("mongoose");

const reactFormDataSchema = new mongoose.Schema({
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

const eventSchema = new mongoose.Schema({
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

const userSchema = new mongoose.Schema({
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


const Client = mongoose.model("Client", reactFormDataSchema);
const Event = mongoose.model("Event", eventSchema);
const User = mongoose.model("User", userSchema);

module.exports = { Client, Event , User };