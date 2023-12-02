import connectMongo from '../../../../lib/connect';
import { Client } from '../../../../models/reactDataSchema';

export default async function handler(req, res) {
  await connectMongo();

  if (req.method === 'GET') {
    try {
      const total = await Client.countDocuments();
      res.json({ total });
    } catch (err) {
      res.status(500).send({
        message: err.message || 'Some error occurred while counting clients.',
      });
    }
  } else {
    res.status(405).send({ message: 'Only GET method is allowed' });
  }
}
