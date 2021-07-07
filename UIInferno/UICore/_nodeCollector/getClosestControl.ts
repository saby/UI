import {default as goUpByControlTree} from "./goUpByControlTree";
import {IControl} from 'UICommon/interfaces';

export function getClosestControl(element: HTMLElement): IControl {
   return goUpByControlTree(element)[0];
}
