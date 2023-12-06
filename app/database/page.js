'use client';
import { useState } from 'react';
import Table from '../../components/Table';
import { FaSearch } from 'react-icons/fa';
import { FaPlus } from 'react-icons/fa';
import { FaFileImport } from 'react-icons/fa';
import Modal from '../../components/Modal';
import database from './database.module.css';

const Database = () => {
  const [openModal, setopenModal] = useState(false);

  const [filter, setfilter] = useState('');

  const [onUpdate, setOnUpdate] = useState(false);


  return (
    <>
      <Modal
        open={openModal}
        onClose={() => {
          setopenModal(false);
        }}
        onUpdate={() => setOnUpdate(!onUpdate)}
      />
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
