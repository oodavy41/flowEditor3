import React, { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import FlowNode from "./FlowNode";
import styles from "./MainPlane.less";

export default function MainPlane(props) {
  const canvas = useRef();
  let addNode, changeCamera;
  const [state, setState] = useState(0);
  useEffect(() => {
    let canvasSize = [canvas.current.clientWidth, canvas.current.clientHeight];
    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(
      -canvasSize[0] / 2,
      canvasSize[0] / 2,
      canvasSize[1] / 2,
      -canvasSize[1] / 2,
      1,
      1000
    );
    camera.position.set(150, 250, 150);
    camera.lookAt(0, 0, 0);

    var renderer = new THREE.WebGLRenderer({ canvas: canvas.current });
    renderer.setSize(canvasSize[0], canvasSize[1]);

    var gridHelper = new THREE.GridHelper(2000, 50);

    scene.add(gridHelper);

    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();

    let nodeArray = [];
    addNode = () => {
      var cube = new THREE.Mesh(
        new THREE.BoxGeometry(80, 40, 80),
        new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff })
      );
      scene.add(cube);
      cube.FLOWTYPE="NODE"
      nodeArray.push(cube);
    };

    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();

    changeCamera = () => {
      if (camera.position.x > 0) {
        camera.position.set(0, 250, 0);
      } else {
        camera.position.set(150, 250, 150);
      }
      camera.lookAt(0, 0, 0);
    };

    let picked = false;
    let pickedNode = null;

    function onMouseMove(event) {
      if (picked) {
        mouse.x = (event.clientX / canvas.current.clientWidth) * 2 - 1;
        mouse.y = -(event.clientY / canvas.current.clientHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        // See if the ray from the camera into the world hits one of our meshes
        var intersects = raycaster.intersectObject(gridHelper);

        // Toggle rotation bool for meshes that we clicked
        if (intersects.length > 0) {
          pickedNode.position.set(intersects[0].point.x, 0, intersects[0].point.z);
        }
      }
    }

    function onMouseDown(event) {
      mouse.x = (event.clientX / canvas.current.clientWidth) * 2 - 1;
      mouse.y = -(event.clientY / canvas.current.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // See if the ray from the camera into the world hits one of our meshes
      var intersects = raycaster.intersectObjects(nodeArray);
      if (intersects.length > 0) {
        picked = true;
        pickedNode = intersects[0].object;
      }
    }

    function onMouseUp(event) {
      pickedNode = null;
      picked = false;
    }

    canvas.current.addEventListener("mousemove", onMouseMove);
    canvas.current.addEventListener("mousedown", onMouseDown);
    canvas.current.addEventListener("mouseup", onMouseUp);
  }, [0]);
  return (
    <div className={styles.main}>
      <div
        className={[styles.addButton, styles.button].join(" ")}
        onClick={() => addNode&&addNode()}
      >
        + 添加
      </div>
      <div
        className={[styles.rotateButton, styles.button].join(" ")}
        onClick={() => changeCamera && changeCamera()}
      >
        切换视角
      </div>
      <canvas className={styles.mainCanvas} ref={canvas}></canvas>
    </div>
  );
}
