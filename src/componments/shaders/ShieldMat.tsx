import * as THREE from "three";

import shaderBase from "./shaderBase";

// attribute : offset
const vert = `
  attribute float offset;
  varying float voffset;
  varying vec3 vnormal;

  void main() {

    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    voffset = position.y;
    vnormal = normalMatrix * normal;
    gl_Position = projectionMatrix * mvPosition;

  }
`;

const frag = `
  uniform float opacityBase;
  uniform vec3 color;

  varying float voffset;
  varying vec3 vnormal;

  void main() {

    float vecDot = 1.0 - abs(dot(normalize(vnormal),vec3(0.0,0.0,1.0)));
    float opacity = 0.0;
    if ( vecDot > opacityBase ){
      opacity = (vecDot-opacityBase)/(1.0-opacityBase);
    }

    gl_FragColor =vec4(color , opacity);

  }
`;

export default class ShieldMat extends shaderBase {
  UniformList: {
    label: string;
    key: "opacityBase" | "color";
    type: "number" | "color";
  }[] = [
    { label: "最低透明度", key: "opacityBase", type: "number" },
    { label: "颜色", key: "color", type: "color" },
  ];

  constructor(option: { transparent: boolean } = { transparent: true }) {
    super({
      uniforms: {
        opacityBase: { value: 0.5 },
        color: { value: new THREE.Color(0xffffff) },
      },
      vertexShader: vert,
      fragmentShader: frag,
      transparent: option.transparent,
      depthTest: !option.transparent,
    });
  }
}
