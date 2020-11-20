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
    pickedNode = useRef<flowIF & THREE.Object3D>(),
    updateCanvas = useRef<(key: string, value: any) => void>(),
    sceneImport = useRef<() => void>(),
    sceneOutport = useRef<() => void>(),
    outputArea = useRef<HTMLInputElement>();
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
      new THREE.PlaneGeometry(canvasSize[0], canvasSize[1]),
      new THREE.MeshBasicMaterial({
        color: "white",
        transparent: true,
        opacity: 0.1,
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

    let objArray: Array<flowIF & THREE.Object3D> = [];

    let canvasUpdatefunMap = {
      cameraHeight: (value: any) => {
        camera.position.y = +value;
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
        camera.position.set(0, 2500, 0);
      } else {
        camera.position.set(1500, 2500, 1500);
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
                  .padStart(6, "0"),
              ["DODECAHE", "CYLINDER", "BOX"][Math.floor(Math.random() * 3)]
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
          objArray.push(
            new TextBoard(scene, "test text", 40, "#fff", textFactory)
          );
          break;
        default:
          break;
      }
    };

    let pointing: (flowIF & THREE.Object3D) | null = null;
    let picked = false;
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
        if (
          intersects.length > 0 &&
          pickedNode.current &&
          pickedNode.current.onMouseMove
        ) {
          pickedNode.current.onMouseMove(intersects[0].point, event);
        }
      }
      var intersects = raycaster.intersectObjects(objArray);
      if (intersects.length > 0) {
        let result = intersects[0].object as flowIF & THREE.Object3D;
        result.switchLayer(POINT_BLOOM_LAYER, true);
        if (pointing !== result) {
          pointing && pointing.switchLayer(POINT_BLOOM_LAYER, false);
          pointing = result;
        }
      } else {
        pointing && pointing.switchLayer(POINT_BLOOM_LAYER, false);
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
        let result = intersects[0].object as flowNode;
        if (pickedNode.current && pickedNode.current !== result) {
          pickedNode.current.switchLayer(POINT_BLOOM_LAYER, false);
        }
        pickedNode.current = result;
        result.switchLayer(POINT_BLOOM_LAYER, true);
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
          pickedNode.current = result;
          (result as flowIF).onClick(raycaster);
        }
      } else {
        console.log("pickNone!", objArray);
        if (pickedNode.current) {
          (pickedNode.current as flowIF).offClick(raycaster);
          (pickedNode.current as flowIF).switchLayer(POINT_BLOOM_LAYER, false);
        }
        pickedNode.current = null;
      }
      setUpdate(Math.random());
    }

    function onMouseUp(event: MouseEvent) {
      if (pickedNode.current && pickedNode.current.offClick) {
        pickedNode.current.offClick();
      }
      pickedNode.current = null;
      picked = false;
    }

    canvas.current.addEventListener("mousemove", onMouseMove);
    canvas.current.addEventListener("mousedown", onMouseDown);
    canvas.current.addEventListener("mouseup", onMouseUp);

    sceneImport.current = () => {
      var jsonLoader = new THREE.ObjectLoader();
      let url = `data:,${outputArea.current.value}`;
      jsonLoader.load(url, (obj) => {
        scene.add(obj);
      });
    };
    sceneOutport.current = () => {
      outputArea.current.value = JSON.stringify(scene.toJSON());
    };
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
        pickedUpdater={pickedNode}
      ></MetaPanel>
      <div>
        <button onClick={() => sceneOutport.current()}>导出</button>
        <button onClick={() => sceneImport.current()}>导入</button>
        <input type="textarea" ref={outputArea}></input>
      </div>
    </div>
  );
}

function switchBloom(obj: THREE.Object3D | flowNode, flag: boolean) {
  if (flag) {
    if (obj instanceof flowNode) {
      obj.mainMesh.layers.enable(POINT_BLOOM_LAYER);
      obj.layers.enable(POINT_BLOOM_LAYER);
    } else {
      obj.layers.enable(POINT_BLOOM_LAYER);
    }
  } else {
    if (obj instanceof flowNode) {
      obj.mainMesh.layers.disable(POINT_BLOOM_LAYER);
      obj.layers.disable(POINT_BLOOM_LAYER);
    } else {
      obj.layers.disable(POINT_BLOOM_LAYER);
    }
  }
}
