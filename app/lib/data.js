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

   return await checkEmailPresence(
      unscheduledJobs.map((job) => ({
        invoiceId: job.invoiceId,
        jobTitle: job.jobTitle,
        dateDue: job.dateDue.toISOString(),
        isScheduled: job.isScheduled,
        emailSent: job.emailSent,
      }))
    );
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

export const checkEmailPresence = async (dueInvoices) => {
  await connectMongo();

  const invoiceIds = dueInvoices.map((invoice) => invoice.invoiceId);
  try {
    const invoices = await Invoice.find({ _id: { $in: invoiceIds } }).lean();

    const prefixes = invoices.map((prefix) => prefix.invoiceId.split('-')[0]);

    const prefixesWithIds = invoices.map((invoice) => {
      const prefix = invoice.invoiceId.split('-')[0];
      return { _id: invoice._id, prefix };
    });

    const clients = await Client.find({ prefix: { $in: prefixes } }).lean();

    const updatedPrefixesWithIds = prefixesWithIds.map((prefixWithId) => {
      const client = clients.find(
        (client) => client.prefix === prefixWithId.prefix
      );
      const emailExists = client && client.email !== '';
      return { ...prefixWithId, emailExists };
    });

    const updatedDueInvoices = dueInvoices.map(invoice => {
      const invoiceId = typeof invoice.invoiceId === 'string' ? invoice.invoiceId : invoice.invoiceId.toString();
      const prefixWithId = updatedPrefixesWithIds.find(prefix => {
        const prefixId = typeof prefix._id === 'string' ? prefix._id : prefix._id.toString();
        return prefixId === invoiceId;
      });
    
      const emailExists = !!prefixWithId && prefixWithId.emailExists;
      return { ...invoice, emailExists };
    });
    return updatedDueInvoices;
  } catch (error) {
    console.error('Error finding invoices:', error);
  }
};


export const fetchYearlySalesData = async () => {
  await connectMongo();
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;

  const matchCurrentYear = {
    $match: {
      dateIssued: {
        $gte: new Date(`${currentYear}-01-01`),
        $lte: new Date(`${currentYear}-12-31`),
      },
    },
  };

  const matchLastYear = {
    $match: {
      dateIssued: {
        $gte: new Date(`${lastYear}-01-01`),
        $lte: new Date(`${lastYear}-12-31`),
      },
    },
  };

  const group = {
    $group: {
      _id: { month: { $month: '$dateIssued' } },
      totalSales: { $sum: { $sum: '$items.price' } },
    },
  };

  const sortByMonth = { $sort: { '_id.month': 1 } };

  const currentYearSales = await Invoice.aggregate([
    matchCurrentYear,
    group,
    sortByMonth,
  ]);

  const lastYearSales = await Invoice.aggregate([matchLastYear, group, sortByMonth]);

  const months = Array.from({ length: 12 }, (_, i) => i + 1); 
  const salesData = months.map(month => {
    const currentYearSale = currentYearSales.find(sale => sale._id.month === month);
    const lastYearSale = lastYearSales.find(sale => sale._id.month === month);
    return {
      date: new Date(currentYear, month - 1, 1).toLocaleString('default', { month: 'short' }) + ' ' + currentYear.toString().slice(-2),
      'This Year': currentYearSale ? currentYearSale.totalSales : 0,
      'Last Year': lastYearSale ? lastYearSale.totalSales : 0,
    };
  });

  return salesData;
};