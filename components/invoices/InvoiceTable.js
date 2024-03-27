import { useState, useEffect } from 'react';
import {
  useReactTable,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from '@tanstack/react-table';
import { FaSearch, FaTrash, FaPenSquare } from 'react-icons/fa';
import Link from 'next/link';
import { deleteInvoice } from '../../app/lib/actions';
import DeleteModal from '../DeleteModal';

const InvoiceTable = ({ invoiceData }) => {
  const columnHelper = createColumnHelper();
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});

  useEffect(() => {
    const updateVisibility = () => {
      const isMobile = window.innerWidth < 768; 
      setColumnVisibility({
        invoiceId: !isMobile, 
        jobTitle: true,
        issuedDate: !isMobile, 
        status: !isMobile, 
        items: !isMobile, 
        InvoiceEdit: true, 
        deleteInvoice: !isMobile, 
      });
    };
  
    updateVisibility(); 
    window.addEventListener('resize', updateVisibility);
  
    return () => {
      window.removeEventListener('resize', updateVisibility);
    };
  }, []);

  const handleDelete = async (invoiceId) => {
    try {
      const deleteInvoiceWithId = deleteInvoice.bind(null, invoiceId);
      await deleteInvoiceWithId();
      toast.success('Invoice deleted successfully');
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Database Error: Failed to delete Invoice');
    }
    return;
  };

  const columns = [
    columnHelper.accessor('invoiceId', {
      header: 'Invoice #',
      id: 'invoiceId',
      cell: (info) => <div className=''>{'#' + info.getValue()}</div>,
    }),
    columnHelper.accessor('jobTitle', {
      header: 'Job Title',
      id: 'jobTitle',
      cell: (info) => <div className=''>{info.getValue()}</div>,
    }),
    columnHelper.accessor('dateIssued', {
      header: 'Issued Date',
      id: 'issuedDate',
      cell: (info) => {
        const value = info.getValue();
        if (value) {
          return <div className=''>{value.split('T')[0]}</div>;
        }
      },
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      id: 'status',
      cell: (info) => {
        const status = info.getValue();
        return (
          <div
            className={`rounded-lg flex justify-center items-center font-bold ${
              status === 'paid'
                ? 'bg-green-500 text-white'
                : status === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {status.toUpperCase()}
          </div>
        );
      },
    }),
    columnHelper.accessor('items', {
      header: 'Amount',
      id: 'items',
      cell: (info) => {
        const { original } = info.row;
        let Total = 0;
        for (let i = 0; i < original.items.length; i++) {
          Total += original.items[i].price;
        }

        return <div className=''>${Total + Total * 0.05}</div>;
      },
    }),
    columnHelper.accessor('_id', {
      header: 'Edit Invoice',
      id: 'editInvoice',
      cell: (info) => {
        return (
          <Link
            className='flex justify-center'
            href={`/invoices/${info.getValue()}`}
          >
            <FaPenSquare className='rounded bg-darkGreen size-8 text-white hover:bg-green-800' />
          </Link>
        );
      },
    }),
    columnHelper.accessor('_id', {
      header: 'Delete Invoice',
      id: 'deleteInvoice',
      cell: (info) => {
        return (
          <div className='flex justify-center'>
            <FaTrash
              className='rounded bg-red-600 hover:bg-red-800 p-2 size-8 text-white hover:cursor-pointer'
              onClick={() => {
                setSelectedInvoiceId(info.getValue());
                setShowModal(true);
              }}
            />
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: invoiceData,
    columns,
    state: {
      globalFilter,
      sorting,
      columnVisibility
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
  });

  return (
    <div>
      <div className='flex flex-col py-2 md:flex-row gap-3'>
        <div className='flex'>
          <input
            type='text'
            placeholder='Search For Invoice...'
            onChange={(e) => setGlobalFilter(e.target.value)}
            className='w-full md:w-80 px-3 h-10 rounded-l-md border  border-darkGreen ring-2 ring-darkGreen focus:outline-none'
          />
          <button
            type='submit'
            className='text-white bg-darkGreen px-2 md:px-3 py-0 md:py-1 rounded-r-md border-darkGreen ring-2 ring-darkGreen hover:bg-darkBlue'
          >
            <FaSearch className='w-5 h-5 ' />
          </button>
        </div>
        <select
          id='invoiceSort'
          name='invoiceSort'
          onChange={(e) => {
            if (e.target.value === 'Pending') {
              setGlobalFilter('Pending');
              return;
            }
            if (e.target.value === 'All') {
              table.resetSorting();
              table.resetGlobalFilter();
              return;
            }

            const sortOption = JSON.parse(e.target.value);
            setSorting([sortOption]);
          }}
          className='w-full h-10 border border-gray-300 hover:cursor-pointer focus:border-darkGreen focus:ring-2 focus:ring-darkGreen text-gray-700 rounded-md px-2 md:px-3 py-0 md:py-1 tracking-wider'
        >
          <option value='All'>All</option>
          <option value='Pending'>Pending</option>
          <option value={JSON.stringify({ id: 'issuedDate', desc: false })}>
            Earliest Invoices
          </option>
          <option value={JSON.stringify({ id: 'issuedDate', desc: true })}>
            Latest Invoices
          </option>
        </select>
      </div>
      <div className='overflow-auto min-h-[70vh] max-h-[70vh] rounded'>
        <table className='w-full text-left '>
          <thead className='bg-darkGreen text-white'>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className=''>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className='capitalize px-3.5 py-3'>
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
          <tbody className='font-bold rounded'>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={
                  row.id % 2 == 0
                    ? 'bg-borderGreen text-white'
                    : 'bg-darkGreen text-white'
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className='px-3.5 py-2.5'>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <div className='flex items-center justify-center lg:justify-between mt-2'>
          <div className='flex flex-row gap-2'>
            <button
              onClick={() => {
                table.setPageIndex(0);
              }}
              disabled={!table.getCanPreviousPage()}
              className='p-1 border border-gray-300 rounded px-2 bg-darkGreen text-white disabled:opacity-30'
            >
              {'<<'}
            </button>
            <button
              onClick={() => {
                table.previousPage();
              }}
              disabled={!table.getCanPreviousPage()}
              className='p-1 border border-gray-300 rounded px-2 bg-darkGreen text-white disabled:opacity-30'
            >
              {'<'}
            </button>
            <button
              onClick={() => {
                table.nextPage();
              }}
              disabled={!table.getCanNextPage()}
              className='p-1 border rounded border-gray-300 px-2 bg-darkGreen text-white disabled:opacity-30'
            >
              {'>'}
            </button>
            <button
              onClick={() => {
                table.setPageIndex(table.getPageCount() - 1);
              }}
              disabled={!table.getCanNextPage()}
              className='p-1 border rounded border-gray-300 px-2 bg-darkGreen text-white disabled:opacity-30'
            >
              {'>>'}
            </button>
            <span className='hidden lg:flex items-center gap-1'>
              <div>Page</div>
              <strong>
                {table.getState().pagination.pageIndex + 1} of{' '}
                {table.getPageCount()}
              </strong>
            </span>
          </div>
          <span className='items-center gap-1 hidden lg:flex'>
            Go to page:
            <input
              type='number'
              defaultValue={table.getState().pagination.pageIndex + 1}
              onChange={(e) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                table.setPageIndex(page);
              }}
              className='border p-2 rounded w-16 bg-transparent'
            />
          </span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
            className='p-2 border rounded bg-transparent hidden lg:block'
          >
            {[10, 20, 30, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>
      <DeleteModal
        showModal={showModal}
        onConfirm={() => {
          handleDelete(selectedInvoiceId);
          setShowModal(false);
        }}
        onCancel={() => setShowModal(false)}
        deleteText={'Are you sure you want to delete this invoice?'}
        deleteDesc={'This action cannot be undone!'}
      />
    </div>
  );
};

export default InvoiceTable;
