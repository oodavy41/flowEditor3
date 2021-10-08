import * as THREE from "three";
import { StyleNode, OBJ_PROP_ACT } from "../../GLOBAL";

export default interface flowIF {
  text?: string;
  color: string;
  flowUUID?: string;
  editorID?: string;
  isPicked: boolean;
  isHoving: boolean;
  tick?: (delta: number) => void;
  switchLayer?: (layer: number, flag: boolean) => void;
  onClick?: (raycaster?: THREE.Raycaster) => void;
  offClick?: (raycaster?: THREE.Raycaster) => void;
  onUpdateData?: (
    propName: string,
    action: OBJ_PROP_ACT,
    value?: any,
    selfUpdate?: boolean
  ) => any | void;
  configToPush?: { [key: string]: any };
  selfConfigUpdate?: (config: any, id?: string, tileType?: string) => void;
  onMouseMove?: (
    point: THREE.Vector3,
    event?: MouseEvent,
    raycaster?: THREE.Raycaster
  ) => void;

  onDispose: (
    scene: THREE.Scene,
    objArray: (flowIF | ((flowIF & dataSetIF) & THREE.Object3D))[]
  ) => void;

  fromADGEJSON: (json: any) => void;
  toADGEJSON: (cache?: any) => any;
}
export interface dataSetIF {
  data: number;
  stateSteps: StyleNode[];

  updateData: () => void;
}
