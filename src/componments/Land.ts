import * as THREE from "three";

import flowIF from "./flowIF";

export default class Land extends THREE.Mesh implements flowIF {
  color: string | number;
  isPicked: boolean;
  isHoving: boolean;
  onClick: (raycaster?: THREE.Raycaster) => void;
  offClick: (raycaster?: THREE.Raycaster) => void;
  switchLayer: (layer: number, flag: boolean) => void;
  onUpdateData: { [key: string]: [string, (value: any) => void, any?] };
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
        depthTest: true,
        opacity: 0.5,
      })
    );
    this.color = color;
    this.position.y = 0.9;
    scene.add(this);
    this.rotateX(-Math.PI / 2);

    this.isPicked = false;
    this.isHoving = false;
    this.onClick = (raycaster) => {
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
          if (this.material instanceof THREE.MeshBasicMaterial) {
            this.color = value;
            this.material.color.set(value);
          }
        },
      ],
      image: [
        "贴图",
        (value) => {
          var texture = new THREE.TextureLoader().load(
            URL.createObjectURL(value)
          );
          (this.material as THREE.MeshBasicMaterial).map = texture;
          (this.material as THREE.MeshBasicMaterial).needsUpdate = true;
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

    this.onMouseMove = (point, event) => {
      if (event.ctrlKey) {
        let parentLocation = this.position;
        this.geometry = new THREE.PlaneGeometry(
          Math.abs(point.x - parentLocation.x) * 2,
          Math.abs(point.z - parentLocation.z) * 2
        );
      } else {
        this.position.set(point.x, this.position.y, point.z);
      }
    };
  }
}
