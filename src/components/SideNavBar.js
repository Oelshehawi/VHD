import * as React from "react";
import "../style/layout.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faUser } from "@fortawesome/free-solid-svg-icons";

library.add(faUser);

const SideNavBar = () => {
  return (
    <nav>
      <FontAwesomeIcon
        id="user-icon"
        icon="user"
        label="Username"
        fixedWidth
        size="5x"
      />
      <div className="line"></div>
    </nav>
  );
};

export default SideNavBar;
