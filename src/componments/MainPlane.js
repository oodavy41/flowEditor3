import React, { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import bloomVert from "../shaders/bloom.vert";
import bloomFrag from "../shaders/bloom.frag";

import FlowNode from "./Node";
import FlowLine from "./Line";
import styles from "./MainPlane.less";

import FragFactory from "./textRenderer/fragFactory";
let textFactory = new FragFactory();

const POINT_BLOOM_LAYER = 1;
const bloomLayer = new THREE.Layers();
bloomLayer.set(POINT_BLOOM_LAYER);

export default function MainPlane(props) {
  const canvas = useRef();
  const bodyDom = useRef();
  let addNode, changeCamera;
  const [state, setState] = useState(0);
  useEffect(() => {
    bodyDom.current.appendChild(textFactory.canvas);
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
    camera.position.set(150, 400, 150);
    camera.lookAt(0, 0, 0);

    var renderer = new THREE.WebGLRenderer({ canvas: canvas.current });
    renderer.setSize(canvasSize[0], canvasSize[1]);

    var gridHelper = new THREE.GridHelper(2000, 50);

    scene.add(gridHelper);

    const darkMaterial = new THREE.MeshBasicMaterial({ color: "black" });
    const materials = {};
    const renderScene = new RenderPass(scene, camera);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(canvasSize[0], canvasSize[1])
    );
    bloomPass.threshold = 0.1;
    bloomPass.strength = 1;
    bloomPass.radius = 0.2;

    const bloomComposer = new EffectComposer(renderer);
    bloomComposer.renderToScreen = false;
    bloomComposer.addPass(renderScene);
    bloomComposer.addPass(bloomPass);

    const finalPass = new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: bloomComposer.renderTarget2.texture },
        },
        vertexShader: `varying vec2 vUv;void main() {vUv = uv;gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );}`,
        fragmentShader: `uniform sampler2D baseTexture;uniform sampler2D bloomTexture;varying vec2 vUv;void main() {gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );}`,
        defines: {},
      }),
      "baseTexture"
    );
    finalPass.needsSwap = true;

    const finalComposer = new EffectComposer(renderer);
    finalComposer.addPass(renderScene);
    finalComposer.addPass(finalPass);

    function animate() {
      requestAnimationFrame(animate);
      // renderer.render(scene, camera);
      scene.traverse((obj) => {
        if (obj.isMesh && bloomLayer.test(obj.layers) === false) {
          materials[obj.uuid] = obj.material;
          obj.material = darkMaterial;
        }
      });
      bloomComposer.render();
      scene.traverse((obj) => {
        if (materials[obj.uuid]) {
          obj.material = materials[obj.uuid];
          delete materials[obj.uuid];
        }
      });
      finalComposer.render();
    }
    animate();

    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();

    let objArray = [];

    changeCamera = () => {
      if (camera.position.x > 0) {
        camera.position.set(0, 250, 0);
      } else {
        camera.position.set(150, 250, 150);
      }
      camera.lookAt(0, 0, 0);
    };
    addNode = () =>
      objArray.push(FlowNode(scene, textFactory, `NODE${objArray.length}`));

    let pointing = null;
    let picked = false;
    let pickedNode = null;
    let lineNode = [];

    function onMouseMove(event) {
      mouse.x = (event.clientX / canvas.current.clientWidth) * 2 - 1;
      mouse.y = -(event.clientY / canvas.current.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      if (picked) {
        // See if the ray from the camera into the world hits one of our meshes
        var intersects = raycaster.intersectObject(gridHelper);

        // Toggle rotation bool for meshes that we clicked
        if (intersects.length > 0 && pickedNode && pickedNode.onMouseMove) {
          pickedNode.onMouseMove(intersects[0].point);
        }
        if (pickedNode && pickedNode.flowAttr.type === "NODE") {
          pickedNode.flowAttr.starts.forEach((_) =>
            _.updateFlowLine(true, pickedNode)
          );
          pickedNode.flowAttr.ends.forEach((_) =>
            _.updateFlowLine(false, pickedNode)
          );
        }
      }
      var intersects = raycaster.intersectObjects(objArray);
      if (intersects.length > 0) {
        let result = intersects[0].object;
        if (result.flowAttr) {
          result.layers.enable(POINT_BLOOM_LAYER);
          if (pointing !== result) {
            pointing && pointing.layers.disable(POINT_BLOOM_LAYER);
            pointing = result;
          }
        }
      } else {
        pointing && pointing.layers.disable(POINT_BLOOM_LAYER);
        pointing = null;
      }
    }

    function onMouseDown(event) {
      mouse.x = (event.clientX / canvas.current.clientWidth) * 2 - 1;
      mouse.y = -(event.clientY / canvas.current.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // See if the ray from the camera into the world hits one of our meshes
      var intersects = raycaster.intersectObjects(objArray);
      if (intersects.length > 0) {
        let result = intersects[0].object;
        if (event.shiftKey) {
          picked = false;
          if (lineNode[0]) {
            lineNode[1] = result;
            objArray.push(FlowLine(lineNode[0], lineNode[1], scene));
            lineNode = [];
          } else {
            lineNode[0] = result;
          }
        } else {
          picked = true;
          pickedNode = result;
        }
      }
    }

    function onMouseUp(event) {
      if (pickedNode && pickedNode.flowAttr.type === "NODE") {
        pickedNode.flowAttr.starts.forEach((_) =>
          _.updateFlowLine(true, pickedNode)
        );
        pickedNode.flowAttr.ends.forEach((_) =>
          _.updateFlowLine(false, pickedNode)
        );
      }
      pickedNode = null;
      picked = false;
    }

    canvas.current.addEventListener("mousemove", onMouseMove);
    canvas.current.addEventListener("mousedown", onMouseDown);
    canvas.current.addEventListener("mouseup", onMouseUp);
  }, [0]);
  return (
    <div className={styles.main} ref={bodyDom}>
      <div
        className={[styles.addButton, styles.button].join(" ")}
        onClick={() => addNode()}
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
