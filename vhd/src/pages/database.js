import React, { useState } from "react";
import Layout from "../components/Layout";
import Tabs from "../components/Tabs";
import "../style/database.css";
import { FaSearch } from "react-icons/fa";
import { FaFileImport } from "react-icons/fa";
import Modal from "../components/Modal";
const Database = () => {
  const [openModal, setopenModal] = useState(false);

  const [filter, setfilter] = useState("");

  return (
    <>
      <Modal open={openModal} onClose={() => setopenModal(false)} />
      <Layout>
        <div className="dataContainer">
          {"Database"}
          <div className="searchContainer">
            <FaSearch />
            <input
              type="search"
              placeholder="Search..."
              className="searchBar"
              value={filter || ""}
              onChange={(e) => setfilter(e.target.value)}
            />
            <FaFileImport
              className="fileImport"
              onClick={() => setopenModal(true)}
            />
          </div>
        </div>
        <Tabs filter={filter} />
      </Layout>
    </>
  );
};

export default Database;

export const Head = () => <title>VHD</title>;
