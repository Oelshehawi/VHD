const Client = require("../models/reactDataSchema");

// Posting Data to MongoDB from Axios post request and Add client Modal form
exports.insert = async (req, res) => {
  const ClientName = req.body.clientName;
  const JobTitle = req.body.jobTitle;
  const Email = req.body.email;
  const PhoneNumber = req.body.phoneNumber;
  const Dates = req.body.date;
  const Price = req.body.price;
  const Frequency = req.body.frequency;
  const Location = req.body.location;
  const Notes = req.body.notes;
  const Invoice = req.files.invoice;

  const formData = new Client({
    clientName: ClientName,
    jobTitle: JobTitle,
    email: Email,
    phoneNumber: PhoneNumber,
    date: Dates,
    price: Price,
    frequency: Frequency,
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
        message: err.message || "Some error occurred while retrieving Clients.",
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

exports.delete = (req, res) => {
  const id = req.params.id;

  Client.findByIdAndRemove(id)
    .then((data) => {
      if (!data) {
        res.status(404).send({
          message: `Cannot delete Client with id=${id}. Maybe Client was not found!`,
        });
      } else {
        res.send({
          message: "Client was deleted successfully!",
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Could not delete Client with id=" + id,
      });
    });
};

exports.update = async (req, res) => {
  if (!req.body) {
    return res.status(400).send({
      message: "Data to update can not be empty!",
    });
  }
  const id = req.params.id;

  Client.findByIdAndUpdate(id, req.body, { useFindAndModify: false })
    .then((data) => {
      if (!data) {
        res.status(404).send({
          message: `Cannot update Client with id=${id}. Maybe Client was not found!`,
        });
      } else res.send({ message: "Client was updated successfully." });
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error updating Client with id=" + id,
      });
    });
};
