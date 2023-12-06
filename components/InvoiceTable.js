import React, { useState, useEffect, useMemo } from 'react';
import styles from './styles/invoiceTable.module.css';
import axios from 'axios';
import {
  useReactTable,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  PaginationState,
  getPaginationRowModel,
} from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Spinner } from 'react-bootstrap';

const InvoiceTable = ({ filter }) => {
  const [invoiceData, setInvoiceData] = useState([]);
  const [globalFilter, setglobalFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/invoices/`
        );
        setInvoiceData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    setglobalFilter(filter);
  }, [filter]);

  const columnHelper = createColumnHelper();

  const columns = [
    columnHelper.accessor('invoiceId', {
      header: 'Invoice #',
      cell: (info) => (
        <div className={styles.cell}>{'#' + info.getValue()}</div>
      ),
    }),
    columnHelper.accessor('jobTitle', {
      header: 'Job Title',
      cell: (info) => <div className={styles.cell}>{info.getValue()}</div>,
    }),
    columnHelper.accessor('dateIssued', {
      header: 'Issued Date',
      cell: (info) => {
        const value = info.getValue();
        if (value) {
          return <div className={styles.cell}>{value.split('T')[0]}</div>;
        }
      },
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const status = info.getValue();
        let buttonStyle = '';

        switch (status) {
          case 'pending':
            buttonStyle = styles.yellowButton;
            break;
          case 'overdue':
            buttonStyle = styles.redButton;
            break;
          case 'paid':
            buttonStyle = styles.greenButton;
            break;
          default:
            break;
        }

        return (
          <div className={styles.cell}>
            <button className={`${styles.statusButton} ${buttonStyle}`}>
              {status.toUpperCase()}
            </button>
          </div>
        );
      },
    }),
    columnHelper.accessor('items', {
      header: 'Amount',
      cell: (info) => {
        const { original } = info.row;
        let Total = 0;
        for (let i = 0; i < original.items.length; i++) {
          Total += original.items[i].price;
        }

        return <div className={styles.cell}>${Total + Total * 0.05}</div>;
      },
    }),
  ];

  const handleRowClick = (row) => {
    if (row) {
      redirectToInvoiceDetails(row);
    }
  };

  const redirectToInvoiceDetails = (invoiceId) => {
    router.push(`/invoices/invoiceDetailed?id=${invoiceId}`);
  };

  const data = useMemo(() => invoiceData, [invoiceData]);

  const tableInstance = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
    },
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setglobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) {
    return (
      <Spinner animation="border" size="lg" role="status" aria-hidden="true" />
    );
  }

  return (
    <>
      <table className={styles.table}>
        <thead className={styles.thead}>
          {tableInstance.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className={styles.tr}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={styles.th}
                  style={{
                    width:
                      header.getSize() !== 150 ? header.getSize() : undefined,
                  }}
                >
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
          onClick={() =>
            tableInstance.setPageIndex(tableInstance.getPageCount() - 1)
          }
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
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              tableInstance.setPageIndex(page);
            }}
            className="border p-1 rounded w-16"
          />
        </span>
        <select
          value={tableInstance.getState().pagination.pageSize}
          onChange={(e) => {
            tableInstance.setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </>
  );
};

export default InvoiceTable;
