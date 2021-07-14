import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

import { StyleNode, OBJ_PROP_ACT } from "../../GLOBAL";
import { get, post } from "../../tools/http";

import flowIF, { dataSetIF } from "./flowIFs";
import flowLine from "./Line";
import flowIcon from "./Land";
import TextBoard from "./TextBoard";
import FragFactory from "../textRenderer/fragFactory";

const SIZE = 40;
const hideOpacity = 0.2;

export default class flowNode extends THREE.Mesh implements flowIF, dataSetIF {
  private _name: string;
  private _dataRequestInterval: number;
  private _queryData: any;
  private _hide: boolean;
  private _data: number;
  private _stateSteps: StyleNode[];
  nameText: TextBoard;
  mainMesh: THREE.Mesh;
  line: THREE.LineSegments;
  iconPlane: THREE.Mesh;
  private _color: string;
  flowUUID: string;
  private _lineColor: string;
  starts: flowLine[];
  ends: flowLine[];
  isPicked: boolean;
  isHoving: boolean;
  onClick: () => void;
  offClick: () => void;
  switchLayer: (layer: number, flag: boolean) => void;
  onMouseMove: (point: THREE.Vector3) => void;
  editorID: string;
  selfConfigUpdate?: (config: any, id?: string, tileType?: string) => void;

  constructor(
    scene: THREE.Scene,
    textFactory: FragFactory,
    name: string,
    color: string,
    lineColor?: string,
    editorID?: string
  ) {
    super(
      new THREE.BoxGeometry(SIZE, 2 * SIZE, SIZE),
      new THREE.MeshBasicMaterial({
        transparent: true,
        depthWrite: false,
        opacity: 0,
      })
    );
    this.editorID = editorID;
    this.flowUUID = Math.floor(Math.random() * 0xffffff).toString(16);
    this.stateSteps = [];
    this._color = color;
    this._lineColor = lineColor || "#888";
    this._name = name;
    this.position.y = 5;
    let geo = new THREE.BoxGeometry(SIZE, SIZE, SIZE);
    this.mainMesh = new THREE.Mesh(
      geo,
      new THREE.MeshLambertMaterial({
        color: color,
        transparent: true,
      })
    );
    const edges = new THREE.EdgesGeometry(this.mainMesh.geometry);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({
        color: this.lineColor,
        linewidth: 1,
        transparent: true,
      })
    );
    this.line = line;
    line.scale.set(1.01, 1.01, 1.01);
    this.mainMesh.add(line);
    this.mainMesh.position.y = SIZE / 2;
    this.add(this.mainMesh);

    this.iconPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(SIZE * 0.9, SIZE * 0.9),
      new THREE.MeshBasicMaterial({
        color: "#fff",
        transparent: true,
        depthWrite: false,
        opacity: 0.8,
      })
    );
    this.iconPlane.position.y = SIZE + 1;
    this.iconPlane.rotateX(-Math.PI / 2);
    this.add(this.iconPlane);
    this.iconPlane.visible = false;

    this.nameText = new TextBoard(
      scene,
      name,
      (SIZE * 2) / 4,
      "#4286c4",
      textFactory
    );
    this.nameText.rotation.z = -Math.PI / 2;
    this.nameText.position.x = -SIZE * 1.2;
    this.add(this.nameText);
    scene.add(this);

    this.starts = [];
    this.ends = [];

    this.isPicked = false;
    this.isHoving = false;
    this.onClick = () => {
      this.isPicked = true;
      this.starts.forEach((_: flowLine) => _.onNodeClick(true, this));
      this.ends.forEach((_: flowLine) => _.onNodeClick(false, this));
      console.log(this.stateSteps, this.data);
    };
    this.offClick = () => {
      this.isPicked = false;
      this.starts.forEach((_: flowLine) => _.offNodeClick());
      this.ends.forEach((_: flowLine) => _.offNodeClick());
      this.onUpdateData(
        "position",
        OBJ_PROP_ACT.SET,
        `${this.position.x},${this.position.z}`
      );
    };
    this.switchLayer = (layer, flag) => {
      this.isHoving = flag;
      if (flag) {
        this.mainMesh.layers.enable(layer);
        this.layers.enable(layer);
      } else {
        this.mainMesh.layers.disable(layer);
        this.layers.disable(layer);
      }
    };

    this.onMouseMove = (point) => {
      if (this.isPicked) {
        this.position.set(point.x, 5, point.z);
        this.starts.forEach((_: flowLine) => _.updateFlowLine(true, this));
        this.ends.forEach((_: flowLine) => _.updateFlowLine(false, this));
      }
    };
  }

  switchRoadFocus(hide: boolean) {
    switchFocus(this, hide, true);
    switchFocus(this, hide, false);
  }

  onUpdateData(propName: string, action: OBJ_PROP_ACT, value?: any) {
    let funMap: {
      [key: string]: [string, (value: any) => void, () => any, any[]?];
    } = {
      label_uuid: ["标识ID", (value) => {}, () => this.flowUUID],
      color: [
        "颜色",
        (value) => {
          this.color = value;
        },
        () => this.color,
      ],
      list_type: [
        "形状",
        (value) => {
          console.log(value as geometryType);
          let geo = geoGen(value as geometryType, SIZE);
          this.mainMesh.geometry = geo;
          this.line.geometry = new THREE.EdgesGeometry(geo);
        },
        () => "BOX",
        [
          { key: "BOX", value: geometryType.BOX },
          { key: "CYLINDER", value: geometryType.CYLINDER },
          { key: "DODECAHE", value: geometryType.DODECAHE },
          { key: "SPHERE", value: geometryType.SPHERE },
          { key: "CONE", value: geometryType.CONE },
        ],
      ],
      color_line: [
        "描边颜色",
        (value) => {
          this.lineColor = value;
        },
        () => this.lineColor,
      ],
      name: [
        "名称",
        (value) => {
          this.text = value;
        },
        () => this.text,
      ],
      model: [
        "模型",
        (value) => {
          if (value && value instanceof File) {
            new OBJLoader().load(URL.createObjectURL(value), (obj) => {
              this.mainMesh.geometry = (obj.children[0] as THREE.Mesh).geometry;
              this.line.geometry = new THREE.EdgesGeometry(
                this.mainMesh.geometry
              );
            });
          }
        },
        () => {},
      ],
      image_icon: [
        "贴图",
        (value) => {
          if (value && value instanceof File) {
            var texture = new THREE.TextureLoader().load(
              URL.createObjectURL(value)
            );
            this.iconPlane.visible = true;
            (this.iconPlane.material as THREE.MeshBasicMaterial).map = texture;
            (this.iconPlane.material as THREE.MeshBasicMaterial).needsUpdate =
              true;
          }
        },
        () => {},
      ],
      number_icon_scaleX: [
        "图标x缩放",
        (value) => (this.iconPlane.scale.x = +value),
        () => this.iconPlane.scale.x,
      ],
      number_icon_scaleY: [
        "图标y缩放",
        (value) => (this.iconPlane.scale.y = +value),
        () => this.iconPlane.scale.y,
      ],
      number_icon_rotateZ: [
        "图标旋转",
        (value) => (this.iconPlane.rotation.z = +value),
        () => this.iconPlane.rotation.z,
      ],
      number_iconHeight: [
        "图片高度",
        (value) => {
          this.iconPlane.position.y = +value;
        },
        () => this.iconPlane.position.y,
      ],
      number_text: [
        "文字偏移",
        (value) => {
          this.nameText.position.x = -value;
        },
        () => -this.nameText.position.x,
      ],
      number_scaleX: [
        "x缩放",
        (value) => (this.mainMesh.scale.x = value),
        () => this.mainMesh.scale.x,
      ],
      number_scaleY: [
        "y缩放",
        (value) => {
          this.mainMesh.scale.y = value;
          this.mainMesh.position.y = (this.mainMesh.scale.y * SIZE) / 2;
        },
        () => this.mainMesh.scale.y,
      ],
      number_scaleZ: [
        "z缩放",
        (value) => (this.mainMesh.scale.z = value),
        () => this.mainMesh.scale.z,
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
        () => this.position.x,
      ],
      steps: [
        "数据状态",
        (value) => (this.stateSteps = value),
        () => this.stateSteps,
      ],
    };
    if (action === OBJ_PROP_ACT.KEYS) return Object.keys(funMap);
    else if (funMap[propName]) {
      if (action === OBJ_PROP_ACT.NAME || action === OBJ_PROP_ACT.LIST_NODES)
        return funMap[propName][action];
      else if (action === OBJ_PROP_ACT.SET) {
        if (
          propName.indexOf("position") !== -1 ||
          funMap[propName][OBJ_PROP_ACT.GET]() !== value
        ) {
          funMap[propName][action](value);
          if (this.selfConfigUpdate && this.editorID) {
            let config: { [key: string]: any } = {};
            config[propName] = value;
            this.selfConfigUpdate(config, this.editorID, "flow3DNode");
          }
        }
      } else {
        return funMap[propName][action] ? funMap[propName][action]() : null;
      }
    }
  }

  updateData() {
    if (!(this.data && this.stateSteps && this.stateSteps.length > 0)) return;
    let steps = [...this.stateSteps];
    steps.unshift({
      cutPoint: -Infinity,
      color: this.color,
      lineColor: this.lineColor,
    });
    steps.length > 2 && steps.sort((a, b) => a.cutPoint - b.cutPoint);
    let k = 0;
    while (k !== steps.length && this.data > steps[k].cutPoint) k++;
    (this.mainMesh.material as THREE.MeshBasicMaterial).color.set(
      steps[k - 1].color
    );
    (this.line.material as THREE.LineBasicMaterial).color.set(
      steps[k - 1].lineColor
    );
  }

  set color(value) {
    if (this.mainMesh.material) {
      (this.mainMesh.material as THREE.MeshBasicMaterial).color.set(value);
      this._color = value;
    }
  }
  get color() {
    return this._color;
  }
  set lineColor(value) {
    if (this.line.material instanceof THREE.LineBasicMaterial) {
      this.line.material.color.set(value);
      this._lineColor = value;
    }
  }
  get lineColor() {
    return this._lineColor;
  }
  set hide(value) {
    this._hide = value;
    if (value) {
      (this.mainMesh.material as THREE.Material).opacity = hideOpacity;
      (this.line.material as THREE.Material).opacity = hideOpacity;
      (this.iconPlane.material as THREE.Material).opacity = hideOpacity;
      this.nameText.material.opacity = hideOpacity;
    } else {
      (this.mainMesh.material as THREE.Material).opacity = 1;
      (this.line.material as THREE.Material).opacity = 1;
      (this.iconPlane.material as THREE.Material).opacity = 1;
      this.nameText.material.opacity = 1;
    }
  }
  get hide() {
    return this._hide;
  }
  set text(value) {
    this._name = value;
    this.nameText.text = value;
  }
  get text() {
    return this._name;
  }

  set data(value) {
    this._data = value;
    this.updateData();
  }
  get data() {
    return this._data;
  }

  set stateSteps(value) {
    console.log(value);
    this._stateSteps = value;
    this.updateData();
  }

  get stateSteps() {
    return this._stateSteps;
  }
  // set datasetID(value) {
  //   this._datasetID = value;
  //   clearInterval(this._dataRequestInterval);
  //   if (value) {
  //     this._dataRequestInterval = window.setInterval(() => {
  //       post(
  //         `https://test.visdata.com.cn:8081/visdata/rest/dataquery/dataconvert/query?definedStr=${this.datasetID}`
  //       ).then((result) => {
  //         if (result.status === 200 && result.data.result !== this.datasetID) {
  //           console.log("DATA UPDATE:", this.datasetID, result.data.result);
  //         } else {
  //           console.log("ERROR QUERYSTR:", this.datasetID);
  //         }
  //       });
  //     }, 60000);
  //   }
  // }

  toADGEJSON(lineArray: any[]) {
    let ret: any = {};
    ret.type = "Node";
    ret.uuid = this.uuid;
    ret.name = this.text;
    ret.flowUUID = this.flowUUID;
    ret.stateSteps = btoa(JSON.stringify(this.stateSteps));
    ret.editorID = this.editorID;
    ret.nameOffset = this.nameText.position.z;
    ret.iconHeight = this.iconPlane.position.y;
    ret.color = this.color;
    ret.lineColor = this.lineColor;
    ret.matrix = [
      this.position.toArray(),
      this.scale.toArray(),
      this.rotation.toArray(),
    ];
    ret.mainMeshJson = this.mainMesh.toJSON();
    ret.iconMesh = this.iconPlane.toJSON();
    // lineArray.push(...this.starts.map((s) => s.toADGEJSON()));
    return ret;
  }
  fromADGEJSON(json: any) {
    this.text = json.name;
    json.flowUUID && (this.flowUUID = json.flowUUID);
    json.stateSteps && (this.stateSteps = JSON.parse(atob(json.stateSteps)));
    this.nameText.position.z = json.nameOffset;
    this.color = json.color;
    this.lineColor = json.lineColor;
    new THREE.ObjectLoader().parse(json.mainMeshJson, (obj) => {
      this.mainMesh.geometry = (obj as THREE.Mesh).geometry;
      this.mainMesh.scale.copy((obj as THREE.Mesh).scale);
      this.mainMesh.position.copy((obj as THREE.Mesh).position);
      this.line.geometry = new THREE.EdgesGeometry(this.mainMesh.geometry);
    });
    new THREE.ObjectLoader().parse(json.iconMesh, (obj) => {
      this.remove(this.iconPlane);
      this.iconPlane = obj as THREE.Mesh;
      json.iconHeight && (obj.position.y = +json.iconHeight);
      this.add(obj);
    });
    this.position.fromArray(json.matrix[0]);
    this.scale.fromArray(json.matrix[1]);
    this.rotation.fromArray(json.matrix[2]);
    this.editorID = json.editorID;
  }
  onDispose(scene: THREE.Scene, objArray: (flowIF & THREE.Object3D)[]) {
    scene.remove(this);
    let index = objArray.indexOf(this);
    if (index >= 0) {
      objArray.splice(index, 1);
      this.remove(this.mainMesh);
      this.mainMesh.geometry.dispose();
      (this.mainMesh.material as THREE.Material).dispose();
      this.remove(this.iconPlane);
      this.iconPlane.geometry.dispose();
      (this.iconPlane.material as THREE.Material).dispose();
      this.geometry.dispose();
      (this.material as THREE.Material).dispose();
      this.starts.forEach((line) => line.onDispose(scene, objArray));
      this.ends.forEach((line) => line.onDispose(scene, objArray));
    }
  }
}

enum geometryType {
  BOX = "BOX",
  CYLINDER = "CYLINDER",
  DODECAHE = "DODECAHE",
  SPHERE = "SPHERE",
  CONE = "CONE",
}

function geoGen(type: geometryType, SIZE: number) {
  const typeFun = {
    CYLINDER: () => {
      return new THREE.CylinderGeometry(SIZE / 2, SIZE / 2, SIZE);
    },
    DODECAHE: () => {
      return new THREE.DodecahedronGeometry(SIZE / 2);
    },
    BOX: () => {
      return new THREE.BoxGeometry(SIZE, SIZE, SIZE);
    },
    SPHERE: () => {
      return new THREE.SphereGeometry(SIZE / 2);
    },
    CONE: () => {
      return new THREE.ConeGeometry(SIZE * 0.6, SIZE, 4);
    },
  };
  return typeFun[type]();
}

function switchFocus(obj: flowNode, hide: boolean, forward: boolean) {
  obj.hide = hide;
  if (forward) {
    obj.starts.forEach((l) => {
      l.hide = hide;
      switchFocus(l.end, hide, forward);
    });
  } else {
    obj.ends.forEach((l) => {
      l.hide = hide;
      switchFocus(l.start, hide, forward);
    });
  }
}
