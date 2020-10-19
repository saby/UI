import { onEndLifecycle, onStartLifecycle } from '../../../DevtoolsHook';
import { IControlNode, TControlId } from '../interfaces';
import { delay } from 'Types/function';
import { Logger } from 'UI/Utils';
import { Control } from 'UI/Base';

/**
 * @author Кондаков Р.Н.
 */

type TMountMethod = (controlNode: IControlNode, rebuildChanges: Set<TControlId | 0>) => void;
type TPreparationsResult = [Control, boolean, IControlNode[], boolean];

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

    private mountMethodPreparations(
        controlNode: IControlNode,
        rebuildNodesIds: Set<TControlId | 0>
    ): TPreparationsResult {
        const control: Control = controlNode.control;
        // tslint:disable-next-line:ban-ts-ignore
        // @ts-ignore
        const isDestroyed: boolean = control._destroyed;
        // tslint:disable-next-line:ban-ts-ignore
        // @ts-ignore
        if (!isDestroyed && !control._reactiveStart) {
            // tslint:disable-next-line:ban-ts-ignore
            // @ts-ignore
            control._reactiveStart = true;
        }
        const childNodes: IControlNode[] = controlNode.childrenNodes;
        const isChanged: boolean = typeof controlNode.id !== 'undefined' &&
            rebuildNodesIds.has(controlNode.id);

        return [control, isDestroyed, childNodes, isChanged];
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

    private afterRenederProcess(controlNode: IControlNode, control: Control): void {
        try {
            // tslint:disable-next-line:ban-ts-ignore
            // @ts-ignore
            control._afterRender(controlNode.oldOptions || controlNode.options, controlNode.oldContext);
        } catch (error) {
            Logger.lifeError('_afterRender', control, error);
        }
    }

    beforePaint: TMountMethod = (controlNode, rebuildChanges) => {
        const [control, isDestroyed, childNodes, isChanged]: TPreparationsResult =
            this.mountMethodPreparations(controlNode, rebuildChanges);

        if (childNodes) {
            for (let i = 0; i < childNodes.length; ++i) {
                this.beforePaint(childNodes[i], rebuildChanges);
            }
        }

        if (!isChanged) {
            this.forceUpdateIfNeed(control);
            return;
        }

        onStartLifecycle(controlNode.vnode || controlNode);
        if (this.isBeforeMount(control)) {
            // FIXME: костыль, нужно чтобы попап синхронно отреагировал после вставки в дом.
            //  нужно чтобы одновременно открывалась панель и скрывался аккордеон.
            //  либо оставлять хук и удалять условие, либо другое решение (Красильников)
            // tslint:disable-next-line:ban-ts-ignore
            // @ts-ignore
            if (control._moduleName === 'Controls/_popup/Manager/Popup' ||
                // tslint:disable-next-line:ban-ts-ignore
                // @ts-ignore
                control._moduleName === 'Controls/_scroll/StickyHeader/_StickyHeader') {
                // tslint:disable-next-line:ban-ts-ignore
                // @ts-ignore
                if (!isDestroyed && typeof controlNode.control._beforePaintOnMount === 'function') {
                    // tslint:disable-next-line:ban-ts-ignore
                    // @ts-ignore
                    controlNode.control._beforePaintOnMount();
                }
            }
            onEndLifecycle(controlNode.vnode || controlNode);
            return;
        }
        try {
            // tslint:disable-next-line:ban-ts-ignore
            // @ts-ignore
            if (!isDestroyed && typeof control._beforePaint === 'function') {
                // tslint:disable-next-line:ban-ts-ignore
                // @ts-ignore
                control._beforePaint();
            }
        } catch (error) {
            Logger.lifeError('_beforePaint', control, error);
        }
        onEndLifecycle(controlNode.vnode || controlNode);
    }

    beforeRender: TMountMethod = (controlNode, rebuildChanges) => {
        const [control, isDestroyed, childNodes, isChanged]: TPreparationsResult =
            this.mountMethodPreparations(controlNode, rebuildChanges);

        if (childNodes) {
            for (let i = 0; i < childNodes.length; ++i) {
                this.beforeRender(childNodes[i], rebuildChanges);
            }
        }

        if (!isChanged) {
            this.forceUpdateIfNeed(control);
            return;
        }

        onStartLifecycle(controlNode.vnode || controlNode);
        if (!this.isBeforeMount(control)) {
            try {
                // tslint:disable-next-line:ban-ts-ignore
                // @ts-ignore
                if (!isDestroyed && typeof control._beforeRender === 'function') {
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

    afterRender: TMountMethod = (controlNode, rebuildChanges) => {
        const [control, isDestroyed, childNodes, isChanged]: TPreparationsResult =
            this.mountMethodPreparations(controlNode, rebuildChanges);

        if (childNodes) {
            for (let i = 0; i < childNodes.length; ++i) {
                this.afterRender(childNodes[i], rebuildChanges);
            }
        }

        if (!isChanged) {
            this.forceUpdateIfNeed(control);
            return;
        }

        onStartLifecycle(controlNode.vnode || controlNode);
        if (!this.isBeforeMount(control)) {
            try {
                // tslint:disable-next-line:ban-ts-ignore
                // @ts-ignore
                if (!isDestroyed && typeof control._afterRender === 'function') {
                    delay((): void => {
                        this.afterRenederProcess(controlNode, control);
                    });
                }
            } catch (error) {
                Logger.lifeError('_afterRender', control, error);
            }
        }
        onEndLifecycle(controlNode.vnode || controlNode);
    }

    afterUpdate: TMountMethod = (controlNode, rebuildChanges) => {
        const [control, isDestroyed, childNodes, isChanged]: TPreparationsResult =
            this.mountMethodPreparations(controlNode, rebuildChanges);

        if (childNodes) {
            for (let i = 0; i < childNodes.length; ++i) {
                this.afterUpdate(childNodes[i], rebuildChanges);
            }
        }

        if (!isChanged) {
            this.forceUpdateIfNeed(control);
            return;
        }

        onStartLifecycle(controlNode.vnode || controlNode);
        if (this.isBeforeMount(control)) {
            delay((): void => {
                this.afterMountProcess(controlNode, control);
            });
            onEndLifecycle(controlNode.vnode || controlNode);
            return;
        }
        try {
            if (!isDestroyed) {
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
            }
        } catch (error) {
            Logger.lifeError('_afterUpdate', controlNode.control, error);
        } finally {
            delete controlNode.oldOptions;
        }
        onEndLifecycle(controlNode.vnode || controlNode);
    }
}
