import React, { Component } from "react";
import MainPlane from "./componments/Main";
import imJSON from "./importJSON";

interface MainIf {
  dataProvider?: any[];
  compModel?: boolean;
  option?: {
    clipTile: {
      displayName: string;
      tileType: string;
      editorId: string;
      id: string;
      dataQuery?: string[];
      config: any;
    }[];
    config?: {
      BgColor: string;
      gridColor: string;
      import: string;
      cameraHeight: number;
      sceneLight: number;
    };
  };
  selfConfigUpdate?: (config: any, id?: string) => void;
}
export default function Comp(props: MainIf) {
  let newProps;
  let { option } = props;
  if (imJSON.sceneJSON) {
    newProps = {
      ...props,
      dataImport: [imJSON.sceneJSON],
      dataOfSet: option
        ? option.clipTile
            .filter((c) => c.displayName !== "000000")
            .map((c) => ({
              id: c.displayName,
              editorId: c.id,
              tileType: c.tileType,
              value: c.dataQuery ? +c.dataQuery[0] : 0,
              config: (c && c.config) || undefined,
            }))
        : undefined,
      config: option ? { ...option.config } : undefined,
    };
  }
  return <MainPlane {...newProps} />;
}
