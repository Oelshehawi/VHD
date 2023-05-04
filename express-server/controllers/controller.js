const Client = require("../models/reactDataSchema");

// Posting Data to MongoDB from Axios post request and Add client Modal form
exports.insert = async (req, res) => {
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
    invoice: {
      data: Invoice.data,
      contentType: Invoice.mimetype,
      filename: Invoice.name,
    },
  });
  try {
    await formData.save();
    res.send("inserted data..");
  } catch (err) {
    console.log(err);
  }
};

// Getting data from mongoDB
exports.findAll = async (req, res) => {
  const jobTitle = req.query.jobTitle;
  var condition = jobTitle
    ? { jobTitle: { $regex: new RegExp(jobTitle), $options: "i" } }
    : {};

  Client.find(condition)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving Clients.",
      });
    });
};

exports.findOne = async (req, res) => {
  const fileId = req.params.id;

  try {
    // Find file in MongoDB and retrieve its metadatas
    const invoiceFound = await Client.findById(fileId);

    if (invoiceFound) {
      // Set headers for file download
      res.setHeader(
        "Access-Control-Expose-Headers",
        "Content-Type, Content-Disposition"
      );
      res.set({
        "Content-Type": invoiceFound.invoice.contentType,
        "Content-Disposition": `attachment; filename=${invoiceFound.invoice.filename}`,
      });
      // Send file to client as a stream
      res.send(invoiceFound.invoice.data);
    } else {
      res.status(500).send("File data is missing");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};
