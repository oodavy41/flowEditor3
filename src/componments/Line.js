import * as THREE from "three";

let addLine = (start, end, scene) => {
  function caculatePoints(start, end) {
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
  let tube = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(
        caculatePoints(start, end),
        false,
        "catmullrom",
        0.1
      ),
      20,
      2,
      5,
      false
    ),
    new THREE.MeshBasicMaterial({
      color: (0.5 + 0.5 * Math.random()) * 0xffffff,
    })
  );
  scene.add(tube);
  let flowAttributes = {
    type: "LINE",
    start: start,
    end: end,
  };
  start.flowAttr.starts.push(tube);
  end.flowAttr.ends.push(tube);

  tube.updateFlowLine = (fromStart , object) => {
    if (fromStart) flowAttributes.start = object;
    else flowAttributes.end = object;
    tube.geometry = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(
        caculatePoints(flowAttributes.start, flowAttributes.end),
        false,
        "catmullrom",
        0.1
      ),
      20,
      2,
      5,
      false
    );
  };

  tube.flowAttr = flowAttributes;

  return tube;
};

export default addLine;
