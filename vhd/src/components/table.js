import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTable, useGlobalFilter } from "react-table";
import DownloadInvoice from "./downloadInvoice";
import { FaSearch } from "react-icons/fa";

const Table = () => {
  // data fetched from MongoDB
  const [clientData, setclientData] = useState([]);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:4000/api/Clients/")
      .then((res) => setclientData(res.data))
      .catch((err) => console.error(err));
  }, []);
  //React table initialization
  const data = React.useMemo(() => clientData, [clientData]);

  //Setting up columns for table changing the displayed name
  const columns = React.useMemo(
    () => [
      {
        accessor: "jobTitle",
        width: 1500,
        Cell: ({ value }) => <div className="jobTitle">{value}</div>,
      },
      {
        accessor: "date",
        width: 300,
        Cell: ({ value }) => (
          <div className="dateValue">{value.split("T")[0]}</div>
        ),
      },
      {
        accessor: "_id",
        Cell: ({ value }) => (
          <div className="invoice">
            <DownloadInvoice size="2x" fileId={value} />
          </div>
        ),
      },
    ],
    []
  );

  // Initalizing useTable hook
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state,
    setGlobalFilter,
  } = useTable({ columns, data }, useGlobalFilter);

  const { globalFilter } = state;

  useEffect(() => {
    axios
      .get("http://127.0.0.1:4000/api/Clients/")
      .then((res) => setclientData(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <>
      <div className="searchContainer">
        <FaSearch />
        <input
          type="search"
          placeholder="Search..."
          className="searchBar"
          value={globalFilter || ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>
      <table {...getTableProps()}>
        <thead>
          {/* Looping through Header Groups and choosing what react should render*/}
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th
                  {...column.getHeaderProps({
                    style: { minWidth: column.minWidth, width: column.width },
                  })}
                >
                  {column.render("Header")}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => (
                  <td
                    {...cell.getCellProps({
                      style: {
                        minWidth: cell.column.minWidth,
                        width: cell.column.width,
                      },
                    })}
                  >
                    {cell.render("Cell")}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
};

export default Table;
