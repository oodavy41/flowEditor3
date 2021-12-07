import * as THREE from "three";

export default abstract class ShaderIF extends THREE.ShaderMaterial {
  set color(value: THREE.Color) {
    if (this.uniforms.color) this.uniforms.color.value = value;
  }
  get color(): THREE.Color {
    if (this.uniforms.color) return this.uniforms.color.value;
  }

  setTime(time: number) {
    if (this.uniforms.time) this.uniforms.time.value = time;
  }
  abstract getUniformsList(): {
    key: string;
    type: "number" | "color" | "image";
  }[];
  abstract setUniform(name: string, value: unknown): void;
  abstract getUniform(name: string): unknown;
}
