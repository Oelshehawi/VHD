import InvoiceContainer from '../../components/invoices/invoiceContainer';
import { fetchAllInvoices } from '../lib/data';

const Invoice = async () => {
  const invoiceData = await fetchAllInvoices();

  return (
    <div className='flex items-center justify-center min-h-full'>
      <InvoiceContainer
        invoiceData={invoiceData}
      />
    </div>
  );
};

export default Invoice;

export const Head = () => <title>VHD</title>;
