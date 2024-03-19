import connectMongo from '../../../../app/lib/connect';
import { Invoice } from '../../../../models/reactDataSchema';

export default async function handler(req, res) {
    await connectMongo();

    if (req.method === 'GET') {
        try {
            const { prefix } = req.query;

            const regex = new RegExp(`^${prefix}`);
            const invoices = await Invoice.find({ invoiceId: { $regex: regex } });

            res.status(200).json(invoices);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching invoices.' });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}