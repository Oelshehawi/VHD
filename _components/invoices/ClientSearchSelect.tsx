import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { FaSearch } from "react-icons/fa";
import { ClientType } from "../../app/lib/typeDefinitions";

const ClientSearchSelect = ({
  placeholder,
  data,
  className,
  onSelect,
  register,
  error,
  resetKey
  
}: {
  placeholder: string;
  data: ClientType[];
  className?: string;
  onSelect: (client: ClientType) => void;
  register: any;
  error: any;
  resetKey: number;
}) => {
  const [filteredData, setFilteredData] = useState<ClientType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [OpenDropdown, setOpenDropdown] = useState(false);

  useEffect(() => {
    setSearchTerm("");
    setFilteredData([]);
    setOpenDropdown(false);
  }, [resetKey]);


  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setOpenDropdown(true);
    if (term) {
      const filtered = data.filter(
        (client) =>
          client.clientName.toLowerCase().includes(term.toLowerCase()) ||
          client.email.toLowerCase().includes(term.toLowerCase()),
      );
      setFilteredData(filtered);
    } else {
      setOpenDropdown(false);
    }
  };

  const handleSelect = (client: ClientType) => {
    setSearchTerm(client.clientName);
    setOpenDropdown(false);
    onSelect(client);
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
          {...register("clientId", { required: true })}
          onChange={(e) => {
            register("clientId").onChange(e);
            handleSearch(e.target.value);
          }}
          className="h-10 w-full grow rounded-e-lg pl-5 focus:outline-none "
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">Client is required</p>}
      {OpenDropdown && (
        <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-md bg-white shadow-lg">
          <ul className="max-h-60 overflow-y-auto">
            {filteredData.map((client: any) => (
              <li
                key={client._id.toString()}
                className="flex cursor-pointer items-center justify-between gap-2 px-4 py-2 hover:border-s-2 hover:border-darkGreen hover:bg-gray-200"
                onClick={() => handleSelect(client)}
              >
                <div className="flex items-center gap-2">
                  <span>{client.clientName}</span>
                </div>
                <div className="text-right">
                  <span>{client.email}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ClientSearchSelect;
