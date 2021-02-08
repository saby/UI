import { onEndLifecycle, onStartLifecycle } from '../../../DevtoolsHook';
import { IControlNode, TControlId } from '../interfaces';
import { delay } from 'Types/function';
import { Logger } from 'UI/Utils';
import { Control } from 'UI/Base';

/**
 * @author Кондаков Р.Н.
 */

type TMountMethod = (controlNodes: IControlNode[]) => void;

export default class MountMethodsCaller {
    // Возможно, этот метод должен быть в Control.
    private forceUpdateIfNeed(control: Control): void {
        // tslint:disable-next-line:ban-ts-ignore FIXME в ws куча подобных исполоьзований приватных полей контрола.
        // @ts-ignore
        if (control._$needForceUpdate) {
            // tslint:disable-next-line:ban-ts-ignore
            // @ts-ignore
            delete control._$needForceUpdate;
            control._forceUpdate();
        }
    }

    private isBeforeMount(control: Control): boolean {
        // tslint:disable-next-line:ban-ts-ignore
        // @ts-ignore
        return !control._mounted && !control._unmounted;
    }

    /**
     * Сбор изменённых контрол нод перед вызовом хуков среди всех детей.
     * @function UI/_vdom/Synchronizer/resources/MountMethodsCaller#collectControlNodesToCall
     * @param controlNode Корневая контрол нода.
     * @param rebuildChanges Набор айди изменённых контрол нод.
     * @param result Массив для сбора изменённых контрол нод, по умолчанию пустой.
     * @returns Массив изменённых контрол нод
     */
    collectControlNodesToCall(controlNode: IControlNode, rebuildChanges: Set<TControlId | 0>, result: IControlNode[] = []): IControlNode[] {
        const control: Control = controlNode.control;
        // tslint:disable-next-line:ban-ts-ignore
        // @ts-ignore
        if (!control._destroyed && !control._reactiveStart) {
            // tslint:disable-next-line:ban-ts-ignore
            // @ts-ignore
            control._reactiveStart = true;
        }

        const childNodes: IControlNode[] = controlNode.childrenNodes;
        if (childNodes) {
            for (let i = 0; i < childNodes.length; i++) {
                this.collectControlNodesToCall(childNodes[i], rebuildChanges, result);
            }
        }

        if (typeof controlNode.id !== 'undefined' && rebuildChanges.has(controlNode.id)) {
            result.push(controlNode);
        } else {
            this.forceUpdateIfNeed(control);
        }

        return result;
    }

    private componentDidMountProcess(controlNode: IControlNode, control: Control): void {
        // tslint:disable-next-line:ban-ts-ignore
        // @ts-ignore
        if (control._destroyed) {
            return;
        }
        try {
            // tslint:disable-next-line:ban-ts-ignore
            // @ts-ignore
            if (typeof control._componentDidMount === 'function') {
                // tslint:disable-next-line:ban-ts-ignore
                // @ts-ignore
                control._componentDidMount(controlNode.options, controlNode.context);
            }
            this.forceUpdateIfNeed(control);
        } catch (error) {
            Logger.lifeError('_componentDidMount', control, error);
        }
    }

    private afterRenderProcess(controlNode: IControlNode, control: Control): void {
        // tslint:disable-next-line:ban-ts-ignore
        // @ts-ignore
        if (control._destroyed) {
            return;
        }
        try {
            // tslint:disable-next-line:ban-ts-ignore
            // @ts-ignore
            // TODO: remove it
            if (typeof control.__afterRender === 'function') {
                // tslint:disable-next-line:ban-ts-ignore
                // @ts-ignore
                control.__afterRender(
                   controlNode.oldOptions || controlNode.options,
                   controlNode.context
                );
            }
            this.forceUpdateIfNeed(control);
        } catch (error) {
            Logger.lifeError('_afterRender', control, error);
        }
    }

    private afterMountProcess(controlNode: IControlNode, control: Control): void {
        // tslint:disable-next-line:ban-ts-ignore
        // @ts-ignore
        if (control._destroyed) {
            return;
        }
        try {
            // tslint:disable-next-line:ban-ts-ignore
            // @ts-ignore
            if (typeof control._afterMount === 'function') {
                // tslint:disable-next-line:ban-ts-ignore
                // @ts-ignore
                control._afterMount(controlNode.options, controlNode.context);
            }
            // tslint:disable-next-line:ban-ts-ignore
            // @ts-ignore
            control._mounted = true;
            this.forceUpdateIfNeed(control);
        } catch (error) {
            Logger.lifeError('_afterMount', control, error);
        }
    }

    private afterUpdateProcess(controlNode: IControlNode, control: Control): void {
        // tslint:disable-next-line:ban-ts-ignore
        // @ts-ignore
        if (control._destroyed) {
            return;
        }
        try {
            // tslint:disable-next-line:ban-ts-ignore
            // @ts-ignore
            if (typeof control._afterUpdate === 'function') {
                // tslint:disable-next-line:ban-ts-ignore
                // @ts-ignore
                control._afterUpdate(
                   controlNode.oldOptions || controlNode.options,
                   controlNode.oldContext
                );
            }
            this.forceUpdateIfNeed(control);
        } catch (error) {
            Logger.lifeError('_afterUpdate', control, error);
        } finally {
            delete controlNode.oldOptions;
        }
    }

    beforePaint: TMountMethod = (controlNodes: IControlNode[]) => {
        for (let i = 0; i < controlNodes.length; i++) {
            const controlNode: IControlNode = controlNodes[i];
            const control: Control = controlNode.control;
            // tslint:disable-next-line:ban-ts-ignore
            // @ts-ignore
            if (control._beforePaint && typeof control._beforePaint === 'function') {
                Logger.error(`Хук "_beforePaint" был удален.
                Вместо него следует использовать:
                _componentDidMount - вызывается после монтирования контрола в DOM
                _afterRender - вызывается после каждого обновления DOM`, control);
            }
        }
    }

    /**
     * @function UI/_vdom/Synchronizer/resources/MountMethodsCaller#beforeRender
     * @param controlNodes Массив контрол нод.
     */
    beforeRender: TMountMethod = (controlNodes: IControlNode[]) => {
        for (let i = 0; i < controlNodes.length; i++) {
            const controlNode: IControlNode = controlNodes[i];
            const control: Control = controlNode.control;
            onStartLifecycle(controlNode.vnode || controlNode);
            if (!this.isBeforeMount(control)) {
                try {
                    // tslint:disable-next-line:ban-ts-ignore
                    // @ts-ignore
                    if (!control._destroyed && typeof control._beforeRender === 'function') {
                        // tslint:disable-next-line:ban-ts-ignore
                        // @ts-ignore
                        control._beforeRender();
                    }
                } catch (error) {
                    Logger.lifeError('_beforeRender', control, error);
                }
            }
            onEndLifecycle(controlNode.vnode || controlNode);
        }
    }

    /**
     * Запускает вызов _afterRender для каждого элемента массива controlNodes,
     * если в массиве встречается еще не замаунченный контрол,
     * то для него вызывается _componentDidMount.
     * Вызов _afterRender/_componentDidMount происходит синхронно.
     * @function UI/_vdom/Synchronizer/resources/MountMethodsCaller#afterRenderProcess
     * @param controlNodes Массив контрол нод.
     */
    afterRender: TMountMethod = (controlNodes: IControlNode[]) => {
        for (let i = 0; i < controlNodes.length; i++) {
            const controlNode: IControlNode = controlNodes[i];
            const control: Control = controlNode.control;
            onStartLifecycle(controlNode.vnode || controlNode);
            if (this.isBeforeMount(control)) {
                if (controlNode.hasCompound || control.getPendingBeforeMountState()) {
                    delay((): void => {
                        this.componentDidMountProcess(controlNode, control);
                    });
                } else {
                    this.componentDidMountProcess(controlNode, control);
                }
            } else {
                this.afterRenderProcess(controlNode, control);
            }
            onEndLifecycle(controlNode.vnode || controlNode);
        }
    }

    /**
     * Запускает вызов _afterUpdate для каждого элемента массива controlNodes,
     * если в массиве встречается еще не замаунченный контрол,
     * то для него вызывается _afterMount.
     * Вызов _afterUpdate/_afterMount происходит асинхронно.
     * @function UI/_vdom/Synchronizer/resources/MountMethodsCaller#afterUpdate
     * @param controlNodes Массив контрол нод.
     */
    afterUpdate: TMountMethod = (controlNodes: IControlNode[]) => {
        for (let i = 0; i < controlNodes.length; i++) {
            const controlNode: IControlNode = controlNodes[i];
            const control: Control = controlNode.control;
            onStartLifecycle(controlNode.vnode || controlNode);
            if (this.isBeforeMount(control)) {
                if (controlNode.hasCompound || control.getPendingBeforeMountState()) {
                    delay((): void => {
                        this.afterMountProcess(controlNode, control);
                    });
                } else {
                    this.afterMountProcess(controlNode, control);
                }
                onEndLifecycle(controlNode.vnode || controlNode);
                continue;
            }
            this.afterUpdateProcess(controlNode, control);
            onEndLifecycle(controlNode.vnode || controlNode);
        }
    }
}
