import {Control} from "UICore/Base";
import {TControlNode} from "./TControlNode";

export function prepareContainer(node: TControlNode, control: Control) {
   if (node instanceof Control) {
      // храним родительский хок, чтобы потом ему установить контейнер тоже
      // @ts-ignore
      node._parentHoc = control;
   }
}
