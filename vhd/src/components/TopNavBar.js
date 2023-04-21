import * as React from "react";
import "../style/topbar.css";
import logo from "../images/9925.png";

const TopNavBar = () => {
  return (
    <nav className="HeaderBar">
      <div className="imgcontainer">
        <img src={logo} alt="Vancouver Hood Doctors" />
        <div className="text">{"Vancouver Hood Doctors"}</div>
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
