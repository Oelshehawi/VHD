import axios from 'axios'
import connectMongo from '../lib/connect'
import { unstable_noStore as noStore } from 'next/cache';
import { Client, Invoice } from '../../models/reactDataSchema';

export const fetchDueInvoices = async () => {
    
}

export const getClientCount = async () => {
    await connectMongo();
    noStore();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
        const count = await Client.countDocuments()
        return count;
    } catch (error) {
        console.error("Database Error:",error)
        Error("Failed to fetch client count")
    }
}

export const getOverDueInvoiceAmount = async () => {
    await connectMongo();
    noStore();
    try {
        const count = await Invoice.countDocuments({status: "overdue"})
        return count;
    } catch (error) {
        console.error("Database Error:",error)
        Error("Failed to fetch overdue invoice count")
    }
}

export const getPendingInvoiceAmount = async () => {
    await connectMongo();
    noStore();
    try {
        const count = await Invoice.countDocuments({status: "overdue"})
        return count;
    } catch (error) {
        console.error("Database Error:",error)
        Error("Failed to fetch overdue invoice count")
    }
}