import {TControlNode} from './TControlNode';
import {IControl} from 'UICommon/interfaces';

export function prepareContainer(node: TControlNode, control: IControl) {
   if (node instanceof Control) {
      // храним родительский хок, чтобы потом ему установить контейнер тоже
      // @ts-ignore
      node._parentHoc = control;
   }
}
