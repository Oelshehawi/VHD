import * as React from "react";
import Test from "../components/sections/test";
import * as FaIcons from "react-icons/fa"

const IndexPage = () => {
  return (
    <>
      <Test />
      <p> another word</p>
      <FaIcons.FaBitcoin/>
    </>
  );
};

export default IndexPage;

export const Head = () => <title>VHD</title>;

