import {Control} from 'UI/Base';
import {IDOMEnvironment} from 'UICore/interfaces';
import {Logger} from 'UICommon/Utils';
import {TControlNode} from "./TControlNode";

export interface IControlNode {
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

export function prepareControlNodes(node: TControlNode, control: Control): void {
    const container = node?._container || node;
    if (!container) {
        return;
    }
    if (!node) {
        // @ts-ignore _container сейчас _protected
        removeControlNode(control._container.controlNodes, control);
    }
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
        // @ts-ignore _moduleName сейчас _protected
        const moduleName = curControl._moduleName;
        Object.defineProperty(controlNode, 'environment', {
            get(): object {
                Logger.error(`Попытка использовать Environment в React окружении,
                необходимо убрать зависимость. Компонент - ${moduleName}`);
                return this.control._getEnvironment();
            }
        });
        addControlNode(container.controlNodes, controlNode);
        // @ts-ignore _container сейчас _protected
        curControl._container = container;
        // @ts-ignore _container сейчас _protected
        curControl = curControl._parentHoc;
    }
}
