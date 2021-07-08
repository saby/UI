import { Responsibility, IResponsibilityHandler } from 'UICore/Ref';
import { prepareContainer } from './_ref/ParentHoc';
import { IControl } from 'UICommon/interfaces';

/**
 * Если над контролом располагается хок, сохраним его на этом контроле в свойстве _parentHoc,
 * это поле служебное и оно пригодится в последующих рефах,
 * например, для того чтобы правильно навешивать элементы на контрол и сохранять полный набор контролов
 */
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
