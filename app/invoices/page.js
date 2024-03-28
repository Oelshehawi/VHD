import InvoiceContainer from '../../components/invoices/InvoiceContainer';
import { fetchAllClients, fetchAllInvoices } from '../lib/data';

const Invoice = async () => {
  const invoiceData = await fetchAllInvoices();
  const clients = await fetchAllClients();

  return (
    <div className='flex items-center justify-center min-h-full'>
      <InvoiceContainer
        invoiceData={invoiceData}
        clients={clients}
      />
    </div>
  );
};

export default Invoice;

export const Head = () => <title>VHD</title>;
