import {
  Transaction,
  TransactionTableProps,
} from "../../app/lib/typeDefinitions";
import {
  cn,
  formatAmount,
  formatDateTime,
  getTransactionStatus,
  removeSpecialCharacters,
} from "../../app/lib/utils";
import { transactionCategoryStyles } from "../../constants";
import Pagination from "../database/Pagination";

const TransactionsTable = ({
  transactions,
  totalPages,
}: TransactionTableProps & { totalPages: number }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="min-h-[80%] min-w-[100%] max-w-[50%] overflow-auto rounded ">
        <table className="w-full text-left">
          <thead className="bg-darkGreen text-white">
            <tr>
              <th className="px-4 py-3 capitalize">Transaction</th>
              <th className="px-4 py-3 capitalize">Amount</th>
              <th className="px-4 py-3 capitalize">Status</th>
              <th className="px-4 py-3 capitalize">Date</th>
              <th className="px-4 py-3 capitalize">Channel</th>
              <th className="px-4 py-3 capitalize">Category</th>
            </tr>
          </thead>
          <tbody className="font-bold">
            {transactions.map((t: Transaction) => {
              const status = {
                confidence_level: "high", 
                detailed: getTransactionStatus(new Date(t.date)),
                primary: getTransactionStatus(new Date(t.date)),
              };
              const amount = formatAmount(t.amount);

              const isDebit = t.type === "debit";
              const isCredit = t.type === "credit";

              return (
                <tr
                  key={t.id}
                  className={`${isDebit || amount[0] === "-" ? "bg-[#FFFBFA]" : "bg-[#F6FEF9]"} !over:bg-none !border-b-DEFAULT`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <h1 className="text-14 truncate font-semibold text-[#344054]">
                        {removeSpecialCharacters(t.name)}
                      </h1>
                    </div>
                  </td>

                  <td
                    className={`p-4 font-semibold ${
                      isDebit || amount[0] === "-"
                        ? "text-[#f04438]"
                        : "text-[#039855]"
                    }`}
                  >
                    {isDebit ? `-${amount}` : isCredit ? amount : amount}
                  </td>

                  <td className="p-4">
                    <CategoryBadge category={status.primary} />
                  </td>

                  <td className="min-w-32 p-4">
                    {formatDateTime(new Date(t.date)).dateTime}
                  </td>

                  <td className="min-w-24 p-4 capitalize">
                    {t.paymentChannel}
                  </td>

                  <td className="p-4 ">
                    <CategoryBadge category={t.category?.primary} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination totalPages={totalPages} />
    </div>
  );
};

const CategoryBadge = ({
  category,
}: {
  category: string
}) => {
  const { borderColor, backgroundColor, textColor, chipBackgroundColor } =
    transactionCategoryStyles[
      category as keyof typeof transactionCategoryStyles
    ] || transactionCategoryStyles.default;

  return (
    <div className={cn("category-badge", borderColor, chipBackgroundColor)}>
      <div className={cn("size-2 rounded-full", backgroundColor)} />
      <p className={cn("text-[12px] font-medium", textColor)}>
        {category}
      </p>
    </div>
  );
};


export default TransactionsTable;
