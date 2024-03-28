import { Suspense } from 'react';
import InvoiceDetailsContainer from '../../../components/invoices/InvoiceDetailsContainer';
import { InvoiceDetailedSkeleton } from '../../../components/Skeletons';
import { fetchClientById, fetchInvoiceById } from '../../lib/data';

const InvoiceDetailed = async ({ params }) => {
  const invoiceId = params.id;
  const invoice = await fetchInvoiceById(invoiceId);
  const client = await fetchClientById(invoice.clientId);

  return (
    <>
      <div className='mt-4 px-3 lg:!px-5'>
        <Suspense fallback={<InvoiceDetailedSkeleton />}>
          <InvoiceDetailsContainer invoice={invoice} client={client} />
        </Suspense>
      </div>
    </>
  );
};

export default InvoiceDetailed;
