import * as THREE from "three";

import FragFactory from "./textRenderer/fragFactory";

let addNode = (scene, textFactory, name) => {
  var cube = new THREE.Mesh(
    new THREE.BoxGeometry(80, 40, 80),
    new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff })
  );
  let text = textFactory.frag(name, 20, "#999").obj;
  text.position.y = 45;
  cube.add(text);
  scene.add(cube);
  let flowAttributes = {
    type: "NODE",
    starts: [],
    ends: [],
  };
  cube.flowAttr = flowAttributes;
  cube.onMouseMove = (point) => {
    cube.position.set(point.x, 0, point.z);
  };

  return cube;
};

export default addNode;
