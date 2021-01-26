import {IControl, IControlNode, TControlConstructor} from './interfaces';
import {createEnvironment} from 'UI/_react/Control/EnvironmentStorage';

function getNumberId(id: string | 0): number {
    return parseInt((id + '').replace('inst_', ''), 10);
}
function sortedAddControlNode(controlNodes: IControlNode[], newControlNode: IControlNode): void {
    const newId: number = getNumberId(newControlNode.id);

    // Если массив пустой или все айди не меньше, чем у новой ноды - добавляем в конец.
    let newIndex: number = controlNodes.length;
    for (let index = 0; index < controlNodes.length; ++index) {
        const id = getNumberId(controlNodes[index].id);

        // Добавляем ноду перед первой из тех, чей айди меньше.
        if (id < newId) {
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
function removeControlNode(controlNodes: IControlNode[], controlToRemove: IControl): void {
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

export function prepareControlNodes(node: any, control: IControl, Control: TControlConstructor): void {
    let container;
    if (node instanceof HTMLElement) {
        // если у контрола отрисовался контейнер, используем его
        container = node;
    } else if (node && node._container instanceof HTMLElement) {
        // если строим хок и дочерний контрол уже построен, используем его элемент как контейнер
        container = node._container;
    }
    if (node instanceof Control) {
        // храним родительский хок, чтобы потом ему установить контейнер тоже
        node._parentHoc = control;
    }
    if (container) {
        if (node) {
            let environment;
            let curControl = control;
            while (curControl) {
                if (curControl._getEnvironment()) {
                    environment = curControl._getEnvironment();
                    break;
                }
                curControl = curControl._logicParent;
            }
            curControl = control;
            while (curControl && (!curControl._container || !curControl._container.parentNode)) {
                container.controlNodes = container.controlNodes || [];
                // если на контроле есть подписки на кастомные события, то нужно положить их
                // на элемент в eventProperties, чтобы работал _notify
                if(control._options.events) {
                    container.eventProperties = control._options.events;
                }
                const controlNode = {
                    control: curControl,
                    element: container,
                    environment,
                    id: curControl.getInstanceId()
                };
                addControlNode(container.controlNodes, controlNode);

                curControl._saveEnvironment(environment, controlNode);
                curControl._container = container;

                curControl = curControl._parentHoc;
            }
        } else {
            // @ts-ignore
            removeControlNode(control._container.controlNodes, control);
        }
    }
}
