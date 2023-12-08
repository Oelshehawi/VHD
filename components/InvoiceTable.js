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
import {
  Container,
  Row,
  Col,
  Spinner,
  Table,
  Pagination,
  Form,
  Button,
} from 'react-bootstrap';

const InvoiceTable = ({ filter, onUpdate }) => {
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
  }, [onUpdate]);

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
        return (
          <Col
            className={`rounded-1 d-flex justify-content-center fw-bolder align-items-center ${
              styles.statusButton
            } ${
              status === 'paid'
                ? styles.greenButton
                : status === 'pending'
                ? styles.yellowButton
                : styles.redButton
            }`}
          >
            {status.toUpperCase()}
          </Col>
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

  const handleRowClick = (invoiceId) => {
    router.push(`/invoices/invoiceDetailed?id=${invoiceId}`);
  };

  const data = useMemo(() => invoiceData, [invoiceData]);

  const tableInstance = useReactTable({
    data,
    columns,
    state: {
      globalFilter: globalFilter,
    },
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setglobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) {
    return (
      <Container
        fluid
        className="d-flex justify-content-center align-items-center"
      >
        <Spinner
          animation="border"
          size="lg"
          role="status"
          aria-hidden="true"
        />
      </Container>
    );
  }

  return (
    <Container className="p-0">
      <Row className={`mb-3 ${styles.tableContainer}`}>
        <Table striped bordered hover>
          <thead className={styles.thead}>
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
                className={` ${styles.tableRow}`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={`text-center`}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </Row>
      <Row>
        <Pagination>
          <Pagination.First
            onClick={() => tableInstance.setPageIndex(0)}
            disabled={!tableInstance.getCanPreviousPage()}
          />
          <Pagination.Prev
            onClick={() => tableInstance.previousPage()}
            disabled={!tableInstance.getCanPreviousPage()}
          />
          <Pagination.Item active>
            {tableInstance.getState().pagination.pageIndex + 1}
          </Pagination.Item>
          <Pagination.Next
            onClick={() => tableInstance.nextPage()}
            disabled={!tableInstance.getCanNextPage()}
          />
          <Pagination.Last
            onClick={() =>
              tableInstance.setPageIndex(tableInstance.getPageCount() - 1)
            }
            disabled={!tableInstance.getCanNextPage()}
          />
        </Pagination>
        <div className="d-flex align-items-center justify-content-between">
          <div>
            Page:{' '}
            <strong>
              {tableInstance.getState().pagination.pageIndex + 1} of{' '}
              {tableInstance.getPageCount()}
            </strong>
          </div>
          <div>
            Go to page:
            <Form.Control
              type="number"
              size="sm"
              defaultValue={tableInstance.getState().pagination.pageIndex + 1}
              onChange={(e) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                tableInstance.setPageIndex(page);
              }}
              style={{ width: '80px', display: 'inline' }}
            />
          </div>
          <div>
            <Form.Select
              size="sm"
              value={tableInstance.getState().pagination.pageSize}
              onChange={(e) =>
                tableInstance.setPageSize(Number(e.target.value))
              }
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  Show {pageSize}
                </option>
              ))}
            </Form.Select>
          </div>
        </div>
      </Row>
    </Container>
  );
};

export default InvoiceTable;
