"use server";

import { Transaction } from "../../../models/reactDataSchema";

export const createTransaction = async (transactionData: any) => {
  try {
    const transaction = new Transaction({
      channel: "online",
      category: "Transfer",
      ...transactionData,
    });

    const newTransaction = await transaction.save();
    return newTransaction.toObject();
  } catch (error) {
    console.error("Error creating transaction:", error);
    return null;
  }
};

export const getTransactionsByBankId = async ({
  bankId,
}: {
  bankId: string;
}) => {
  try {
    const transactions = await Transaction.find({
      $or: [{ senderBankId: bankId }, { receiverBankId: bankId }],
    }).exec();

    return {
      total: transactions.length,
      documents: transactions.map((tx) => tx.toObject()),
    };
  } catch (error) {
    console.error("Error fetching transactions by bankId:", error);
    return null;
  }
};
