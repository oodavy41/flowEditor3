import * as THREE from "three";

export default interface flowIF {
  name?: string;
  color: string | number;
  isPicked: boolean;
  isHoving: boolean;
  switchLayer?: (layer: number, flag: boolean) => void;
  onClick?: (raycaster?: THREE.Raycaster) => void;
  offClick?: (raycaster?: THREE.Raycaster) => void;
  onUpdateData: { [key: string]: [string, (value: any) => void,any?] };
  onMouseMove?: (
    point: THREE.Vector3,
    event?: MouseEvent,
    raycaster?: THREE.Raycaster
  ) => void;
}
