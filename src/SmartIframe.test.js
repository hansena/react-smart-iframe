import React from "react";
import ReactDOM from "react-dom";
import SmartIframe from "./SmartIframe";

it("renders without crashing", () => {
  const div = document.createElement("div");
  ReactDOM.render(<SmartIframe />, div);
});
