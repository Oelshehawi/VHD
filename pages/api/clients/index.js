import connectMongo from '../../../lib/connect';
import { Client } from '../../../models/reactDataSchema';
import { IncomingForm } from 'formidable';
import { tmpdir } from 'os';
import { join } from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  await connectMongo();

  if (req.method === 'GET') {
    // Request without ID
    const jobTitle = req.query.jobTitle;
    const condition = jobTitle
      ? { jobTitle: { $regex: new RegExp(jobTitle), $options: 'i' } }
      : {};

    try {
      const data = await Client.find(condition);
      res.send(data);
    } catch (err) {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving Clients.',
      });
    }
  } else if (req.method === 'POST') {
    const form = new IncomingForm({ uploadDir: tmpdir() });

    try {
      const { fields, files } = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) {
            reject(err);
          } else {
            resolve({ fields, files });
          }
        });
      });

      // Extract form data
      let {
        clientName,
        jobTitle,
        email,
        phoneNumber,
        date,
        price,
        frequency,
        location,
        notes,
      } = fields || {};

      // Convert empty array fields to null
      clientName = clientName.length === 0 ? null : clientName[0];
      jobTitle = jobTitle.length === 0 ? null : jobTitle[0];
      email = email.length === 0 ? null : email[0];
      phoneNumber = phoneNumber.length === 0 ? null : phoneNumber[0];
      date = date.length === 0 ? null : date[0];
      // Convert price and frequency to numbers
      price =
        price.length === 0 || isNaN(parseFloat(price[0]))
          ? null
          : parseFloat(price[0]);
      frequency =
        frequency.length === 0 || isNaN(parseFloat(frequency[0]))
          ? null
          : parseFloat(frequency[0]);
      location = location.length === 0 ? null : location[0];
      notes = notes.length === 0 ? null : notes[0];

      // Extract the invoice file
      const invoiceFile = files ? files.invoice : null;

      let binaryData = '';

      if (invoiceFile) {
        const tempFilePath = join(tmpdir(), invoiceFile[0].originalFilename);
      
        // Move the uploaded file to the temporary directory
        try {
          fs.renameSync(invoiceFile[0].filepath, tempFilePath);
        } catch (error) {
          console.log('Error moving uploaded file:', error);
          res.status(500).send({
            message: 'Error moving uploaded file.',
          });
          return;
        }
      
        // Read the binary data from the temporary file
        try {
          binaryData = fs.readFileSync(tempFilePath);
          console.log('Invoice file contents:', binaryData);
        } catch (error) {
          console.log('Error reading invoice file:', error);
          res.status(500).send({
            message: 'Error reading invoice file.',
          });
          return;
        }
      
        // Remove the temporary file
        try {
          fs.unlinkSync(tempFilePath);
        } catch (error) {
          console.log('Error removing temporary file:', error);
        }
      }

      const formData = new Client({
        clientName,
        jobTitle,
        email,
        phoneNumber,
        date,
        price,
        frequency,
        location,
        notes,
        invoice: {
          data: invoiceFile ? binaryData : null,
          contentType: invoiceFile ? invoiceFile[0].mimetype : null,
          filename: invoiceFile ? invoiceFile[0].originalFilename : null,
        },
      });

      await formData.save();
      res.send('Inserted data successfully.');
    } catch (err) {
      console.log(err);
      res.status(500).send({
        message: 'Some error occurred while inserting data.',
      });
    }
  }
}
