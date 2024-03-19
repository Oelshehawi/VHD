import connectMongo from '../../../app/lib/connect';
import { Invoice } from '../../../models/reactDataSchema';

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
        const condition = { invoiceId: { $regex: `^${prefix}-` } };
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
    try {
      const {
        invoiceId,
        jobTitle,
        dateIssued,
        dateDue,
        items,
        frequency,
        location,
        notes,
        status,
      } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).send({ message: 'Items are required.' });
      }

      const formattedItems = items.map((item) => ({
        description: item.description,
        price: parseFloat(item.price) || 0,
      }));

      const invoiceData = new Invoice({
        invoiceId,
        jobTitle,
        dateIssued,
        dateDue,
        items: formattedItems,
        frequency,
        location,
        notes,
        status,
      });

      await invoiceData.save();
      res.status(201).send({ message: 'Invoice created successfully.' });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .send({ message: 'Error occurred while creating the invoice.' });
    }
  }
}
