var postmark = require('postmark');
import connectMongo from '../../../../app/lib/connect';
import { Invoice } from '../../../../models/reactDataSchema';
import { Client } from '../../../../models/reactDataSchema';
import { JobsDueSoon } from '../../../../models/reactDataSchema';

export default async function handler(req, res) {
  await connectMongo();

  if (req.method === 'POST') {
    const { clientId, invoiceId } = req.body;

    try {
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      const clientDetails = await Client.findOne({
        _id: clientId,
      });

      if (!clientDetails || !clientDetails.email) {
        return res.status(404).json({ error: 'Client email not found' });
      }

      const clientEmail = clientDetails.email;
      const utcDate = new Date(
        invoice.dateDue.getTime() + invoice.dateDue.getTimezoneOffset() * 60000
      );
      const formattedDate = utcDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const client = new postmark.ServerClient(process.env.POSTMARK_CLIENT);

      await client.sendEmailWithTemplate({
        From: 'adam@vancouverventcleaning.ca',
        To: clientEmail,
        TemplateAlias: 'reminder-email',
        TemplateModel: {
          due_date: formattedDate,
          jobTitle: invoice.jobTitle,
          phone_number: '604-273-8717',
          contact_email: 'adam@vancouverventcleaning.ca',
        },
        TrackOpens: true,
      });

      const result = await JobsDueSoon.findOneAndUpdate(
        { invoiceId: invoiceId },
        { $set: { emailSent: true } },
        { new: true }
      );
      
      return res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
      return res
        .status(500)
        .json({ error: 'Failed to send email', details: error.message });
    }
  } else {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
}
