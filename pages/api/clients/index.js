import connectMongo from '../../../app/lib/connect';
import { Client } from '../../../models/reactDataSchema';

export const config = {
  api: {
    bodyParser: true,
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
    try {
      const { clientName, prefix, email, phoneNumber, notes } = req.body;

      const newClient = new Client({
        clientName,
        prefix,
        email,
        phoneNumber,
        notes,
      });

      await newClient.save();
      res.status(201).send('Client added successfully.');
    } catch (err) {
      console.error(err);
      res.status(500).send({ message: 'Error occurred while adding client.' });
    }
  }
}
