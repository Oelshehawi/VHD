import { NextApiRequest, NextApiResponse } from "next";
import connectMongo from "../../../app/lib/connect";
import { Invoice } from "../../../models/reactDataSchema";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Extract the invoiceId, datePaid, and notes from request body
    const { invoiceId, datePaid, notes } = req.body;

    // Validate inputs
    if (!invoiceId) {
      return res.status(400).json({ message: "Invoice ID is required" });
    }

    // Connect to the database
    await connectMongo();

    // Prepare payment info update
    const paymentInfo = {
      method: "cheque" as const,
      datePaid: datePaid ? new Date(datePaid) : new Date(),
      notes: notes || undefined,
    };

    // Update the invoice with cheque payment info and mark as paid
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      invoiceId,
      {
        status: "paid",
        paymentInfo,
      },
      { new: true, runValidators: true },
    );

    // Check if invoice exists
    if (!updatedInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Return success response
    return res.status(200).json({
      message: "Cheque marked as paid successfully",
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error("Error marking cheque as paid:", error);
    return res.status(500).json({
      message: "Failed to mark cheque as paid",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
