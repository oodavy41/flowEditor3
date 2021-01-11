import React from "react";
import * as THREE from "three";
import { Object3D } from "three";
import dagre from "dagre";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";

import styles from "./MainPlane.less";

import FragFactory from "./textRenderer/fragFactory";
import flowIF from "./flowIF";
import flowNode from "./Node";
import flowLine from "./Line";
import Land from "./Land";
import TextBoard from "./TextBoard";
import MetaPanel from "./MetaPanel";
import Popup from "./popup";
import { render } from "react-dom";

interface MainIf {
  dataProvider?: any[];
  compModel?: boolean;
}
interface MainState {
  displayMode: boolean;
  poping: [flowIF, number[]];
  pickedNode: flowIF & THREE.Object3D;
}
const MIN_CAM_SCALE = 0.5;
const MAX_CAM_SCALE = 2;
const POINT_OUTLINE_COLOR = "#214362";
const CLEAR_COLOR = "#fff";
const GRID_COLOR = "#999";
const LINE_COLOR = "#444";
const TEXT_COLOR = "#fff";
const TEXT_BACKGROUND = "#4286c4";
const NODE_COLOR = "#f6f6ef";
const BORDER_COLOR = "#888";
const POINT_BLOOM_LAYER = 1;
const bloomLayer = new THREE.Layers();
bloomLayer.set(POINT_BLOOM_LAYER);

const canvasWH = [1280, 720];
const defaultIntensity = 0.87;
const defaultScale = 0.75;
const defaultCameraHeight = 2000;

let textFactory = new FragFactory(undefined, TEXT_COLOR, TEXT_BACKGROUND);

export default class MainPlane extends React.Component<MainIf, MainState> {
  canvas: HTMLCanvasElement;
  bodyDom: HTMLDivElement;
  scene: THREE.Scene;
  objArray: Array<flowIF & THREE.Object3D>;
  addNode: (flag: string) => void;
  changeCamera: () => void;
  onResize: () => void;
  onDispose: () => void;
  updateCanvas: (key: string, value: any) => void;
  sceneImport: (value: string) => void;
  sceneOutport: () => string;
  outputArea: HTMLInputElement;
  saveInterval: number;

  constructor(props: MainIf) {
    super(props);
    this.canvas = undefined;
    this.bodyDom = undefined;
    this.state = {
      displayMode: false,
      pickedNode: null,
      poping: [null, []],
    };
  }
  componentDidMount() {
    const { dataProvider, compModel } = this.props;
    // this.bodyDom.appendChild(textFactory.canvas);
    let canvasRect = this.canvas.getBoundingClientRect();
    let canvasSize = [
      canvasRect.width,
      canvasRect.height,
      canvasRect.left,
      canvasRect.top,
    ];
    let scene = new THREE.Scene();
    this.scene = scene;
    let camera = new THREE.OrthographicCamera(
      -canvasWH[0] / 2,
      canvasWH[0] / 2,
      canvasWH[1] / 2,
      -canvasWH[1] / 2,
      1,
      10000
    );
    camera.position.set(-1500, defaultCameraHeight, 1500);
    camera.lookAt(0, 0, 0);
    scene.add(camera);
    enum CAMERA_STATE {
      LEFT,
      RIGHT,
      TOP,
    }
    let cameraState: CAMERA_STATE = 0 as CAMERA_STATE;
    let cameraScale = defaultScale;
    camera.scale.set(cameraScale, cameraScale, cameraScale);
    window.addEventListener("wheel", (event) => {
      if (event.shiftKey) {
        if (event.deltaY > 0) {
          cameraScale += 0.05;
        } else {
          cameraScale -= 0.05;
        }
        cameraScale = Math.max(cameraScale, MIN_CAM_SCALE);
        cameraScale = Math.min(cameraScale, MAX_CAM_SCALE);
      }
      camera.scale.set(cameraScale, cameraScale, cameraScale);
    });

    let resizeCountDown: number;
    this.onResize = () => {
      clearTimeout(resizeCountDown);
      resizeCountDown = window.setTimeout(() => {
        let canvasRect = this.canvas.getBoundingClientRect();
        canvasSize = [
          canvasRect.width,
          canvasRect.height,
          canvasRect.left,
          canvasRect.top,
        ];
      }, 2000);
      console.log(canvasRect, canvasSize);
    };
    this.onResize();
    window.addEventListener("resize", this.onResize);

    let light = new THREE.DirectionalLight("#fff", 1 - defaultIntensity);
    light.position.set(-100, 200, -100);
    light.lookAt(0, 0, 0);
    scene.add(light);
    let ambientLight = new THREE.AmbientLight("#fff", defaultIntensity);
    scene.add(ambientLight);

    var renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
    renderer.setSize(canvasWH[0], canvasWH[1]);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(CLEAR_COLOR);
    renderer.sortObjects = true;

    this.onDispose = () => {
      renderer.forceContextLoss();
    };

    let gridHelper = new THREE.GridHelper(2000, 50);
    gridHelper.position.y = -1;
    (gridHelper.material as THREE.LineBasicMaterial).color.set(GRID_COLOR);
    scene.add(gridHelper);
    let ground = new THREE.Mesh(
      new THREE.PlaneGeometry(canvasWH[0], canvasWH[1]),
      new THREE.MeshBasicMaterial({
        color: "white",
        transparent: true,
        depthWrite: false,
        opacity: 0.01,
      })
    );
    ground.rotateX(-Math.PI / 2);
    scene.add(ground);

    let pointing: (flowIF & THREE.Object3D) | null = null;
    let picked = false;
    let lineNode: flowNode[] = [];
    let lands: Land[] = [];

    const darkMaterial = new THREE.MeshBasicMaterial({ color: "black" });
    const materials: { [key: string]: THREE.Material | THREE.Material[] } = {};

    const renderPass = new RenderPass(scene, camera);
    const finalComposer = new EffectComposer(renderer);

    finalComposer.addPass(renderPass);
    let outlinePass = new OutlinePass(
      new THREE.Vector2(canvasWH[0], canvasWH[1]),
      scene,
      camera
    );
    outlinePass.visibleEdgeColor = new THREE.Color(POINT_OUTLINE_COLOR);
    finalComposer.addPass(outlinePass);
    let landOutLine = new OutlinePass(
      new THREE.Vector2(canvasWH[0], canvasWH[1]),
      scene,
      camera
    );
    landOutLine.visibleEdgeColor = new THREE.Color("#333");
    landOutLine.selectedObjects = lands;
    finalComposer.addPass(landOutLine);
    let fxaaPass = new ShaderPass(FXAAShader);
    const pixelRatio = renderer.getPixelRatio();
    fxaaPass.material.uniforms["resolution"].value.x =
      1 / (canvasWH[0] * pixelRatio);
    fxaaPass.material.uniforms["resolution"].value.y =
      1 / (canvasWH[1] * pixelRatio);
    finalComposer.addPass(fxaaPass);

    let objArray: Array<flowIF & THREE.Object3D> = [];
    this.objArray = objArray;
    let lastTime = 0;
    function animate(t: number) {
      requestAnimationFrame(animate);
      let delta = t - lastTime;
      lastTime = t;

      outlinePass.selectedObjects = pointing ? [pointing] : [];
      scene.traverse((obj: THREE.Mesh) => {
        if (materials[obj.uuid]) {
          obj.material = materials[obj.uuid];
          delete materials[obj.uuid];
        }
      });
      finalComposer.render();
      outlinePass.selectedObjects = [];

      objArray.forEach((obj) => obj.tick && obj.tick(delta));
    }
    animate(0);

    let canvasUpdatefunMap = {
      cameraHeight: (value: any) => {
        camera.position.y = +value;
        console.log(value);
        camera.lookAt(0, 0, 0);
      },
      sceneLight: (value: any) => {
        light.intensity = 1 - value;
        ambientLight.intensity = value;
      },
      backgroundColor: (value: any) => {
        renderer.setClearColor(value, 1);
      },
    };
    this.updateCanvas = (key: keyof typeof canvasUpdatefunMap, value: any) => {
      canvasUpdatefunMap[key](value);
    };

    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    this.changeCamera = () => {
      cameraState = (cameraState + 1) % 3;
      switch (cameraState) {
        case CAMERA_STATE.LEFT:
          camera.position.x = -1500;
          camera.position.z = 1500;
          break;
        case CAMERA_STATE.RIGHT:
          camera.position.x = 1500;
          camera.position.z = 1500;
          break;
        case CAMERA_STATE.TOP:
          camera.position.x = 0;
          camera.position.z = 0;
          break;
        default:
          break;
      }
      camera.lookAt(0, 0, 0);
    };
    this.addNode = (flag: string) => {
      switch (flag) {
        case "NODE":
          objArray.push(
            new flowNode(
              scene,
              textFactory,
              `NODE${objArray.length}`,
              NODE_COLOR,
              BORDER_COLOR
            )
          );
          break;
        case "PLANE":
          let land = new Land(scene, "#888", lands);
          objArray.push(land);
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

    // let locate = new THREE.Mesh(
    //   new THREE.BoxGeometry(10, 100, 10),
    //   new THREE.MeshBasicMaterial({ color: "red" })
    // );
    // scene.add(locate);

    let onMouseMove = (event: MouseEvent) => {
      mouse.x = ((event.clientX - canvasSize[2]) / canvasSize[0]) * 2 - 1;
      mouse.y = -((event.clientY - canvasSize[3]) / canvasSize[1]) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      var intersects = raycaster.intersectObject(ground);
      // if (intersects.length > 0) {
      //   locate.position.copy(intersects[0].point);
      // }
      if (picked) {
        if (
          intersects.length > 0 &&
          this.state.pickedNode &&
          this.state.pickedNode.onMouseMove
        ) {
          this.state.pickedNode.onMouseMove(intersects[0].point, event);
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
    };

    let onMouseDown = (event: MouseEvent) => {
      mouse.x = ((event.clientX - canvasSize[2]) / canvasSize[0]) * 2 - 1;
      mouse.y = -((event.clientY - canvasSize[3]) / canvasSize[1]) * 2 + 1;
      console.log(event.clientX, event.clientY, canvasSize);

      raycaster.setFromCamera(mouse, camera);

      // See if the ray from the camera into the world hits one of our meshes
      var intersects = raycaster.intersectObjects(objArray);
      if (intersects.length > 0) {
        let result = intersects[0].object as flowIF & THREE.Object3D;
        if (this.state.pickedNode && this.state.pickedNode !== result) {
          this.state.pickedNode.switchLayer(POINT_BLOOM_LAYER, false);
        }
        this.setState({ pickedNode: result });
        result.switchLayer(POINT_BLOOM_LAYER, true);
        if (event.ctrlKey && result instanceof flowNode) {
          let pos = new THREE.Vector3().copy(result.position);
          pos = pos.project(camera);
          this.setState({
            poping: [
              result,
              [
                ((pos.x + 1) * canvasWH[0]) / 2,
                ((1 - pos.y) * canvasWH[1]) / 2,
              ],
            ],
          });
        }
        if (event.shiftKey && result instanceof flowNode) {
          picked = false;
          if (lineNode[0]) {
            lineNode[1] = result;
            objArray.push(
              new flowLine(scene, lineNode[0], lineNode[1], LINE_COLOR)
            );
            lineNode = [];
          } else {
            lineNode[0] = result;
          }
        } else {
          picked = true;
          this.setState({ pickedNode: result });
          (result as flowIF).onClick(raycaster);
        }
      } else {
        console.log("pickNone!", objArray);
        if (this.state.pickedNode) {
          (this.state.pickedNode as flowIF).offClick(raycaster);
          (this.state.pickedNode as flowIF).switchLayer(
            POINT_BLOOM_LAYER,
            false
          );
        }
        this.setState({ pickedNode: null });
      }
    };

    let onMouseUp = (event: MouseEvent) => {
      if (this.state.pickedNode && this.state.pickedNode.offClick) {
        this.state.pickedNode.offClick();
      }
      // this.setState({ pickedNode: null });
      picked = false;
    };

    this.canvas.addEventListener("mousemove", onMouseMove);
    this.canvas.addEventListener("mousedown", onMouseDown);
    this.canvas.addEventListener("mouseup", onMouseUp);

    this.sceneImport = (value) => {
      console.log(value);
      let objs = JSON.parse(value);
      console.log(objs);
      let nodes: { [key: string]: flowNode } = {};
      let lines: any[] = [];
      objs.forEach((obj: any) => {
        switch (obj.type) {
          case "Land":
            let land = new Land(scene, "#fff", lands);
            land.fromADGEJSON(obj);
            objArray.push(land);
            break;
          case "Node":
            let node = new flowNode(
              scene,
              textFactory,
              "node",
              NODE_COLOR,
              BORDER_COLOR
            );
            nodes[obj.uuid] = node;
            node.fromADGEJSON(obj);
            objArray.push(node);
            break;
          case "TextBoard":
            let tb = new TextBoard(scene, "name", 20, "#fff", textFactory);
            tb.fromADGEJSON(obj);
            objArray.push(tb);
            break;
          case "Line":
            lines.push(obj);
            break;
          default:
            break;
        }
      });
      console.log(lines);
      lines.forEach((lineObj) => {
        let start = nodes[lineObj.startID],
          end = nodes[lineObj.endID];
        if (start && end) {
          let line = new flowLine(scene, start, end, LINE_COLOR);
          line.fromADGEJSON(lineObj);
          objArray.push(line);
        }
      });
    };
    this.sceneOutport = () => {
      let lineIdMap: any[] = [];
      console.log("outport", objArray);
      let output = objArray.map((obj) => obj.toADGEJSON(lineIdMap));
      output.push(...lineIdMap);
      return JSON.stringify(output);
    };

    if (dataProvider && dataProvider[0]) {
      this.sceneImport(dataProvider[0]);
      this.setState({ displayMode: true });
    } else {
      let save = localStorage.getItem("saveJSON");
      if (save && save !== "[]") {
        if (confirm("发现存档，是否载入?")) {
          this.sceneImport(save);
        }
      }
    }

    // this.setState({ needsUpdate: Math.random() });
    this.saveInterval = window.setInterval(() => {
      localStorage.setItem("saveJSON", this.sceneOutport());
    }, 60000);
  }

  componentWillUnmount() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }
    this.onDispose();
  }

  layout(objs: THREE.Object3D[]) {
    let g = new dagre.graphlib.Graph();
    g.setGraph({});

    g.setDefaultEdgeLabel(function () {
      return {};
    });

    let nodes: flowNode[] = [];
    objs.forEach((obj) => {
      if (obj instanceof flowNode) {
        nodes.push(obj);
        g.setNode(obj.uuid, { label: obj.text, width: 60, height: 60 });
      }
    });
    nodes.forEach((obj) => {
      obj.starts.forEach((line) => {
        g.setEdge(line.start.uuid, line.end.uuid);
      });
    });

    let xscale = 1.7,
      yscale = 0.9;
    dagre.layout(g);
    g.nodes().forEach((v) => {
      let info = g.node(v);
      console.log(info.label, " x:" + info.x, " y:" + info.y);
      let obj = objs.find((o) => o.uuid === v);
      obj.position.x = info.x * xscale - canvasWH[0] / 2;
      obj.position.z = 30 + info.y * yscale - canvasWH[1] / 2;
    });
    g.edges().forEach((e) => {
      let info = g.edge(e);
      console.log(`${e.v} -> ${e.w} :`, info.points);
    });
    objs.forEach((e) => {
      if (e instanceof flowLine) {
        e.reGenrate();
      }
    });
  }

  render() {
    const { dataProvider } = this.props;
    const { displayMode } = this.state;
    const { poping } = this.state;
    return (
      <div className={styles.main} ref={(m) => (this.bodyDom = m)}>
        <div className={styles.buttons}>
          <div
            className={[styles.rotateButton, styles.button].join(" ")}
            onClick={() => this.changeCamera && this.changeCamera()}
          >
            切换视角
          </div>
          {!displayMode && (
            <>
              <div
                className={[styles.addButton, styles.button].join(" ")}
                onClick={() => this.addNode("NODE")}
              >
                + 添加节点
              </div>
              <div
                className={[styles.addButton, styles.button].join(" ")}
                onClick={() => this.addNode("TEXT")}
              >
                + 添加文字
              </div>
              <div
                className={[styles.addButton, styles.button].join(" ")}
                onClick={() => this.addNode("PLANE")}
              >
                + 添加范围
              </div>
              <div
                className={[styles.addButton, styles.button].join(" ")}
                onClick={() => this.layout(this.objArray)}
              >
                排版
              </div>
            </>
          )}
        </div>

        <div style={{ position: "relative" }}>
          <canvas
            className={styles.mainCanvas}
            ref={(m) => (this.canvas = m)}
          ></canvas>
          <Popup node={poping[0]} position={poping[1]}></Popup>
        </div>
        <MetaPanel
          scene={this.scene}
          objArray={this.objArray}
          compModel={displayMode}
          canvasUpdater={this.updateCanvas}
          pickedUpdater={this.state.pickedNode}
        ></MetaPanel>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            padding: "2px 10px 2px 0",
            color: "#000",
            backgroundColor: "rgba(255,255,255,0.4)",
          }}
        >
          <input
            type="checkbox"
            checked={displayMode}
            onChange={(t) => this.setState({ displayMode: t.target.checked })}
          ></input>
          展示模式
          {!displayMode && (
            <div>
              <button
                onClick={() => (this.outputArea.value = this.sceneOutport())}
              >
                导出
              </button>
              <button onClick={() => this.sceneImport(this.outputArea.value)}>
                导入
              </button>
              <input type="textarea" ref={(m) => (this.outputArea = m)}></input>
            </div>
          )}
        </div>
      </div>
    );
  }
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
