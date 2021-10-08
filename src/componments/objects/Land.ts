import * as THREE from "three";
import _ from "lodash";

import flowIF from "./flowIFs";
import { OBJ_PROP_ACT } from "../../GLOBAL";

let temp_pickingCoord = [0, 0];
let temp_objCoord = [0, 0];
export default class Land extends THREE.Mesh implements flowIF {
  private _color: string;
  private _sizeX: number;
  private _sizeZ: number;
  flowUUID: string;
  isPicked: boolean;
  isHoving: boolean;
  afterPickFlag: boolean;
  private _isBlooming: boolean;
  lands: Land[];
  onClick: (raycaster?: THREE.Raycaster) => void;
  offClick: (raycaster?: THREE.Raycaster) => void;
  switchLayer: (layer: number, flag: boolean) => void;
  onMouseMove: (
    point: THREE.Vector3,
    event?: MouseEvent,
    raycaster?: THREE.Raycaster
  ) => void;
  editorID: string;
  configToPush: { [key: string]: any } = {};
  selfConfigUpdate?: (config: any, id?: string, tileType?: string) => void;

  constructor(
    scene: THREE.Scene,
    color: string,
    lands: Land[],
    editorID?: string
  ) {
    super(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        depthWrite: false,
        opacity: 0.3,
      })
    );
    this.editorID = editorID;
    this.sizeX = 200;
    this.sizeZ = 200;
    this.flowUUID = Math.floor(Math.random() * 0xffffff).toString(16);
    this.renderOrder = -999;
    this._color = color;
    this.lands = lands;
    this.position.y = 0.1;
    scene.add(this);
    this.rotateX(-Math.PI / 2);

    this.isPicked = false;
    this.isHoving = false;
    this.afterPickFlag = false;
    this._isBlooming = false;
    this.onClick = (raycaster) => {
      this.isPicked = true;
      this.afterPickFlag = true;
    };
    this.offClick = () => {
      this.isPicked = false;
      this.onUpdateData(["size_x", "size_z", "position"], OBJ_PROP_ACT.SET, [
        this.sizeX,
        this.sizeZ,
        `${this.position.x},${this.position.z}`,
        true,
      ]);
    };
    this.switchLayer = (layer, flag) => {
      this.isHoving = flag;
      if (flag) {
        this.layers.enable(layer);
      } else {
        this.layers.disable(layer);
      }
    };

    this.onMouseMove = (point, event) => {
      if (event.ctrlKey) {
        let parentLocation = this.position;
        this.sizeX = Math.abs(point.x - parentLocation.x) * 2;
        this.sizeZ = Math.abs(point.z - parentLocation.z) * 2;
      } else {
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
      }
    };
  }

  onUpdateData(
    propName: string | string[],
    action: OBJ_PROP_ACT,
    value?: any | any[],
    selfUpdate = true
  ) {
    let funMap: {
      [key: string]: [string, (value: any) => void, () => any, any[]?];
    } = {
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
          if (value && value instanceof File) {
            var texture = new THREE.TextureLoader().load(
              URL.createObjectURL(value)
            );
            (this.material as THREE.MeshBasicMaterial).map = texture;
            (this.material as THREE.MeshBasicMaterial).needsUpdate = true;
          }
        },
        () => {},
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

      size_x: ["宽度", (value) => (this.sizeX = value), () => this.sizeX],
      size_z: ["长度", (value) => (this.sizeZ = value), () => this.sizeZ],
    };

    if (action === OBJ_PROP_ACT.KEYS) return Object.keys(funMap);
    else if (typeof propName !== "string") {
      if (Array.isArray(value) && action === OBJ_PROP_ACT.SET) {
        propName.forEach((key, index) => {
          if (funMap[key] && funMap[key][OBJ_PROP_ACT.GET] !== value[index]) {
            this.configToPush[key] = value[index];
            selfUpdate && this.selfConfigUpdateDeb();
          }
        });
      }
    } else if (funMap[propName]) {
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
      this.selfConfigUpdate(this.configToPush, this.editorID, "flow3DLand");
      this.configToPush = {};
    }
  }, 1000);

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

  set sizeX(value: number) {
    this._sizeX = value;
    this.geometry = new THREE.PlaneGeometry(this.sizeX, this.sizeZ);
    this.geometry.computeBoundingBox();
  }
  get sizeX() {
    return this._sizeX;
  }
  set sizeZ(value: number) {
    this._sizeZ = value;
    this.geometry = new THREE.PlaneGeometry(this.sizeX, this.sizeZ);
    this.geometry.computeBoundingBox();
  }
  get sizeZ() {
    return this._sizeZ;
  }

  toADGEJSON() {
    let ret: any = {};
    ret.type = "Land";
    ret.THREEJson = this.toJSON();
    ret.isBlooming = this.isBlooming;
    ret.color = this.color;
    ret.editorID = this.editorID;
    ret.sizeX = this.sizeX;
    ret.sizeZ = this.sizeZ;
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
    this.editorID = json.editorID;
    this.sizeX = json.sizeX;
    this.sizeZ = json.sizeZ;
  }
}
