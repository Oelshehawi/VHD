"use server";

import { CountryCode } from "plaid";

import { plaidClient } from "../plaid";

import { getBank, getBanks } from "./actions";
import { BankAccount, Transaction } from "../../../models/reactDataSchema";

// Get multiple bank accounts
export const getAccounts = async ({ userId }: { userId: string }) => {
  try {
    const banks = await getBanks({ userId });

    if (!banks) {
      throw new Error("No banks found for the user.");
    }

    let count = 0;

    // Gather all accounts for all linked banks
    const accounts = await Promise.all(
      banks.map(async (bank) => {
        // Get account info from Plaid
        const accountsResponse = await plaidClient.accountsGet({
          access_token: bank.accessToken,
        });

        // Map through all accounts returned by Plaid for the current bank
        const institution = await getInstitution({
          institutionId: accountsResponse.data.item.institution_id!,
        });

        return accountsResponse.data.accounts.map((accountData) => ({
          id: accountData.account_id,
          availableBalance: accountData.balances.available!,
          currentBalance: accountData.balances.current!,
          institutionId: institution?.institution_id,
          name: accountData.name,
          officialName: accountData.official_name,
          mask: accountData.mask!,
          type: accountData.type as string,
          subtype: accountData.subtype! as string,
          bankAccountId: bank._id.toString(),
          shareableId: bank.shareableId,
        }));
      }),
    );

    const allAccounts = accounts.flat();

    const totalBanks = allAccounts.length;
    const totalCurrentBalance = allAccounts.reduce((total, account) => {
      return total + account.currentBalance;
    }, 0);

    return {
      data: allAccounts,
      totalBanks,
      totalCurrentBalance,
    };
  } catch (error) {
    console.error("An error occurred while getting the accounts:", error);
  }
};

// Get one bank account
export const getAccount = async ({
  bankAccountId,
}: {
  bankAccountId: string;
}) => {
  try {
    // Get bank from MongoDB
    const bank = await getBank({ documentId: bankAccountId });

    if (!bank) {
      throw new Error("Bank not found.");
    }

    // Get account info from Plaid
    const accountsResponse = await plaidClient.accountsGet({
      access_token: bank.accessToken,
    });

    const accountData = accountsResponse.data.accounts[0];

    // Get institution info from Plaid
    const institution = await getInstitution({
      institutionId: accountsResponse.data.item.institution_id!,
    });

    // Retrieve the stored cursor from the database
    const storedCursor = bank.cursor || null;

    // Fetch new transactions using the stored cursor
    const { added, modified, removed, cursor: newCursor } = await getTransactions({
      accessToken: bank.accessToken,
      cursor: storedCursor,
    });

    // Update the stored cursor in the database
    await updateBankCursor(bank._id.toString(), newCursor);

    // Save new transactions to the database
    await saveTransactionsToDatabase(added, bank._id.toString());

    // Update modified transactions in the database
    await saveTransactionsToDatabase(modified, bank._id.toString());

    // Remove deleted transactions from the database
    await removeDeletedTransactionsFromDatabase(removed);

    // Retrieve all transactions from the database
    const allTransactions = await getAllTransactionsFromDatabase(bank._id.toString());

    // Combine with transfer transactions if needed
    // Assuming transferTransactions are stored separately
    // const transferTransactions = await getTransferTransactions(bank._id.toString());

    // const combinedTransactions = [
    //   ...allTransactions,
    //   ...(transferTransactions || []),
    // ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const combinedTransactions = allTransactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const account = {
      id: accountData?.account_id,
      availableBalance: accountData?.balances.available!,
      currentBalance: accountData?.balances.current!,
      institutionId: institution?.institution_id,
      name: accountData?.name,
      officialName: accountData?.official_name,
      mask: accountData?.mask!,
      type: accountData?.type as string,
      subtype: accountData?.subtype! as string,
      bankAccountId: bank._id.toString(),
    };

    return {
      data: account,
      transactions: combinedTransactions,
    };
  } catch (error) {
    console.error("An error occurred while getting the account:", error);
    return null;
  }
};


// Get bank info
export const getInstitution = async ({
  institutionId,
}: {
  institutionId: string;
}) => {
  try {
    const institutionResponse = await plaidClient.institutionsGetById({
      institution_id: institutionId,
      country_codes: ["US"] as CountryCode[],
    });

    const institution = institutionResponse.data.institution;

    return institution;
  } catch (error) {
    console.error("An error occurred while getting the institution:", error);
    return null;
  }
};

const mapPlaidTransaction = (transaction) => ({
  transactionId: transaction.transaction_id,
  id: transaction.transaction_id,
  $id: transaction.transaction_id,
  name: transaction.name,
  paymentChannel: transaction.payment_channel,
  type: transaction.transaction_type,
  accountId: transaction.account_id,
  amount: transaction.amount,
  pending: transaction.pending,
  category: {
    confidence_level: transaction.personal_finance_category?.confidence_level || "",
    detailed: transaction.personal_finance_category?.detailed || "",
    primary: transaction.personal_finance_category?.primary || "",
  },
  date: transaction.date,
  image: transaction.merchant_name || "", // Assuming merchant_name corresponds to image
  channel: transaction.payment_channel,
  $createdAt: new Date().toISOString(), // You can adjust this if needed
});

export const getTransactions = async ({
  accessToken,
  cursor,
}: {
  accessToken: string;
  cursor: string | null;
}) => {
  let hasMore = true;
  let added: any[] = [];
  let modified: any[] = [];
  let removed: any[] = [];
  let newCursor = cursor;
  try {
    while (hasMore) {
      const response = await plaidClient.transactionsSync({
        access_token: accessToken,
        cursor: newCursor || undefined,
      });

      const data = response.data;

      // Map transactions to your Transaction type
      const mappedAdded = data.added.map((transaction) => mapPlaidTransaction(transaction));
      const mappedModified = data.modified.map((transaction) => mapPlaidTransaction(transaction));

      added = added.concat(mappedAdded);
      modified = modified.concat(mappedModified);
      removed = removed.concat(data.removed);

      newCursor = data.next_cursor;
      hasMore = data.has_more;
    }

    return {
      added,
      modified,
      removed,
      cursor: newCursor,
    };
  } catch (error) {
    console.error("An error occurred while getting the transactions:", error);
    return {
      added: [],
      modified: [],
      removed: [],
      cursor: newCursor,
    };
  }
};


export const updateBankCursor = async (bankId: string, newCursor: string) => {
  await BankAccount.findByIdAndUpdate(bankId, { cursor: newCursor });
};

export const saveTransactionsToDatabase = async (
  transactions: any[],
  bankAccountId: string,
) => {
  for (const transaction of transactions) {
    // Check if the transaction already exists
    const existingTransaction = await Transaction.findOne({
      transactionId: transaction.transactionId,
    });

    if (existingTransaction) {
      // Update existing transaction
      await Transaction.updateOne(
        { transactionId: transaction.transactionId },
        {
          $set: transaction,
        },
      );
    } else {
      // Create new transaction
      await Transaction.create({
        ...transaction,
        bankAccountId,
      });
    }
  }
};


export const removeDeletedTransactionsFromDatabase = async (
  removedTransactions: any[],
) => {
  const transactionIds = removedTransactions.map((t) => t.transaction_id);
  await Transaction.deleteMany({ transactionId: { $in: transactionIds } });
};

export const getAllTransactionsFromDatabase = async (
  bankAccountId: string,
) => {
  const transactions = await Transaction.find({ bankAccountId }).lean();
  return transactions;
};