
export enum CAMERA_STATE {
  LEFT,
  RIGHT,
  TOP,
}
import Events from "events";
export let EventEmitter = new Events.EventEmitter();
export type StyleNode = {
  cutPoint: number;
  color: string;
  lineColor: string;
};
