import { Responsibility, IResponsibilityHandler } from 'UICore/Ref';
import { prepareContainer, prepareControlNodes } from 'UICore/ControlNodes';
import { Control } from 'UI/Base';

export class CreateControlNodeRef extends Responsibility {
    private readonly _control: Control;
    private readonly _constructor: Control;

    constructor(control: Control, constructor: Control) {
        super();
        this._control = control;
        this._constructor = constructor;
    }

    getHandler(): IResponsibilityHandler {
        return (node: HTMLElement): void => {
            const container = prepareContainer(node, this._control, this._constructor);
            return prepareControlNodes(node, this._control, container);
        };
    }
}
