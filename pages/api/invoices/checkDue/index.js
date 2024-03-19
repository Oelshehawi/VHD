import connectMongo from '../../../../app/lib/connect';
import { Invoice } from '../../../../models/reactDataSchema';
import { JobsDueSoon } from '../../../../models/reactDataSchema';

export default async function handler(req, res) {
  await connectMongo();

  if (req.method === 'GET') {
    try {
      const today = new Date();
      const sevenDaysLater = new Date(today);
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

      const dueInvoices = await Invoice.find({
        dateDue: {
          $gte: today,
          $lte: sevenDaysLater,
        },
      });

      await Promise.all(
        dueInvoices.map(async (invoice) => {
          const { _id: invoiceId, jobTitle, dateDue } = invoice;

          const jobExists = await JobsDueSoon.findOne({ invoiceId });
          if (!jobExists) {
            await JobsDueSoon.create({
              invoiceId,
              jobTitle,
              dateDue,
              isScheduled: false,
              emailSent: false,
            });
          }
        })
      );

      const unscheduledJobs = await JobsDueSoon.find({ isScheduled: false });

      res.status(200).json(unscheduledJobs);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error processing due invoices.');
    }
  } else if (req.method === 'POST') {
    try {
      const { invoiceId, isScheduled } = req.body;

      await JobsDueSoon.findOneAndUpdate(
        { invoiceId },
        { $set: { isScheduled } },
        { new: true }
      );

      res.status(200).send('Invoice updated successfully.');
    } catch (error) {
      console.error(error);
      res.status(500).send('Error updating invoice.');
    }
  } else {
    res.status(405).send({ message: 'Only GET method is allowed' });
  }
}
