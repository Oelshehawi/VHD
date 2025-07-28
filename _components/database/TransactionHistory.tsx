import Link from "next/link";
import { FaFileInvoice, FaEye, FaCalendar } from "react-icons/fa";

const TransactionHistory = ({ invoices }: { invoices: any }) => {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Paid";
      case "overdue":
        return "Overdue";
      default:
        return "Pending";
    }
  };

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 ">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <FaFileInvoice className="h-5 w-5 text-green-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
            <p className="text-sm text-gray-500">
              {invoices.length} {invoices.length === 1 ? 'invoice' : 'invoices'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-6 h-[500px] overflow-y-auto">
        {invoices.length !== 0 ? (
          <div className="space-y-3">
            {invoices.map((invoice: any) => (
              <Link 
                key={invoice._id}
                href={`/invoices/${invoice._id}`}
                className="block group"
              >
                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 group-hover:bg-blue-100">
                      <FaFileInvoice className="h-4 w-4 text-gray-600 group-hover:text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 group-hover:text-blue-900">
                        #{invoice.invoiceId}
                      </p>
                      <p className="text-sm text-gray-500 truncate max-w-xs">
                        {invoice.jobTitle}
                      </p>
                      {invoice.dateIssued && (
                        <div className="flex items-center mt-1 text-xs text-gray-400">
                          <FaCalendar className="mr-1 h-3 w-3" />
                          {new Date(invoice.dateIssued).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {invoice.status && (
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusStyles(invoice.status)}`}>
                        {getStatusText(invoice.status)}
                      </span>
                    )}
                    <FaEye className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="flex justify-center mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                <FaFileInvoice className="h-6 w-6 text-gray-400" />
              </div>
            </div>
            <p className="text-gray-500 font-medium">No invoices found</p>
            <p className="text-sm text-gray-400 mt-1">
              This client doesn't have any invoices yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
