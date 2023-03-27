import * as React from "react";
import Layout from "../components/Layout";
import "../style/database.css";
import { FaSearch } from "react-icons/fa";

const database = () => {
  return (
    <Layout>
      <div className="dataContainer">
        {"Database"}
        <div className="searchContainer">
          <FaSearch />
          <input type="search" placeholder="Search..." className="searchBar" />
        </div>
      </div>
      <div className="jobTable">
        
      </div>
    </Layout>
  );
};

export default database;

export const Head = () => <title>VHD</title>;
