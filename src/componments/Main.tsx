import React from "react";
import * as THREE from "three";
import { Object3D } from "three";
import dagre from "dagre";
import Events from "events";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";

import styles from "./Main.less";

import { CAMERA_STATE, EventEmitter, OBJ_PROP_ACT, StyleNode } from "../GLOBAL";

import FragFactory from "./textRenderer/fragFactory";
import flowIF, { dataSetIF } from "./objects/flowIFs";
import flowNode from "./objects/Node";
import flowLine from "./objects/Line";
import Land from "./objects/Land";
import TextBoard from "./objects/TextBoard";
import MetaPanel from "./MetaPanel";
import Popup from "./popup";

interface MainIf {
  dataProvider?: any[];
  dataImport?: any[];
  compModel?: boolean;
  dataOfSet?: {
    config: any;
    tileType: string;
    editorID: string;
    id: string;
    value: number;
    message?:
      | { status: string; title: string; content: string; url: string }
      | undefined;
  }[];
  config: {
    BgColor: string;
    gridColor: string;
    import: string;
    cameraHeight: number;
    sceneLight: number;
  };
  selfConfigUpdate?: (config: any, id?: string, tileType?: string) => void;
  selfNodeSelect?: (id: string) => void;
  selfNodeAdd?: (type: string, name: string) => string;
  develop: boolean;
}
interface MainState {
  displayMode: boolean;
  focusMode: boolean;
  poping: [
    { status: string; title: string; content: string; url: string },
    number[]
  ];
  pickedNode: flowIF & THREE.Object3D;
}
const MIN_CAM_SCALE = 0.2;
const MAX_CAM_SCALE = 1;
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

const canvasWH = [1920, 1080];
const defaultIntensity = 0.87;
const defaultScale = 0.7;
const defaultCameraHeight = 2000;

let textFactory = new FragFactory(undefined, TEXT_COLOR, TEXT_BACKGROUND);

export default class MainPlane extends React.Component<MainIf, MainState> {
  canvas: HTMLCanvasElement;
  bodyDom: HTMLDivElement;
  eventEmitter: Events.EventEmitter;
  displayInView: boolean;
  scene: THREE.Scene;
  camera: THREE.Camera;
  objArray: ((flowIF | (flowIF & dataSetIF)) & THREE.Object3D)[];
  lands: Land[];
  addNode: (flag: string) => void;
  changeCamera: () => void;
  onResize: () => void;
  onDispose: () => void;
  updateCanvas: (key: string, value: any) => void;
  recentSceneSTR: string;
  recentDataSTR: string;
  outputArea: HTMLInputElement;
  saveInterval: number;

  constructor(props: MainIf) {
    super(props);
    this.canvas = undefined;
    this.bodyDom = undefined;
    this.eventEmitter = EventEmitter;
    this.displayInView = false;
    this.state = {
      displayMode: true,
      focusMode: false,
      pickedNode: null,
      poping: [undefined, []],
    };
  }
  componentDidMount() {
    const {
      dataImport,
      compModel,
      dataOfSet,
      selfConfigUpdate,
      selfNodeAdd,
      selfNodeSelect,
    } = this.props;
    if (!(selfConfigUpdate && selfNodeAdd && selfNodeSelect))
      this.displayInView = !this.props.develop;
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
      50000
    );
    this.camera = camera;
    camera.position.set(-1500, defaultCameraHeight, 1500);
    camera.lookAt(0, 0, 0);
    scene.add(camera);

    let cameraState: CAMERA_STATE = 1 as CAMERA_STATE;
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
        if (this.canvas) {
          let canvasRect = this.canvas.getBoundingClientRect();
          canvasSize = [
            canvasRect.width,
            canvasRect.height,
            canvasRect.left,
            canvasRect.top,
          ];
        }
      }, 2000);
      console.log("onResize", canvasRect, canvasSize);
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
        color: "black",
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
    this.lands = [];

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
    landOutLine.selectedObjects = this.lands;
    finalComposer.addPass(landOutLine);
    let fxaaPass = new ShaderPass(FXAAShader);
    const pixelRatio = renderer.getPixelRatio();
    fxaaPass.material.uniforms["resolution"].value.x =
      1 / (canvasWH[0] * pixelRatio);
    fxaaPass.material.uniforms["resolution"].value.y =
      1 / (canvasWH[1] * pixelRatio);
    finalComposer.addPass(fxaaPass);
    this.objArray = [];
    let lastTime = 0;
    let animate = (t: number) => {
      requestAnimationFrame(animate);
      try {
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

        this.objArray.forEach(
          (obj: (flowIF | (flowIF & dataSetIF)) & THREE.Object3D) =>
            obj.tick && obj.tick(delta)
        );
      } catch (e) {
        console.error("RENDER ERROR:", e);
      }
    };
    animate(0);

    let canvasUpdatefunMap = {
      cameraHeight: (value: any) => {
        camera.position.y = +value;
        camera.lookAt(0, 0, 0);
      },
      sceneLight: (value: any) => {
        light.intensity = 1 - value;
        ambientLight.intensity = value;
      },
      backgroundColor: (value: any) => {
        renderer.setClearColor(value, 1);
      },
      gridColor: (value: any) => {
        (gridHelper.material as THREE.LineBasicMaterial).color.set(value);
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
        case CAMERA_STATE.RIGHT:
          camera.position.x = -1500;
          camera.position.z = 1500;
          camera.lookAt(0, 0, 0);
          break;
        case CAMERA_STATE.LEFT:
          camera.position.x = -1500;
          camera.position.z = -1500;
          camera.lookAt(0, 0, 0);
          break;
        case CAMERA_STATE.TOP:
          camera.position.x = 0;
          camera.position.z = 0;
          camera.lookAt(0, 0, 0);
          camera.rotation.z = -Math.PI / 2;
          break;
        default:
          break;
      }
      this.eventEmitter.emit("changeCamera", cameraState);
    };
    this.addNode = (flag: string) => {
      switch (flag) {
        case "NODE":
          this.objArray.push(
            new flowNode(
              scene,
              textFactory,
              `NODE${this.objArray.length}`,
              NODE_COLOR,
              BORDER_COLOR
            )
          );
          break;
        case "PLANE":
          let land = new Land(scene, "#888", this.lands);
          this.objArray.push(land);
          break;
        case "TEXT":
          this.objArray.push(
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
      let { focusMode } = this.state;
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
      var intersects = raycaster.intersectObjects(this.objArray);
      if (intersects.length > 0) {
        let result = intersects[0].object as flowIF & THREE.Object3D;
        result.switchLayer(POINT_BLOOM_LAYER, true);
        if (pointing !== result) {
          pointing && pointing.switchLayer(POINT_BLOOM_LAYER, false);
          if (focusMode) {
            pointing instanceof flowNode && pointing.switchRoadFocus(true);
            result instanceof flowNode && result.switchRoadFocus(false);
          }
          pointing = result;
        }
      } else {
        pointing && pointing.switchLayer(POINT_BLOOM_LAYER, false);
        if (focusMode) {
          pointing instanceof flowNode && pointing.switchRoadFocus(true);
        }
        pointing = null;
      }
    };

    let onMouseDown = (event: MouseEvent) => {
      mouse.x = ((event.clientX - canvasSize[2]) / canvasSize[0]) * 2 - 1;
      mouse.y = -((event.clientY - canvasSize[3]) / canvasSize[1]) * 2 + 1;
      console.log(event.clientX, event.clientY, canvasSize);

      raycaster.setFromCamera(mouse, camera);

      // See if the ray from the camera into the world hits one of our meshes
      var intersects = raycaster.intersectObjects(this.objArray);
      if (intersects.length > 0) {
        let result = intersects[0].object as flowIF & THREE.Object3D;
        if (this.state.pickedNode && this.state.pickedNode !== result) {
          this.state.pickedNode.switchLayer(POINT_BLOOM_LAYER, false);
        }
        result.switchLayer(POINT_BLOOM_LAYER, true);
        if (!this.displayInView) {
          if (event.ctrlKey && result instanceof flowNode) {
            //ctrl handle
          } else if (event.shiftKey && result instanceof flowNode) {
            picked = false;
            if (lineNode[0]) {
              lineNode[1] = result;
              const line = new flowLine(
                scene,
                lineNode[0],
                lineNode[1],
                LINE_COLOR
              );
              line.editorID = selfNodeAdd(
                "flow3DLine",
                `${lineNode[0].text}->${lineNode[1].text}`
              );
              this.objArray.push(line);
              lineNode = [];
            } else {
              lineNode[0] = result;
            }
          } else {
            picked = true;
            this.setState({ pickedNode: result });
            result.editorID &&
              !this.displayInView &&
              this.props.selfNodeSelect(result.editorID);
            (result as flowIF).onClick(raycaster);
          }
        }
      } else {
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

    this.saveInterval = window.setInterval(() => {
      this.manualSave();
    }, 60000);
    this.dataUpdate();
  }

  componentDidUpdate() {
    console.log("UUU");
    this.dataUpdate();
  }

  componentWillUnmount() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }
    this.onDispose && this.onDispose();
  }

  sceneOutport() {
    let lineIdMap: any[] = [];
    let output = this.objArray.map((obj) => obj.toADGEJSON(lineIdMap));
    output.push(...lineIdMap);
    this.recentSceneSTR = JSON.stringify(output);
    return this.recentSceneSTR;
  }
  manualSave() {
    let save = this.sceneOutport();
    if (this.props.selfConfigUpdate && !this.displayInView) {
      this.props.selfConfigUpdate({ import: save });
    }
  }

  sceneImport(value: string) {
    console.log("sceneImport");
    if (this.recentSceneSTR === value) return;
    this.clearScene();
    this.recentSceneSTR = value;
    let objs = JSON.parse(value);
    let nodes: { [key: string]: flowNode } = {};
    let lines: any[] = [];
    objs.forEach((obj: any) => {
      switch (obj.type) {
        case "Land":
          let land = new Land(this.scene, "#fff", this.lands);
          land.fromADGEJSON(obj);
          this.objArray.push(land);
          break;
        case "Node":
          let node = new flowNode(
            this.scene,
            textFactory,
            "node",
            NODE_COLOR,
            BORDER_COLOR
          );
          nodes[obj.uuid] = node;
          node.fromADGEJSON(obj);
          this.objArray.push(node);
          break;
        case "TextBoard":
          let tb = new TextBoard(this.scene, "name", 20, "#fff", textFactory);
          tb.fromADGEJSON(obj);
          this.objArray.push(tb);
          break;
        case "Line":
          lines.push(obj);
          break;
        default:
          break;
      }
    });
    lines.forEach((lineObj) => {
      let start = nodes[lineObj.startID],
        end = nodes[lineObj.endID];
      if (start && end) {
        let line = new flowLine(this.scene, start, end, LINE_COLOR);
        line.fromADGEJSON(lineObj);
        this.objArray.push(line);
      }
    });
  }
  dataUpdate() {
    let { dataOfSet, config, selfConfigUpdate } = this.props;
    if (config) {
      config.BgColor && this.updateCanvas("backgroundColor", config.BgColor);
      config.gridColor && this.updateCanvas("gridColor", config.gridColor);
      config.cameraHeight &&
        this.updateCanvas("cameraHeight", config.cameraHeight);
      config.sceneLight && this.updateCanvas("sceneLight", config.sceneLight);
      config.import && this.sceneImport(config.import);
    }
    if (!(dataOfSet && selfConfigUpdate)) return;

    let newDataSTR = JSON.stringify(dataOfSet);
    if (this.recentDataSTR !== newDataSTR) {
      this.recentDataSTR = newDataSTR;

      let objMap: {
        [key: string]: { exist: boolean; obj: flowIF & THREE.Object3D };
      } = {};
      this.objArray.forEach((o) => {
        if (o.editorID) objMap[o.editorID] = { obj: o, exist: false };
      });
      dataOfSet.forEach((data) => {
        if (data.id === "000000") return;
        let item: flowIF & THREE.Object3D;
        if (objMap[data.editorID]) {
          item = objMap[data.editorID].obj;
          objMap[data.editorID].exist = true;
        } else {
          switch (data.tileType) {
            case "flow3DNode":
              item = new flowNode(
                this.scene,
                textFactory,
                data.id,
                NODE_COLOR,
                BORDER_COLOR,
                data.editorID
              );
              this.objArray.push(item);
              break;
            case "flow3DLand":
              let land = new Land(
                this.scene,
                "#888",
                this.lands,
                data.editorID
              );
              this.objArray.push(land);
              item = land;
              break;
            case "flow3DText":
              item = new TextBoard(
                this.scene,
                "test text",
                40,
                "#fff",
                textFactory,
                data.editorID
              );
              this.objArray.push(item);
              break;
            case "flow3DLine":
              item = this.objArray.find((l) => l.editorID === data.editorID);
              break;
            default:
              break;
          }
        }
        if (!item) return;

        item.selfConfigUpdate = (config, id, tileType) => {
          selfConfigUpdate(config, id, tileType);
          this.manualSave();
        };

        if (item instanceof flowNode || item instanceof flowLine)
          item.data = data.value;
        if (data.config && Object.keys(data.config).length > 0) {
          //数据状态
          let stepSteps: StyleNode[] = [];
          for (let i = 1; i < 3; i++) {
            if (data.config[`baseNumber${i}`]) {
              stepSteps.push({
                cutPoint: +data.config[`baseNumber${i}`],
                color: data.config[`color${i}`],
                lineColor: data.config[`lineColor${i}`],
              });
            }
          }
          for (let key in data.config) {
            item.onUpdateData(key, 1, data.config[key]);
          }
          if (data.id) {
            item.onUpdateData("name", OBJ_PROP_ACT.SET, data.id);
          }
          if (stepSteps.length > 0) {
            item.onUpdateData("steps", OBJ_PROP_ACT.SET, stepSteps);
          }
        }
        if (data.message) {
          this.popupOnNode(item, data.message);
        }
      });
      for (let id in objMap) {
        let node = objMap[id];
        if (!(node.exist || node.obj instanceof flowLine)) {
          node.obj.onDispose(this.scene, this.objArray);
        }
      }
    }
  }

  popupOnNode(
    result: THREE.Object3D,
    info: { status: string; title: string; content: string; url: string }
  ) {
    let pos = new THREE.Vector3().copy(result.position);
    pos = pos.project(this.camera);
    this.setState({
      poping: [
        info,
        [((pos.x + 1) * canvasWH[0]) / 2, ((1 - pos.y) * canvasWH[1]) / 2],
      ],
    });
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

    let xscale = 1,
      yscale = 1;
    dagre.layout(g);
    g.nodes().forEach((v) => {
      let info = g.node(v);
      console.log(info.label, " x:" + info.x, " y:" + info.y);
      let obj = objs.find((o) => o.uuid === v);
      obj.position.x = 0 + info.x * xscale - canvasWH[0] / 8;
      obj.position.z = 0 + info.y * yscale - canvasWH[1] / 8;
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

  switchFocus(hide: boolean) {
    this.setState({ focusMode: hide });
    this.objArray.forEach((o) => {
      if (o instanceof flowNode || o instanceof flowLine) {
        o.hide = hide;
      }
    });
  }

  clearScene() {
    console.log("clearScene");
    this.objArray.forEach((o) => {
      if (o.onDispose) o.onDispose(this.scene, this.objArray);
      else this.scene.remove(o);
    });
    this.objArray = [];
  }

  render() {
    const { dataImport } = this.props;
    const { displayMode, focusMode } = this.state;
    const { poping } = this.state;
    return (
      <div className={styles.main} ref={(m) => (this.bodyDom = m)}>
        <div className={styles.buttons}>
          <div
            className={[styles.rotateButton, styles.button].join(" ")}
            onClick={() => this.manualSave && this.manualSave()}
          >
            保存场景
          </div>
          <div
            className={[styles.rotateButton, styles.button].join(" ")}
            onClick={() => this.changeCamera && this.changeCamera()}
          >
            切换视角
          </div>
          <div
            className={[
              styles.rotateButton,
              styles.button,
              focusMode ? "" : styles.disabled,
            ].join(" ")}
            onClick={() => {
              this.switchFocus(!focusMode);
            }}
          >
            高亮模式
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
              <div style={{ fontSize: 8 }}>
                <p>按住SHIFT点击两个节点制作连线</p>
                <p>按住ctrl拖动一个平面调整其尺寸</p>
                <p>选中连线后会显示标识ID，点击自动复制</p>
                <p>下方同ID的连线样式节点绑定</p>
              </div>
            </>
          )}
        </div>

        <div style={{ position: "relative" }}>
          <canvas
            className={styles.mainCanvas}
            ref={(m) => (this.canvas = m)}
          ></canvas>
          <Popup
            info={poping[0]}
            position={poping[1]}
            onClose={() =>
              this.setState({
                poping: [undefined, []],
              })
            }
          ></Popup>
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
            disabled={this.displayInView}
            onChange={(t) =>
              this.setState({
                displayMode: this.displayInView || t.target.checked,
              })
            }
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
