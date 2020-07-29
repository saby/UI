/// <amd-module name="UI/_executor/_Markup/ResolveControlName" />
/* tslint:disable */

import { TAttributes } from './IGeneratorType';
import { INodeAttribute } from './Compatible/ICompatibleType';

interface IControlData {
   name?: unknown;
}

/**
 * @author Тэн В.А.
 */
export class ResolveControlName {
   static resolveControlName<TOptions extends IControlData>(controlData: TOptions,
                                                            attributes: TAttributes | INodeAttribute): TAttributes | INodeAttribute {
      const attr = attributes || {};
      if (controlData && controlData.name) {
         attr.name = controlData.name;
      } else {
         if (attributes && attributes.name) {
            controlData.name = attributes.name;
         }
      }
      return attr;
   }
}
