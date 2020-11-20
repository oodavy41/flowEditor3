import * as THREE from "three";

import flowIF from "./flowIF";
import flowNode from "./Node";
import flowLinePoint from "./LinePoint";

export default class flowLine extends THREE.Mesh implements flowIF {
  color: string | number;
  start: flowNode;
  end: flowNode;
  isPicked: boolean;
  isHoving: boolean;
  picking: flowLinePoint;
  pointArray: flowLinePoint[];
  updatePointKey: () => void;
  onClick: (raycaster?: THREE.Raycaster) => void;
  offClick: () => void;
  switchLayer: (layer: number, flag: boolean) => void;
  onUpdateData: { [key: string]: (value: any) => void };
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
    super(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(init, false, "catmullrom", 0.01),
        128,
        5,
        8,
        false
      ),
      new THREE.MeshBasicMaterial({
        color: color,
      })
    );
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
      }
    };
    this.offClick = () => {
      this.isPicked = false;
      this.picking = null;
    };
    this.onMouseMove = (point) => {
      if (this.picking) {
        this.picking.onMouseMove(point);
        console.log(point);
        let pre = this.pointArray[this.picking.key - 1],
          next = this.pointArray[this.picking.key + 1];
        if (pre) {
          if (Math.abs(pre.position.x - point.x) < 20) {
            pre.position.x = point.x;
          }
          if (Math.abs(pre.position.z - point.z) < 20) {
            pre.position.z = point.z;
          }
        } else {
          this.pointArray.unshift(new flowLinePoint(this, this.start.position));
        }
        if (next) {
          if (Math.abs(next.position.x - point.x) < 20) {
            next.position.x = point.x;
          }
          if (Math.abs(next.position.z - point.z) < 20) {
            next.position.z = point.z;
          }
        } else {
          this.pointArray.push(new flowLinePoint(this, this.end.position));
        }
        this.updatePointKey();
        this.drawLine();
      }
    };
    this.switchLayer = (layer, flag) => {
      this.isHoving = flag;
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
      color: (value) => {
        if (this.material instanceof THREE.MeshBasicMaterial) {
          this.color = value;
          this.material.color.set(value);
        }
      },
    };

    this.drawLine = () => {
      this.geometry = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(
          [start, ...this.pointArray, end].map((e) => {
            let r = new THREE.Vector3();
            e.getWorldPosition(r);
            return r;
          }),
          false,
          "catmullrom",
          0.01
        ),
        128,
        5,
        8,
        false
      );
    };

    this.updateFlowLine = (fromStart: boolean, object) => {
      let point = object.position;
      if (fromStart) {
        this.start = object;
        let next = this.pointArray[0];
        if (next) {
          if (Math.abs(next.position.x - point.x) < 20) {
            next.position.x = point.x;
          }
          if (Math.abs(next.position.z - point.z) < 20) {
            next.position.z = point.z;
          }
        } else {
          this.pointArray.push(new flowLinePoint(this, this.end.position));
        }
      } else {
        this.end = object;
        let pre = this.pointArray[this.pointArray.length - 1];
        if (pre) {
          if (Math.abs(pre.position.x - point.x) < 20) {
            pre.position.x = point.x;
          }
          if (Math.abs(pre.position.z - point.z) < 20) {
            pre.position.z = point.z;
          }
        } else {
          this.pointArray.unshift(new flowLinePoint(this, this.start.position));
        }
      }
      this.drawLine();
    };
  }
}
