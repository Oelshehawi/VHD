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

const Client = mongoose.model("Client", reactFormDataSchema);

module.exports = Client;
