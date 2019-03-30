import {IPreparedNode, IStaticData, TypeFunction} from "../../Interfaces";

export function parseStatic(data:IStaticData):IPreparedNode {
   return {
      name: data.value,
      type: TypeFunction.value
   };
}
