"use server";
import { revalidatePath } from "next/cache";
import connectMongo from "../connect";
import {
  JobsDueSoon,
  Client,
  Invoice,
  Schedule,
  BankAccount,
} from "../../../models/reactDataSchema";
import { BankAccountType, ClientType } from "../typeDefinitions";
import { calculateDueDate, encryptId, parseStringify } from "../utils";
import { plaidClient } from "../plaid";
import {
  CountryCode,
  Products,
} from "plaid";

export async function updateInvoiceScheduleStatus(invoiceId) {
  await connectMongo();

  try {
    const updatedJob = await JobsDueSoon.findOneAndUpdate(
      { invoiceId },
      { $set: { isScheduled: true } },
      { new: true },
    );

    if (!updatedJob) {
      throw new Error("Invoice not found or update failed");
    }
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update invoice schedule status");
  }

  revalidatePath("/dashboard");
}

export async function deleteClient(clientId: string) {
  await connectMongo();
  try {
    const clientExists = await Client.exists({ _id: clientId });
    if (!clientExists) {
      return { message: "Client not found" };
    }

    const invoices = await Invoice.find({ clientId: clientId });

    await Invoice.deleteMany({ clientId: clientId });

    await JobsDueSoon.deleteMany({ clientId: clientId });

    for (const invoice of invoices) {
      await Schedule.deleteMany({ invoiceRef: invoice._id });
    }

    await Client.findByIdAndDelete(clientId);
  } catch (error) {
    console.error("Database Error:", error);
    return {
      message: "Database Error: Failed to delete client and associated data",
    };
  }
  revalidatePath("/database");
  revalidatePath("/dashboard");
}

export async function updateClient(clientId, formData) {
  await connectMongo();
  try {
    await Client.findByIdAndUpdate(clientId, formData);
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update client with id");
  }
  revalidatePath(`/database/${clientId}`);
}

export async function createClient(clientData: ClientType) {
  await connectMongo();
  try {
    const newClient = new Client(clientData);
    await newClient.save();
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to create client");
  }

  revalidatePath("/dashboard");
}

export async function deleteInvoice(invoiceId: string) {
  await connectMongo();
  try {
    const job = await JobsDueSoon.findOne({ invoiceId: invoiceId });
    if (job) {
      await JobsDueSoon.findByIdAndDelete(job._id);
    }
    const scheduledJob = await Schedule.findOne({ invoiceRef: invoiceId });
    if (scheduledJob) {
      await Schedule.findByIdAndDelete(scheduledJob._id);
    }
    await Invoice.findByIdAndDelete(invoiceId);
  } catch (error) {
    console.error("Database Error:", error);
    return {
      message: "Database Error: Failed to delete invoice and associated data",
    };
  }
  revalidatePath("/database");
  revalidatePath("/dashboard");
}

export async function createInvoice(invoiceData) {
  await connectMongo();
  try {
    // Find the invoice with the highest invoiceId for the client
    const latestInvoice = await Invoice.findOne({ clientId: invoiceData.clientId })
      .sort({ invoiceId: -1 })
      .exec();

    let newInvoiceNumber = 0; // Start at 0 for the first invoice (e.g., HUT-000)

    if (latestInvoice) {
      // Extract the numeric part from the latest invoiceId
      const latestNumber = parseInt(latestInvoice.invoiceId.split('-')[1], 10);
      newInvoiceNumber = latestNumber + 1;
    }

    const newInvoiceId = `${invoiceData.prefix}-${newInvoiceNumber.toString().padStart(3, "0")}`;

    const newInvoiceData = { ...invoiceData, invoiceId: newInvoiceId };

    const newInvoice = new Invoice(newInvoiceData);
    await newInvoice.save();
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to create invoice");
  }

  revalidatePath("/invoices");
}

export async function updateInvoice(invoiceId: any, formData: any) {
  await connectMongo();
  try {
    const currentInvoice = await Invoice.findById(invoiceId);

    await Invoice.findByIdAndUpdate(invoiceId, formData);

    let jobsDueSoonUpdate: any = {};

    if (
      formData.dateIssued &&
      formData.dateIssued !== currentInvoice?.dateIssued
    ) {
      const newDateDue = calculateDueDate(
        formData.dateIssued,
        formData.frequency,
      );
      jobsDueSoonUpdate.dateDue = newDateDue;
    }

    if (formData.jobTitle && formData.jobTitle !== currentInvoice?.jobTitle) {
      jobsDueSoonUpdate.jobTitle = formData.jobTitle;
    }

    if (Object.keys(jobsDueSoonUpdate).length > 0) {
      await JobsDueSoon.findOneAndUpdate(
        { invoiceId: invoiceId },
        jobsDueSoonUpdate,
      );
    }
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update invoice with id");
  }

  revalidatePath(`/invoices/${invoiceId}`);
}

export const createLinkToken = async (user: any) => {
  try {
    const tokenParams = {
      user: {
        client_user_id: user.id,
      },
      client_name: `${user.firstName} ${user.lastName}`,
      products: ["auth", "transactions"] as Products[],
      language: "en",
      country_codes: ["CA"] as CountryCode[],
    };

    const response = await plaidClient.linkTokenCreate(tokenParams);

    return parseStringify({ linkToken: response.data.link_token });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to create link token");
  }
};

export const createBankAccount = async ({
  userId,
  bankId,
  accountId,
  accessToken,
  shareableId,
}: BankAccountType) => {
  try {
    await connectMongo();

    const bankAccount = new BankAccount({
      userId,
      bankId,
      accountId,
      accessToken,
      shareableId,
    });

    const savedBankAccount = await bankAccount.save();

    return savedBankAccount.toObject();
  } catch (error) {
    console.error("Error creating bank account:", error);
    return null;
  }
};

export const exchangePublicToken = async ({
  publicToken,
  user,
}: {
  publicToken: string;
  user: any;
}) => {
  try {
    const exchangeTokenResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = exchangeTokenResponse.data.access_token;
    const itemId = exchangeTokenResponse.data.item_id;

    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accountData = accountsResponse.data.accounts[0];

    // const request: ProcessorStripeBankAccountTokenCreateRequest = {
    //   access_token: accessToken,
    //   account_id: accountData?.account_id ?? "",
    // };

    // const stripeTokenResponse =
    //   await plaidClient.processorStripeBankAccountTokenCreate(request);
    // const bankAccount = stripeTokenResponse.data.stripe_bank_account_token;

    await createBankAccount({
      userId: user.id,
      bankId: itemId,
      accountId: accountData?.account_id ?? "",
      accessToken,
      shareableId: encryptId(accountData?.account_id as string),
    });

    revalidatePath("/transactions");

    return parseStringify({ publicTokenExhange: "complete" });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to exchange public token");
  }
};

export const getBanks = async ({ userId }: { userId: string }) => {
  await connectMongo();
  try {
    const banks = await BankAccount.find({ userId }).exec();
    return banks.map((bank) => bank.toObject());
  } catch (error) {
    console.error("Error fetching banks:", error);
    return null;
  }
};

export const getBank = async ({ documentId }: { documentId: string }) => {
  await connectMongo();
  try {
    const bank = await BankAccount.findById(documentId).exec();
    return bank ? bank.toObject() : null;
  } catch (error) {
    console.error("Error fetching bank:", error);
    return null;
  }
};
