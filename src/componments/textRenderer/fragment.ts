import * as THREE from "three";
import fragFactory from "./fragFactory";
export default class TextFrag extends THREE.Sprite {
  factory: fragFactory;
  _text: string;
  _size: number;
  _color: string | number;
  uvs: number[];
  width: number;
  height: number;
  constructor(
    factory: fragFactory,
    text: string,
    size: number = undefined,
    color: string | number = undefined
  ) {
    super(
      new THREE.SpriteMaterial({
        map: factory.tex,
        transparent: true,
        depthWrite: false,
      })
    );
    factory.regist(text + Math.random(), this);
    this.factory = factory;
    this._text = text;
    this._size = size;
    this._color = color;
    this.uvs = [];
    this.width = 0;
    this.height = size;
    this.factory.draw(this);

    let textgeo = new THREE.BufferGeometry();
    let spritePos = [
      -0.5 * this.width,
      0,
      0,
      0.5 * this.width,
      0,
      0,
      0.5 * this.width,
      this.height,
      0,
      -0.5 * this.width,
      this.height,
      0,
    ];
    textgeo.setIndex([0, 1, 2, 0, 2, 3]);
    textgeo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(spritePos), 3)
    );
    textgeo.setAttribute(
      "uv",
      new THREE.BufferAttribute(new Float32Array(this.uvs), 2)
    );
    this.geometry = textgeo;
    this.position.y = 0.5;
    this.position.z = 0.5;
  }

  set color(color) {
    this._color = color;
    this.factory.redraw();
  }

  get color() {
    return this._color;
  }

  set size(size) {
    this._size = size;
    this.height = size;
    this.factory.redraw();
  }

  get size() {
    return this._size;
  }
  get text() {
    return this._text;
  }
  set text(text) {
    this._text = text;
    this.factory.redraw();
  }

  update() {
    let spritePos = [
      -0.5 * this.width,
      0,
      0,
      0.5 * this.width,
      0,
      0,
      0.5 * this.width,
      this.height,
      0,
      -0.5 * this.width,
      this.height,
      0,
    ];
    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(spritePos), 3)
    );
    this.geometry.setAttribute(
      "uv",
      new THREE.BufferAttribute(new Float32Array(this.uvs), 2)
    );

    this.geometry.computeBoundingBox();
    this.material.map.needsUpdate = true;
  }
}
