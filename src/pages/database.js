import * as React from "react";
import Layout from "../components/Layout"
import "../style/database.css"
import { FaSearch } from "react-icons/fa"

const database = () => {
  return (
   <Layout>
    <div className="dataContainer">
      {"Database"}
      <FaSearch />
      <input type="text" placeholder="Search..." className="searchbar" />
    </div>

    </Layout>
  );
};

export default database;

export const Head = () => <title>VHD</title>;