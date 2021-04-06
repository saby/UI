/// <amd-module name="UICore/_vdom/Synchronizer/Synchronizer" />
/* tslint:disable */

import { createNode } from './resources/ControlNode';
import { DirtyKind, rebuildNode, destroyReqursive, getReceivedState } from './resources/DirtyChecking';
import DOMEnvironment from './resources/DOMEnvironment';
import { delay } from 'Types/function';
// @ts-ignore
import { ObjectUtils } from 'UICommon/Utils';
// @ts-ignore
import { Serializer } from 'UICommon/State';
import { Control, IControlOptions } from 'UICore/Base';

// @ts-ignore
import { Logger } from 'UICommon/Utils';
import { IOptions, IControlNode, IMemoNode, IWasabyHTMLElement, IDOMEnvironment, IRootAttrs } from './interfaces';

import {
   injectHook,
   onEndCommit,
   onEndSync,
   onStartCommit,
   onStartSync,
   OperationType,
   getNodeName
} from 'UICore/DevtoolsHook';
// @ts-ignore
import { prepareRestoreFocusBeforeRedraw, restoreFocusAfterRedraw } from 'UICore/Focus';

/**
 * @author Кондаков Р.Н.
 */

injectHook();

function forEachNodeParents(node: IControlNode, fn: (node:IControlNode) => void) {
   var parent = node.parent;
   while (parent) {
      fn(parent);
      parent = parent.parent;
   }
}

// Идентификатор для корней, который используется в девтулзах.
// Нельзя использовать inst_id, т.к. замеры начинаются раньше, чем создаётся корень
let rootCount = 0;
let _environments: IDOMEnvironment[] = [];

type TRequredControl = Control & {
   _moduleName: string
   // _mounted: any;
   // _unmounted: any;
   // _beforeMountCalled: any;
} & {
   environment: IDOMEnvironment  // Скорее всего просто IEnvironment
   _saveEnvironment: (env: IDOMEnvironment) => void
   _getEnvironment: () => IDOMEnvironment
   _forceUpdate: () => void
}

class VDomSynchronizer {
   private _rootNodes: IControlNode[] = [];
   _controlNodes: Record<string, IControlNode> = {};

   private _nextDirtiesRunCheck(controlNode: IControlNode) {
      let self = this;
      let currentRoot = self._rootNodes[0];
      for (let i = 1; i < self._rootNodes.length; i++) {
         if (controlNode.environment === self._rootNodes[i].environment) {
            currentRoot = self._rootNodes[i];
            break;
         }
      }

      currentRoot.environment._currentDirties = currentRoot.environment._nextDirties;
      currentRoot.environment._nextDirties = {};
      onStartSync(currentRoot.rootId);
      let rootsRebuild: IMemoNode | Promise<IMemoNode> = rebuildNode(currentRoot.environment, currentRoot, undefined, true);

      if ('then' in rootsRebuild) {
         rootsRebuild.then((val) => {
            val.memo.createdNodes.forEach((node: IControlNode) => {
               this._controlNodes[node.id] = node;
            });

            val.memo.destroyedNodes.forEach((node: IControlNode) => {
               delete this._controlNodes[node.id];
            });

            val.value.environment._haveRebuildRequest = true;
            val.value.environment.applyNodeMemo(val, () => onEndSync(currentRoot.rootId));
         },
            function (err: any) {
               Logger.asyncRenderErrorLog(err);
               return err;
            }
         );

         return;
      }

      rootsRebuild.memo.createdNodes.forEach((node: IControlNode) => {
         this._controlNodes[node.id] = node;
      });

      rootsRebuild.memo.destroyedNodes.forEach((node: IControlNode) => {
         delete this._controlNodes[node.id];
      });

      rootsRebuild.value.environment.applyNodeMemo(rootsRebuild, () => onEndSync(currentRoot.rootId));
   }

   mountControlToDOM(
      control: TRequredControl,
      options: IOptions,
      mountPoint: IWasabyHTMLElement,
      attributes: IRootAttrs) {

      //@ts-ignore не могу пока избавиться от jQuery
      if (mountPoint.length > 0) {
         mountPoint = mountPoint[0];
      }

      if (!(mountPoint instanceof HTMLElement)) {
         throw new Error('Не корректный DOM элемент указан в качестве узла вставки.');
      }

      let hasMountedComponent: boolean = this._rootNodes.some(function (controlNode: IControlNode) {
         return controlNode.control === control;
      });

      if (hasMountedComponent) {
         throw new Error('На этом DOM-элементе уже есть смонтированный корневой компонент');
      }

      let environment: any;
      let state: any;

      const foundEnvironment = _environments.find(function (env: IDOMEnvironment) {
         //@ts-ignore
         return env instanceof DOMEnvironment && env.getDOMNode() === mountPoint;
      });

      let rootAttrs = attributes || {};

      if (!attributes) {
         rootAttrs['data-component'] = mountPoint.getAttribute('data-component');
      }

      if (foundEnvironment) {
         environment = foundEnvironment;
      } else {
         environment = new DOMEnvironment(mountPoint, (nodeId) => this.__requestRebuild(nodeId), rootAttrs);
         _environments.push(environment);
      }

      const rootId = rootCount++;
      onStartSync(rootId);
      onStartCommit(
         OperationType.CREATE,
         //@ts-ignore
         control._moduleName
      );

      let nodeOptions = {
         user: options,
         internal: {},
         attributes: {},
         events: {}
      };

      const key: string = options?.bootstrapKey as string;
      let controlNode: IControlNode = createNode(control, nodeOptions, key, environment, null, state);
      controlNode.rootId = rootId;  // KIRILL: оно добавляется только тут
      if (rootAttrs) {
         controlNode.attributes = rootAttrs;  // KIRILL: оно добавляется только тут
      }
      this._controlNodes[controlNode.id] = controlNode;

      this._rootNodes.push(controlNode);

      // храним в рутовом виртуальном компоненте ссылку на environment,
      // иначе до него не докопаться, только после ребилда, а это слишком поздно для системы фокусов
      // KIRILL: !!! оно же private!!!
      //@ts-ignore
      controlNode.control._saveEnvironment(environment, controlNode);

      var carrier: Promise<any>;
      // Эти флаги создаются в GeneratorDefault
      //@ts-ignore
      if (!control._mounted && !control._unmounted && !control._beforeMountCalled) {
         carrier = getReceivedState(
            controlNode,
            {
               controlProperties: options,
               //@ts-ignore
               controlClass: control.constructor
            },
            new Serializer()
         );
      }

      controlNode['element'] = mountPoint;
      /**
       * Сделать final проверку
       */
      // @ts-ignore
      if (controlNode.control.saveOptions) {
         // @ts-ignore
         controlNode.control.saveOptions(controlNode.options, controlNode);
      } else {
         /**
          * Поддержка для совместимости версий контролов
          */
         //@ts-ignore
         controlNode.control._options = controlNode.options;
         // @ts-ignore
         controlNode.control._container = $(controlNode.element);
      }

      /**
       * Обработка асинхронного построения для рутовой ноды
       * @type {*}
       */
      if (carrier) {
         onEndCommit(controlNode, {
            //@ts-ignore private
            template: controlNode.control._template,
            //@ts-ignore DirtyChecking добавляет с помощью Core/ReactiveObserver
            state: controlNode.control.reactiveValues,
            options: controlNode.options,
            attributes: controlNode.attributes,
            instance: controlNode.control,
            logicParent: null
         });
         carrier.then(
            (receivedState: any) => {
               controlNode.receivedState = receivedState;
               this.__requestRebuild(controlNode.id);
               onEndSync(rootId);
               return receivedState;
            },
            function asyncRenderErrback(error: any) {
               Logger.asyncRenderErrorLog(error, controlNode);
               return error;
            }
         );
      } else {
         this.__requestRebuild(controlNode.id);
         onEndCommit(controlNode, {
            //@ts-ignore private
            template: controlNode.control._template,
            //@ts-ignore DirtyChecking добавляет с помощью Core/ReactiveObserver
            state: controlNode.control.reactiveValues,
            options: controlNode.options,
            attributes: controlNode.attributes,
            instance: controlNode.control,
            logicParent: null
         });
         onEndSync(rootId);
      }
   }

   cleanControlDomLink(node: HTMLElement, control?: Control<IControlOptions, unknown>) {
      if (control) {
         // @ts-ignore
         delete this._controlNodes[control._instId];
      }
      if (!node) {
         return;
      }
      const domElement = node[0] ? node[0] : node;
      if (domElement.controlNodes) {
         domElement.controlNodes = domElement.controlNodes.filter((controlNode: { control: { _destroyed: any; }; id: string | number; }) =>
            controlNode.control && !controlNode.control._destroyed
         );
      }
   }

   unMountControlFromDOM(control: Control, node: any[]) {
      let domElement = node[0] ? node[0] : node;
      let foundControlEnvironment: IDOMEnvironment;
      let foundControlNode: IControlNode;

      for (var i = this._rootNodes.length - 1; i >= 0; i--) {
         var environment = this._rootNodes[i].environment;
         //@ts-ignore TODO - убрать использование
         var rootDOMNode = environment._rootDOMNode;

         // We only have one root dom node on vdom page, others are created inside of
         // compound controls. Compound control could be destroyed incorrectly, which would
         // leave an environment with undefined _rootDOMNode. We have to clean up these
         // environments as well.
         if ((domElement === rootDOMNode && environment._canDestroy(control)) || !rootDOMNode) {
            var nodeId = this._rootNodes[i].id;
            var environmentIndex = _environments.indexOf(environment);
            if (environmentIndex !== -1) {
               _environments.splice(environmentIndex, 1);
            }

            if (this._controlNodes[nodeId]) {
               foundControlNode = this._controlNodes[nodeId];
               onStartSync(foundControlNode.rootId);
               delete this._controlNodes[nodeId];
            } else {
               /**
                * If a node wasn't found it means that it was destroyed inside the compatibility layer.
                * This is the only place that is guaranteed to be called for these nodes.
                * We can't measure the time here, but at least we should tell the devtools that the node was destroyed.
                */
               const vnode = this._rootNodes[i];
               onStartSync(vnode.rootId);
               onStartCommit(OperationType.DESTROY, getNodeName(vnode), vnode);
               onEndCommit(vnode);
               onEndSync(vnode.rootId);
            }
            this._rootNodes.splice(i, 1);

            // Control's environment was found, remember it to destroy after loop
            if (domElement === rootDOMNode) {
               foundControlEnvironment = environment;
            } else {
               environment.destroy();
            }
         }
      }

      if (!foundControlEnvironment) {
         return;
      }

      //@ts-ignore private
      const isControlDestroyed = control._destroyed;
      if (!foundControlNode) {
         if (!isControlDestroyed) {
            // @ts-ignore
            control.destroy();
         }
         //@ts-ignore используется runtime hack
         control._mounted = false;
         //@ts-ignore используется runtime hack
         control._unmounted = true;
         foundControlEnvironment.destroy();
         return;
      }

      //@ts-ignore DirtyChecking ставит флаг, которого нет в API контрола.
      if (!control.__$destroyFromDirtyChecking) {
         destroyReqursive(foundControlNode, foundControlEnvironment);
      }
      onEndSync(foundControlNode.rootId);
      //@ts-ignore используется runtime hack
      control._mounted = false;
      //@ts-ignore используется runtime hack
      control._unmounted = true;
      foundControlEnvironment.destroy();
   }

   private __requestRebuild(controlId: string): void {
      //контрол здесь точно должен найтись, или быть корневым - 2 варианта попадания сюда:
      //    из конструктора компонента (тогда его нет, но тогда синхронизация активна) - тогда не нужно с ним ничего делать
      //    из внутреннего события компонента, меняющего его состояние, и вызывающего requestRebuild
      let controlNode = this._controlNodes[controlId];

      //@ts-ignore используется runtime hack
      let canUpdate = controlNode && !controlNode.environment._rebuildRequestStarted;

      if (!canUpdate) {
         if (controlNode && controlNode.environment) {
            if (!controlNode.environment.queue) {
               controlNode.environment.queue = [];
            }
            if (!controlNode.environment.queue.includes(controlId)) {
               controlNode.environment.queue.push(controlId);
            }
         }
         return;
      }

      controlNode.environment._nextDirties[controlId] |= DirtyKind.DIRTY;
      forEachNodeParents(controlNode, function (parent: IControlNode) {
         controlNode.environment._nextDirties[parent.id] |= DirtyKind.CHILD_DIRTY;
      });

      if (controlNode.environment._haveRebuildRequest) {
         return;
      }

      controlNode.environment._haveRebuildRequest = true;
      const requestRebuildDelayed = () => {
         if (this._rootNodes.length === 0 || !controlNode.environment._haveRebuildRequest) {
            /*
            * При _rootNodes.length === 0 - кто-то сделал unmount
            *
            * Если _haveRebuildRequest=false значит
            * циклы синхронизации смешались и в предыдущем тике у
            * всех контролов был вызван _afterUpdate
            * Такое может случиться только в слое совместимости,
            * когда динамически удаляются и добавляются контрол ноды
            * */
            return;
         }

         //@ts-ignore используется runtime hack
         controlNode.environment._rebuildRequestStarted = true;
         prepareRestoreFocusBeforeRedraw(controlNode.control);
         this._nextDirtiesRunCheck(controlNode);
         restoreFocusAfterRedraw(controlNode.control);
      };
      delay(requestRebuildDelayed);
   }
}

export default new VDomSynchronizer();
