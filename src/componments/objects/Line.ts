import * as THREE from "three";
import _ from "lodash";
import { StyleNode, OBJ_PROP_ACT } from "../../GLOBAL";

import DashTube from "./DashTube";
import flowIF, { dataSetIF } from "./flowIFs";
import flowNode from "./Node";
import flowLinePoint from "./LinePoint";

import LineShader from "./LineShader";

const XFIRST = false;
const hideOpacity = 0.2;
const RADIUS = 5;
function caculatePoints(start: flowNode, end: flowNode) {
  let startPoint = start.position.clone(),
    endPoint = end.position.clone();
  let midPoint = startPoint.clone().add(endPoint).multiplyScalar(0.5);
  return [
    startPoint,
    new THREE.Vector3(
      XFIRST ? startPoint.x : midPoint.x,
      startPoint.y,
      XFIRST ? midPoint.z : startPoint.z
    ),
    new THREE.Vector3(
      XFIRST ? endPoint.x : midPoint.x,
      endPoint.y,
      XFIRST ? midPoint.z : endPoint.z
    ),
    endPoint,
  ];
}
export default class flowLine extends THREE.Mesh implements flowIF, dataSetIF {
  private _color: string;
  private _broken: boolean;
  private _dash: boolean;
  flowUUID: string;
  private _hide: boolean;
  private _data: number;
  private _stateSteps: StyleNode[];
  start: flowNode;
  end: flowNode;
  curve: THREE.CatmullRomCurve3;
  isPicked: boolean;
  isHoving: boolean;
  picking: flowLinePoint;
  pickingPre: [flowLinePoint, boolean];
  pickingNext: [flowLinePoint, boolean];
  pointArray: flowLinePoint[];
  dashManager: ReturnType<typeof dashGenerator>;
  updatePointKey: () => void;
  onClick: (raycaster?: THREE.Raycaster) => void;
  offClick: () => void;
  offNodeClick: () => void;
  onNodeClick: (fromStart: boolean, object: THREE.Object3D) => void;
  switchLayer: (layer: number, flag: boolean) => void;
  onMouseMove?: (
    point: THREE.Vector3,
    event?: MouseEvent,
    raycaster?: THREE.Raycaster
  ) => void;
  drawLine: (genDash?: boolean) => void;
  updateFlowLine: (fromStart: boolean, object: flowNode) => void;
  configToPush: { [key: string]: any } = {};
  selfConfigUpdate?: (config: any, id?: string, tileType?: string) => void;
  editorID?: string;
  constructor(
    scene: THREE.Scene,
    start: flowNode,
    end: flowNode,
    color: string,
    broken = true
  ) {
    super(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(
          broken
            ? caculatePoints(start, end)
            : [
                new THREE.Vector3().copy(start.position),
                new THREE.Vector3().copy(end.position),
              ],
          false,
          "catmullrom",
          0.01
        ),
        128,
        RADIUS,
        8,
        false
      ),
      new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        depthTest: false,
        opacity: 0,
      })
    );
    this.renderOrder = -100;
    let init = broken
      ? caculatePoints(start, end)
      : [
          new THREE.Vector3().copy(start.position),
          new THREE.Vector3().copy(end.position),
        ];
    let curve = new THREE.CatmullRomCurve3(init, false, "catmullrom", 0.01);
    this.start = start;
    this.end = end;
    this.flowUUID = Math.floor(Math.random() * 0xffffff).toString(16);
    this.stateSteps = [];
    this.curve = curve;
    this.dashManager = dashGenerator(this, 20, 15, 0.02, 0x000);
    this.dashManager.genrate(this.curve);

    let mid1 = new flowLinePoint(this, init[1]),
      mid2 = new flowLinePoint(this, init[2]);
    this.pointArray = [mid1, mid2];
    this.add(mid1, mid2);
    this.color = color;
    scene.add(this);

    start.starts.push(this);
    end.ends.push(this);

    this.isPicked = false;
    this.isHoving = false;

    this.updatePointKey = () => {
      this.pointArray.forEach((e, i) => (e.key = i));
    };
    this.onClick = (raycaster) => {
      this.isPicked = true;
      let result = raycaster.intersectObjects(this.pointArray);
      if (result.length > 0) {
        this.picking = result[0].object as flowLinePoint;
        if (this.broken) {
          let point = this.picking,
            pre = this.pointArray[this.picking.key - 1],
            next = this.pointArray[this.picking.key + 1];
          if (!pre) {
            pre = new flowLinePoint(this, this.start.position);
            this.pointArray.unshift(pre);
          }
          if (!next) {
            next = new flowLinePoint(this, this.end.position);
            this.pointArray.push(next);
          }
          let preFlag = Math.abs(pre.position.x - point.position.x) < 2,
            nextFlag = Math.abs(next.position.x - point.position.x) < 2;
          this.pickingNext = [next, nextFlag];
          this.pickingPre = [pre, preFlag];
        }
      }
    };
    this.onNodeClick = (fromStart: boolean, object: THREE.Object3D) => {
      let point = object;
      if (this.broken) {
        if (fromStart) {
          let next = this.pointArray[0];
          this.pickingNext = [
            next,
            Math.abs(next.position.x - point.position.x) < 2,
          ];
        } else {
          let pre = this.pointArray[this.pointArray.length - 1];
          this.pickingPre = [
            pre,
            Math.abs(pre.position.x - point.position.x) < 2,
          ];
        }
      }
    };
    this.offClick = () => {
      this.isPicked = false;
      this.picking = null;
      this.offNodeClick();
    };
    this.offNodeClick = () => {
      this.pickingNext = [null, null];
      this.pickingPre = [null, null];
      this.drawLine(true);
    };
    this.onMouseMove = (point) => {
      if (this.picking) {
        this.picking.onMouseMove(point);
        if (this.broken) {
          try {
            if (this.pickingPre[1]) {
              this.pickingPre[0].position.x = point.x;
            } else {
              this.pickingPre[0].position.z = point.z;
            }
            if (this.pickingNext[1]) {
              this.pickingNext[0].position.x = point.x;
            } else {
              this.pickingNext[0].position.z = point.z;
            }
          } catch (e) {
            console.error(
              "LINE drag error:",
              e,
              this.pickingPre,
              this.pickingNext
            );
          }
        }
        this.drawLine();
      }
    };
    this.switchLayer = (layer, flag) => {
      this.isHoving = flag;
      (this.material as THREE.MeshBasicMaterial).opacity = flag ? 0.1 : 0;
      this.pointArray.forEach((e) =>
        flag ? e.layers.enable(0) : e.layers.disable(0)
      );
      if (flag) {
        this.layers.enable(layer);
      } else {
        this.layers.disable(layer);
      }
    };

    this.drawLine = (genDash = false) => {
      this.updatePointKey();
      let curve = new THREE.CatmullRomCurve3(
        [this.start, ...this.pointArray, this.end].map((e) => {
          let r = new THREE.Vector3();
          e.getWorldPosition(r);
          return r;
        }),
        false,
        "catmullrom",
        0.01
      );
      this.geometry.dispose();
      this.geometry = new THREE.TubeGeometry(
        curve,
        Math.floor(curve.getLength() / 10),
        RADIUS,
        8,
        false
      );
      this.geometry.computeBoundingBox();
      this.curve = curve;
      genDash && this.dashManager.genrate(curve);
    };

    this.updateFlowLine = (fromStart, object) => {
      let point = object.position;
      if (this.broken) {
        if (fromStart) {
          if (this.pickingNext[1]) {
            this.pickingNext[0].position.x = point.x;
          } else {
            this.pickingNext[0].position.z = point.z;
          }
        } else {
          if (this.pickingPre[1]) {
            this.pickingPre[0].position.x = point.x;
          } else {
            this.pickingPre[0].position.z = point.z;
          }
        }
      }
      this.drawLine(true);
    };

    this.updatePointKey();
    this.broken = broken || false;
  }
  onUpdateData(
    propName: string,
    action: OBJ_PROP_ACT,
    value?: any,
    selfUpdate = true
  ) {
    let funMap: {
      [key: string]: [string, (value: any) => void, () => any, any[]?];
    } = {
      label_uuid: ["标识ID", (value) => {}, () => this.flowUUID],
      checker_broken: [
        "折线",
        (value) => (this.broken = value),
        () => this.broken,
      ],
      checker_dash: ["虚线", (value) => (this.dash = value), () => this.dash],
      color: [
        "颜色",
        (value) => {
          this.color = value;
        },
        () => this.color,
      ],
      number_dashLength: [
        "虚线长度",
        (value) => {
          this.dashManager.changeProperty("dashLength", +value);
        },
        () => this.dashManager.properties().dashLength,
      ],
      number_dashSpace: [
        "虚线间隔",
        (value) => {
          this.dashManager.changeProperty("dashSpace", +value);
        },
        () => this.dashManager.properties().dashSpace,
      ],
      number_speed: [
        "流动速度",
        (value) => {
          this.dashManager.changeProperty("speed", +value);
        },
        () => this.dashManager.properties().speed,
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
        if (funMap[propName][OBJ_PROP_ACT.GET]() !== value) {
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
      this.selfConfigUpdate(this.configToPush, this.editorID);
      this.configToPush = {};
    }
  }, 1000);

  updateData() {
    if (!this.data) return;
    let steps = [...this.stateSteps];
    steps.unshift({
      cutPoint: -Infinity,
      color: this.color,
      lineColor: this.color,
    });
    steps.length > 2 && steps.sort((a, b) => a.cutPoint - b.cutPoint);
    let k = 0;
    while (k !== steps.length && this.data > steps[k].cutPoint) k++;
    this.dashManager.changeColor(steps[k - 1].color);
  }

  reGenrate() {
    let init = this.broken
      ? caculatePoints(this.start, this.end)
      : [
          new THREE.Vector3().copy(this.start.position),
          new THREE.Vector3().copy(this.end.position),
        ];
    this.pointArray && this.remove(...this.pointArray);
    this.pointArray = this.broken
      ? init.map((v) => new flowLinePoint(this, v))
      : [];
    this.drawLine(true);
  }

  tick(delta: number, time: number) {
    this.dashManager.tick(time);
  }

  set color(value) {
    if (this.material instanceof THREE.MeshBasicMaterial) {
      this._color = value;
      this.material.color.set(value);
    }
    this.dashManager.changeColor(value);
  }
  get color() {
    return this._color;
  }

  set hide(value) {
    this._hide = value;
    this.dashManager.changeProperty("opacity", value ? hideOpacity : 1);
  }
  get hide() {
    return this._hide;
  }
  set data(value) {
    this._data = value;
    this.updateData();
  }
  get data() {
    return this._data;
  }

  set stateSteps(value) {
    this._stateSteps = value;
    this.updateData();
  }

  get stateSteps() {
    return this._stateSteps;
  }

  set broken(value) {
    this._broken = value;
    this.reGenrate();
  }
  get broken() {
    return this._broken;
  }

  set dash(value) {
    this._dash = value;
  }
  get dash() {
    return this._dash;
  }

  toADGEJSON() {
    let ret: any = {};
    ret.type = "Line";
    ret.color = this.color;
    ret.flowUUID = this.flowUUID;
    ret.editorID = this.editorID;
    ret.stateSteps = btoa(JSON.stringify(this.stateSteps));
    ret.dashProperties = this.dashManager.toJSON();
    ret.startID = this.start.uuid;
    ret.endID = this.end.uuid;
    ret.pointArray = this.pointArray.map(({ position }) => [
      position.x,
      position.y,
      position.z,
    ]);
    return ret;
  }
  fromADGEJSON(json: any) {
    this.color = json.color;
    json.flowUUID && (this.flowUUID = json.flowUUID);
    json.editorID && (this.editorID = json.editorID);
    json.stateSteps && (this.stateSteps = JSON.parse(atob(json.stateSteps)));
    this.remove(...this.pointArray);
    this.pointArray = json.pointArray.map(
      (v: number[]) =>
        new flowLinePoint(this, new THREE.Vector3(v[0], v[1], v[2]))
    );
    this.dashManager.fromJSON(json.dashProperties);
    this.drawLine(true);
  }
  onDispose(scene: THREE.Scene, objArray: (flowIF & THREE.Object3D)[]) {
    scene.remove(this);
    let index = objArray.indexOf(this);
    if (index >= 0) {
      objArray.splice(index, 1);
      this.start.starts.splice(this.start.starts.indexOf(this), 1);
      this.end.starts.splice(this.end.starts.indexOf(this), 1);
      this.pointArray.forEach((p) => p.onDispose(this));
      this.remove(...this.pointArray);
      this.dashManager.dispose();
      this.geometry.dispose();
      (this.material as THREE.Material).dispose();
    }
  }
}

function dashGenerator(
  parent: THREE.Object3D,
  dashLength: number,
  dashSpace: number,
  speed: number,
  color: number | string,
  opacity: number = 1
) {
  let length = 0;
  let lineTube: THREE.Mesh<DashTube, THREE.ShaderMaterial>;
  let LineMat: THREE.ShaderMaterial;
  let property = {
    dashLength,
    dashSpace,
    speed,
    color,
    opacity,
  };

  return {
    properties: () => {
      return property;
    },
    tick: (time: number) => {
      if (LineMat) {
        LineMat.uniforms["time"].value = time;
      }
    },
    changeColor: (newColor: number | string) => {
      property.color = newColor;
      if (LineMat) {
        LineMat.uniforms["color"].value = new THREE.Color(property.color);
      }
    },
    changeProperty: (key: keyof typeof property, value: number) => {
      property[key] = value;
      if (LineMat) {
        LineMat.uniforms[key].value = value;
      }
    },
    genrate: (curve: THREE.CatmullRomCurve3) => {
      parent.remove(lineTube);
      length = curve.getLength();
      LineMat = new THREE.ShaderMaterial({
        uniforms: {
          length: { value: length },
          time: { value: 0 },
          speed: { value: property.speed },
          opacity: { value: property.opacity },
          dashLength: { value: property.dashLength },
          dashSpace: { value: property.dashSpace },
          color: { value: new THREE.Color(property.color) },
        },
        vertexShader: LineShader.vert,
        fragmentShader: LineShader.frag,
        side: THREE.DoubleSide,
        transparent: true,
        depthTest: false,
      });
      lineTube = new THREE.Mesh(
        new DashTube(curve, Math.floor(length / 5), 3, 6),
        LineMat
      );
      lineTube.renderOrder = parent.renderOrder;
      parent.add(lineTube);
    },
    toJSON: () => {
      return property;
    },
    fromJSON: (json: typeof property) => {
      Object.keys(json).forEach((key) => {
        let pkey = key as keyof typeof property;
        if (pkey === "color") {
          if (json.color) {
            color = json.color;
            LineMat.uniforms["color"].value = new THREE.Color(color);
          }
        } else {
          if (json[pkey]) {
            property[pkey] = json[pkey];
            LineMat.uniforms[key].value = json[pkey];
          }
        }
      });
    },
    dispose: () => {
      parent.remove(lineTube);

      lineTube.material.dispose();
      lineTube.geometry.dispose();
    },
  };
}
