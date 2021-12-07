import * as THREE from "three";
import UpperDashMat from "./UpperDashMat";
import UpperWaveMat from "./UpperWaveMat";
import ShieldMat from "./ShieldMat";
import StarryMaskMat from "./StarryMaskMat";

const shaderList = [
  { name: "MeshLambertMaterial", creator: THREE.MeshLambertMaterial },
  { name: UpperDashMat.name, creator: UpperDashMat },
  { name: UpperWaveMat.name, creator: UpperWaveMat },
  { name: ShieldMat.name, creator: ShieldMat },
  { name: StarryMaskMat.name, creator: StarryMaskMat },
];
export default shaderList;
