import { ObjectId } from "mongodb";

export interface ScheduleType {
  _id: ObjectId | string;
  invoiceRef: ObjectId | string;
  jobTitle: string | undefined;
  location: string;
  startDateTime: Date | string;
  assignedTechnician: string;
  confirmed: boolean;
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
  dateDue: Date| string;
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
