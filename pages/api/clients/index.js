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
    const { prefix } = req.query;
    try {
      if (prefix) {
        const condition = { prefix };
        const data = await Client.find(condition);
        res.send(data);
      } else {
        const data = await Client.find({});
        res.send(data);
      }
    } catch (err) {
      res.status(500).send({
        message:
          err.message || 'Some error occurred while retrieving invoices.',
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

      let {
        clientName,
        prefix,
        email,
        phoneNumber,
        notes,
      } = fields || {};

      clientName = clientName.length === 0 ? null : clientName[0];
      email = email.length === 0 ? null : email[0];
      prefix = prefix.length === 0 ? null : prefix[0];
      phoneNumber = phoneNumber.length === 0 ? null : phoneNumber[0];
      notes = notes.length === 0 ? null : notes[0];

      const formData = new Client({
        clientName,
        prefix,
        email,
        phoneNumber,
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
