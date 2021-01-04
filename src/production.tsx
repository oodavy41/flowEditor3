import React, { Component } from "react";
import MainPlane from "./componments/MainPlane";
import imJSON from "./importJSON";

interface MainIf {
  dataProvider?: any[];
  compModel?: boolean;
}
export default function Comp(props: MainIf) {
  let newProps;
  if (imJSON.sceneJSON) {
    newProps = {
      ...props,
      dataProvider: [imJSON.sceneJSON],
    };
  }
  return <MainPlane {...newProps} />;
}
