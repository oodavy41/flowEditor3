import React from "react";
import flowIF, { dataSetIF } from "./objects/flowIFs";
import StepStyleEditor from "./stepStyleEditor";

interface metaPanelIF {
  scene: THREE.Scene;
  objArray: ((flowIF | (flowIF & dataSetIF)) & THREE.Object3D)[];
  compModel: boolean;
  canvasUpdater: (key: string, value: any) => void;
  pickedUpdater: (flowIF | (flowIF & dataSetIF)) & THREE.Object3D;
}

export default function MetaPanel(props: metaPanelIF) {
  let { scene, objArray, compModel, canvasUpdater, pickedUpdater } = props;
  let nodeFun: {
    [key: string]: (
      updateObj: (flowIF | (flowIF & dataSetIF)) & THREE.Object3D,
      updateFun: (value: any) => void,
      updateLabel?: string,
      defaultValue?: any,
      keyObj?: any
    ) => JSX.Element;
  } = {
    color: (updateObj, updateFun, updateLabel, defaultVaule) => (
      <div key={Math.random()}>
        {updateLabel || "颜色"}:
        <input
          type="color"
          defaultValue={defaultVaule}
          onChange={(event) => updateFun(event.target.value)}
        />
      </div>
    ),
    list: (updateObj, updateFun, updateLabel, defaultValue, keyObj) => (
      <div key={Math.random()}>
        {updateLabel}
        <select
          defaultValue={defaultValue}
          onChange={(event) => updateFun(event.target.value)}
        >
          {keyObj[3].map((info: { key: string; value: number }) => (
            <option value={info.value}>{info.key}</option>
          ))}
        </select>
      </div>
    ),
    name: (updateObj, updateFun, updateLabel, defaultVaule) => (
      <div key={Math.random()}>
        {updateLabel || "名字"}:
        <input
          type="text"
          defaultValue={defaultVaule}
          onChange={(event) => updateFun(event.target.value)}
        />
      </div>
    ),
    image: (updateObj, updateFun, updateLabel) => (
      <div key={Math.random()}>
        {updateLabel || "贴图"}:
        <input
          type="file"
          accept="image/*"
          onChange={(event) => updateFun(event.target.files[0])}
        ></input>
      </div>
    ),
    model: (updateObj, updateFun, updateLabel) => (
      <div key={Math.random()}>
        {updateLabel || "模型"}:
        <input
          type="file"
          accept="*/obj"
          onChange={(event) => updateFun(event.target.files[0])}
        ></input>
      </div>
    ),
    number: (updateObj, updateFun, updateLabel, defaultVaule) => (
      <div key={Math.random()}>
        {updateLabel || "大小"}:
        <input
          type="number"
          defaultValue={defaultVaule}
          step={0.1}
          onChange={(event) => updateFun(event.target.value)}
        ></input>
      </div>
    ),
    checker: (updateObj, updateFun, updateLabel, defaultVaule) => (
      <div key={Math.random()}>
        {updateLabel || "选项"}:
        <input
          type="checkbox"
          defaultChecked={defaultVaule}
          onChange={(event) => {
            updateFun(event.target.checked);
          }}
        ></input>
      </div>
    ),
    text: (updateObj, updateFun, updateLabel, defaultVaule) => (
      <div key={Math.random()}>
        {updateLabel || "属性"}:
        <input
          type="text"
          defaultValue={defaultVaule}
          onChange={(event) => updateFun(event.target.value)}
        ></input>
      </div>
    ),
    label: (updateObj, updateFun, updateLabel, defaultVaule) => (
      <div
        key={Math.random()}
        onClick={() => {
          navigator.clipboard.writeText(defaultVaule);
        }}
      >
        {updateLabel || "文本框"}: {defaultVaule}
      </div>
    ),
    steps: (updateObj, updateFun, updateLabel, defaultValue) => (
      <StepStyleEditor
        UUID={updateObj.uuid}
        levels={defaultValue}
        onChange={(newSteps) => updateFun(newSteps)}
      ></StepStyleEditor>
    ),
  };
  let pickedDom: JSX.Element[] = [];
  if (pickedUpdater) {
    for (let key in pickedUpdater.onUpdateData) {
      let updateObj = pickedUpdater;
      let updateLabel = pickedUpdater.onUpdateData[key][0];
      let updateFun = pickedUpdater.onUpdateData[key][1];
      let defaultValue =
        pickedUpdater.onUpdateData[key][2] &&
        pickedUpdater.onUpdateData[key][2]();
      Object.keys(nodeFun).forEach((funKey) => {
        if (key.indexOf(funKey) > -1 && (!compModel || funKey === "label")) {
          pickedDom.push(
            nodeFun[funKey](
              updateObj,
              updateFun,
              updateLabel,
              defaultValue,
              pickedUpdater.onUpdateData[key]
            )
          );
        }
      });
    }
    !compModel &&
      pickedDom.push(
        <div>
          <button onClick={() => pickedUpdater.onDispose(scene, objArray)}>
            删除
          </button>
        </div>
      );
  }
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        padding: 5,
        color: "#000",
        backgroundColor: "rgba(255,255,255,0.4)",
      }}
    >
      {compModel ? (
        <>{pickedDom}</>
      ) : (
        <>
          <div>
            视角高度
            <input
              type="range"
              min="500"
              max="9000"
              defaultValue={4000}
              onChange={(event) =>
                canvasUpdater("cameraHeight", event.target.value)
              }
            />
          </div>
          <div>
            伪光影强度
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              defaultValue={0.5}
              onChange={(event) =>
                canvasUpdater("sceneLight", event.target.value)
              }
            />
          </div>
          <div>
            背景颜色
            <input
              type="color"
              defaultValue="#000"
              onChange={(event) =>
                canvasUpdater("backgroundColor", event.target.value)
              }
            />
          </div>
          {pickedDom.length > 0 && <hr></hr>}
          {pickedDom}
        </>
      )}
    </div>
  );
}
