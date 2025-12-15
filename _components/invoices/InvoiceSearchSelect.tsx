import { useState, useEffect } from "react";
import { clsx } from "clsx";
import { InvoiceType, ScheduleType } from "../../app/lib/typeDefinitions";
import { FaSearch } from "react-icons/fa";
import { formatDateToString } from "../../app/lib/utils";

const InvoiceSearchSelect = ({
  placeholder,
  data,
  className,
  onSelect,
  register,
  error,
}: {
  placeholder: string;
  data: InvoiceType[];
  className?: string;
  onSelect: (invoice: ScheduleType) => void;
  register: any;
  error: any;
}) => {
  const [filteredData, setFilteredData] = useState<InvoiceType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [OpenDropdown, setOpenDropdown] = useState(false);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setOpenDropdown(true);
    if (term) {
      const filtered = data.filter(
        (invoice) =>
          invoice.jobTitle.toLowerCase().includes(term.toLowerCase()) ||
          invoice.dateIssued
            .toString()
            .toLowerCase()
            .includes(term.toLowerCase()),
      );
      setFilteredData(filtered);
    } else {
      setOpenDropdown(false);
    }
  };

  const handleSelect = (invoice: ScheduleType) => {
    setSearchTerm(invoice.jobTitle as string);
    setOpenDropdown(false);
    onSelect(invoice);
  };

  return (
    <div
      className={clsx("relative flex w-full flex-col gap-3 py-2", className)}
    >
      <div className="group flex w-full rounded-lg shadow-custom">
        <FaSearch className="size-10 rounded-l-lg bg-black-2 p-2 text-gray-400 group-focus-within:text-gray-600" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          {...register("invoiceRef", { required: true })}
          onChange={(e) => {
            register("invoiceRef").onChange(e);
            handleSearch(e.target.value);
          }}
          className="h-10 w-full grow rounded-e-lg pl-5 focus:outline-none "
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500">Invoice is required</p>
      )}
      {OpenDropdown && (
        <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-md bg-white shadow-lg">
          <ul className="max-h-60 overflow-y-auto">
            {filteredData.map((invoice: any) => {
              return (
                <li
                  key={invoice._id.toString()}
                  className="flex cursor-pointer items-center justify-between gap-2 px-4 py-2 hover:border-s-2 hover:border-darkGreen hover:bg-gray-200"
                  onClick={() => handleSelect(invoice)}
                >
                  <div className="flex items-center gap-2">
                    <span>{invoice.jobTitle}</span>
                  </div>
                  <div className="text-right">
                    <span>{formatDateToString(invoice.dateIssued)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default InvoiceSearchSelect;
