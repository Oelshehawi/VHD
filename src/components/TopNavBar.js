import * as React from "react";
import "../style/topbar.css";

const TopNavBar = () => {
  return (
    <nav className="HeaderBar">
      <div className="text">
        <img
          src="../images/9925.png"
          alt="Vancouver Hood Doctors"
          width="40px"
          height="400px"
          margin-left="300px"
        />
      </div>
      {/* <div className="vLine">
        <div className="vLine2">
          <div className="vLine3"></div>
        </div>
      </div> */}
    </nav>
  );
};

export default TopNavBar;
