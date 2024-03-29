import * as THREE from "three";
import { TypeOfTag } from "typescript";

import shaderBase from "./shaderBase";

// attribute : offset
const vert = `
  attribute float offset;
  varying float voffset;

  void main() {

    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    voffset = position.y;
    gl_Position = projectionMatrix * mvPosition;

  }
`;

const frag = `
  uniform float time;
  uniform float speed;
  uniform float cycle;
  uniform float opacityBase;
  uniform float offsetScale;
  uniform vec3 color;

  varying float opacity;
  varying float voffset;

  void main() {

    float opacity = mix(opacityBase,1.0,1.0-(mod(max((time * speed - voffset * offsetScale) , 0.0) , cycle) / cycle));
    gl_FragColor =vec4(color , opacity);

  }
`;

export default class UpperWaveMat extends shaderBase {
  type = "UpperWaveMat";
  UniformList: {
    label: string;
    key: "speed" | "cycle" | "opacityBase" | "offsetScale" | "color";
    type: "number" | "color";
  }[] = [
    { label: "动画速度", key: "speed", type: "number" },
    { label: "动画周期", key: "cycle", type: "number" },
    { label: "最低透明度", key: "opacityBase", type: "number" },
    { label: "周期缩放", key: "offsetScale", type: "number" },
    { label: "颜色", key: "color", type: "color" },
  ];

  constructor(option: { transparent: boolean } = { transparent: true }) {
    super({
      uniforms: {
        time: { value: 0 },
        speed: { value: 0.03 },
        cycle: { value: 5 },
        opacityBase: { value: 0.01 },
        offsetScale: { value: 1 },
        color: { value: new THREE.Color(0xffffff) },
      },
      vertexShader: vert,
      fragmentShader: frag,
      transparent: option.transparent,
      depthTest: !option.transparent,
    });
  }
}
