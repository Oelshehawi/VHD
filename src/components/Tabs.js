import React, { useState } from "react";

const Tab = () => {
  const [currentTab, setcurrentTab] = useState(1);

  const handleTabClick = (index) => {
    setcurrentTab(index);
  };

  return (
    <div className="jobTableContainer">
      <div className="tabs">
        <div className="btn-box">
          <button type="button" onClick={() => handleTabClick(1)} autoFocus>All</button>
          <button type="button" onClick={() => handleTabClick(2)}>Recently Viewed</button>
          <button type="button" onClick={() => handleTabClick(3)}>Favorites</button>
        </div>
      </div>
      <div className={currentTab === 1 ? "show-content" : "content" }>test</div>
      <div className={currentTab === 2 ? "show-content" : "content" }>test2</div>
      <div className={currentTab === 3 ? "show-content" : "content" }>test3</div>
    </div>
  );
};

export default Tab;

export const Head = () => <title>VHD</title>;
