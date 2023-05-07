import React, { useState } from "react";
import Table from "./Table";

const Tabs = ({ filter }) => {
  // Used to set the current working Tab
  const [currentTab, setcurrentTab] = useState(1);

  //Switching tabs and showing the related content
  const handleTabClick = (index) => {
    setcurrentTab(index);
  };

  return (
    <div className="jobTableContainer">
      <div className="tabs">
        <div className="btn-box">
          <button
            type="button"
            className={currentTab === 1 ? "active-tab" : "databaseTab"}
            onClick={() => handleTabClick(1)}
          >
            All
          </button>
          <button
            type="button"
            className={currentTab === 2 ? "active-tab" : "databaseTab"}
            onClick={() => handleTabClick(2)}
          >
            Recently Viewed
          </button>
          <button
            type="button"
            className={currentTab === 3 ? "active-tab" : "databaseTab"}
            onClick={() => handleTabClick(3)}
          >
            Favorites
          </button>
        </div>
      </div>
      <div className={currentTab === 1 ? "show-content" : "content"}>
        <Table filter={filter} />
      </div>
      <div className={currentTab === 2 ? "show-content" : "content"}>test2</div>
      <div className={currentTab === 3 ? "show-content" : "content"}>test3</div>
    </div>
  );
};

export default Tabs;

export const Head = () => <title>VHD</title>;
