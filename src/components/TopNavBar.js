import * as React from "react";
import "../style/topbar.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faUser } from "@fortawesome/free-solid-svg-icons";

library.add(faUser);

const TopNavBar = () => {
  return(
    <nav className="HeaderBar">
      <div className="text"> Hi there</div>
    </nav>
  );
};

export default TopNavBar;
