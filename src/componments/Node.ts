import * as THREE from "three";

import flowIF from "./flowIF";
import flowLine from "./Line";
import TextBoard from "./TextBoard";
import FragFactory from "./textRenderer/fragFactory";

import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

export default class flowNode extends THREE.Mesh implements flowIF {
  name: string;
  nameText: TextBoard;
  mainMesh: THREE.Mesh;
  color: string | number;
  starts: flowLine[];
  ends: flowLine[];
  isPicked: boolean;
  isHoving: boolean;
  onClick: () => void;
  offClick: () => void;
  switchLayer: (layer: number, flag: boolean) => void;
  onUpdateData: { [key: string]: (value: any) => void };
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
      new THREE.MeshBasicMaterial({
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
      color: (value) => {
        if (this.mainMesh.material instanceof THREE.MeshBasicMaterial) {
          this.color = value;
          this.mainMesh.material.color.set(value);
        }
      },
      name: (value) => {
        this.nameText.text = value;
      },
      image: (value) => {
        var texture = new THREE.TextureLoader().load(
          URL.createObjectURL(value)
        );
        (this.mainMesh.material as THREE.MeshBasicMaterial).map = texture;
        (this.mainMesh.material as THREE.MeshBasicMaterial).needsUpdate = true;
      },
      model: (value) => {
        new OBJLoader().load(URL.createObjectURL(value), (obj) => {
          console.log(obj);
          this.mainMesh.geometry = (obj.children[0] as THREE.Mesh).geometry;
          line.geometry = new THREE.EdgesGeometry(this.mainMesh.geometry);
        });
      },
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
