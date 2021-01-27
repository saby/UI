import {goUpByControlTree} from 'UI/NodeCollector';
import {IControl, IControlOptions, TIState} from './interfaces';

export function makeRelation(currentControl: IControl<IControlOptions, TIState>): void {
    if (!currentControl._container) {
        return;
    }
    const container = currentControl._container;
    // @ts-ignore
    const controlNodes = container.controlNodes;
    const foundControlNode = controlNodes.find((controlNode) => {
        return controlNode.control === currentControl;
    });
    const index = controlNodes.indexOf(foundControlNode);
    if (index !== controlNodes.length - 1) {
        parent = controlNodes[index + 1];
    } else {
        const parentNodes = goUpByControlTree(currentControl._container.parentNode, []);
        parent = parentNodes[0];
    }

    foundControlNode.parent = parent;
    // @ts-ignore
    if (currentControl._options.name) {
        // @ts-ignore
        parent._children[currentControl._options.name] = currentControl;
    }
}

export function removeRelation(currentControl: IControl): void {
    if (!currentControl._container) {
        return;
    }
    const container = currentControl._container;
    // @ts-ignore
    const controlNodes = container.controlNodes;
    const foundControlNode = controlNodes.find((controlNode) => {
        return controlNode.control === currentControl;
    });

    const parent = foundControlNode.parent;
    foundControlNode.parent = null;
    // @ts-ignore
    if (currentControl._options.name) {
        // @ts-ignore
        delete parent._children[currentControl._options.name];
    }
}
