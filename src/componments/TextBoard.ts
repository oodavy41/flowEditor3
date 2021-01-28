import * as THREE from "three";
import Events from "events";

import { CAMERA_STATE, EventEmitter } from "../GLOBAL";

import flowIF from "./flowIF";
import FragFactory from "./textRenderer/fragFactory";
import TextBoard from "./textRenderer/board";

export default class TextNode extends TextBoard implements flowIF {
  name: string;
  isPicked: boolean;
  isHoving: boolean;
  updateText: () => void;
  onClick: (raycaster?: THREE.Raycaster) => void;
  offClick: (raycaster?: THREE.Raycaster) => void;
  switchLayer: (layer: number, flag: boolean) => void;
  onUpdateData: { [key: string]: [string, (value: any) => void, any?, any[]?] };
  onMouseMove: (point: THREE.Vector3) => void;

  constructor(
    scene: THREE.Scene,
    text: string,
    size: number,
    color: string | number,
    textFactory: FragFactory
  ) {
    super(textFactory, text || "TEXT text", size || 40, color);
    this.name = text || "TEXT text";
    this.position.y = 10;
    scene.add(this);
    this.rotateX(-Math.PI / 2);
    // this.rotateZ(Math.PI / 2);

    this.isPicked = false;
    this.isHoving = false;
    this.onClick = () => {
      this.isPicked = true;
    };
    this.offClick = () => {
      this.isPicked = false;
    };

    let changeCameraLauncher = (data: CAMERA_STATE) => {
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

    this.switchLayer = (layer, flag) => {
      this.isHoving = flag;
      if (flag) {
        this.layers.enable(layer);
      } else {
        this.layers.disable(layer);
      }
    };
    this.onUpdateData = {
      color: [
        "颜色",
        (value) => {
          this.color = value;
        },
      ],
      name: [
        "文字",
        (value) => {
          this.text = value;
          this.name = value;
        },
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
      list_rotateX: [
        "X旋转",
        (value) => (this.rotation.x = value),
        () => this.rotation.x,
        [
          { key: "0°", value: 0 },
          { key: "90°", value: 0.5 * Math.PI },
          { key: "180°", value: Math.PI },
          { key: "270°", value: Math.PI * 1.5 },
        ],
      ],
      list_rotateY: [
        "Y旋转",
        (value) => (this.rotation.y = value),
        () => this.rotation.y,
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
            this.rotation.z = value;
            EventEmitter.removeListener("changeCamera", changeCameraLauncher);
          } else {
            EventEmitter.on("changeCamera", changeCameraLauncher);
          }
        },
        () => this.rotation.z,
        [
          { key: "0°", value: 0 },
          { key: "90°", value: 0.5 * Math.PI },
          { key: "180°", value: Math.PI },
          { key: "270°", value: Math.PI * 1.5 },
          { key: "跟随视角", value: "FOLLOW" },
        ],
      ],
    };

    this.onMouseMove = (point) => {
      this.position.set(point.x, this.position.y, point.z);
    };
  }

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
    ret.size = this.size;
    ret.text = this.text;
    ret.matrix = [
      this.position.toArray(),
      this.scale.toArray(),
      this.rotation.toArray(),
    ];
    return ret;
  }
  fromADGEJSON(json: any) {
    this.color = json.color;
    this.text = this.name = json.text;
    this.size = json.size;
    this.position.fromArray(json.matrix[0]);
    this.scale.fromArray(json.matrix[1]);
    this.rotation.fromArray(json.matrix[2]);
  }
}
