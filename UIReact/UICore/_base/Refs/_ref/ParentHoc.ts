import { TControlNode } from './TControlNode';
import { IControl } from 'UICommon/interfaces';

export function prepareContainer(node: TControlNode, control: IControl) {
   // @ts-ignore это утиная проверка. тут может быть нода, и у нее нет поля _beforeMount
   if (node?._beforeMount) {
      // храним родительский хок, чтобы потом ему установить контейнер тоже
      // @ts-ignore
      node._parentHoc = control;
   }
}
