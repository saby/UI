import { Responsibility, IResponsibilityHandler } from 'UICore/Ref';
import { prepareControls } from './_ref/Controls';
import { IControl } from 'UICommon/interfaces';

export class CreateControlRef extends Responsibility {
   private readonly _control: IControl;

   constructor(control: IControl) {
      super();
      this._control = control;
   }

   getHandler(): IResponsibilityHandler {
      return (node: HTMLElement): void => {
         prepareControls(node, this._control);
      };
   }
}
