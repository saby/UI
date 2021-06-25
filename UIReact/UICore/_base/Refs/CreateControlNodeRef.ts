import { Responsibility, IResponsibilityHandler } from 'UICore/Ref';
import { default as ControlNodes } from './ControlNodes';
import { default as Control } from '../Control';

export class CreateControlNodeRef extends Responsibility {
    private readonly control: Control;

    constructor(control: Control) {
        super();
        this.control = control;
    }

    getHandler(): IResponsibilityHandler {
        return (node: HTMLElement): void => {
            const container = ControlNodes.prepareContainer(node, this.control);
            return ControlNodes.setupControlNode(container, node, this.control);
        };
    }
}
