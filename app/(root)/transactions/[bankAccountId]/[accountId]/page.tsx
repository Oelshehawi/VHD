import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { getAccount, getAccounts } from "../../../../lib/actions/bank.actions";
import { SearchParamProps, Transaction } from "../../../../lib/typeDefinitions";
import TransactionsTable from "../../../../../_components/transactions/TransactionsTable";
import TransactionsHeader from "../../../../../_components/transactions/TransactionsHeader";
import AccountSelector from "../../../../../_components/transactions/AccountSelector";

interface TransactionsProps {
  params: {
    bankAccountId: string;
    accountId: string;
  };
  searchParams: {
    page?: string;
  };
}

const Transactions = async ({ params, searchParams }: TransactionsProps) => {
  const { bankAccountId, accountId } = params;
  const { page } = searchParams;
  const user: any = await currentUser();

  const accounts = await getAccounts({ userId: user.id });

  if (accounts?.data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-3xl font-bold">
        Connect your bank account to view transactions!
      </div>
    );
  }

  const accountsData = accounts?.data || [];

  const bankAccount = await getAccount({ bankAccountId });

  if (!bankAccount) {
    return (
      <div className="flex h-full items-center justify-center text-3xl font-bold">
        Bank not found!
      </div>
    );
  }

  const filteredTransactions = bankAccount.transactions.filter(
    (transaction: Transaction) => transaction.accountId === accountId,
  );

  const itemsPerPage = 10;
  const currentPage = Number(page) || 1;
  const totalPages = Math.ceil(
    (filteredTransactions.length || 0) / itemsPerPage,
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    endIndex,
  );

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-center gap-4">
        {accountsData.length <= 4 ? (
          <>
            <div className="hidden gap-2 sm:flex">
              {accountsData.map((bank) => (
                <Link
                  key={bank.id}
                  href={`/transactions/${bank.bankAccountId}/${bank.id}?page=1`}
                  className={`rounded-md border p-2 ${
                    accountId === bank.id
                      ? "bg-darkGreen text-white"
                      : "bg-white text-black"
                  }`}
                >
                  {bank.name} ({bank.mask})
                </Link>
              ))}
            </div>
            <div className="flex w-full sm:hidden">
              <AccountSelector
                accountsData={accountsData}
                accountId={accountId}
              />
            </div>
          </>
        ) : (
          <AccountSelector accountsData={accountsData} accountId={accountId} />
        )}
      </div>
      <TransactionsHeader
        account={
          accountsData.find((acc) => acc.id === accountId) || accountsData[0]
        }
      />
      <TransactionsTable
        transactions={paginatedTransactions}
        totalPages={totalPages}
      />
    </div>
  );
};

export default Transactions;
