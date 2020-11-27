import * as THREE from "three";

import flowIF from "./flowIF";
import flowLine from "./Line";
import flowNode from "./Node";

export default class linePoint extends THREE.Mesh implements flowIF {
  color: string | number;
  line: flowLine;
  isPicked: boolean;
  isHoving: boolean;
  key: number;
  onClick: () => void;
  offClick: () => void;
  switchLayer: (layer: number, flag: boolean) => void;
  onUpdateData: { [key: string]: [string, (value: any) => void, any?] };
  onMouseMove?: (
    point: THREE.Vector3,
    event?: MouseEvent,
    raycaster?: THREE.Raycaster
  ) => void;
  constructor(line: flowLine, position: THREE.Vector3) {
    super(
      new THREE.SphereGeometry(5),
      new THREE.MeshBasicMaterial({
        color: "red",
      })
    );
    line.add(this);
    this.position.copy(position);

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
    this.onMouseMove = (point) => {
      this.position.set(point.x, 0, point.z);
    };
  }
}
