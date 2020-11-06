import * as THREE from "three";

import flowIF from "./flowIF";
import flowLine from "./Line";
import FragFactory from "./textRenderer/fragFactory";
import TextFrag from "./textRenderer/fragment";

export default class flowNode extends THREE.Mesh implements flowIF {
  name: string;
  nameText: TextFrag;
  color: string | number;
  starts: flowLine[];
  ends: flowLine[];
  isPicked: boolean;
  isHoving: boolean;
  onClick: () => void;
  onUpdateData: { [key: string]: (value: any) => void };
  onMouseMove: (point: THREE.Vector3) => void;

  constructor(
    scene: THREE.Scene,
    textFactory: FragFactory,
    name: string,
    color: string | number
  ) {
    super(
      new THREE.BoxGeometry(80, 40, 80),
      new THREE.MeshBasicMaterial({ color: color })
    );
    this.color = color;
    this.name = name;
    this.nameText = textFactory.frag(name, 20, "#999").obj;
    this.nameText.position.y = 45;
    this.add(this.nameText);
    scene.add(this);

    this.starts = [];
    this.ends = [];

    this.isPicked = false;
    this.isHoving = false;
    this.onClick = () => {
      this.isPicked = true;
    };
    this.onUpdateData = {
      color: (value) => {
        if (this.material instanceof THREE.MeshBasicMaterial) {
          this.color = value;
          this.material.color.set(value);
        }
      },
      name: (value) => {
        this.nameText.text = value;
      },
    };

    this.onMouseMove = (point) => {
      this.position.set(point.x, 0, point.z);
    };
  }
}
