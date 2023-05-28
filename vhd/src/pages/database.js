import React, { useState } from 'react';
import Layout from '../components/Layout';
import Tabs from '../components/Tabs';
import { FaSearch } from 'react-icons/fa';
import { FaFileImport } from 'react-icons/fa';
import Modal from '../components/Modal';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const Database = () => {
  const [openModal, setopenModal] = useState(false);

  const [filter, setfilter] = useState('');

  const [onUpdate, setOnUpdate] = useState(false);

  const showToast = () => {
    toast.success('Client Added Successfully!', {
      position: 'bottom-right',
      transition: Slide,
    });
  };

  return (
    <>
      <Modal
        open={openModal}
        onClose={() => {
          setopenModal(false);
        }}
        showToast={showToast}
        onUpdate={() => setOnUpdate(!onUpdate)}
      />
      <ToastContainer />
      <Layout>
        <div className="dataContainer">
          {'Database'}
          <div className="searchContainer">
            <FaSearch />
            <input
              type="search"
              placeholder="Search..."
              className="searchBar"
              value={filter ?? ''}
              onChange={(e) => setfilter(e.target.value)}
            />
            <FaFileImport
              className="fileImport"
              onClick={() => setopenModal(true)}
            />
          </div>
        </div>
        <Tabs filter={filter} onUpdate={() => setOnUpdate(!onUpdate)} />
      </Layout>
    </>
  );
};

export default Database;

export const Head = () => <title>VHD</title>;
