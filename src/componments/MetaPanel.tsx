import React from "react";
import flowIF from "./flowIF";

interface metaPanelIF {
  update: number;
  canvasUpdater: React.MutableRefObject<(key: string, value: any) => void>;
  pickedUpdater: React.MutableRefObject<flowIF & THREE.Object3D>;
}

export default function MetaPanel(props: metaPanelIF) {
  let { update, canvasUpdater, pickedUpdater } = props;
  let pickedDom = [];
  if (pickedUpdater.current) {
    for (let key in pickedUpdater.current.onUpdateData) {
      let updateObj = pickedUpdater.current;
      let updateFun = pickedUpdater.current.onUpdateData[key];
      switch (key) {
        case "color":
          pickedDom.push(
            <div key={update + 1}>
              <input
                type="color"
                defaultValue={updateObj.color}
                onChange={(event) => updateFun(event.target.value)}
              />
            </div>
          );
          break;
        case "name":
          pickedDom.push(
            <div key={update + 2}>
              <input
                type="text"
                defaultValue={updateObj.name}
                onChange={(event) => updateFun(event.target.value)}
              />
            </div>
          );
          break;
        case "image":
          pickedDom.push(
            <input
              type="file"
              accept="image/*"
              onChange={(event) => updateFun(event.target.files[0])}
            ></input>
          );
          break;
        case "model":
          pickedDom.push(
            <input
              type="file"
              accept="*/obj"
              onChange={(event) => updateFun(event.target.files[0])}
            ></input>
          );
          break;
        default:
          break;
      }
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
