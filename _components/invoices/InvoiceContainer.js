"use client";
import { useState } from "react";
import InvoiceTable from "./InvoiceTable";
import AddInvoice from "./AddInvoice";

const InvoiceContainer = ({ invoiceData, clients }) => {
  const [openModal, setopenModal] = useState(false);

  return (
    <div className="my-5 min-h-[90vh] w-[90%] rounded-lg bg-white p-4 shadow-lg lg:my-0 lg:w-4/5">
      <AddInvoice
        clients={clients}
        show={openModal}
        onHide={() => setopenModal(false)}
      />
      <div className="my-2 flex flex-row items-center justify-between">
        <div className="fw-bold text-xl">Invoices</div>
        <button
          onClick={() => setopenModal(true)}
          className="h-full rounded bg-darkGreen px-4 py-2 font-bold text-white shadow-sm hover:bg-darkBlue"
        >
          {"Add Invoice"}
        </button>
      </div>
      <div className="">
        {invoiceData && <InvoiceTable invoiceData={invoiceData} />}
      </div>
    </div>
  );
};

export default InvoiceContainer;
