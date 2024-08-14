import Link from "next/link";

const TransactionHistory = ({ invoices }: { invoices: any }) => {
  return (
    <div className="mb-2 w-full px-2 md:w-1/2 lg:mb-0">
      <div className="rounded border shadow">
        <div className="border-b px-4 py-2 text-xl ">Transaction History</div>
        <div className="p-4">
          {invoices.length !== 0 ? (
            <ul className="space-y-2">
              {invoices.map((invoice: any) => (
                <li
                  key={invoice._id}
                  className="cursor-pointer rounded border p-2 hover:bg-gray-100"
                >
                  <Link href={`/invoices/${invoice._id}`}>
                    #{invoice.invoiceId} - {invoice.jobTitle}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-2 text-center">No invoices for this client</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
