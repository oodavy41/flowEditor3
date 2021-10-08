import React, { Component } from "react";
import MainPlane from "./componments/Main";

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
  develop: boolean;
  selfConfigUpdate?: (config: any, id?: string, tileType?: string) => void;
  selfNodeSelect?: (id: string) => void;
  selfNodeAdd?: (role: string, type: string, name: string) => string;
  selfNodeDelete?: (id: string, type: string) => void;
  selfNodeEdit?: (id: string, type: string, name: string) => void;
}
export default function Comp(props: MainIf) {
  let newProps;
  let {
    option,
    selfConfigUpdate,
    selfNodeSelect,
    selfNodeAdd,
    selfNodeDelete,
    selfNodeEdit,
  } = props;

  newProps = {
    ...props,
    dataOfSet: option
      ? option.clipTile
          .filter((c) => c.displayName !== "000000")
          .map((c) => {
            let message = undefined;
            try {
              if (c.dataQuery && c.dataQuery[4])
                message = {
                  status: c.dataQuery[1],
                  title: c.dataQuery[2],
                  content: c.dataQuery[3],
                  url: c.dataQuery[4],
                };
            } catch (e) {
              console.log(e, c.dataQuery);
            }
            return {
              id: c.displayName,
              editorID: c.id,
              tileType: c.tileType,
              value: c.dataQuery ? +c.dataQuery[0] : 0,
              config: (c && c.config) || undefined,
              message: message,
            };
          })
      : [
          {
            id: "d113a2",
            editorID: "6428be8f5619500cae109c90d41cb35bf1dc7e3f",
            tileType: "flow3DNode",
            value: 0,
            config: undefined,
            // message: { status: "red", title: "t", content: "c", url: "r" },
          },
        ],
    config: option ? { ...option.config } : undefined,
    selfConfigUpdate:
      selfConfigUpdate && typeof selfConfigUpdate === "function"
        ? (config: any, id?: string, tileType?: string) => {
            console.log("SELFUPDATE", config, id);
            selfConfigUpdate(config, id, tileType);
          }
        : (config: any, id?: string, tileType?: string) => {},
    selfNodeSelect:
      selfNodeSelect && typeof selfNodeSelect === "function"
        ? (id: string) => selfNodeSelect(id)
        : (id: string) => {},
    selfNodeAdd:
      selfNodeAdd && typeof selfNodeAdd === "function"
        ? (type: string, name: string) => selfNodeAdd("flowStyle", type, name)
        : (type: string, name: string) => "",
    selfNodeDelete:
      selfNodeDelete && typeof selfNodeDelete === "function"
        ? (id: string, type: string) => selfNodeDelete(id, type)
        : (id: string, type: string) => "",
    selfNodeEdit:
      selfNodeEdit && typeof selfNodeEdit === "function"
        ? (id: string, type: string, name: string) =>
            selfNodeEdit(id, type, name)
        : (id: string, type: string, name: string) => "",
  };
  return <MainPlane {...newProps} />;
}
