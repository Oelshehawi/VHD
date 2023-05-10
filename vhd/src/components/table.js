import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  useReactTable,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import DownloadInvoice from "./DownloadInvoice";
import ClientModalDetailed from "./ClientModalDetailed";

const Table = ({ filter }) => {
  // data fetched from MongoDB
  const [clientData, setclientData] = useState([]);

  const [globalFilter, setglobalFilter] = useState("");

  const [modal, setmodal] = useState(false);

  const [selectedrow, setselectedrow] = useState([]);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:4000/api/Clients/")
      .then((res) => setclientData(res.data))
      .catch((err) => console.error(err));
  }, []);

  const columnHelper = createColumnHelper();

  const columns = [
    columnHelper.accessor("jobTitle", {
      size: 5500,
      cell: (info, row) => (
        <>
          <div className="jobTitle">{info.getValue()}</div>
        </>
      ),
    }),
    columnHelper.accessor("date", {
      size: 500,
      cell: (info) => {
        const value = info.getValue();
        if (value) {
          return <div className="dateValue">{value.split("T")[0]}</div>;
        }
      },
    }),
    columnHelper.accessor("_id", {
      size: 500,
      cell: (info) => (
        <div className="invoice">
          <DownloadInvoice size="2x" fileId={info.getValue()} />
        </div>
      ),
    }),
  ];

  //React table data initialization
  const data = React.useMemo(() => clientData, [clientData]);

  const memoizedFilter = useMemo(() => filter, [filter]);

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
    },
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setglobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
  });

  useEffect(() => {
    setglobalFilter(memoizedFilter ?? "");
  }, [memoizedFilter, setglobalFilter]);

  return (
    <>
      <table>
        <thead>
          {/* Looping through Header Groups and choosing what react should render*/}
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              onClick={() => {
                setmodal(true);
                setselectedrow(row._valuesCache._id);
              }}
              key={row.id}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  style={{
                    width:
                      cell.column.getSize() !== 0
                        ? cell.column.getSize()
                        : undefined,
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <ClientModalDetailed
        open={modal}
        data={selectedrow}
        clientData={clientData}
        onClose={() => {
          setmodal(false);
        }}
      />
    </>
  );
};

export default Table;
