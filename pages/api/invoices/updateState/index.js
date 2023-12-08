import connectMongo from '../../../../lib/connect';
import { Invoice } from '../../../../models/reactDataSchema';

export default async function handler(req, res) {
  await connectMongo();
  if (req.method === 'PUT') {
    try {
      const { invoiceId, status } = req.body;
      await Invoice.findByIdAndUpdate(invoiceId, { status });
      res.status(200).send('Invoice status updated successfully.');
    } catch (err) {
      res.status(500).send({ message: 'Error updating invoice status.' });
    }
  } else {
    res.status(405).send({ message: 'Method Not Allowed' });
  }
}