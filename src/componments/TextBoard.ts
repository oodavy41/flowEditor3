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
    this.position.y = 1;
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
        this.position.y,
      ],
    };

    this.onMouseMove = (point) => {
      this.position.set(point.x, this.position.y, point.z);
    };
  }
}
