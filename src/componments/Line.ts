import * as THREE from "three";

import flowIF from "./flowIF";
import flowNode from "./Node";

export default class flowLine extends THREE.Mesh implements flowIF {
  color: string | number;
  start: flowNode;
  end: flowNode;
  isPicked: boolean;
  isHoving: boolean;
  onClick: () => void;
  onUpdateData: { [key: string]: (value: any) => void };
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
    super(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(
          caculatePoints(start, end),
          false,
          "catmullrom",
          0.01
        ),
        128,
        2,
        8,
        false
      ),
      new THREE.MeshBasicMaterial({
        color: color,
      })
    );
    this.color = color;
    scene.add(this);

    this.start = start;
    this.end = end;

    start.starts.push(this);
    end.ends.push(this);

    this.isPicked = false;
    this.isHoving = false;
    this.onClick = () => {
      this.isPicked = true;
    };
    this.onUpdateData = {
      color: (value) => {
        if (this.material instanceof THREE.MeshBasicMaterial) {
          this.color = value;
          this.material.color.set(value);
        }
      },
    };

    this.updateFlowLine = (fromStart: boolean, object) => {
      if (fromStart) this.start = object;
      else this.end = object;
      this.geometry = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(
          caculatePoints(start, end),
          false,
          "catmullrom",
          0.01
        ),
        128,
        2,
        8,
        false
      );
    };
  }
}
