import * as THREE from "three";

import flowIF from "./flowIF";
import flowLine from "./Line";
import flowIcon from "./Land";
import TextBoard from "./TextBoard";
import FragFactory from "./textRenderer/fragFactory";

import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

export default class flowNode extends THREE.Mesh implements flowIF {
  name: string;
  nameText: TextBoard;
  mainMesh: THREE.Mesh;
  iconPlane: THREE.Mesh;
  color: string | number;
  starts: flowLine[];
  ends: flowLine[];
  isPicked: boolean;
  isHoving: boolean;
  onClick: () => void;
  offClick: () => void;
  switchLayer: (layer: number, flag: boolean) => void;
  onUpdateData: { [key: string]: [string, (value: any) => void, any?] };
  onMouseMove: (point: THREE.Vector3) => void;

  constructor(
    scene: THREE.Scene,
    textFactory: FragFactory,
    name: string,
    color: string | number,
    type: string = "BOX"
  ) {
    super(
      new THREE.BoxGeometry(75, 150, 75),
      new THREE.MeshBasicMaterial({
        transparent: true,
        depthTest: true,
        opacity: 0,
      })
    );
    let geo: THREE.Geometry;
    switch (type) {
      case "CYLINDER":
        geo = new THREE.CylinderGeometry(35, 40, 80);
        break;
      case "DODECAHE":
        geo = new THREE.DodecahedronGeometry(40);
        break;
      case "BOX":
      default:
        geo = new THREE.BoxGeometry(80, 80, 80);
        break;
    }
    this.mainMesh = new THREE.Mesh(
      geo,
      new THREE.MeshLambertMaterial({
        color: color,
      })
    );
    const edges = new THREE.EdgesGeometry(this.mainMesh.geometry);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: "#fff", linewidth: 0 })
    );
    line.scale.set(1.01, 1.01, 1.01);
    this.mainMesh.add(line);
    this.mainMesh.position.y = 40;
    this.add(this.mainMesh);

    this.iconPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(75, 75),
      new THREE.MeshBasicMaterial({
        color: "#fff",
        transparent: true,
        depthTest: true,
        opacity: 0.8,
      })
    );
    this.iconPlane.position.y = 81;
    this.iconPlane.rotateX(-Math.PI / 2);
    this.add(this.iconPlane);
    this.iconPlane.visible = false;

    this.color = color;
    this.name = name;



    this.nameText = new TextBoard(scene, name, 20, "#fff", textFactory);
    this.nameText.position.z = 60;
    this.add(this.nameText);
    scene.add(this);

    this.starts = [];
    this.ends = [];

    this.isPicked = false;
    this.isHoving = false;
    this.onClick = () => {
      this.isPicked = true;
    };
    this.offClick = () => {
      this.isPicked = false;
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
        "颜色0",
        (value) => {
          if (this.mainMesh.material instanceof THREE.MeshBasicMaterial) {
            this.color = value;
            this.mainMesh.material.color.set(value);
          }
        },
      ],
      name: [
        "名称",
        (value) => {
          this.nameText.text = value;
        },
      ],
      // image: [
      //   "贴图",
      //   (value) => {
      //     var texture = new THREE.TextureLoader().load(
      //       URL.createObjectURL(value)
      //     );
      //     (this.mainMesh.material as THREE.MeshBasicMaterial).map = texture;
      //     (this.mainMesh
      //       .material as THREE.MeshBasicMaterial).needsUpdate = true;
      //   },
      // ],
      model: [
        "模型",
        (value) => {
          new OBJLoader().load(URL.createObjectURL(value), (obj) => {
            console.log(obj);
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
        (value) => (this.iconPlane.scale.x = value),
        this.iconPlane.scale.x,
      ],
      number_icon_scaleY: [
        "图标y缩放",
        (value) => (this.iconPlane.scale.y = value),
        this.iconPlane.scale.y,
      ],
      number_text: [
        "文字偏移",
        (value) => {
          this.nameText.position.z = value;
        },
        this.nameText.position.z,
      ],
      number_scaleX: [
        "x缩放",
        (value) => (this.mainMesh.scale.x = value),
        this.mainMesh.scale.x,
      ],
      number_scaleY: [
        "y缩放",
        (value) => (this.mainMesh.scale.y = value),
        this.mainMesh.scale.y,
      ],
      number_scaleZ: [
        "z缩放",
        (value) => (this.mainMesh.scale.z = value),
        this.mainMesh.scale.z,
      ],
    };

    this.onMouseMove = (point) => {
      this.position.set(point.x, 0, point.z);
      if (this.isPicked) {
        this.starts.forEach((_: flowLine) => _.updateFlowLine(true, this));
        this.ends.forEach((_: flowLine) => _.updateFlowLine(false, this));
      }
    };
  }
}
