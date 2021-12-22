import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import _ from "lodash";

import { StyleNode, OBJ_PROP_ACT } from "../../GLOBAL";
import { get, post } from "../../tools/http";

import flowIF, { dataSetIF } from "./flowIFs";
import flowLine from "./Line";
import flowIcon from "./Land";
import TextBoard from "./TextBoard";
import FragFactory from "../textRenderer/fragFactory";
import { BufferGeometry } from "three";
import ShaderIF from "../shaders/shadeIF";
import shaderList from "../shaders/shaderList";
import StarryMaskMat from "../shaders/StarryMaskMat";
import shaderBase from "../shaders/shaderBase";

const SIZE = 40;
const hideOpacity = 0.2;
const NODE_Y_POS = 5;

let temp_pickingCoord = [0, 0];
let temp_objCoord = [0, 0];

export default class flowNode extends THREE.Mesh implements flowIF, dataSetIF {
  private _name: string;
  private _dataRequestInterval: number;
  private _queryData: any;
  private _hide: boolean;
  private _data: number;
  private _stateSteps: StyleNode[];
  scene: THREE.Scene;
  shape: geometryType = geometryType.BOX;
  modelFile: File = null;
  imageFile: File = null;
  nameText: TextBoard;
  mainMesh: THREE.Mesh;
  halo: THREE.Mesh;
  haloColor: number[];
  line: THREE.LineSegments;
  iconPlane: THREE.Mesh;
  private _color: string;
  flowUUID: string;
  groupID: string;
  private _lineColor: string;
  starts: flowLine[];
  ends: flowLine[];
  pickingGroupMember: flowNode[];
  isPicked: boolean;
  pickPos: THREE.Vector3;
  isHoving: boolean;
  afterPickFlag: boolean;
  onClick: () => void;
  onGroupClick: () => void;
  offClick: () => void;
  offGroupClick: () => void;
  switchLayer: (layer: number, flag: boolean) => void;
  onMouseMove: (point: THREE.Vector3) => void;
  onGroupMove: (delta: THREE.Vector3) => void;
  editorID: string;
  configToPush: { [key: string]: any } = {};
  selfConfigUpdate?: (config: any, id?: string, tileType?: string) => void;

  constructor(
    scene: THREE.Scene,
    textFactory: FragFactory,
    name: string,
    color: string,
    lineColor?: string,
    editorID?: string
  ) {
    super(
      new THREE.BoxGeometry(SIZE, 2 * SIZE, SIZE),
      new THREE.MeshBasicMaterial({
        transparent: true,
        depthTest: false,
        opacity: 0,
      })
    );
    this.scene = scene;
    this.pickingGroupMember = [];
    this.editorID = editorID;
    this.flowUUID = Math.floor(Math.random() * 0xffffff).toString(16);
    this.groupID = "";
    this.stateSteps = [];
    this._color = color;
    this._lineColor = lineColor || "#888";
    this._name = name;
    this.position.y = NODE_Y_POS;
    let geo = new THREE.BoxGeometry(SIZE, SIZE, SIZE);
    this.mainMesh = new THREE.Mesh(
      geo,
      new THREE.MeshLambertMaterial({
        color: color,
        transparent: true,
      })
    );
    this.mainMesh.geometry.computeVertexNormals();

    const edges = new THREE.EdgesGeometry(this.mainMesh.geometry);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({
        color: this.lineColor,
        linewidth: 1,
        transparent: true,
      })
    );
    this.line = line;
    line.scale.set(1.01, 1.01, 1.01);
    this.mainMesh.add(line);
    this.mainMesh.position.y = SIZE / 2;

    let positionRaw = [
      0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5, 0.5,
      -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5,
      0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5,
      0.5, -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
      -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5,
      -0.5, -0.5, -0.5, -0.5, -0.5,
    ].map((n) => n * SIZE);
    let indices = [
      0, 2, 1, 2, 3, 1, 4, 6, 5, 6, 7, 5, 8, 10, 9, 10, 11, 9, 12, 14, 13, 14,
      15, 13, 16, 18, 17, 18, 19, 17, 20, 22, 21, 22, 23, 21,
    ];
    let colorRaw = [];
    this.haloColor = [150, 150, 210];
    for (let i = 0; i < 24; i++) {
      colorRaw.push(
        this.haloColor[0] / 255,
        this.haloColor[1] / 255,
        this.haloColor[2] / 255,
        0
      );
    }
    let btmI = [2, 3, 6, 7, 12, 13, 14, 15, 18, 19, 22, 23];
    btmI.forEach((i) => {
      colorRaw[i * 4 + 3] = 1.0;
    });
    const colors = new Float32Array(colorRaw);
    const positions = new Float32Array(positionRaw);
    let geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 4));
    geometry.setIndex(indices);

    // *************************
    // requires three.js 0.127+
    // *************************
    const material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
    });
    this.halo = new THREE.Mesh(geometry, material);
    this.halo.scale.set(1.05, 2.5, 1.05);
    this.mainMesh.add(this.halo);
    this.halo.position.set(0, SIZE * 0.75, 0);
    this.add(this.mainMesh);
    this.halo.visible = false;

    this.iconPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(SIZE * 0.9, SIZE * 0.9),
      new THREE.MeshBasicMaterial({
        color: "#fff",
        transparent: true,
        depthTest: false,
        opacity: 0.8,
      })
    );
    this.iconPlane.position.y = SIZE + 1;
    this.iconPlane.rotateX(-Math.PI / 2);
    this.add(this.iconPlane);
    this.iconPlane.visible = false;

    this.nameText = new TextBoard(
      scene,
      name,
      (SIZE * 2) / 4,
      "#fff",
      textFactory
    );
    this.nameText.rotation.z = -Math.PI / 2;
    this.nameText.position.x = -SIZE * 1.2;
    this.add(this.nameText);
    scene.add(this);

    this.starts = [];
    this.ends = [];

    this.isPicked = false;
    this.isHoving = false;
    this.afterPickFlag = false;
    this.onClick = () => {
      this.onGroupClick();
      if (this.groupID) {
        this.scene.traverse((obj) => {
          if (obj instanceof flowNode && obj.groupID === this.groupID) {
            obj.onGroupClick();
            this.pickingGroupMember.push(obj);
          }
        });
        console.log(this.pickingGroupMember, this.stateSteps, this.data);
      }
    };
    this.onGroupClick = () => {
      this.isPicked = true;
      this.afterPickFlag = true;
      this.starts.forEach((_: flowLine) => _.onNodeClick(true, this));
      this.ends.forEach((_: flowLine) => _.onNodeClick(false, this));
      this.pickPos = this.position.clone();
    };
    this.offClick = () => {
      this.offGroupClick();
      this.pickingGroupMember.forEach((obj) => obj.offGroupClick());
      this.pickingGroupMember = [];
    };
    this.offGroupClick = () => {
      this.isPicked = false;
      this.afterPickFlag = false;
      this.onUpdateData(
        "position",
        OBJ_PROP_ACT.SET,
        `${this.position.x},${this.position.z}`,
        true
      );
    };
    this.switchLayer = (layer, flag) => {
      this.isHoving = flag;
      if (flag) {
        this.mainMesh.layers.enable(layer);
        this.layers.enable(layer);
      } else {
        this.mainMesh.layers.disable(layer);
        this.layers.disable(layer);
      }
    };

    this.onMouseMove = (point) => {
      if (this.afterPickFlag) {
        temp_pickingCoord = [point.x, point.z];
        this.afterPickFlag = false;
      } else {
        let delta = new THREE.Vector3(
          point.x - temp_pickingCoord[0],
          0,
          point.z - temp_pickingCoord[1]
        );
        this.onGroupMove(delta);
        this.pickingGroupMember.forEach((_: flowNode) => _.onGroupMove(delta));
      }
    };

    this.onGroupMove = (delta) => {
      this.position.copy(this.pickPos.clone().add(delta));
      this.starts.forEach((_: flowLine) => _.updateFlowLine(true, this));
      this.ends.forEach((_: flowLine) => _.updateFlowLine(false, this));
    };
  }

  tick(delta: number, t: number) {
    if (this.mainMesh.material instanceof ShaderIF) {
      this.mainMesh.material.setTime(t);
    }
  }

  setHaloColor(value: string) {
    let reg = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/;
    if (reg.test(value)) {
      let [raw, r, g, b, a] = reg.exec(value);
      this.haloColor = [+r, +g, +b];
      let colorRaw = [];
      for (let i = 0; i < 24; i++) {
        colorRaw.push(+r / 255, +g / 255, +b / 255, 0);
      }
      let btmI = [2, 3, 6, 7, 12, 13, 14, 15, 18, 19, 22, 23];
      btmI.forEach((i) => {
        colorRaw[i * 4 + 3] = 1.0;
      });
      (this.halo.geometry as THREE.BufferGeometry).setAttribute(
        "color",
        new THREE.BufferAttribute(new Float32Array(colorRaw), 4)
      );
    }
  }

  getMatAttributes() {
    if (this.mainMesh.material instanceof ShaderIF) {
      let uniforms = (this.mainMesh.material as ShaderIF).getUniformsList();
      return uniforms.map((_: { label: string; key: string; type: any }) => {
        return {
          label: _.label,
          key: _.key,
          type: _.type,
          value:
            _.key === "color"
              ? "0x" +
                (
                  (this.mainMesh.material as ShaderIF).getUniform(
                    _.key
                  ) as THREE.Color
                ).getHexString()
              : (this.mainMesh.material as ShaderIF).getUniform(_.key),
        };
      });
    } else {
      return [
        {
          label: "颜色",
          key: "color",
          type: "color",
          value: (
            this.mainMesh.material as THREE.MeshLambertMaterial
          ).color.getHexString(),
        },
      ];
    }
  }

  transToGeo() {
    this.mainMesh.geometry.computeBoundingSphere();
    let geoCenter = new THREE.Vector3().copy(
      this.mainMesh.geometry.boundingSphere.center
    );
    this.mainMesh.geometry.applyMatrix4(
      new THREE.Matrix4().makeTranslation(-geoCenter.x, 0, -geoCenter.z)
    );
    this.mainMesh.geometry.computeBoundingBox();
    this.geometry.boundingBox = this.mainMesh.geometry.boundingBox;
    this.onUpdateData(
      "position",
      OBJ_PROP_ACT.SET,
      `${this.position.x + geoCenter.x},${this.position.y + geoCenter.z}`,
      true
    );
  }

  switchRoadFocus(hide: boolean) {
    let nodeArray = {};
    switchFocus(this, hide, true, nodeArray, true);
    switchFocus(this, hide, false, nodeArray, true);
  }

  onUpdateData(
    propName: string,
    action: OBJ_PROP_ACT,
    value?: any,
    selfUpdate = true
  ) {
    let funMap: {
      [key: string]: [
        string,
        (value: any, selfUpdate?: boolean) => void,
        () => any,
        any[]?
      ];
    } = {
      label_uuid: ["标识ID", (value) => {}, () => this.flowUUID],
      list_type: [
        "形状",
        (value) => {
          console.log(value as geometryType);
          let geo = geoGen(value as geometryType, SIZE);
          this.mainMesh.geometry = geo;
          this.line.geometry = new THREE.EdgesGeometry(geo);
          this.shape = value as geometryType;
        },
        () => this.shape,
        [
          { key: "BOX", value: geometryType.BOX },
          { key: "CYLINDER", value: geometryType.CYLINDER },
          { key: "DODECAHE", value: geometryType.DODECAHE },
          { key: "SPHERE", value: geometryType.SPHERE },
          { key: "CONE", value: geometryType.CONE },
        ],
      ],
      color_line: [
        "描边颜色",
        (value) => {
          this.lineColor = value;
        },
        () => this.lineColor,
      ],
      color_text: [
        "文字颜色",
        (value) => (this.nameText.color = value),
        () => this.nameText.color,
      ],
      color_halo: [
        "光柱颜色",
        (value) => this.setHaloColor(value),
        () =>
          `rgb(${this.haloColor[0]},${this.haloColor[1]},${this.haloColor[2]})`,
      ],
      checker_halo: [
        "显示光柱",
        (value) => (this.halo.visible = value),
        () => this.halo.visible,
      ],
      name: [
        "名称",
        (value) => {
          this.text = value;
        },
        () => this.text,
      ],
      name_groupID: [
        "组ID",
        (value) => {
          this.groupID = value;
        },
        () => this.groupID,
      ],
      model: [
        "模型",
        (value) => {
          if (value && value instanceof File) {
            new OBJLoader().load(URL.createObjectURL(value), (obj) => {
              this.mainMesh.geometry = (obj.children[0] as THREE.Mesh).geometry;
              this.mainMesh.geometry.computeVertexNormals();
              this.transToGeo();
              this.line.geometry = new THREE.EdgesGeometry(
                this.mainMesh.geometry
              );
            });
            this.modelFile = value;
          }
        },
        () => this.modelFile,
      ],
      image_icon: [
        "贴图",
        (value) => {
          console.log(value);
          if (value && value instanceof File) {
            var texture = new THREE.TextureLoader().load(
              URL.createObjectURL(value)
            );
            this.iconPlane.visible = true;
            (this.iconPlane.material as THREE.MeshBasicMaterial).map = texture;
            (this.iconPlane.material as THREE.MeshBasicMaterial).needsUpdate =
              true;
            this.imageFile = value;
          }
        },
        () => this.imageFile,
      ],
      number_icon_scaleX: [
        "图标x缩放",
        (value) => (this.iconPlane.scale.x = +value),
        () => this.iconPlane.scale.x,
      ],
      number_icon_scaleY: [
        "图标y缩放",
        (value) => (this.iconPlane.scale.y = +value),
        () => this.iconPlane.scale.y,
      ],
      number_icon_rotateZ: [
        "图标旋转",
        (value) => (this.iconPlane.rotation.z = +value),
        () => this.iconPlane.rotation.z,
      ],
      number_iconHeight: [
        "图片高度",
        (value) => {
          this.iconPlane.position.y = +value;
        },
        () => this.iconPlane.position.y,
      ],
      number_text: [
        "文字偏移",
        (value) => {
          this.nameText.position.x = -value;
        },
        () => -this.nameText.position.x,
      ],
      number_textHeight: [
        "文字高度",
        (value) => {
          this.nameText.position.y = value;
        },
        () => -this.nameText.position.y,
      ],
      number_scaleX: [
        "x缩放",
        (value) => (this.mainMesh.scale.x = value),
        () => this.mainMesh.scale.x,
      ],
      number_scaleY: [
        "y缩放",
        (value) => {
          this.mainMesh.scale.y = value;
          // this.position.y = (this.scale.y * SIZE) / 2;
        },
        () => this.mainMesh.scale.y,
      ],
      number_scaleZ: [
        "z缩放",
        (value) => (this.mainMesh.scale.z = value),
        () => this.mainMesh.scale.z,
      ],
      position: [
        "位置",
        (value) => {
          let pos = /^(\-?\d+(\.\d+)?),\s*(\-?\d+(\.\d+)?)$/.exec(value);
          if (pos) {
            this.position.x = +pos[1];
            this.position.z = +pos[3];
          }
          this.starts.forEach((_: flowLine) => _.offNodeClick());
          this.ends.forEach((_: flowLine) => _.offNodeClick());
        },
        () => `${this.position.x},${this.position.z}`,
      ],
      steps: [
        "数据状态",
        (value) => (this.stateSteps = value),
        () => this.stateSteps,
      ],
      list_mat: [
        "材质类型",
        (pickingMat, selfUpdate) => {
          if (
            pickingMat !==
            (this.mainMesh.material as THREE.MeshLambertMaterial | shaderBase)
              .type
          ) {
            this.switchMat(pickingMat);
            if (selfUpdate) {
              let attrs = this.getMatAttributes();
              this.configToPush["attrSet"] = attrs;
            }
          }
        },
        () =>
          (this.mainMesh.material as THREE.MeshLambertMaterial | shaderBase)
            .type,
        shaderList.map((matNode) => ({
          key: matNode.name,
          value: matNode.name,
        })),
      ],
      attrSet: [
        "材质属性",
        (
          data: {
            label: string;
            key: string;
            type: string;
            value: string;
          }[]
        ) => {
          data.forEach(
            ((_: { type: string; key: string; value: any }) => {
              if (_.type === "color") {
                (
                  this.mainMesh.material as THREE.MeshLambertMaterial | ShaderIF
                ).color = new THREE.Color(_.value + "");
              } else if (this.mainMesh.material instanceof ShaderIF) {
                if (_.type === "image") {
                  if (_.value && _.value instanceof File) {
                    let texLoader = new THREE.TextureLoader().load(
                      URL.createObjectURL(_.value),
                      (texture) => {
                        let oldUniforms = this.getMatAttributes();
                        this.mainMesh.material = new StarryMaskMat({ texture });
                        oldUniforms.forEach(
                          ({ key, value }) =>
                            typeof value === "number" &&
                            (
                              this.mainMesh.material as StarryMaskMat
                            ).setUniform(key, value)
                        );
                      }
                    );
                    texLoader.wrapS = THREE.RepeatWrapping;
                    texLoader.wrapT = THREE.RepeatWrapping;
                  }
                } else {
                  (this.mainMesh.material as ShaderIF).setUniform(
                    _.key,
                    _.value
                  );
                }
              } else {
                console.error("ShaderSet Invailed", _.type, _.key, _.value);
              }
            }).bind(this)
          );
        },
        () => {
          return this.getMatAttributes();
        },
      ],
    };
    if (action === OBJ_PROP_ACT.KEYS) return Object.keys(funMap);
    else if (funMap[propName]) {
      if (action === OBJ_PROP_ACT.NAME || action === OBJ_PROP_ACT.LIST_NODES)
        return funMap[propName][action];
      else if (action === OBJ_PROP_ACT.SET) {
        if (
          propName.indexOf("position") !== -1 ||
          funMap[propName][OBJ_PROP_ACT.GET].bind(this)() !== value
        ) {
          funMap[propName][action].bind(this)(value, selfUpdate);
          if (selfUpdate) {
            this.configToPush[propName] = value;
            this.selfConfigUpdateDeb();
          }
        }
      } else {
        return funMap[propName][action]
          ? funMap[propName][action].bind(this)()
          : null;
      }
    }
  }

  selfConfigUpdateDeb = _.debounce(() => {
    if (this.selfConfigUpdate && this.editorID) {
      this.selfConfigUpdate(this.configToPush, this.editorID, "flow3DNode");
      this.configToPush = {};
    }
  }, 1000);

  switchMat(pickingMat: string) {
    let { creator } = shaderList.find((mat) => mat.name === pickingMat);
    let oldOpacity = (this.mainMesh.material as THREE.Material).opacity;
    let oldColor = (
      this.mainMesh.material as THREE.MeshLambertMaterial | ShaderIF
    ).color;
    let oldUniforms = undefined;
    if (this.mainMesh.material instanceof THREE.ShaderMaterial) {
      oldUniforms = this.mainMesh.material.uniforms;
    }
    this.mainMesh.material = new creator({
      transparent: true,
      texture: undefined,
    });
    if (oldUniforms && this.mainMesh.material instanceof THREE.ShaderMaterial) {
      for (let key in oldUniforms) {
        if (this.mainMesh.material.uniforms[key])
          this.mainMesh.material.uniforms[key] = oldUniforms[key];
      }
    }
    this.mainMesh.material.opacity = oldOpacity;
    (this.mainMesh.material as THREE.MeshLambertMaterial | ShaderIF).color.set(
      oldColor
    );
    this.mainMesh.material.needsUpdate = true;
  }

  updateData() {
    if (!(this.data && this.stateSteps && this.stateSteps.length > 0)) return;
    let steps = [...this.stateSteps];
    steps.unshift({
      cutPoint: -Infinity,
      color: this.color,
      lineColor: this.lineColor,
    });
    steps.length > 2 && steps.sort((a, b) => a.cutPoint - b.cutPoint);
    let k = 0;
    while (k !== steps.length && this.data > steps[k].cutPoint) k++;
    (this.mainMesh.material as THREE.MeshLambertMaterial | ShaderIF).color.set(
      steps[k - 1].color
    );
    (this.line.material as THREE.LineBasicMaterial).color.set(
      steps[k - 1].lineColor
    );
  }

  set color(value) {
    if (this.mainMesh.material) {
      (
        this.mainMesh.material as THREE.MeshLambertMaterial | ShaderIF
      ).color.set(value);
      this._color = value;
    }
  }
  get color() {
    return this._color;
  }
  set lineColor(value) {
    if (this.line.material instanceof THREE.LineBasicMaterial) {
      this.line.material.color.set(value);
      this._lineColor = value;
    }
  }
  get lineColor() {
    return this._lineColor;
  }
  set hide(value) {
    this._hide = value;
    if (value) {
      (this.mainMesh.material as THREE.Material).opacity = hideOpacity;
      (this.line.material as THREE.Material).opacity = hideOpacity;
      (this.iconPlane.material as THREE.Material).opacity = hideOpacity;
      this.nameText.material.opacity = hideOpacity;
    } else {
      (this.mainMesh.material as THREE.Material).opacity = 1;
      (this.line.material as THREE.Material).opacity = 1;
      (this.iconPlane.material as THREE.Material).opacity = 1;
      this.nameText.material.opacity = 1;
    }
  }
  get hide() {
    return this._hide;
  }
  set text(value) {
    this._name = value;
    this.nameText.text = value;
  }
  get text() {
    return this._name;
  }

  set data(value) {
    this._data = value;
    this.updateData();
  }
  get data() {
    return this._data;
  }

  set stateSteps(value) {
    console.log(value);
    this._stateSteps = value;
    this.updateData();
  }

  get stateSteps() {
    return this._stateSteps;
  }

  toADGEJSON(lineArray: any[]) {
    let ret: any = {};
    ret.type = "Node";
    ret.uuid = this.uuid;
    ret.name = this.text;
    ret.flowUUID = this.flowUUID;
    ret.stateSteps = btoa(JSON.stringify(this.stateSteps));
    ret.editorID = this.editorID;
    ret.groupID = this.groupID;
    ret.nameOffset = this.nameText.position.z;
    ret.iconHeight = this.iconPlane.position.y;
    ret.color = this.color;
    ret.lineColor = this.lineColor;
    ret.matrix = [
      this.position.toArray(),
      this.scale.toArray(),
      this.rotation.toArray(),
    ];
    ret.mainMeshJson = this.mainMesh.toJSON();
    ret.iconMesh = this.iconPlane.toJSON();
    ret.halo = { visible: this.halo.visible, color: this.haloColor };
    ret.matType = (
      this.mainMesh.material as THREE.MeshLambertMaterial | shaderBase
    ).type;

    // lineArray.push(...this.starts.map((s) => s.toADGEJSON()));
    return ret;
  }
  fromADGEJSON(json: any) {
    console.log("nodeLoadStart", json);
    this.text = json.name;
    json.flowUUID && (this.flowUUID = json.flowUUID);
    json.stateSteps && (this.stateSteps = JSON.parse(atob(json.stateSteps)));
    this.nameText.position.z = json.nameOffset;
    this.color = json.color;
    this.lineColor = json.lineColor;
    json.mainMeshJson.materials = json.mainMeshJson.materials.map((m: any) => {
      if (m.type != "MeshLambertMaterial" && m.type != "ShaderMaterial") {
        m.type = "ShaderMaterial";
      }
      return m;
    });
    new THREE.ObjectLoader().parse(json.mainMeshJson, (obj) => {
      this.mainMesh.geometry = (obj as THREE.Mesh).geometry;
      this.mainMesh.scale.copy((obj as THREE.Mesh).scale);
      this.mainMesh.position.copy((obj as THREE.Mesh).position);
      this.line.geometry = new THREE.EdgesGeometry(this.mainMesh.geometry);
      this.mainMesh.geometry.computeVertexNormals();
      this.mainMesh.material = (obj as THREE.Mesh).material;
      if (json.matType !== "MeshLambertMaterial") {
        this.switchMat(json.matType);
      }
    });
    new THREE.ObjectLoader().parse(json.iconMesh, (obj) => {
      this.remove(this.iconPlane);
      this.iconPlane = obj as THREE.Mesh;
      json.iconHeight && (obj.position.y = +json.iconHeight);
      this.add(obj);
    });
    if (json.halo) {
      this.halo.visible = json.halo.visible;
      this.setHaloColor(
        `rgba(${json.halo.color[0]},${json.halo.color[1]},${json.halo.color[2]},1.0)`
      );
    }
    this.position.fromArray(json.matrix[0]);
    this.scale.fromArray(json.matrix[1]);
    this.rotation.fromArray(json.matrix[2]);
    this.editorID = json.editorID;
    this.groupID = json.groupID;
    console.log("nodeLoadEnd", json);
  }
  onDispose(scene: THREE.Scene, objArray: (flowIF & THREE.Object3D)[]) {
    scene.remove(this);
    this.remove(this.mainMesh);
    this.mainMesh.geometry.dispose();
    (this.mainMesh.material as THREE.Material).dispose();
    this.remove(this.iconPlane);
    this.iconPlane.geometry.dispose();
    (this.iconPlane.material as THREE.Material).dispose();
    this.geometry.dispose();
    (this.material as THREE.Material).dispose();
    this.starts.forEach((line) => line.onDispose(scene, objArray));
    this.ends.forEach((line) => line.onDispose(scene, objArray));
  }
}

enum geometryType {
  BOX = "BOX",
  CYLINDER = "CYLINDER",
  DODECAHE = "DODECAHE",
  SPHERE = "SPHERE",
  CONE = "CONE",
}

function geoGen(type: geometryType, SIZE: number) {
  const typeFun = {
    CYLINDER: () => {
      return new THREE.CylinderGeometry(SIZE / 2, SIZE / 2, SIZE);
    },
    DODECAHE: () => {
      return new THREE.DodecahedronGeometry(SIZE / 2);
    },
    BOX: () => {
      return new THREE.BoxGeometry(SIZE, SIZE, SIZE);
    },
    SPHERE: () => {
      return new THREE.SphereGeometry(SIZE / 2);
    },
    CONE: () => {
      return new THREE.ConeGeometry(SIZE * 0.6, SIZE, 4);
    },
  };
  return typeFun[type]();
}

function switchFocus(
  obj: flowNode,
  hide: boolean,
  forward: boolean,
  nodeArray: { [key: string]: boolean | string },
  starter = false
) {
  obj.hide = hide;
  if (!starter) {
    if (nodeArray[obj.uuid]) return;
  }
  nodeArray[obj.uuid] = true;
  if (forward) {
    obj.starts.forEach((l) => {
      l.hide = hide;
      switchFocus(l.end, hide, forward, nodeArray);
    });
  } else {
    obj.ends.forEach((l) => {
      l.hide = hide;
      switchFocus(l.start, hide, forward, nodeArray);
    });
  }
}
