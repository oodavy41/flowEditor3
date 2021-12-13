import * as THREE from "three";
import UpperDashMat from "./UpperDashMat";
import UpperWaveMat from "./UpperWaveMat";
import ShieldMat from "./ShieldMat";
import StarryMaskMat from "./StarryMaskMat";

const shaderList = [
  { name: "MeshLambertMaterial", creator: THREE.MeshLambertMaterial },
  { name: "UpperDashMat", creator: UpperDashMat },
  { name: "UpperWaveMat", creator: UpperWaveMat },
  { name: "ShieldMat", creator: ShieldMat },
  { name: "StarryMaskMat", creator: StarryMaskMat },
];
export default shaderList;
