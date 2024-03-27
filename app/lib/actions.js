'use server';
import { revalidatePath } from 'next/cache';
import connectMongo from './connect';
import { JobsDueSoon, Client, Invoice } from '../../models/reactDataSchema';

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

export async function deleteClient(clientId) {
  await connectMongo();
  try {
    const clientExists = await Client.exists({ _id: clientId });
    if (!clientExists) {
      return { message: 'Client not found' };
    }

    await Invoice.deleteMany({ clientId: clientId });

    await JobsDueSoon.deleteMany({ clientId: clientId });

    await Client.findByIdAndDelete(clientId);
  } catch (error) {
    console.error('Database Error:', error);
    return {
      message: 'Database Error: Failed to delete client and associated data',
    };
  }
  revalidatePath('/database');
  revalidatePath('/dashboard');
}

export async function updateClient(clientId, formData) {
  await connectMongo();
  try {
    await Client.findByIdAndUpdate(clientId, formData);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to update client with id');
  }
  revalidatePath(`/database/${clientId}`);
}

export async function createClient(clientData) {
  await connectMongo();
  try {
    const newClient = new Client(clientData);
    await newClient.save();
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to create client');
  }

  revalidatePath('/dashboard');
}


export async function deleteInvoice(invoiceId) {
  await connectMongo();
  try {
    await Invoice.findByIdAndDelete(invoiceId);
  } catch (error) {
    console.error('Database Error:', error);
    return {
      message: 'Database Error: Failed to delete invoice and associated data',
    };
  }
  revalidatePath('/database');
  revalidatePath('/dashboard');
}

export async function updateInvoice(invoiceId, formData) {
  await connectMongo();
  try {
    await Invoice.findByIdAndUpdate(invoiceId, formData);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to update invoice with id');
  }
  revalidatePath(`/database/${invoiceId}`);
}