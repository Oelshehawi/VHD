import * as React from "react";
import "../style/layout.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faUser } from "@fortawesome/free-solid-svg-icons";

library.add(faUser)

const TopNavBar = () => {
  return (
    <header className="HeaderBar" >
      <FontAwesomeIcon id="user-icon" icon="fa-solid user" label="Username" fixedWidth size="7x" />
      TopNavBar
    </header>
  );
};

export default TopNavBar;
