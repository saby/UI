import {onEndLifecycle, onStartLifecycle} from '../../../DevtoolsHook';
import {IControlNode, TControlId} from '../interfaces';
import {delay} from 'Types/function';
import {Logger} from 'UI/Utils';
import {Control} from 'UI/Base';

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

   // TODO: Remove
   private beforePaintProcess(controlNode: IControlNode, control: Control): void {
      // _needSyncAfterMount - специальный флаг для работы beforePaint
      // TODO: удалить этот флаг и сделать нормальную работу beforePaint
      // https://online.sbis.ru/doc/4fd6afbb-da9b-4a55-a416-d4325cade9ff
      // @ts-ignore
      if (!control._needSyncAfterMount) {
         return;
      }
      // tslint:disable-next-line:ban-ts-ignore
      // @ts-ignore
      if (control._destroyed) {
         return;
      }
      try {
         // tslint:disable-next-line:ban-ts-ignore
         // @ts-ignore
         if (control._beforePaint && typeof control._beforePaint === 'function') {
            // tslint:disable-next-line:ban-ts-ignore
            // @ts-ignore
            control._beforePaint(controlNode.oldOptions || controlNode.options, controlNode.oldContext);
         }
      } catch (error) {
         Logger.lifeError('_beforePaint', control, error);
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
            control._afterUpdate(controlNode.oldOptions || controlNode.options, controlNode.oldContext);
         }
         this.forceUpdateIfNeed(control);
      } catch (error) {
         Logger.lifeError('_afterUpdate', control, error);
      } finally {
         delete controlNode.oldOptions;
      }
   }

   /**
    * @function UI/_vdom/Synchronizer/resources/MountMethodsCaller#beforePaint
    * @param controlNodes Массив контрол нод.
    */
      // TODO: Remove
   beforePaint: TMountMethod = (controlNodes: IControlNode[]) => {
      for (let i = 0; i < controlNodes.length; i++) {
         const controlNode: IControlNode = controlNodes[i];
         const control: Control = controlNode.control;
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
               if (!control._destroyed && typeof controlNode.control._beforePaintOnMount === 'function') {
                  // tslint:disable-next-line:ban-ts-ignore
                  // @ts-ignore
                  controlNode.control._beforePaintOnMount();
               }
            } else {
               this.beforePaintProcess(controlNode, control);
            }
            onEndLifecycle(controlNode.vnode || controlNode);
            continue;
         }
         try {
            // tslint:disable-next-line:ban-ts-ignore
            // @ts-ignore
            if (!control._destroyed && typeof control._beforePaint === 'function') {
               // tslint:disable-next-line:ban-ts-ignore
               // @ts-ignore
               control._beforePaint();
            }
         } catch (error) {
            Logger.lifeError('_beforePaint', control, error);
         }
         onEndLifecycle(controlNode.vnode || controlNode);
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
    * Синхронный хук, вызывается после первого обновления DOM-дерева
    * @function UI/_vdom/Synchronizer/resources/MountMethodsCaller#afterUpdate
    * @param controlNodes Массив контрол нод.
    */
   componentDidMount: TMountMethod = (controlNodes: IControlNode[]) => {
      for (let i = 0; i < controlNodes.length; i++) {
         const controlNode: IControlNode = controlNodes[i];
         const control: Control = controlNode.control;
         onStartLifecycle(controlNode.vnode || controlNode);
         if (this.isBeforeMount(control)) {
            try {
               // tslint:disable-next-line:ban-ts-ignore
               // @ts-ignore
               if (!control._destroyed && typeof control._componentDidMount === 'function') {
                  // tslint:disable-next-line:ban-ts-ignore
                  // @ts-ignore
                  control._componentDidMount(
                     controlNode.oldOptions || controlNode.options,
                     controlNode.oldContext
                  );
               }
            } catch (error) {
               Logger.lifeError('_componentDidMount', control, error);
            }
            onEndLifecycle(controlNode.vnode || controlNode);
         }
      }
   };

   /**
    * Асинхронный хук, вызывается после каждого обновления DOM-дерева
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
   };

   /**
    * Синхронный хук, вызывается после каждого обновления DOM-дерева
    * @function UI/_vdom/Synchronizer/resources/MountMethodsCaller#afterRender
    * @param controlNodes Массив контрол нод.
    */
   // TODO: rename to "_componentDidUpdate"
   afterRender: TMountMethod = (controlNodes: IControlNode[]) => {
      for (let i = 0; i < controlNodes.length; i++) {
         const controlNode: IControlNode = controlNodes[i];
         const control: Control = controlNode.control;
         onStartLifecycle(controlNode.vnode || controlNode);
         if (!this.isBeforeMount(control)) {
            try {
               // tslint:disable-next-line:ban-ts-ignore
               // @ts-ignore
               if (!control._destroyed && typeof control._afterRender === 'function') {
                  // tslint:disable-next-line:ban-ts-ignore
                  // @ts-ignore
                  control._afterRender(
                     controlNode.oldOptions || controlNode.options,
                     controlNode.oldContext
                  );
               }
            } catch (error) {
               Logger.lifeError('_afterRender', control, error);
            }
         }
         onEndLifecycle(controlNode.vnode || controlNode);
      }
   }
}
