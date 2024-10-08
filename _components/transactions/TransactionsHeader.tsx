import { formatAmount } from "../../app/lib/utils";

const TransactionsHeader = ({ account }: any) => {
  return (
    <div className="transactions">
      <div className="space-y-6">
        <div className="transactions-account">
          <div className="flex flex-col gap-2">
            <h2 className="text-18 font-bold text-white">{account?.name}</h2>
            <p className="text-14 text-blue-25">{account?.officialName}</p>
            <p className="text-14 font-semibold tracking-[1.1px] text-white">
              ●●●● ●●●● ●●●● {account?.mask}
            </p>
          </div>

          <div className="transactions-account-balance">
            <p className="text-14">Current balance</p>
            <p className="text-24 text-center font-bold">
              {formatAmount(account?.currentBalance)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsHeader;
