import React, { useState, useEffect, useMemo } from 'react';
import styles from './styles/invoiceTable.module.css';
import axios from 'axios';
import {
  useReactTable,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { useRouter } from 'next/navigation';

const InvoiceTable = ({ filter, onUpdate }) => {
  const [invoiceData, setInvoiceData] = useState([]);
  const [globalFilter, setglobalFilter] = useState('');
  const [modal, setmodal] = useState(false);
  const [selectedRow, setSelectedRow] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/invoices/`
        );
        setInvoiceData(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [onUpdate]);

  const columnHelper = createColumnHelper();

  const columns = [
    columnHelper.accessor('invoiceId', {
      header: 'Invoice #',
      cell: (info) => (
        <div className={styles.invoiceId}>{'#' + info.getValue()}</div>
      ),
    }),
    columnHelper.accessor('jobTitle', {
      header: 'Job Title',
      cell: (info) => <div className={styles.jobTitle}>{info.getValue()}</div>,
    }),
    columnHelper.accessor('dateDue', {
      header: 'Due Date',
      cell: (info) => {
        const value = info.getValue();
        if (value) {
          return <div className={styles.jobTitle}>{value.split('T')[0]}</div>;
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
          <div className={styles.phone}>
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
        const firstItem = original.items[0]; // Accessing the first item in the items array
        const price = firstItem ? firstItem.price : null;

        return <div className={styles.phone}>{'$' + price}</div>;
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

  //React table data initialization
  const data = React.useMemo(() => invoiceData, [invoiceData]);

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
    </>
  );
};

export default InvoiceTable;
