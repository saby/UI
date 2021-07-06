import { Responsibility, IResponsibilityHandler } from 'UICore/Ref';
import {prepareContainer} from './ParentHoc';
import { default as Control } from '../Control';

export class CreateHocRef extends Responsibility {
   private readonly _control: Control;

   constructor(control: Control) {
      super();
      this._control = control;
   }

   getHandler(): IResponsibilityHandler {
      return (node: HTMLElement): void => {
         prepareContainer(node, this._control);
      };
   }
}
