import React, { useState, useEffect, useMemo } from 'react';
import styles from './styles/table.module.css';
import axios from 'axios';
import {
  useReactTable,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';
import DownloadInvoice from './DownloadInvoice';
import ClientModalDetailed from './ClientModalDetailed';

const Table = ({ filter, onUpdate }) => {
  // data fetched from MongoDB
  const [clientData, setClientData] = useState([]);
  const [globalFilter, setglobalFilter] = useState('');
  const [modal, setmodal] = useState(false);
  const [selectedrow, setselectedrow] = useState('');

  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/clients/`)
      .then((res) => {
        setClientData(res.data);
        console.log('just updated');
      })
      .catch((err) => console.error(err));
  }, [onUpdate]);

  const columnHelper = createColumnHelper();

  const columns = [
    columnHelper.accessor('jobTitle', {
      size: 5500,
      cell: (info) => <div className={styles.jobTitle}>{info.getValue()}</div>,
    }),
    columnHelper.accessor('date', {
      size: 500,
      cell: (info) => {
        const value = info.getValue();
        if (value) {
          return <div className={styles.dateValue}>{value.split('T')[0]}</div>;
        }
      },
    }),
    columnHelper.accessor('phoneNumber', {
      size: 500,
      cell: (info) => {
        return <div className={styles.phone}>{info.getValue()}</div>;
      },
    }),
  ];

  //React table data initialization
  const data = React.useMemo(() => clientData, [clientData]);

  const memoizedFilter = useMemo(() => filter, [filter]);

  const tableInstance = useReactTable({
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
    setglobalFilter(memoizedFilter ?? '');
  }, [memoizedFilter, setglobalFilter]);

  return (
    <>
      <table className={styles.table}>
        <thead>
          {/* Looping through Header Groups and choosing what react should render*/}
          {tableInstance.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className={styles.tr}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className={styles.th}>
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
        <tbody className={styles.tbody}>
          {tableInstance.getRowModel().rows.map((row) => (
            <tr
              onClick={() => {
                setselectedrow(row.original._id);
                setmodal(true);
              }}
              key={row.id}
              className={styles.tr}
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
                  className={styles.td}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {selectedrow !== '' ? (
        <ClientModalDetailed
          open={modal}
          rowId={selectedrow}
          clientData={clientData}
          onUpdate={onUpdate}
          onClose={() => {
            setselectedrow('');
            setmodal(false);
          }}
        />
      ) : null}
    </>
  );
};

export default Table;
