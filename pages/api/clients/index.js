import connectMongo from '../../../lib/connect';
import { Client } from '../../../models/reactDataSchema';
import { IncomingForm } from 'formidable';

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
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
      const responseBodySize = JSON.stringify(data).length / (1024 * 1024); // Convert to MB

      console.log(`Response size: ${responseBodySize} MB`);

      res.send(data);
    } catch (err) {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving Clients.',
      });
    }
  } else if (req.method === 'POST') {
    const form = new IncomingForm();

    try {
      const { fields } = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields) => {
          if (err) {
            reject(err);
          } else {
            resolve({ fields });
          }
        });
      });

      // Extract form data
      let {
        clientName,
        prefix,
        email,
        phoneNumber,
        frequency,
        location,
        notes,        
    
      } = fields || {};

      // Convert empty array fields to null
      clientName = clientName.length === 0 ? null : clientName[0];
      email = email.length === 0 ? null : email[0];
      prefix = prefix.length === 0 ? null : prefix[0];
      phoneNumber = phoneNumber.length === 0 ? null : phoneNumber[0];
      // Convert price and frequency to numbers
      frequency =
        frequency.length === 0 || isNaN(parseFloat(frequency[0]))
          ? null
          : parseFloat(frequency[0]);
      location = location.length === 0 ? null : location[0];
      notes = notes.length === 0 ? null : notes[0];

      const formData = new Client({
        clientName,
        prefix,
        email,
        phoneNumber,
        frequency,
        location,
        notes,      
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
