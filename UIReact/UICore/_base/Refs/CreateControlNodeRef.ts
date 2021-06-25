import { Responsibility, IResponsibilityHandler } from 'UICore/Ref';
import { default as ControlNodes } from './ControlNodes';
import { IControl } from 'UICommon/interfaces';

export class CreateControlNodeRef extends Responsibility {
    private readonly control: IControl;

    constructor(control: IControl) {
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
