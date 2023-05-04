import React, { useState } from "react";
import Layout from "../components/Layout";
import Tabs from "../components/tabs";
import "../style/database.css";
import { FaFileImport } from "react-icons/fa";
import Modal from "../components/Modal";
const Database = () => {
  const [openModal, setopenModal] = useState(false);

  return (
    <>
      <Modal open={openModal} onClose={() => setopenModal(false)} />
      <Layout>
        <div className="dataContainer">
          {"Database"}
          <FaFileImport
            className="fileImport"
            onClick={() => setopenModal(true)}
          />
        </div>
        <Tabs />
      </Layout>
    </>
  );
};

export default Database;

export const Head = () => <title>VHD</title>;
