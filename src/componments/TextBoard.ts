import * as THREE from "three";

import flowIF from "./flowIF";
import FragFactory from "./textRenderer/fragFactory";
import TextFrag from "./textRenderer/fragment";

export default class TextBoard extends THREE.Mesh implements flowIF {
  color: string | number;
  name: string;
  isPicked: boolean;
  isHoving: boolean;
  textObj: TextFrag;
  updateText: () => void;
  onClick: (raycaster?: THREE.Raycaster) => void;
  offClick: (raycaster?: THREE.Raycaster) => void;
  onUpdateData: { [key: string]: (value: any) => void };
  onMouseMove: (point: THREE.Vector3) => void;

  constructor(
    scene: THREE.Scene,
    color: string | number,
    textFactory: FragFactory
  ) {
    let textFrag = textFactory.frag("TEXT text", 40, color + "");
    let textgeo = new THREE.BufferGeometry();
    updateGeo(textgeo, textFrag);
    super(
      textgeo,
      new THREE.MeshBasicMaterial({
        map: textFrag.factory.tex,
        transparent: true,
      })
    );
    this.name = "TEXT text";
    this.color = color;
    this.position.y = 1;
    scene.add(this);
    this.rotateX(-Math.PI / 2);
    // this.rotateZ(Math.PI / 2);

    this.isPicked = false;
    this.isHoving = false;
    this.onClick = () => {
      this.isPicked = true;
    };
    this.offClick = () => {
      this.isPicked = false;
    };
    this.updateText = () => {
      updateGeo(textgeo, textFrag);
    };
    this.onUpdateData = {
      color: (value) => {
        textFrag.color = value;
        this.updateText();
      },
      name: (value) => {
        textFrag.text = value;
        this.name = value;
        this.updateText();
      },
    };

    this.onMouseMove = (point) => {
      this.position.set(point.x, 1, point.z);
    };
  }
}

function updateGeo(textgeo: THREE.BufferGeometry, textFrag: TextFrag) {
  let spritePos = [
    -0.5 * textFrag.width,
    0,
    0,
    0.5 * textFrag.width,
    0,
    0,
    0.5 * textFrag.width,
    textFrag.height,
    0,
    -0.5 * textFrag.width,
    textFrag.height,
    0,
  ];
  textgeo.setIndex([0, 1, 2, 0, 2, 3]);
  textgeo.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(spritePos), 3)
  );
  textgeo.setAttribute(
    "uv",
    new THREE.BufferAttribute(new Float32Array(textFrag.uvs), 2)
  );
}
