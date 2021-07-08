import { Responsibility, IResponsibilityHandler } from 'UICore/Ref';
import { prepareControlNodes } from './_ref/ControlNodes';
import { IControl } from 'UICommon/interfaces';

export class CreateControlNodeRef extends Responsibility {
    private readonly _control: IControl;

    constructor(control: IControl) {
        super();
        this._control = control;
    }

    getHandler(): IResponsibilityHandler {
        return (node: HTMLElement): void => {
            prepareControlNodes(node, this._control);
        };
    }
}
