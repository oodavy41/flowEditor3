import * as THREE from "three";

import flowIF from "./flowIF";

export default class Land extends THREE.Mesh implements flowIF {
  _color: string | number;
  isPicked: boolean;
  isHoving: boolean;
  _isBlooming: boolean;
  lands: Land[];
  onClick: (raycaster?: THREE.Raycaster) => void;
  offClick: (raycaster?: THREE.Raycaster) => void;
  switchLayer: (layer: number, flag: boolean) => void;
  onUpdateData: { [key: string]: [string, (value: any) => void, any?] };
  onMouseMove: (
    point: THREE.Vector3,
    event?: MouseEvent,
    raycaster?: THREE.Raycaster
  ) => void;

  constructor(scene: THREE.Scene, color: string | number, lands: Land[]) {
    super(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        depthWrite: false,
        opacity: 0.3,
      })
    );
    this._color = color;
    this.lands = lands;
    this.position.y = 0.1;
    scene.add(this);
    this.rotateX(-Math.PI / 2);

    this.isPicked = false;
    this.isHoving = false;
    this._isBlooming = false;
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
          this.color = value;
        },
        () => this.color,
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
      number_icon_rotateZ: [
        "旋转",
        (value) => (this.rotation.z = +value),
        () => this.rotation.z,
      ],
      number: [
        "层级",
        (value) => {
          this.position.y = value;
        },
        () => this.position.y,
      ],
      number_opacity: [
        "透明度",
        (value) => {
          (this.material as THREE.MeshBasicMaterial).opacity = +value;
        },
        () => (this.material as THREE.MeshBasicMaterial).opacity,
      ],
      checker_shadow: [
        "外阴影",
        (value) => {
          this.isBlooming = value;
        },
        () => this.isBlooming,
      ],
    };

    this.onMouseMove = (point, event) => {
      if (event.ctrlKey) {
        let parentLocation = this.position;
        this.geometry = new THREE.PlaneGeometry(
          Math.abs(point.x - parentLocation.x) * 2,
          Math.abs(point.z - parentLocation.z) * 2
        );
        this.geometry.computeBoundingBox();
      } else {
        this.position.set(point.x, this.position.y, point.z);
      }
    };
  }

  onDispose(scene: THREE.Scene, objArray: (flowIF & THREE.Object3D)[]) {
    scene.remove(this);
    let index = objArray.indexOf(this);
    if (index >= 0) {
      objArray.splice(index, 1);
      this.geometry.dispose();
      (this.material as THREE.MeshBasicMaterial).dispose();
    }
  }

  set isBlooming(value: boolean) {
    this._isBlooming = value;
    if (value) {
      if (!this.lands.find((l) => l === this)) this.lands.push(this);
    } else {
      let index = this.lands.indexOf(this);
      if (index > 0) this.lands.splice(index, 1);
    }
    console.log(this.uuid, this.lands, value);
  }
  get isBlooming() {
    return this._isBlooming;
  }

  set color(value) {
    this._color = value;
    (this.material as THREE.MeshBasicMaterial).color.set(value);
  }

  get color() {
    return this._color;
  }

  toADGEJSON() {
    let ret: any = {};
    ret.type = "Land";
    ret.THREEJson = this.toJSON();
    ret.isBlooming = this.isBlooming;
    ret.color = this.color;
    return ret;
  }
  fromADGEJSON(json: any) {
    this.color = json.color;
    this.isBlooming = json.isBlooming;
    new THREE.ObjectLoader().parse(json.THREEJson, (object) => {
      if (object instanceof THREE.Mesh) {
        this.material = object.material;
        this.geometry = object.geometry;
        this.position.copy(object.position);
        this.scale.copy(object.scale);
        this.rotation.copy(object.rotation);
      }
    });
  }
}
