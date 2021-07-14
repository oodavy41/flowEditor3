import React, { Component } from "react";
import ReactDom from "react-dom";
import MainPlane from "./production";

ReactDom.render(<MainPlane develop={true} />, document.getElementById("root"));
