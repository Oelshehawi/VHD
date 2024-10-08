import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getAccounts } from "../../lib/actions/bank.actions";

const TransactionsRedirect = async () => {
  const user: any = await currentUser();
  const accounts = await getAccounts({ userId: user.id });

  if (accounts?.data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-3xl font-bold">
        Connect your bank account to view transactions!
      </div>
    );
  }

  const firstAccount = accounts?.data[0];

  redirect(`/transactions/${firstAccount?.bankAccountId}/${firstAccount?.id}`);
};

export default TransactionsRedirect;
