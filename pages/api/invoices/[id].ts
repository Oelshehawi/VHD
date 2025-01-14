import { NextApiRequest, NextApiResponse } from "next";
import { Invoice } from "../../../models/reactDataSchema";
import connectMongo from "../../../app/lib/connect";
import { getAuth } from "@clerk/nextjs/server";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  console.log("🔥 Invoice API called");

  const { userId, orgPermissions } = getAuth(req);
  const canManage = orgPermissions?.includes("org:database:allow") ?? false;

  console.log("👤 User ID:", userId, "Can Manage:", canManage);

  if (!userId) {
    console.log("❌ Unauthorized - No user ID");
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;

  try {
    console.log("📡 Connecting to MongoDB...");
    await connectMongo();
    console.log("✅ Connected to MongoDB");

    const invoice = await Invoice.findOne({ _id: id }).lean();

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const formattedItems = (items: any[]) =>
      items.map((item) => ({
        description: item.description,
        price: parseFloat(item.price) || 0,
      }));

    // Transform the invoice data
    const transformedInvoice = {
      _id: invoice._id.toString(),
      invoiceId: invoice.invoiceId,
      jobTitle: invoice.jobTitle,
      // @ts-ignore
      dateIssued: invoice.dateIssued.toISOString(),
      // @ts-ignore
      dateDue: invoice.dateDue.toISOString(),
      items: formattedItems(invoice.items),
      frequency: invoice.frequency,
      location: invoice.location,
      notes: invoice.notes,
      status: invoice.status,
      clientId: invoice.clientId.toString(),
      signature: invoice.signature || null,
      photos: invoice.photos || { before: [], after: [] },
    };

    res.status(200).json(transformedInvoice);
  } catch (error) {
    console.error("💥 Error in invoice API:", error);
    res.status(500).json({ error: "Error fetching invoice" });
  }
}
