import * as THREE from "three";

import flowIF from "./flowIF";

export default class Land extends THREE.Mesh implements flowIF {
  color: string | number;
  isPicked: boolean;
  anchorIsPicked: boolean;
  isHoving: boolean;
  onClick: (raycaster?: THREE.Raycaster) => void;
  offClick: (raycaster?: THREE.Raycaster) => void;
  onUpdateData: { [key: string]: (value: any) => void };
  onMouseMove: (
    point: THREE.Vector3,
    event?: MouseEvent,
    raycaster?: THREE.Raycaster
  ) => void;

  constructor(scene: THREE.Scene, color: string | number) {
    super(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.5,
      })
    );
    this.color = color;
    this.position.y = 1;
    scene.add(this);
    this.rotateX(-Math.PI / 2);

    this.isPicked = false;
    this.isHoving = false;
    this.anchorIsPicked = false;
    this.onClick = (raycaster) => {
      this.isPicked = true;
    };
    this.offClick = () => {
      this.anchorIsPicked = false;
    };
    this.onUpdateData = {
      color: (value) => {
        if (this.material instanceof THREE.MeshBasicMaterial) {
          this.color = value;
          this.material.color.set(value);
        }
      },
    };

    this.onMouseMove = (point, event) => {
      if (event.ctrlKey) {
        let parentLocation = this.position;
        this.geometry = new THREE.PlaneGeometry(
          Math.abs(point.x - parentLocation.x) * 2,
          Math.abs(point.z - parentLocation.z) * 2
        );
      } else {
        this.position.set(point.x, 1, point.z);
      }
    };
  }
}
