import { Responsibility, IResponsibilityHandler } from 'UICore/Ref';
import { prepareControlNodes } from './ControlNodes';
import { default as Control } from '../Control';

export class CreateControlNodeRef extends Responsibility {
    private readonly _control: Control;

    constructor(control: Control) {
        super();
        this._control = control;
    }

    getHandler(): IResponsibilityHandler {
        return (node: HTMLElement): void => {
            prepareControlNodes(node, this._control);
        };
    }
}
