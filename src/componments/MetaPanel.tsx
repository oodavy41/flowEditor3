import React from "react";
import flowIF from "./flowIF";

interface metaPanelIF {
  update: number;
  canvasUpdater: React.MutableRefObject<(key: string, value: any) => void>;
  pickedUpdater: React.MutableRefObject<flowIF & THREE.Object3D>;
}

export default function MetaPanel(props: metaPanelIF) {
  let { update, canvasUpdater, pickedUpdater } = props;
  let nodeFun: {
    [key: string]: (
      updateObj: flowIF & THREE.Object3D,
      updateFun: (value: any) => void,
      updateLabel?: string,
      defaultValue?: any
    ) => JSX.Element;
  } = {
    color: (updateObj, updateFun, updateLabel) => (
      <div key={update + 1}>
        {updateLabel || "颜色"}:
        <input
          type="color"
          defaultValue={updateObj.color}
          onChange={(event) => updateFun(event.target.value)}
        />
      </div>
    ),
    name: (updateObj, updateFun, updateLabel) => (
      <div key={update + 2}>
        {updateLabel || "名字"}:
        <input
          type="text"
          defaultValue={updateObj.name}
          onChange={(event) => updateFun(event.target.value)}
        />
      </div>
    ),
    image: (updateObj, updateFun, updateLabel) => (
      <>
        {updateLabel || "贴图"}:
        <input
          type="file"
          accept="image/*"
          onChange={(event) => updateFun(event.target.files[0])}
        ></input>
      </>
    ),
    model: (updateObj, updateFun, updateLabel) => (
      <>
        {updateLabel || "模型"}:
        <input
          type="file"
          accept="*/obj"
          onChange={(event) => updateFun(event.target.files[0])}
        ></input>
      </>
    ),
    number: (updateObj, updateFun, updateLabel, defaultVaule) => (
      <>
        {updateLabel || "大小"}:
        <input
          type="number"
          defaultValue={defaultVaule}
          step={0.1}
          onChange={(event) => updateFun(event.target.value)}
        ></input>
      </>
    ),
  };
  let pickedDom: JSX.Element[] = [];
  if (pickedUpdater.current) {
    for (let key in pickedUpdater.current.onUpdateData) {
      let updateObj = pickedUpdater.current;
      let updateLabel = pickedUpdater.current.onUpdateData[key][0];
      let updateFun = pickedUpdater.current.onUpdateData[key][1];
      let defaultValue = pickedUpdater.current.onUpdateData[key][2];
      Object.keys(nodeFun).forEach((funKey) => {
        if (key.indexOf(funKey) > -1) {
          pickedDom.push(
            nodeFun[funKey](updateObj, updateFun, updateLabel, defaultValue)
          );
        }
      });
    }
    console.log(pickedDom);
  }
  return (
    <div>
      <div>
        视角高度
        <input
          type="range"
          min="500"
          max="9000"
          defaultValue={4000}
          onChange={(event) =>
            canvasUpdater.current("cameraHeight", event.target.value)
          }
        />
      </div>
      <div>
        背景颜色
        <input
          type="color"
          defaultValue="#000"
          onChange={(event) =>
            canvasUpdater.current("backgroundColor", event.target.value)
          }
        />
      </div>
      <hr></hr>
      {pickedDom}
    </div>
  );
}
