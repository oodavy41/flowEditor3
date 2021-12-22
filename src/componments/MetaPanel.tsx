import React from "react";
import flowIF, { dataSetIF } from "./objects/flowIFs";
import StepStyleEditor from "./stepStyleEditor";
import { OBJ_PROP_ACT } from "../GLOBAL";
import UniformSetEditor from "./uniformSetEditor";

interface metaPanelIF {
  scene: THREE.Scene;
  objArray: ((flowIF | (flowIF & dataSetIF)) & THREE.Object3D)[];
  compModel: boolean;
  canvasUpdater: (key: string, value: any) => void;
  pickedUpdater: (flowIF | (flowIF & dataSetIF)) & THREE.Object3D;
}

export default function MetaPanel(props: metaPanelIF) {
  let { scene, objArray, compModel, canvasUpdater, pickedUpdater } = props;
  let [renewFlag, renewer] = React.useState(0);
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
          defaultValue={"#" + defaultVaule.toString(16)}
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
          {keyObj.map((info: { key: string; value: number }) => (
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
    attrSet: (updateObj, updateFun, updateLabel, defaultValue) => (
      <UniformSetEditor
        uniformList={defaultValue}
        setFunction={(newUniforms) => updateFun(newUniforms)}
      ></UniformSetEditor>
    ),
  };
  let pickedDom: JSX.Element[] = [];
  if (pickedUpdater) {
    pickedUpdater.onUpdateData("", OBJ_PROP_ACT.KEYS).forEach((key: string) => {
      let updateObj = pickedUpdater;
      let updateLabel = pickedUpdater.onUpdateData(key, OBJ_PROP_ACT.NAME);
      let updateFun = (value: any) => {
        renewer(Math.random());
        pickedUpdater.onUpdateData(key, OBJ_PROP_ACT.SET, value);
      };
      let defaultValue = pickedUpdater.onUpdateData(key, OBJ_PROP_ACT.GET);
      Object.keys(nodeFun).forEach((funKey) => {
        if (key.indexOf(funKey) > -1 && (!compModel || funKey === "label")) {
          pickedDom.push(
            nodeFun[funKey](
              updateObj,
              updateFun,
              updateLabel,
              defaultValue,
              pickedUpdater.onUpdateData(key, OBJ_PROP_ACT.LIST_NODES)
            )
          );
        }
      });
    });
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
              onChange={(event) => canvasUpdater("BgColor", event.target.value)}
            />
          </div>
          <div>
            对比度滤镜
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              defaultValue={1}
              onChange={(event) =>
                canvasUpdater("setContrast", event.target.value)
              }
            />
          </div>
          <div>
            亮度滤镜
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              defaultValue={1}
              onChange={(event) =>
                canvasUpdater("setBrightness", event.target.value)
              }
            />
          </div>
          <div>
            饱和度滤镜
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              defaultValue={1}
              onChange={(event) =>
                canvasUpdater("setSaturate", event.target.value)
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
