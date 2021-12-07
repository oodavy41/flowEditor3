import * as THREE from "three";

import ShaderIF from "./shadeIF";

export default class shaderBase extends ShaderIF {
  UniformList: {
    label: string;
    key: string;
    type: "number" | "color" | "image";
  }[] = [];

  setUniform(key: string, value: number | string): void {
    if (typeof value === "number") {
      this.uniforms[key].value = value;
    } else if (typeof value === "string") {
      this.uniforms[key].value = new THREE.Color(value);
    }
  }

  getUniform(key: string) {
    return this.uniforms[key].value;
  }

  getUniformsList() {
    return this.UniformList;
  }
}
