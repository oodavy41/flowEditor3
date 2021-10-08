import * as THREE from "three";
import _ from "lodash";

import { CAMERA_STATE, EventEmitter, OBJ_PROP_ACT } from "../../GLOBAL";

import flowIF from "./flowIFs";
import FragFactory from "../textRenderer/fragFactory";
import TextBoard from "../textRenderer/board";

let temp_pickingCoord = [0, 0];
let temp_objCoord = [0, 0];

export default class TextNode extends TextBoard implements flowIF {
  name: string;
  flowUUID: string;
  isPicked: boolean;
  isHoving: boolean;
  afterPickFlag: boolean;
  _rotateWithCamera: boolean;
  updateText: () => void;
  onClick: (raycaster?: THREE.Raycaster) => void;
  offClick: (raycaster?: THREE.Raycaster) => void;
  switchLayer: (layer: number, flag: boolean) => void;
  onMouseMove: (point: THREE.Vector3) => void;
  editorID: string;
  configToPush: { [key: string]: any } = {};
  selfConfigUpdate?: (config: any, id?: string, tileType?: string) => void;

  constructor(
    scene: THREE.Scene,
    text: string,
    size: number,
    color: string,
    textFactory: FragFactory,
    editorID?: string
  ) {
    super(textFactory, text || "TEXT text", size || 40, color);
    this.editorID = editorID;
    this.name = text || "TEXT text";
    this.flowUUID = Math.floor(Math.random() * 0xffffff).toString(16);
    this.position.y = 10;
    scene.add(this);
    this.rotateX(-Math.PI / 2);
    // this.rotateZ(Math.PI / 2);

    this.isPicked = false;
    this.afterPickFlag = false;
    this.isHoving = false;
    this._rotateWithCamera = false;
    this.onClick = () => {
      this.isPicked = true;
      this.afterPickFlag = true;
    };
    this.offClick = () => {
      this.isPicked = false;
      this.onUpdateData(
        "position",
        OBJ_PROP_ACT.SET,
        `${this.position.x},${this.position.z}`,
        true
      );
    };

    this.switchLayer = (layer, flag) => {
      this.isHoving = flag;
      if (flag) {
        this.layers.enable(layer);
      } else {
        this.layers.disable(layer);
      }
    };
    this.onMouseMove = (point) => {
      if (this.afterPickFlag) {
        temp_pickingCoord = [point.x, point.z];
        temp_objCoord = [this.position.x, this.position.z];
        this.afterPickFlag = false;
      } else {
        this.position.set(
          temp_objCoord[0] + point.x - temp_pickingCoord[0],
          this.position.y,
          temp_objCoord[1] + point.z - temp_pickingCoord[1]
        );
      }
    };
  }

  onUpdateData(
    propName: string,
    action: OBJ_PROP_ACT,
    value?: any,
    selfUpdate = true
  ) {
    let funMap: {
      [key: string]: [string, (value: any) => void, () => any, any[]?];
    } = {
      label_uuid: ["标识ID", (value) => {}, () => this.flowUUID],
      color: [
        "颜色",
        (value) => {
          this.color = value;
        },
        () => this.color,
      ],
      name: [
        "文字",
        (value) => {
          this.text = value;
          this.name = value;
        },
        () => this.text,
      ],
      number: [
        "层级",
        (value) => {
          this.position.y = value;
        },
        () => this.position.y,
      ],
      number_Size: [
        "字号",
        (value) => {
          this.size = +value;
        },
        () => this.size,
      ],
      position: [
        "位置",
        (value) => {
          let pos = /^(\-?\d+(\.\d+)?),\s*(\-?\d+(\.\d+)?)$/.exec(value);
          if (pos) {
            this.position.x = +pos[1];
            this.position.z = +pos[3];
          }
        },
        () => `${this.position.x},${this.position.z}`,
      ],
      list_rotateX: [
        "X旋转",
        (value) => (this.rotation.x = k2a(value)),
        () => a2k(this.rotation.x),
        [
          { key: "0°", value: 0 },
          { key: "90°", value: 0.5 * Math.PI },
          { key: "180°", value: Math.PI },
          { key: "270°", value: Math.PI * 1.5 },
        ],
      ],
      list_rotateY: [
        "Y旋转",
        (value) => (this.rotation.y = k2a(value)),
        () => a2k(this.rotation.y),
        [
          { key: "0°", value: 0 },
          { key: "90°", value: 0.5 * Math.PI },
          { key: "180°", value: Math.PI },
          { key: "270°", value: Math.PI * 1.5 },
        ],
      ],
      list_rotateZ: [
        "Z旋转",
        (value) => {
          if (value !== "FOLLOW") {
            this.rotation.z = k2a(value);
            this.rotateWithCamera = false;
          } else {
            this.rotateWithCamera = true;
          }
        },
        () => (this.rotateWithCamera ? "FOLLOW" : a2k(this.rotation.z)),
        [
          { key: "0°", value: 0 },
          { key: "90°", value: 0.5 * Math.PI },
          { key: "180°", value: Math.PI },
          { key: "270°", value: Math.PI * 1.5 },
          { key: "跟随视角", value: "FOLLOW" },
        ],
      ],
    };

    if (action === OBJ_PROP_ACT.KEYS) return Object.keys(funMap);
    else if (funMap[propName]) {
      if (action === OBJ_PROP_ACT.NAME || action === OBJ_PROP_ACT.LIST_NODES)
        return funMap[propName][action];
      else if (action === OBJ_PROP_ACT.SET) {
        if (
          propName.indexOf("position") !== -1 ||
          funMap[propName][OBJ_PROP_ACT.GET]() !== value
        ) {
          funMap[propName][action](value);
          this.configToPush[propName] = value;
          selfUpdate && this.selfConfigUpdateDeb();
        }
      } else {
        return funMap[propName][action] ? funMap[propName][action]() : null;
      }
    }
  }
  selfConfigUpdateDeb = _.debounce(() => {
    if (this.selfConfigUpdate && this.editorID) {
      this.selfConfigUpdate(this.configToPush, this.editorID, "flow3DText");
      this.configToPush = {};
    }
  }, 1000);

  get rotateWithCamera() {
    return this._rotateWithCamera;
  }
  set rotateWithCamera(value) {
    this._rotateWithCamera = value;
    if (value) {
      EventEmitter.on("changeCamera", this.changeCameraLauncher);
    } else {
      EventEmitter.removeListener("changeCamera", this.changeCameraLauncher);
    }
  }

  changeCameraLauncher = (data: CAMERA_STATE) => {
    switch (data) {
      case CAMERA_STATE.LEFT:
        this.rotation.z = Math.PI;
        break;
      case CAMERA_STATE.RIGHT:
        this.rotation.z = 0;
        break;
      case CAMERA_STATE.TOP:
        this.rotation.z = -Math.PI / 2;
        break;
      default:
        break;
    }
  };

  onDispose(scene: THREE.Scene, objArray: (flowIF & THREE.Object3D)[]) {
    scene.remove(this);
    let index = objArray.indexOf(this);
    if (index >= 0) {
      objArray.splice(index, 1);
      this.geometry.dispose();
      this.material.dispose();
    }
  }
  toADGEJSON() {
    let ret: any = {};
    ret.type = "TextBoard";
    ret.color = this.color;
    ret.flowUUID = this.flowUUID;
    ret.size = this.size;
    ret.text = this.text;
    ret.rotateWithCamera = this.rotateWithCamera;
    ret.matrix = [
      this.position.toArray(),
      this.scale.toArray(),
      this.rotation.toArray(),
    ];
    ret.editorID = this.editorID;

    return ret;
  }
  fromADGEJSON(json: any) {
    this.color = json.color;
    json.flowUUID && (this.flowUUID = json.flowUUID);
    this.text = this.name = json.text;
    this.size = json.size;
    this.rotateWithCamera = json.rotateWithCamera;
    this.position.fromArray(json.matrix[0]);
    this.scale.fromArray(json.matrix[1]);
    this.rotation.fromArray(json.matrix[2]);
    this.editorID = json.editorID;
  }
}

function k2a(key: string) {
  let ret = 0;
  switch (key) {
    case "90°":
      ret = 0.5 * Math.PI;
      break;
    case "180°":
      ret = Math.PI;
      break;
    case "270°":
      ret = Math.PI * 1.5;
      break;
    case "0°":
    default:
      ret = 0;
      break;
  }
  return ret;
}
function a2k(angle: number) {
  if (angle === 0.5 * Math.PI) return "90°";
  if (angle === Math.PI) return "180°";
  if (angle === Math.PI * 1.5) return "270°";
  if (angle === 0) return "0°";
}
