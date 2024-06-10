import { ObjectId } from "mongodb";
import { Date } from "mongoose";

export interface ScheduleType {
  _id: ObjectId | string;
  invoiceRef: ObjectId | string;
  jobTitle: string | undefined;
  location: string;
  startDateTime: Date | string;
};

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
  dateIssued: Date;
  dateDue: Date;
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
