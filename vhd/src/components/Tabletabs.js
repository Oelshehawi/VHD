import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTable } from "react-table";
import DownloadInvoice from "./downloadInvoice";

const Tab = () => {
  // data fetched from MongoDB
  const [clientData, setclientData] = useState([]);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:4000/api/Clients/")
      .then((res) => setclientData(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Used to set the current working Tab
  const [currentTab, setcurrentTab] = useState(1);

  //Switching tabs and showing the related content
  const handleTabClick = (index) => {
    setcurrentTab(index);
  };

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
        Cell: ({ value }) => <div className="dateValue">{value.split('T')[0]}</div>,
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
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({ columns, data });

  return (
    <div className="jobTableContainer">
      <div className="tabs">
        <div className="btn-box">
          <button type="button" onClick={() => handleTabClick(1)} autoFocus>
            All
          </button>
          <button type="button" onClick={() => handleTabClick(2)}>
            Recently Viewed
          </button>
          <button type="button" onClick={() => handleTabClick(3)}>
            Favorites
          </button>
        </div>
      </div>
      <div className={currentTab === 1 ? "show-content" : "content"}>
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
      </div>
      <div className={currentTab === 2 ? "show-content" : "content"}>test2</div>
      <div className={currentTab === 3 ? "show-content" : "content"}>test3</div>
    </div>
  );
};

export default Tab;

export const Head = () => <title>VHD</title>;
