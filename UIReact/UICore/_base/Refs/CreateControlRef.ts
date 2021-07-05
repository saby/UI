import { Responsibility, IResponsibilityHandler } from 'UICore/Ref';
import {prepareControls} from './Controls';
import { Control } from 'UI/Base';

export class CreateControlRef extends Responsibility {
   private readonly _control: Control;

   constructor(control: Control) {
      super();
      this._control = control;
   }

   getHandler(): IResponsibilityHandler {
      return (node: HTMLElement): void => {
         prepareControls(node, this._control);
      };
   }
}
