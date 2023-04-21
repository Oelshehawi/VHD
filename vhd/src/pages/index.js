import * as React from "react";
import Layout from "../components/Layout";
import "../style/dashboard.css";

const IndexPage = () => {
  return (
    <Layout>
      <div className="dashContainer">
        Today's Schedule
        <div className="innerContainer"></div>
        <div className="hline"></div>
        <div className="innerContainer"></div>
      </div>
      <div className="widgetContainer">
        <div className="weatherContainer">Today's Weather
        <div className="innerContainer2"></div>
        </div>
        <div className="jobsDueContainer">Jobs Due Soon:
        </div>
      </div>
    </Layout>
  );
};

export default IndexPage;

export const Head = () => <title>VHD</title>;
