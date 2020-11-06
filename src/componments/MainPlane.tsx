import React, { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

import { Object3D } from "three";

import styles from "./MainPlane.less";

import FragFactory from "./textRenderer/fragFactory";
import flowIF from "./flowIF";
import flowNode from "./Node";
import flowLine from "./Line";
import Land from "./Land";
import TextBoard from "./TextBoard";
import MetaPanel from "./MetaPanel";

let textFactory = new FragFactory();

const POINT_BLOOM_LAYER = 1;
const bloomLayer = new THREE.Layers();
bloomLayer.set(POINT_BLOOM_LAYER);

export default function MainPlane() {
  const canvas = useRef<HTMLCanvasElement>();
  const bodyDom = useRef<HTMLDivElement>();
  const [needsUpdate, setUpdate] = useState<number>();
  const addNode = useRef<(flag: string) => void>(),
    changeCamera = useRef<() => void>(),
    updateCanvas = useRef<(key: string, value: any) => void>(),
    bloomingObject = useRef<flowIF & Object3D>();
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
      10000
    );
    camera.position.set(1500, 9000, 1500);
    camera.lookAt(0, 0, 0);
    scene.add(camera);

    var renderer = new THREE.WebGLRenderer({ canvas: canvas.current });
    renderer.setSize(canvasSize[0], canvasSize[1]);

    let gridHelper = new THREE.GridHelper(2000, 50);
    gridHelper.position.y = -1;
    scene.add(gridHelper);
    let ground = new THREE.Mesh(
      new THREE.PlaneGeometry(2000, 2000),
      new THREE.MeshBasicMaterial({
        color: "green",
        transparent: true,
        opacity: 0,
      })
    );
    ground.rotateX(-Math.PI / 2);
    scene.add(ground);

    const darkMaterial = new THREE.MeshBasicMaterial({ color: "black" });
    const materials: { [key: string]: THREE.Material | THREE.Material[] } = {};
    const renderScene = new RenderPass(scene, camera);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(canvasSize[0], canvasSize[1]),
      1,
      0.2,
      0.1
    );
    bloomPass.threshold = 0.1;
    bloomPass.strength = 0.3;
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
      scene.traverse((obj: THREE.Mesh) => {
        if (obj.isMesh && bloomLayer.test(obj.layers) === false) {
          materials[obj.uuid] = obj.material;
          obj.material = darkMaterial;
        }
      });
      bloomComposer.render();
      scene.traverse((obj: THREE.Mesh) => {
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

    let objArray: Object3D[] = [];

    let canvasUpdatefunMap = {
      cameraHeight: (value: any) => {
        camera.position.y = value;
        camera.lookAt(0, 0, 0);
      },
      backgroundColor: (value: any) => {
        renderer.setClearColor(value, 1);
      },
    };
    updateCanvas.current = (
      key: keyof typeof canvasUpdatefunMap,
      value: any
    ) => {
      canvasUpdatefunMap[key](value);
    };

    changeCamera.current = () => {
      if (camera.position.x > 0) {
        camera.position.set(0, 250, 0);
      } else {
        camera.position.set(150, 250, 150);
      }
      camera.lookAt(0, 0, 0);
    };
    addNode.current = (flag: string) => {
      switch (flag) {
        case "NODE":
          objArray.push(
            new flowNode(
              scene,
              textFactory,
              `NODE${objArray.length}`,
              "#" +
                Math.floor(Math.random() * 0xffffff)
                  .toString(16)
                  .padStart(6, "0")
            )
          );
          break;
        case "PLANE":
          objArray.push(
            new Land(
              scene,
              Math.floor(Math.random() * 0xffffff)
                .toString(16)
                .padStart(6, "0")
            )
          );
          break;
        case "TEXT":
          objArray.push(new TextBoard(scene, "#999", textFactory));
          break;
        default:
          break;
      }
    };

    let pointing: Object3D | null = null;
    let picked = false;
    let pickedNode: flowIF | null = null;
    let lineNode: flowNode[] = [];

    // let locate = new THREE.Mesh(
    //   new THREE.BoxGeometry(10, 100, 10),
    //   new THREE.MeshBasicMaterial({ color: "red" })
    // );
    // scene.add(locate);

    function onMouseMove(event: MouseEvent) {
      mouse.x = (event.clientX / canvas.current.clientWidth) * 2 - 1;
      mouse.y = -(event.clientY / canvas.current.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      var intersects = raycaster.intersectObject(ground);
      // if (intersects.length > 0) {
      //   locate.position.copy(intersects[0].point);
      // }
      if (picked) {
        if (intersects.length > 0 && pickedNode && pickedNode.onMouseMove) {
          pickedNode.onMouseMove(intersects[0].point, event);
        }
        if (pickedNode && pickedNode instanceof flowNode) {
          pickedNode.starts.forEach((_: flowLine) =>
            _.updateFlowLine(true, pickedNode as flowNode)
          );
          pickedNode.ends.forEach((_: flowLine) =>
            _.updateFlowLine(false, pickedNode as flowNode)
          );
        }
      }
      var intersects = raycaster.intersectObjects(objArray);
      if (intersects.length > 0) {
        let result = intersects[0].object;
        result.layers.enable(POINT_BLOOM_LAYER);
        if (pointing !== result) {
          pointing && pointing.layers.disable(POINT_BLOOM_LAYER);
          pointing = result;
        }
      } else {
        if (pointing !== bloomingObject.current)
          pointing && pointing.layers.disable(POINT_BLOOM_LAYER);
        pointing = null;
      }
    }

    function onMouseDown(event: MouseEvent) {
      mouse.x = (event.clientX / canvas.current.clientWidth) * 2 - 1;
      mouse.y = -(event.clientY / canvas.current.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // See if the ray from the camera into the world hits one of our meshes
      var intersects = raycaster.intersectObjects(objArray);
      if (intersects.length > 0) {
        let result: flowNode = intersects[0].object as flowNode;
        if (bloomingObject.current) {
          bloomingObject.current.layers.disable(POINT_BLOOM_LAYER);
          bloomingObject.current = null;
        }
        bloomingObject.current = result;
        if (event.shiftKey) {
          picked = false;
          if (lineNode[0]) {
            lineNode[1] = result;
            objArray.push(
              new flowLine(
                scene,
                lineNode[0],
                lineNode[1],
                (0.5 + 0.5 * Math.random()) * 0xffffff
              )
            );
            lineNode = [];
          } else {
            lineNode[0] = result;
          }
        } else {
          picked = true;
          pickedNode = result;
          (result as flowIF).onClick(raycaster);
        }
      } else {
        console.log("pickNone!", objArray);
        pickedNode = null;
        if (bloomingObject.current) {
          bloomingObject.current.layers.disable(POINT_BLOOM_LAYER);
          bloomingObject.current = null;
        }
      }
      setUpdate(Math.random());
    }

    function onMouseUp(event: MouseEvent) {
      if (pickedNode && pickedNode.offClick) {
        pickedNode.offClick();
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
      <div className={styles.buttons}>
        <div
          className={[styles.rotateButton, styles.button].join(" ")}
          onClick={() => changeCamera.current && changeCamera.current()}
        >
          切换视角
        </div>
        <div
          className={[styles.addButton, styles.button].join(" ")}
          onClick={() => addNode.current("NODE")}
        >
          + 添加节点
        </div>
        <div
          className={[styles.addButton, styles.button].join(" ")}
          onClick={() => addNode.current("TEXT")}
        >
          + 添加文字
        </div>
        <div
          className={[styles.addButton, styles.button].join(" ")}
          onClick={() => addNode.current("PLANE")}
        >
          + 添加范围
        </div>
      </div>

      <canvas className={styles.mainCanvas} ref={canvas}></canvas>
      <MetaPanel
        update={needsUpdate}
        canvasUpdater={updateCanvas}
        pickedUpdater={bloomingObject}
      ></MetaPanel>
    </div>
  );
}
