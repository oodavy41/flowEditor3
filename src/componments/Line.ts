import * as THREE from "three";

import flowIF from "./flowIF";
import flowNode from "./Node";
import flowLinePoint from "./LinePoint";

let RADIUS = 5;

export default class flowLine extends THREE.Mesh implements flowIF {
  _color: string | number;
  start: flowNode;
  end: flowNode;
  curve: THREE.CatmullRomCurve3;
  isPicked: boolean;
  isHoving: boolean;
  picking: flowLinePoint;
  pickingPre: [flowLinePoint, boolean];
  pickingNext: [flowLinePoint, boolean];
  pointArray: flowLinePoint[];
  dashManager: dashManagerType;
  updatePointKey: () => void;
  onClick: (raycaster?: THREE.Raycaster) => void;
  offClick: () => void;
  offNodeClick: () => void;
  onNodeClick: (fromStart: boolean, object: THREE.Object3D) => void;
  switchLayer: (layer: number, flag: boolean) => void;
  onUpdateData: { [key: string]: [string, (value: any) => void, any?] };
  onMouseMove?: (
    point: THREE.Vector3,
    event?: MouseEvent,
    raycaster?: THREE.Raycaster
  ) => void;
  drawLine: () => void;
  updateFlowLine: (fromStart: boolean, object: flowNode) => void;
  constructor(
    scene: THREE.Scene,
    start: flowNode,
    end: flowNode,
    color: string | number
  ) {
    function caculatePoints(start: flowNode, end: flowNode) {
      let startPoint = start.position.clone(),
        endPoint = end.position.clone();
      let midPoint = startPoint.clone().add(endPoint).multiplyScalar(0.5);
      return [
        startPoint,
        new THREE.Vector3(midPoint.x, startPoint.y, startPoint.z),
        new THREE.Vector3(midPoint.x, endPoint.y, endPoint.z),
        endPoint,
      ];
    }
    let init = caculatePoints(start, end);
    let curve = new THREE.CatmullRomCurve3(init, false, "catmullrom", 0.01);
    super(
      new THREE.TubeGeometry(curve, 128, RADIUS, 8, false),
      new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        depthWrite: false,
        opacity: 0,
      })
    );
    this.curve = curve;
    let dashes = dashGenerator(curve, this, 10, 10, 10, color);
    this.add(...dashes.dashes.map((d) => d.node));
    this.dashManager = dashes;

    let mid1 = new flowLinePoint(this, init[1]),
      mid2 = new flowLinePoint(this, init[2]);
    this.pointArray = [mid1, mid2];
    this.add(mid1, mid2);
    this.color = color;
    scene.add(this);

    this.start = start;
    this.end = end;

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
    };
    this.onNodeClick = (fromStart: boolean, object: THREE.Object3D) => {
      let point = object;
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
    };
    this.offClick = () => {
      this.isPicked = false;
      this.picking = null;
      this.offNodeClick();
    };
    this.offNodeClick = () => {
      this.pickingNext = [null, null];
      this.pickingPre = [null, null];
      this.dashManager.restore(this.curve);
    };
    this.onMouseMove = (point) => {
      if (this.picking) {
        this.picking.onMouseMove(point);
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
    this.onUpdateData = {
      color: [
        "颜色",
        (value) => {
          this.color = value;
        },
        () => this.color,
      ],
      number: [
        "虚线长度",
        (value) => {
          this.dashManager.changeProperty(+value);
        },
        () => this.dashManager.properties().dashLength,
      ],
    };

    this.drawLine = () => {
      this.updatePointKey();
      let curve = new THREE.CatmullRomCurve3(
        [start, ...this.pointArray, end].map((e) => {
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
    };

    this.updateFlowLine = (fromStart, object) => {
      let point = object.position;
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
      this.drawLine();
    };

    this.updatePointKey();
  }

  tick(delta: number) {
    this.dashManager.tick(delta);
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

  fromADGEJSON(json: any) {
    this.color = json.color;
    this.dashManager.changeProperty(+json.dashLength);
    this.remove(...this.pointArray);
    this.pointArray = json.pointArray.map(
      (v: number[]) =>
        new flowLinePoint(this, new THREE.Vector3(v[0], v[1], v[2]))
    );
    this.drawLine();
    this.dashManager.restore(this.curve);
  }
  toADGEJSON() {
    let ret: any = {};
    ret.type = "Line";
    ret.color = this.color;
    ret.dashLength = this.dashManager.properties().dashLength;
    ret.startID = this.start.uuid;
    ret.endID = this.end.uuid;
    ret.pointArray = this.pointArray.map(({ position }) => [
      position.x,
      position.y,
      position.z,
    ]);
    return ret;
  }
}

function dashGenerator(
  curve: THREE.CatmullRomCurve3,
  parent: THREE.Object3D,
  dashLength: number,
  dashSpace: number,
  speed: number,
  color: number | string
) {
  let length = curve.getLength();
  let dashes: { node: THREE.Mesh; offset: number }[] = [];
  let count = length / (dashLength + dashSpace);
  for (let i = 0; i < count; i++) {
    dashes.push(dashNode(dashLength, 4, color, i / count));
  }

  return {
    dashes,
    properties: () => {
      return { dashLength, dashSpace };
    },
    tick: (delta: number) => {
      dashes.forEach((d) => {
        d.offset += (delta * speed) / 1000 / length;
        d.offset = d.offset > 1 ? d.offset - 1 : d.offset;
        d.node.position.copy(curve.getPointAt(d.offset));
        d.node.lookAt(curve.getTangentAt(d.offset).add(d.node.position));
        d.node.rotateX(-Math.PI / 2);
        // d.node.rotateZ(-Math.PI / 2);
      });
    },
    changeColor: (newColor: number | string) => {
      color = newColor;
      dashes.forEach((d) =>
        (d.node.material as THREE.MeshBasicMaterial).color.set(color)
      );
    },
    changeProperty: (newDashLength: number) => {
      newDashLength && (dashLength = newDashLength);
      dashes.forEach((d) => (d.node.scale.y = dashLength));
    },
    restore: (newCurve: THREE.CatmullRomCurve3) => {
      parent.remove(...dashes.map((d) => d.node));
      curve = newCurve;
      length = curve.getLength();
      dashes = [];
      count = length / (dashLength + dashSpace);
      for (let i = 0; i < count; i++) {
        dashes.push(dashNode(dashLength, 4, color, i / count));
      }
      parent.add(...dashes.map((d) => d.node));
    },
  };
}
type dashManagerType = {
  dashes: {
    node: THREE.Mesh;
    offset: number;
  }[];
  tick: (delta: number) => void;
  properties: () => { dashLength: number; dashSpace: number };
  changeColor: (color: string | number) => void;
  changeProperty: (newDashLength: number) => void;
  restore: (newCurve: THREE.CatmullRomCurve3) => void;
};
function dashNode(
  length: number,
  width: number,
  color: number | string,
  offset: number
) {
  const geometry = new THREE.PlaneGeometry(1, 1);
  const material = new THREE.MeshBasicMaterial({
    color: color,
  });
  const node = new THREE.Mesh(geometry, material);
  node.scale.set(width, length, 1);
  node.rotateX(-Math.PI / 2);
  return { node, offset };
}
