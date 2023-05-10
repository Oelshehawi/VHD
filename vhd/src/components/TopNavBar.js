import * as React from "react";
import logo from "../public/9925.png";
import Image from "next/image";

const TopNavBar = () => {
  return (
    <nav className="HeaderBar">
      <div className="imgcontainer">
        <Image src={logo} alt="Vancouver Hood Doctors" />
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
