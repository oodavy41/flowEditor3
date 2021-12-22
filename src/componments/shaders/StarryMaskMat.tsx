import * as THREE from "three";

import shaderBase from "./shaderBase";

// attribute : offset
const vert = `
  uniform float BGscale;
  attribute float offset;
  varying vec2 vcoord;

  void main() {

    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    vec4 camPosition = projectionMatrix * mvPosition;
    vcoord = camPosition.xy*BGscale;
    gl_Position = camPosition;
  }
`;

const frag = `
  uniform sampler2D BackgroundImage;
  varying vec2 vcoord;

  void main() {
    gl_FragColor = texture2D(BackgroundImage,vcoord);
  }
`;

export default class StarryMaskMat extends shaderBase {
  type = "StarryMaskMat";
  UniformList: {
    label: string;
    key: "BackgroundImage" | "BGscale";
    type: "number" | "color" | "image";
  }[] = [
    { label: "背景", key: "BackgroundImage", type: "image" },
    { label: "背景缩放", key: "BGscale", type: "number" },
  ];

  constructor(option: { texture: THREE.Texture }) {
    super({
      uniforms: {
        BackgroundImage: { value: option.texture },
        BGscale: { value: 5 },
      },
      vertexShader: vert,
      fragmentShader: frag,
      transparent: false,
      depthTest: true,
    });
  }

  setUniform(key: string, value: number): void {
    if (key === "BackgroundImage") {
      console.error("Need to create new mat to change Texture");
    } else {
      super.setUniform(key, value);
    }
  }
}
