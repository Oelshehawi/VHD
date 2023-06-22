'use client';
import { useState } from 'react';
import Table from '../../components/Table';
import { FaSearch } from 'react-icons/fa';
import { FaPlus } from 'react-icons/fa';
import { FaFileImport } from 'react-icons/fa';
import Modal from '../../components/Modal';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import database from './database.module.css';

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
      <div className={database.dataContainer}>
        <div className={database.dataTitle}>{'Clients'}</div>
        <div className={database.interactContainer}>
          <div className={database.searchContainer}>
            <FaSearch />
            <input
              type="search"
              placeholder="Search..."
              className={database.searchBar}
              value={filter ?? ''}
              onChange={(e) => setfilter(e.target.value)}
            />
          </div>
          <div
            className={database.clientButtonContainer}
            onClick={() => setopenModal(true)}
          >
            <FaPlus />
            <button className={database.clientButton}> {'Add Client'} </button>
          </div>
        </div>
      </div>
      <div className={database.jobTableContainer}>
        <Table filter={filter} onUpdate={() => setOnUpdate(!onUpdate)} />
      </div>
    </>
  );
};

export default Database;

export const Head = () => <title>VHD</title>;
