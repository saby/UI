import { default as Control } from '../Control';
import {TControlNode} from './TControlNode';

export interface IControlObj {
   control: Control;
   id: string;
}

function getNumberId(id: string | 0): number {
   return parseInt((id + '').replace('inst_', ''), 10);
}

function sortedAddControlObj(controls: IControlObj[], controlObj: IControlObj): void {
   const generatedId: number = getNumberId(controlObj.id);

   // Если массив пустой или все id не меньше чем у новой ноды - добавляем в конец.
   let newIndex: number = controls.length;
   for (let index = 0; index < controls.length; ++index) {
      const id = getNumberId(controls[index].id);

      // Добавляем node перед первой из тех, чей id меньше.
      if (id < generatedId) {
         newIndex = index;
         break;
      }
   }
   controls.splice(newIndex, 0, controlObj);
}

function addControlObj(controls: IControlObj[], controlObj: IControlObj): void {
   const controlIdx = controls.indexOf(controlObj);
   const haveControl = controlIdx !== -1;
   if (!haveControl) {
      sortedAddControlObj(controls, controlObj);
   }
}
function findControlObj(controls: IControlObj[], control: Control): IControlObj {
   const foundControlObj = controls.find((controlObj) => {
      return controlObj.control === control;
   });
   return foundControlObj;
}
function removeControlObj(controls: IControlObj[], controlToRemove: Control): void {
   if (!controls) {
      return;
   }
   const foundControl = findControlObj(controls, controlToRemove);
   if (foundControl) {
      controls.splice(controls.indexOf(foundControl), 1);
   }
}
export function prepareControls(node: TControlNode, control: Control): void {
   const container = node?._container || node;
   if (!container) {
      return;
   }
   if (!node) {
      // @ts-ignore _container сейчас _protected
      removeControlObj(control._container._$controls, control);
   }
   let curControl = control;
   container._$controls = container._$controls || [];
   const foundControlObj = findControlObj(container._$controls, control);
   // @ts-ignore _container сейчас _protected
   while (curControl && !foundControlObj) {
      const controlObj: IControlObj = {
         control: curControl,
         id: curControl.getInstanceId()
      };

      addControlObj(container._$controls, controlObj);

      // @ts-ignore
      curControl = curControl._parentHoc;
   }
}
