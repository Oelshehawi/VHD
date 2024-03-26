'use client';
import { useState } from 'react';
import {
  useReactTable,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from '@tanstack/react-table';
import Link from 'next/link';
import { FaPenSquare, FaTrash } from 'react-icons/fa';
import { deleteClient } from '../../app/lib/actions';
import DeleteModal from '../DeleteModal';
import { toast } from 'react-hot-toast';
import { FaSearch } from 'react-icons/fa';
const ClientTable = ({ clientData }) => {
  const columnHelper = createColumnHelper();
  const [showModal, setShowModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);


  const handleDelete = async (clientId) => {
    try {
      const deleteClientWithId = deleteClient.bind(null, clientId);
      await deleteClientWithId();
      toast.success('Client and associated invoices deleted successfully');
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error(
        'Database Error: Failed to delete client and associated invoices'
      );
    }
    return;
  };

  const columns = [
    columnHelper.accessor('clientName', {
      header: 'Client Name',
      cell: (info) => <div className=''>{info.getValue()}</div>,
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: (info) => <div className=''>{info.getValue()}</div>,
    }),
    columnHelper.accessor('phoneNumber', {
      header: 'Phone Number',
      cell: (info) => <div className=''>{info.getValue()}</div>,
    }),
    columnHelper.accessor('_id', {
      header: 'Edit Client',
      id: 'Client Edit',
      cell: (info) => {
        return (
          <Link
            href={`/database/${info.getValue()}`}
            className='flex justify-center'
          >
            <FaPenSquare className='rounded bg-darkGreen size-8 text-white hover:bg-green-800' />
          </Link>
        );
      },
    }),
    columnHelper.accessor('_id', {
      header: 'Delete Client',
      cell: (info) => {
        return (
          <div className='flex justify-center'>
            <FaTrash
              className='rounded bg-red-600 hover:bg-red-800 p-2 size-8 text-white hover:cursor-pointer'
              onClick={() => {
                setSelectedClientId(info.getValue());
                setShowModal(true);
              }}
            />
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: clientData,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
  });

  return (
    <div>
      <div className='flex flex-col py-2 md:flex-row gap-3'>
        <div className='flex'>
          <input
            type='text'
            placeholder='Search For Client...'
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
          id='clientSort'
          name='clientSort'
          onChange={(e) => {
            if (e.target.value === 'All') {
              table.resetSorting();
            } else {
              const sortOption = JSON.parse(e.target.value);
              setSorting([sortOption]);
            }
          }}
          className='w-full h-10 border border-gray-300 hover:cursor-pointer focus:border-darkGreen focus:ring-2 focus:ring-darkGreen text-gray-700 rounded-md px-2 md:px-3 py-0 md:py-1 tracking-wider'
        >
          <option value='All'>All</option>
          <option value={JSON.stringify({ id: 'clientName', desc: false })}>
            Name A-Z
          </option>
          <option value={JSON.stringify({ id: 'clientName', desc: true })}>
            Name Z-A
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
        <div className='flex items-center justify-between mt-2'>
          <div className='flex flex-row gap-2'>
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
            <span className='flex items-center gap-1'>
              <div>Page</div>
              <strong>
                {table.getState().pagination.pageIndex + 1} of{' '}
                {table.getPageCount()}
              </strong>
            </span>
          </div>
          <span className='flex items-center gap-1'>
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
            className='p-2 border rounded bg-transparent'
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
          handleDelete(selectedClientId);
          setShowModal(false);
        }}
        onCancel={() => setShowModal(false)}
        deleteText={'Are you sure you want to delete this client?'}
        deleteDesc={
          'All associated invoices with this client will also be deleted'
        }
      />
    </div>
  );
};

export default ClientTable;
