import { ObjectId } from "mongodb";
import { Types } from "mongoose";

export type SearchParamProps = {
  params: { [key: string]: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export type Transaction = {
  id: string;
  name: string;
  paymentChannel: string;
  type: string;
  accountId: string;
  amount: number;
  pending: boolean;
  category: {
    confidence_level: string;
    detailed: string;
    primary: string;
  };
  date: string;
  image: string;
  $createdAt: string;
  channel: string;
  senderBankId: string;
  receiverBankId: string;
};

export interface TransactionTableProps {
  transactions: Transaction[];
}

export interface TransactionHistoryTableProps {
  transactions: Transaction[];
  page: number;
}

export interface ScheduleType {
  _id: ObjectId | string;
  invoiceRef: ObjectId | string;
  jobTitle: string | undefined;
  location: string;
  startDateTime: Date | string;
  assignedTechnician: string;
  confirmed: boolean;
}

export interface BankAccountType {
  userId: string;
  bankId: string;
  accountId: string;
  accessToken: string;
  shareableId: string;
  cursor: string | null;
}

export type NewDwollaCustomerParams = {
  firstName: string;
  lastName: string;
  email: string;
  type: string;
  address1: string;
  city: string;
  state: string;
  postalCode: string;
  dateOfBirth: string;
  ssn: string;
};

export interface TransactionType {

  transactionId: string; // Added this line

  bankAccountId: string;

  id?: string;

  $id?: string;

  name?: string;

  paymentChannel?: string;

  type?: string;

  accountId?: string;

  amount?: number;

  pending?: boolean;

  category?: {

    confidence_level?: string;

    detailed?: string;

    primary?: string;

  };

  date?: string;

  image?: string;

  $createdAt?: string;

  channel?: string;

}

export interface ClientType {
  _id: ObjectId | string;
  clientName: string;
  email: string;
  phoneNumber: string;
  prefix: string;
  notes: string;
}

export interface InvoiceType {
  _id: ObjectId | string;
  invoiceId: string;
  jobTitle: string;
  dateIssued: Date | string | number;
  dateDue: Date | string;
  items: {
    description: string;
    price: number;
  }[];
  frequency: number;
  location: string;
  notes?: string;
  status: "pending" | "overdue" | "paid";
  clientId: ObjectId | string;
}

export interface InvoiceItem {
  description: string;
  price: number;
  total: number;
}

export interface InvoiceData {
  invoiceId: string;
  dateIssued: string;
  jobTitle: string;
  location: string;
  clientName: string;
  email: string;
  phoneNumber: string;
  items: InvoiceItem[];
  subtotal: number;
  gst: number;
  totalAmount: number;
  cheque: string;
  eTransfer: string;
  terms: string;
  thankYou: string;
}

export interface DueInvoiceType {
  emailExists: any;
  _id: ObjectId | string;
  invoiceId: string;
  jobTitle: string;
  dateDue: Date;
  isScheduled: boolean;
  emailSent: boolean;
  clientId: ObjectId | string;
  notesExists: any;
}
