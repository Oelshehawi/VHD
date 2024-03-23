import connectMongo from '../lib/connect';
import { unstable_noStore as noStore } from 'next/cache';
import { Client, Invoice, JobsDueSoon } from '../../models/reactDataSchema';
import { revalidatePath } from 'next/cache';

export const fetchDueInvoices = async () => {
  noStore();
  await connectMongo();

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

    await createOrUpdateJobsDueSoon(dueInvoices);

    const unscheduledJobs = await JobsDueSoon.find({
      isScheduled: false,
    });

    return unscheduledJobs.map((job) => ({
      invoiceId: job.invoiceId,
      jobTitle: job.jobTitle,
      dateDue: job.dateDue.toISOString(),
      isScheduled: job.isScheduled,
      emailSent: job.emailSent,
    }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch due invoices.');
  }
};

export const createOrUpdateJobsDueSoon = async (dueInvoices) => {
  noStore();
  await connectMongo();

  const jobsDueSoonPromises = dueInvoices.map(async (invoice) => {
    const { _id, jobTitle, dateDue } = invoice;

    let jobExists = await JobsDueSoon.findOne({
      invoiceId: _id.toString(),
    });
    if (!jobExists) {
      jobExists = await JobsDueSoon.create({
        invoiceId: _id.toString(),
        jobTitle,
        dateDue,
        isScheduled: false,
        emailSent: false,
      });
    }
  });

  await Promise.all(jobsDueSoonPromises);

  revalidatePath('/dashboard');
};

export const getClientCount = async () => {
  noStore();
  await connectMongo();

  try {
    const count = await Client.countDocuments();
    return count;
  } catch (error) {
    console.error('Database Error:', error);
    Error('Failed to fetch client count');
  }
};

export const getOverDueInvoiceAmount = async () => {
  noStore();
  await connectMongo();
  try {
    const result = await Invoice.aggregate([
      { $match: { status: 'overdue' } },
      { $unwind: '$items' },
      {
        $group: { _id: null, totalAmount: { $sum: '$items.price' } },
      },
    ]);
    let totalAmount = result.length > 0 ? result[0].totalAmount : 0;
    return (totalAmount += totalAmount * 0.05);
  } catch (error) {
    console.error('Database Error:', error);
    Error('Failed to fetch overdue invoice amount');
  }
};

export const getPendingInvoiceAmount = async () => {
  await connectMongo();
  noStore();
  try {
    const result = await Invoice.aggregate([
      { $match: { status: 'pending' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$items.price' },
        },
      },
    ]);
    let totalAmount = result.length > 0 ? result[0].totalAmount : 0;
    return (totalAmount += totalAmount * 0.05);
  } catch (error) {
    console.error('Database Error:', error);
    Error('Failed to fetch pending invoice amount');
  }
};
