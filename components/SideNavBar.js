import { useState } from 'react';
import sideNav from './styles/sideNav.module.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome } from 'react-icons/fa';
import { FaRegCalendarAlt } from 'react-icons/fa';
import { FaDatabase } from 'react-icons/fa';
import { FaFileInvoice } from 'react-icons/fa';
import { Container, Col, Row } from 'react-bootstrap';
import { signOut } from 'next-auth/react';


const SideNavBar = () => {
  const isActive = (href) => {
    const pathname = usePathname();
    return (
      pathname === href ||
      pathname.startsWith(`${href}/clientDetailed`) ||
      pathname.startsWith(`${href}/invoiceDetailed`)
    );
  };


  return (
    <Container className={`min-vh-100 d-flex flex-column  ${sideNav.sidebar}`}>
      <Row className="p-3 text-bg-dark text-center">
        <Col>VHD Admin CRM</Col>
      </Row>
      <Col className={`d-flex flex-column mt-3 text-center`}>
        <Link href="/dashboard" className={`p-2 fs-5 ${isActive('/dashboard') ? sideNav.theLinkActive : sideNav.theLink}`}>
          <FaHome className="m-2" />
          Dashboard
        </Link>
        <Link href="/database" className={`p-2 mt-3 fs-5 ${isActive('/database') ? sideNav.theLinkActive : sideNav.theLink}`}>
          <FaDatabase className="m-2" />
          Clients
        </Link>
        <Link href="/invoices" className={`p-2 mt-3 fs-5 ${isActive('/invoices') ? sideNav.theLinkActive : sideNav.theLink}`}>
          <FaFileInvoice className="m-2" />
          Invoices
        </Link>
        <Link href="/schedule" className={`p-2 mt-3 fs-5 ${isActive('/schedule') ? sideNav.theLinkActive : sideNav.theLink}`}>
          <FaRegCalendarAlt className="m-2" />
          Schedule
        </Link>
      </Col>
      <Row
        className={`p-3 text-bg-danger text-center fw-bolder ${sideNav.signOut}`}
        onClick={signOut}
      >
        <Col>Sign Out</Col>
      </Row>
    </Container>
  );
};

export default SideNavBar;
