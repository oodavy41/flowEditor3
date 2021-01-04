import * as THREE from "three";

export default interface flowIF {
  name?: string;
  color: string | number;
  isPicked: boolean;
  isHoving: boolean;
  tick?: (delta: number) => void;
  switchLayer?: (layer: number, flag: boolean) => void;
  onClick?: (raycaster?: THREE.Raycaster) => void;
  offClick?: (raycaster?: THREE.Raycaster) => void;
  onUpdateData: { [key: string]: [string, (value: any) => void, any?, any[]?] };
  onMouseMove?: (
    point: THREE.Vector3,
    event?: MouseEvent,
    raycaster?: THREE.Raycaster
  ) => void;

  fromADGEJSON: (json: any) => void;
  toADGEJSON: (cache?: any) => any;
}
