import * as THREE from "three";
import _ from "lodash";

import flowIF from "./flowIFs";
import { OBJ_PROP_ACT } from "../../GLOBAL";

let shadowImg =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAEtGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS41LjAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iCiAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIKICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIgogICAgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIKICAgZXhpZjpQaXhlbFhEaW1lbnNpb249IjI1NiIKICAgZXhpZjpQaXhlbFlEaW1lbnNpb249IjI1NiIKICAgZXhpZjpDb2xvclNwYWNlPSIxIgogICB0aWZmOkltYWdlV2lkdGg9IjI1NiIKICAgdGlmZjpJbWFnZUxlbmd0aD0iMjU2IgogICB0aWZmOlJlc29sdXRpb25Vbml0PSIyIgogICB0aWZmOlhSZXNvbHV0aW9uPSI3Mi8xIgogICB0aWZmOllSZXNvbHV0aW9uPSI3Mi8xIgogICBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIgogICBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiCiAgIHhtcDpNb2RpZnlEYXRlPSIyMDIx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";

let temp_pickingCoord = [0, 0];
let temp_objCoord = [0, 0];
export default class Land extends THREE.Mesh implements flowIF {
  private _color: string;
  private _sizeX: number;
  private _sizeZ: number;
  private _shadowOn: boolean;
  shadow: THREE.Mesh;
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
        depthTest: false,
        opacity: 0.3,
      })
    );
    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load(shadowImg),
        transparent: true,
      })
    );
    this.shadow.renderOrder = -1000;
    this.add(this.shadow);
    this.shadow.visible = false;
    this.shadow.position.z = -20;
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
      checker_shadowBottom: [
        "下阴影",
        (value) => {
          this.shadowOn = value;
        },
        () => this.shadowOn,
      ],
      number_shadowDepth: [
        "阴影深度",
        (value) => {
          this.shadow.position.z = value;
        },
        () => this.shadow.position.z,
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
    this.geometry.dispose();
    (this.material as THREE.MeshBasicMaterial).dispose();
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
    this.shadow.geometry = new THREE.PlaneGeometry(this.sizeX, this.sizeZ);
    this.geometry.computeBoundingBox();
    this.shadow.geometry.computeBoundingBox();
  }
  get sizeX() {
    return this._sizeX;
  }
  set sizeZ(value: number) {
    this._sizeZ = value;
    this.geometry = new THREE.PlaneGeometry(this.sizeX, this.sizeZ);
    this.shadow.geometry = new THREE.PlaneGeometry(this.sizeX, this.sizeZ);
    this.geometry.computeBoundingBox();
    this.shadow.geometry.computeBoundingBox();
  }
  get sizeZ() {
    return this._sizeZ;
  }
  set shadowOn(value: boolean) {
    this._shadowOn = value;
    (this.material as THREE.Material).transparent = !value;
    (this.material as THREE.Material).depthTest = value;
    this.shadow.visible = value;
  }
  get shadowOn() {
    return this._shadowOn;
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
    ret.shadowOn = this.shadowOn;
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
    this.shadowOn = json.shadowOn || false;
  }
}
