"use server";

import { CountryCode } from "plaid";

import { plaidClient } from "../plaid";

import { getTransactionsByBankId } from "./transaction.actions";
import { getBank, getBanks } from "./actions";

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

    // Get transfer transactions from MongoDB
    const transferTransactionsData = await getTransactionsByBankId({
      bankId: bank._id.toString(),
    });

    const transferTransactions = transferTransactionsData?.documents.map(
      (transferData: any) => ({
        id: transferData._id,
        name: transferData.name || "",
        amount: transferData.amount || 0,
        date: transferData.createdAt,
        paymentChannel: transferData.channel,
        category: transferData.category,
        type:
          transferData.senderBankId === bank._id.toString()
            ? "debit"
            : "credit",
      }),
    );

    // Get institution info from Plaid
    const institution = await getInstitution({
      institutionId: accountsResponse.data.item.institution_id!,
    });

    // Get transactions from Plaid
    const transactions = await getTransactions({
      accessToken: bank.accessToken,
    });

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

    // Combine and sort transactions
    const allTransactions = [
      ...transactions,
      ...(transferTransactions || []),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      data: account,
      transactions: allTransactions,
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

// Get transactions
export const getTransactions = async ({
  accessToken,
}: {
  accessToken: string;
}) => {
  let hasMore = true;
  let transactions: any[] = [];

  try {
    // Iterate through each page of new transaction updates for item
    while (hasMore) {
      const response = await plaidClient.transactionsSync({
        access_token: accessToken,
      });

      const data = response.data;

      const newTransactions = data.added.map((transaction) => ({
        id: transaction.transaction_id,
        name: transaction.name,
        paymentChannel: transaction.payment_channel,
        type: transaction.payment_channel,
        accountId: transaction.account_id,
        amount: transaction.amount,
        pending: transaction.pending,
        category: transaction.personal_finance_category
          ? transaction.personal_finance_category
          : "",
        date: transaction.date,
        image: transaction.logo_url,
      }));

      transactions = transactions.concat(newTransactions);

      hasMore = data.has_more;
    }

    return transactions;
  } catch (error) {
    console.error("An error occurred while getting the transactions:", error);
    return [];
  }
};
