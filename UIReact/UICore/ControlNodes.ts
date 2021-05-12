import {Control} from 'UI/Base';
import {TControlConstructor} from 'UICommon/interfaces';
import {IDOMEnvironment} from 'UICore/interfaces';

interface IControlNode {
    control: Control;
    element: HTMLElement;
    parent: HTMLElement;
    environment: IDOMEnvironment;
    id: string;
}

function getNumberId(id: string | 0): number {
    return parseInt((id + '').replace('inst_', ''), 10);
}

function sortedAddControlNode(controlNodes: IControlNode[], newControlNode: IControlNode): void {
    const generatedId: number = getNumberId(newControlNode.id);

    // Если массив пустой или все id не меньше чем у новой ноды - добавляем в конец.
    let newIndex: number = controlNodes.length;
    for (let index = 0; index < controlNodes.length; ++index) {
        const id = getNumberId(controlNodes[index].id);

        // Добавляем node перед первой из тех, чей id меньше.
        if (id < generatedId) {
            newIndex = index;
            break;
        }
    }
    controlNodes.splice(newIndex, 0, newControlNode);
}

function addControlNode(controlNodes: IControlNode[], controlNode: IControlNode): void {
    const controlNodeIdx = controlNodes.indexOf(controlNode);
    const haveNode = controlNodeIdx !== -1;
    if (!haveNode) {
        sortedAddControlNode(controlNodes, controlNode);
    }
}

function removeControlNode(controlNodes: IControlNode[], controlToRemove: Control): void {
    if (!controlNodes) {
        return;
    }
    const foundControlNode = controlNodes.find((controlNode) => {
        return controlNode.control === controlToRemove;
    });
    if (foundControlNode) {
        controlNodes.splice(controlNodes.indexOf(foundControlNode), 1);
    }
}

export function prepareControlNodes(node: any, control: Control, constructor: TControlConstructor): void {
    let container;
    if (node?.nodeType) {
        // если у контрола отрисовался контейнер, используем его
        container = node;
    } else if (node?._container?.nodeType) {
        // если строим хок и дочерний контрол уже построен, используем его элемент как контейнер
        container = node._container;
    }
    if (node instanceof constructor) {
        // храним родительский хок, чтобы потом ему установить контейнер тоже
        // @ts-ignore
        node._parentHoc = control;
    }
    if (container) {
        if (node) {
            let curControl = control;
            // @ts-ignore _container сейчас _protected
            while (curControl && (!curControl._container || !curControl._container.parentNode)) {
                container.controlNodes = container.controlNodes || [];
                const controlNode: IControlNode = {
                    control: curControl,
                    parent: null,
                    element: container,
                    // @ts-ignore _getEnvironment сейчас private
                    environment: curControl._getEnvironment(),
                    id: curControl.getInstanceId()
                };
                addControlNode(container.controlNodes, controlNode);
                // @ts-ignore _container сейчас _protected
                curControl._container = container;
                // @ts-ignore _container сейчас _protected
                curControl = curControl._parentHoc;
            }
        } else {
            // @ts-ignore _container сейчас _protected
            removeControlNode(control._container.controlNodes, control);
        }
    }
}
