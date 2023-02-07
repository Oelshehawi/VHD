import * as React from "react";
import "../style/layout.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faUser } from "@fortawesome/free-solid-svg-icons";

library.add(faUser);

const TopNavBar = () => {
  return <div className="HeaderBar"></div>;
};

export default TopNavBar;
