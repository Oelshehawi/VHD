const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const Client = require("./models/reactDataSchema");
const fileupload = require("express-fileupload");
app.use(express.json());
app.use(cors());
app.use(fileupload());

mongoose.connect("mongodb://127.0.0.1:27017/VHD", {
  useNewUrlParser: true,
});

app.post("/insert", async (req, res) => {
  const ClientName = req.body.clientName;
  const JobTitle = req.body.jobTitle;
  const Email = req.body.email;
  const PhoneNumber = req.body.phoneNumber;
  const Date = req.body.date;
  const Location = req.body.location;
  const Notes = req.body.notes;
  const Invoice = req.files.invoice;

  const formData = new Client({
    clientName: ClientName,
    jobTitle: JobTitle,
    email: Email,
    phoneNumber: PhoneNumber,
    date: Date,
    location: Location,
    notes: Notes,
    invoice: Invoice,
  });
  try {
    await formData.save();
    res.send("inserted data..");
  } catch (err) {
    console.log(err);
  }
});

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
