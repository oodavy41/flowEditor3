import * as THREE from "three";

import flowIF from "./flowIF";
import flowLine from "./Line";
import flowIcon from "./Land";
import TextBoard from "./TextBoard";
import FragFactory from "./textRenderer/fragFactory";

import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

const SIZE = 40;

export default class flowNode extends THREE.Mesh implements flowIF {
  _name: string;
  nameText: TextBoard;
  mainMesh: THREE.Mesh;
  line: THREE.LineSegments;
  iconPlane: THREE.Mesh;
  _color: string | number;
  _lineColor: string | number;
  starts: flowLine[];
  ends: flowLine[];
  isPicked: boolean;
  isHoving: boolean;
  onClick: () => void;
  offClick: () => void;
  switchLayer: (layer: number, flag: boolean) => void;
  onUpdateData: { [key: string]: [string, (value: any) => void, any?, any[]?] };
  onMouseMove: (point: THREE.Vector3) => void;

  constructor(
    scene: THREE.Scene,
    textFactory: FragFactory,
    name: string,
    color: string | number,
    lineColor?: string | number
  ) {
    super(
      new THREE.BoxGeometry(SIZE, 2 * SIZE, SIZE),
      new THREE.MeshBasicMaterial({
        transparent: true,
         depthWrite:false,
        opacity: 0,
      })
    );
    this._color = color;
    this._lineColor = lineColor || "#888";
    this._name = name;
    this.position.y = 5;
    let geo = new THREE.BoxGeometry(SIZE, SIZE, SIZE);
    this.mainMesh = new THREE.Mesh(
      geo,
      new THREE.MeshLambertMaterial({
        color: color,
      })
    );
    const edges = new THREE.EdgesGeometry(this.mainMesh.geometry);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: this.lineColor, linewidth: 1 })
    );
    this.line = line;
    line.scale.set(1.01, 1.01, 1.01);
    this.mainMesh.add(line);
    this.mainMesh.position.y = SIZE / 2;
    this.add(this.mainMesh);

    this.iconPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(SIZE * 0.9, SIZE * 0.9),
      new THREE.MeshBasicMaterial({
        color: "#fff",
        transparent: true,
         depthWrite:false,
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
      "#4286c4",
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
    this.onClick = () => {
      this.isPicked = true;
      this.starts.forEach((_: flowLine) => _.onNodeClick(true, this));
      this.ends.forEach((_: flowLine) => _.onNodeClick(false, this));
    };
    this.offClick = () => {
      this.isPicked = false;
      this.starts.forEach((_: flowLine) => _.offNodeClick());
      this.ends.forEach((_: flowLine) => _.offNodeClick());
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
    this.onUpdateData = {
      color: [
        "颜色",
        (value) => {
          this.color = value;
        },
        () => this.color,
      ],
      list_type: [
        "形状",
        (value) => {
          console.log(value as geometryType);
          let geo = geoGen(value as geometryType, SIZE);
          this.mainMesh.geometry = geo;
          this.line.geometry = new THREE.EdgesGeometry(geo);
        },
        () => "BOX",
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
      name: [
        "名称",
        (value) => {
          this.text = value;
        },
        () => this.text,
      ],
      model: [
        "模型",
        (value) => {
          new OBJLoader().load(URL.createObjectURL(value), (obj) => {
            this.mainMesh.geometry = (obj.children[0] as THREE.Mesh).geometry;
            line.geometry = new THREE.EdgesGeometry(this.mainMesh.geometry);
          });
        },
      ],
      image_icon: [
        "贴图",
        (value) => {
          var texture = new THREE.TextureLoader().load(
            URL.createObjectURL(value)
          );
          this.iconPlane.visible = true;
          (this.iconPlane.material as THREE.MeshBasicMaterial).map = texture;
          (this.iconPlane
            .material as THREE.MeshBasicMaterial).needsUpdate = true;
        },
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
      number_scaleX: [
        "x缩放",
        (value) => (this.mainMesh.scale.x = value),
        () => this.mainMesh.scale.x,
      ],
      number_scaleY: [
        "y缩放",
        (value) => {
          this.mainMesh.scale.y = value;
          this.mainMesh.position.y = (this.mainMesh.scale.y * SIZE) / 2;
        },
        () => this.mainMesh.scale.y,
      ],
      number_scaleZ: [
        "z缩放",
        (value) => (this.mainMesh.scale.z = value),
        () => this.mainMesh.scale.z,
      ],
    };

    this.onMouseMove = (point) => {
      this.position.set(point.x, 5, point.z);
      if (this.isPicked) {
        this.starts.forEach((_: flowLine) => _.updateFlowLine(true, this));
        this.ends.forEach((_: flowLine) => _.updateFlowLine(false, this));
      }
    };
  }
  onDispose(scene: THREE.Scene, objArray: (flowIF & THREE.Object3D)[]) {
    scene.remove(this);
    let index = objArray.indexOf(this);
    if (index >= 0) {
      objArray.splice(index, 1);
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
  set color(value) {
    if (this.mainMesh.material) {
      (this.mainMesh.material as THREE.MeshBasicMaterial).color.set(value);
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
  set text(value) {
    this._name = value;
    this.nameText.text = value;
  }
  get text() {
    return this._name;
  }
  toADGEJSON(lineArray: any[]) {
    let ret: any = {};
    ret.type = "Node";
    ret.uuid = this.uuid;
    ret.name = this.text;
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
    console.log(this.starts);
    // lineArray.push(...this.starts.map((s) => s.toADGEJSON()));
    return ret;
  }
  fromADGEJSON(json: any) {
    this.text = json.name;
    this.nameText.position.z = json.nameOffset;
    this.color = json.color;
    this.lineColor = json.lineColor;
    new THREE.ObjectLoader().parse(json.mainMeshJson, (obj) => {
      this.mainMesh.geometry = (obj as THREE.Mesh).geometry;
      this.mainMesh.scale.copy((obj as THREE.Mesh).scale);
      this.mainMesh.position.copy((obj as THREE.Mesh).position);
      this.line.geometry = new THREE.EdgesGeometry(this.mainMesh.geometry);
    });
    new THREE.ObjectLoader().parse(json.iconMesh, (obj) => {
      this.remove(this.iconPlane);
      this.iconPlane = obj as THREE.Mesh;
      json.iconHeight && (obj.position.y = +json.iconHeight);
      this.add(obj);
    });
    this.position.fromArray(json.matrix[0]);
    this.scale.fromArray(json.matrix[1]);
    this.rotation.fromArray(json.matrix[2]);
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
      return new THREE.SphereGeometry(SIZE);
    },
    CONE: () => {
      return new THREE.ConeGeometry(SIZE * 0.6, SIZE, 4);
    },
  };
  return typeFun[type]();
}
