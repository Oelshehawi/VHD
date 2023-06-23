import connectMongo from '../../../lib/connect';
import { Invoice } from '../../../models/reactDataSchema';
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
    const { prefix, jobTitle } = req.query;
    try {
      if (prefix) {
        const condition = { invoiceId: { $regex: `^${prefix}-` } };
        const data = await Invoice.find(condition);
        res.send(data);
      } else if (jobTitle) {
        const condition = {
          jobTitle: { $regex: new RegExp(jobTitle), $options: 'i' },
        };
        const data = await Invoice.find(condition);
        res.send(data);
      } else {
        const data = await Invoice.find({});
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

      // Extract form data
      let { invoiceId, jobTitle, dateIssued, dateDue, items, notes, status } =
        fields || {};

      // Convert empty array fields to null
      invoiceId = invoiceId.length === 0 ? null : invoiceId;
      jobTitle = jobTitle.length === 0 ? null : jobTitle;
      dateIssued = dateIssued.length === 0 ? null : dateIssued;
      dateDue = dateDue.length === 0 ? null : dateDue;
      notes = notes.length === 0 ? null : notes;

      // Convert items to an array of objects
      if (items.length === 0) {
        items = null;
      } else {
        items = items.map((item) => ({
          description: item.description,
          price: parseFloat(item.price) || 0,
        }));
      }

      const invoiceData = new Invoice({
        invoiceId,
        jobTitle,
        dateIssued,
        dateDue,
        items,
        notes,
        status,
      });

      await invoiceData.save();
      res.send('Inserted data successfully.');
    } catch (err) {
      console.log(err);
      res.status(500).send({
        message: 'Some error occurred while inserting data.',
      });
    }
  }
}
