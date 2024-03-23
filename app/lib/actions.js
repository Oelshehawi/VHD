'use server';
import { revalidatePath } from 'next/cache';
import connectMongo from './connect';
import { JobsDueSoon } from '../../models/reactDataSchema';

export async function updateInvoiceScheduleStatus(invoiceId) {
    await connectMongo();

    try {
      const updatedJob = await JobsDueSoon.findOneAndUpdate(
        { invoiceId },
        { $set: { isScheduled: true } },
        { new: true }
      );
  
      if (!updatedJob) {
        throw new Error('Invoice not found or update failed');
      }
    } catch (error) {
      console.error('Database Error:', error);
      throw new Error('Failed to update invoice schedule status');
    }
  
    revalidatePath('/dashboard');
  }
  