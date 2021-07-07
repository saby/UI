import { Responsibility, IResponsibilityHandler } from 'UICore/Ref';
import {prepareContainer} from './ParentHoc';
import {IControl} from 'UICommon/interfaces';

export class CreateHocRef extends Responsibility {
   private readonly _control: IControl;

   constructor(control: IControl) {
      super();
      this._control = control;
   }

   getHandler(): IResponsibilityHandler {
      return (node: HTMLElement): void => {
         prepareContainer(node, this._control);
      };
   }
}
