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
      editorID: string;
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
  selfConfigUpdate?: (config: any, id?: string, tileType?: string) => void;
}
export default function Comp(props: MainIf) {
  let newProps;
  let { option, selfConfigUpdate } = props;
  if (imJSON.sceneJSON) {
    newProps = {
      ...props,
      // dataImport: [imJSON.sceneJSON],
      dataOfSet: option
        ? option.clipTile
            .filter((c) => c.displayName !== "000000")
            .map((c) => ({
              id: c.displayName,
              editorID: c.id,
              tileType: c.tileType,
              value: c.dataQuery ? +c.dataQuery[0] : 0,
              config: (c && c.config) || undefined,
              message:
                c.dataQuery && c.dataQuery[1]
                  ? [
                      c.dataQuery[1],
                      c.dataQuery[2],
                      c.dataQuery[3],
                      c.dataQuery[4],
                    ]
                  : undefined,
            }))
        : [
            {
              id: "d113a2",
              editorID: "6428be8f5619500cae109c90d41cb35bf1dc7e3f",
              tileType: "flow3DNode",
              value: 0,
              config: undefined,
              message: ["red", "t", "c", "r"],
            },
          ],
      config: option ? { ...option.config } : undefined,
      selfConfigUpdate: (config: any, id?: string, tileType?: string) => {
        console.log("SELFUPDATE", config, id);
        selfConfigUpdate(config, id, tileType);
      },
    };
  }
  return <MainPlane {...newProps} />;
}
