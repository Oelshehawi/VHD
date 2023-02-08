import * as React from "react";
import Layout from "../components/Layout";
import * as FaIcons from "react-icons/fa";
import TopNavBar from "../components/TopNavBar"

const IndexPage = () => {
  return (
    <Layout>
      <TopNavBar  />
      <div className="text"></div>
    </Layout>
  );
};

export default IndexPage;

export const Head = () => <title>VHD</title>;