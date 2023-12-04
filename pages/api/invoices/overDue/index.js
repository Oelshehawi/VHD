import connectMongo from '../../../../lib/connect';
import { Invoice } from '../../../../models/reactDataSchema';

export default async function handler(req, res) {
  await connectMongo();

  if (req.method === 'GET') {
    try {
      const result = await Invoice.aggregate([
        {
          $match: { status: 'overdue' }
        },
        {
          $unwind: "$items" 
        },
        {
          $group: {
            _id: null, 
            totalAmount: { $sum: "$items.price" }, 
            count: { $sum: 1 }
          }
        }
      ]);

      const response = result.length > 0
        ? { totalAmount: result[0].totalAmount, count: await Invoice.countDocuments({ status: 'overdue' }) }
        : { totalAmount: 0, count: 0 };

      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error retrieving overdue invoices data.');
    }
  } else {
    res.status(405).send({ message: 'Only GET method is allowed' });
  }
}