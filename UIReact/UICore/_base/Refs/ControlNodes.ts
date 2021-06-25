import {Logger} from 'UICommon/Utils';
import {Control} from 'UICore/Base';
import {IDOMEnvironment} from 'UICore/interfaces';

interface IControlNode {
    control: Control;
    element: HTMLElement;
    parent: HTMLElement;
    environment: IDOMEnvironment;
    id: string;
}

type TControlNode = HTMLElement | Control;

export default class ControlNodes {

    private static removeControlNode(controlNodes: IControlNode[], controlToRemove: Control): void {
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

    private static addControlNode(controlNodes: IControlNode[], controlNode: IControlNode): void {
        const controlNodeIdx = controlNodes.indexOf(controlNode);
        const haveNode = controlNodeIdx !== -1;
        if (!haveNode) {
            this.sortedAddControlNode(controlNodes, controlNode);
        }
    }

    private static sortedAddControlNode(controlNodes: IControlNode[], newControlNode: IControlNode): void {
        const generatedId: number = ControlNodes.getNumberId(newControlNode.id);

        // Если массив пустой или все id не меньше чем у новой ноды - добавляем в конец.
        let newIndex: number = controlNodes.length;
        for (let index = 0; index < controlNodes.length; ++index) {
            const id = ControlNodes.getNumberId(controlNodes[index].id);

            // Добавляем node перед первой из тех, чей id меньше.
            if (id < generatedId) {
                newIndex = index;
                break;
            }
        }
        controlNodes.splice(newIndex, 0, newControlNode);
    }

    private static getNumberId(id: string | 0): number {
        return parseInt((id + '').replace('inst_', ''), 10);
    }

    static prepareContainer(node: TControlNode, control: Control): TControlNode {
        if (node?.nodeType) {
            // если у контрола отрисовался контейнер, используем его
            return node;
        } else if (node?._container?.nodeType) {
            // если строим хок и дочерний контрол уже построен, используем его элемент как контейнер
            return node._container;
        }
        if (node instanceof Control) {
            // храним родительский хок, чтобы потом ему установить контейнер тоже
            // @ts-ignore
            node._parentHoc = control;
        }
        return node;
    }

    static setupControlNode(
        container: HTMLElement & {
            controlNodes: IControlNode[]
        },
        node: TControlNode,
        control: Control): void {
        if (!container) {
            return;
        }
        if (!node) {
            // @ts-ignore _container сейчас _protected
            ControlNodes.removeControlNode(control._container.controlNodes, control);
            return;
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
                    return control._getEnvironment();
                }
            });
            ControlNodes.addControlNode(container.controlNodes, controlNode);
            // @ts-ignore _container сейчас _protected
            curControl._container = container;
            // @ts-ignore _container сейчас _protected
            curControl = curControl._parentHoc;
        }
    }
}
