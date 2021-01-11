import * as THREE from "three";

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
  onUpdateData: { [key: string]: [string, (value: any) => void, any?] };
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
      number_rotateX: [
        "X旋转",
        (value) => (this.rotation.x = value),
        () => this.rotation.x,
      ],
      number_rotateY: [
        "Y旋转",
        (value) => (this.rotation.y = value),
        () => this.rotation.y,
      ],
      number_rotateZ: [
        "Z旋转",
        (value) => (this.rotation.z = value),
        () => this.rotation.z,
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
