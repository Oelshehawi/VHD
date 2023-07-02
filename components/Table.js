import React, { useState, useEffect, useMemo } from 'react';
import styles from './styles/table.module.css';
import axios from 'axios';
import {
  useReactTable,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  PaginationState,
  getPaginationRowModel
} from '@tanstack/react-table';
import { useRouter } from 'next/navigation';

const Table = ({ filter, onUpdate }) => {
  const [clientData, setClientData] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState('');
  const router = useRouter();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/clients/`
        );
        setClientData(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [onUpdate]);

  const redirectToClientDetails = (clientId) => {
    router.push(`/database/clientDetailed?id=${clientId}`);
  };

  const handleRowClick = (row) => {
    if (row) {
      redirectToClientDetails(row);
    }
  };

  // Conditionally initialize react table data
  const data = useMemo(() => clientData, [clientData]);

  const columnHelper = createColumnHelper();

  const columns = [
    columnHelper.accessor('clientName', {
      header: 'Client Name',
      cell: (info) => <div className={styles.jobTitle}>{info.getValue()}</div>,
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: (info) => {
        const value = info.getValue();
        if (value) {
          return <div className={styles.dateValue}>{value.split('T')[0]}</div>;
        }
      },
    }),
    columnHelper.accessor('phoneNumber', {
      header: 'Phone Number',
      cell: (info) => {
        return <div className={styles.phone}>{info.getValue()}</div>;
      },
    }),
  ];

  // Conditionally initialize react table
  const tableInstance = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
    },
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    debugTable: true,
  });

  const memoizedFilter = useMemo(() => filter, [filter]);

  useEffect(() => {
    setGlobalFilter(memoizedFilter ?? '');
  }, [memoizedFilter, setGlobalFilter]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  return (
    <>
      <table className={styles.table}>
        <thead className={styles.thead}>
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
              onClick={() => handleRowClick(row.original._id)}
              key={row.id}
              className={styles.tr}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className={styles.td}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-2">
        <button
          className="border rounded p-1"
          onClick={() => tableInstance.setPageIndex(0)}
          disabled={!tableInstance.getCanPreviousPage()}
        >
          {'<<'}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => tableInstance.previousPage()}
          disabled={!tableInstance.getCanPreviousPage()}
        >
          {'<'}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => tableInstance.nextPage()}
          disabled={!tableInstance.getCanNextPage()}
        >
          {'>'}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => tableInstance.setPageIndex(tableInstance.getPageCount() - 1)}
          disabled={!tableInstance.getCanNextPage()}
        >
          {'>>'}
        </button>
        <span className="flex items-center gap-1">
          <div>Page</div>
          <strong>
            {tableInstance.getState().pagination.pageIndex + 1} of{' '}
            {tableInstance.getPageCount()}
          </strong>
        </span>
        <span className="flex items-center gap-1">
          | Go to page:
          <input
            type="number"
            defaultValue={tableInstance.getState().pagination.pageIndex + 1}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              tableInstance.setPageIndex(page)
            }}
            className="border p-1 rounded w-16"
          />
        </span>
        <select
          value={tableInstance.getState().pagination.pageSize}
          onChange={e => {
            tableInstance.setPageSize(Number(e.target.value))
          }}
        >
          {[10, 20, 30, 40, 50].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </>
  );
};

export default Table;
