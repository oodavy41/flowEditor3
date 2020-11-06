import * as THREE from "three";

export default interface flowIF {
  name?: string;
  color: string | number;
  isPicked: boolean;
  isHoving: boolean;
  onClick?: (raycaster?: THREE.Raycaster) => void;
  offClick?: (raycaster?: THREE.Raycaster) => void;
  onUpdateData: { [key: string]: (value: any) => void };
  onMouseMove?: (
    point: THREE.Vector3,
    event?: MouseEvent,
    raycaster?: THREE.Raycaster
  ) => void;
}
