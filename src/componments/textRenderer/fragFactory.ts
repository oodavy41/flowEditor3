import * as THREE from "three";
import textFrag from "./fragment";
import textBoard from "./board";
export default class FragFactory {
  canvas: HTMLCanvasElement;
  yoffset: number;
  xoffset: number;
  lineHeight: number;
  ctx: CanvasRenderingContext2D;
  defaultFont: number;
  defaultColor: string | number;
  tex: THREE.CanvasTexture;
  frags: { [key: string]: textFrag | textBoard };
  modify: boolean;
  constructor(font: number = undefined, color: string | number = undefined) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 2048;
    this.canvas.height = 2048;
    this.ctx = this.canvas.getContext("2d");
    this.flush();
    this.defaultFont = font || 40;
    this.defaultColor = color || "#afafaf";

    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.minFilter = THREE.LinearFilter;
    this.frags = {};
  }

  flush() {
    this.yoffset = 3;
    this.xoffset = 0;
    this.lineHeight = 0;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "rgba(30,30,30,0.4)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  unmount() {
    this.tex.dispose();
    delete this.frags;
  }

  regist(key: string, obj: textFrag | textBoard) {
    this.frags[key] = obj;
  }

  draw(frag: textFrag | textBoard) {
    console.log(frag);
    this.ctx.textBaseline = "top";
    this.ctx.fillStyle =
      typeof frag.color === "string"
        ? frag.color
        : "#" + frag.color.toString(16);
    this.ctx.font = frag.size + "px Fira Sans";
    let text = " " + frag.text + " ";
    let textWidth = this.ctx.measureText(text);
    this.lineHeight = Math.max(this.lineHeight, frag.size);
    if (this.xoffset + textWidth.width > this.canvas.width) {
      this.yoffset += this.lineHeight + 3;
      this.xoffset = 0;
    }
    this.ctx.fillText(text, this.xoffset, this.yoffset);
    frag.uvs = [
      this.xoffset / this.canvas.width,
      1 - (this.yoffset + frag.size - 4) / this.canvas.height,
      (this.xoffset + textWidth.width) / this.canvas.width,
      1 - (this.yoffset + frag.size - 4) / this.canvas.height,
      (this.xoffset + textWidth.width) / this.canvas.width,
      1 - (this.yoffset - 4) / this.canvas.height,
      this.xoffset / this.canvas.width,
      1 - (this.yoffset - 4) / this.canvas.height,
    ];
    this.xoffset += textWidth.width + 3;
    frag.height = frag.size;
    frag.width = textWidth.width;
    for (let i in this.frags) {
      this.frags[i].update();
    }
  }
  redraw() {
    this.flush();
    for (let i in this.frags) {
      this.draw(this.frags[i]);
    }
  }
}