/// <amd-module name="UI/_vdom/Synchronizer/Synchronizer" />
/* tslint:disable */

import { DirtyKind, rebuildNode, createNode, destroyReqursive, IMemoNode } from './resources/DirtyChecking';
import DOMEnvironment, { IDOMEnvironment } from './resources/DOMEnvironment';
import { delay } from 'Types/function';
// @ts-ignore
import * as isEmptyObject from 'Core/helpers/Object/isEmpty';
// @ts-ignore
import * as Serializer from 'Core/Serializer';
import { Set } from 'Types/shim';
import { Control } from 'UI/Base';
import { Common, Vdom } from 'View/Executor/Utils';

// @ts-ignore
import { Logger } from 'UI/Utils';
import { IControlNodeOptions, IControlNode, IWasabyHTMLElement } from './interfaces';

import {
   injectHook,
   onEndCommit,
   onEndSync,
   onStartCommit,
   onStartSync,
   OperationType,
   getNodeName
} from 'UI/DevtoolsHook';
// @ts-ignore
import { restoreFocus } from 'UI/Focus';

/**
 * @author Кондаков Р.Н.
 */

   // A number of rebuild iterations we can run, before we assume that
   // it's stuck in an infinite loop
const MAX_REBUILD = 50;
   // A number of rebuild iterations to run with view logs enabled if it is
   // stuck in an infinite loop, before throwing an error. We should do
   // multiple iterations to see if the components rebuild are different
   // each time or the same
const MAX_REBUILD_LOGGED_ITERS = 2;

injectHook();

function forEachNodeParents(node: IControlNode, fn: (node:IControlNode) => void) {
   var parent = node.parent;
   while (parent) {
      fn(parent);
      parent = parent.parent;
   }
}

function updateCurrentDirties(environment: IDOMEnvironment) {
   environment._currentDirties = environment._nextDirties;
   environment._nextDirties = {};
}

function checkIsControlNodesParentDestroyed(controlNode: any) {
   return (
      controlNode.control &&
      controlNode.control._parent &&
      controlNode.control._parent.isDestroyed &&
      controlNode.control._parent.isDestroyed()
   );
}

// class RebuildQueue {
//    private nodes: IControlNode[];

//    constructor(private env: DOMEnvironment) {
//    }

//    add(node: IControlNode) {
//       // @ts-ignore
//       if (node.control._destroyed ||
//          node.environment !== this.env) {
//          return;
//       }
//       this.nodes.push(node);
//    }

//    run() {
//       while (this.nodes.length > 0) {
//          let rebuild = new Rebuild(this.nodes.shift());
//          rebuild.run().then()
//       }
//    }
// }

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

   constructor() {
   }

   private __rebuildRoots(rootRebuildVal: IMemoNode): Promise<void> {
      // In the case of asynchronous controls we have to check
      // is parent of those destroyed or not. If it is, that means, that we don't have a place
      // to mount our rootNodes
      let newRoot: IControlNode = rootRebuildVal.value;
      if (_environments.indexOf(newRoot.environment) === -1 || !!checkIsControlNodesParentDestroyed(newRoot)) {
         return;
      }

      // after promise callback fired, we have to make sure, that async control will be rebuilded
      // in the current cycle
      //@ts-ignore runtime hack
      if (newRoot.environment._asyncOngoing) {
         newRoot.environment._haveRebuildRequest = true;
         //@ts-ignore runtime hack
         newRoot.environment._asyncOngoing = false;
      }

      let rebuildChanges = rootRebuildVal.memo;
      // Some controls might have already been destroyed, but they are
      // still in rootsRebuild because they were in oldRoots when
      // rebuild started. Filter them out if their environment does
      // not exist anymore
      let rebuildChangesIds = new Set();
      if (newRoot.environment._currentDirties[newRoot.id] & DirtyKind.DIRTY) {
         rebuildChangesIds.add(newRoot.id)
      };

      /**
       * Типы нод, для которых нужно запустить _afterUpdate
       * @type {{createdNodes: boolean, updatedChangedNodes: boolean, selfDirtyNodes: boolean}}
       */
      let rebuildChangesFields = [
         "createdNodes",
         "updatedChangedNodes",
         "selfDirtyNodes",
         "createdTemplateNodes",
         "updatedChangedTemplateNodes",
      ];

      //Сохраняем id созданных/обновленных контрол нод, чтобы вызвать afterUpdate или afterMound только у них
      for (let i = 0; i < rebuildChangesFields.length; i++) {
         let field = rebuildChangesFields[i]
         for (let j = 0; j < rebuildChanges[field].length; j++) {
            let node: IControlNode = rebuildChanges[field][j];
            rebuildChangesIds.add(node.id);
         }
      }

      rebuildChanges.createdNodes.forEach((node: IControlNode) => {
         this._controlNodes[node.id] = node;
      });

      rebuildChanges.destroyedNodes.forEach((node: IControlNode) => {
         delete this._controlNodes[node.id];
      });
      if (!newRoot.environment._haveRebuildRequest || !newRoot.fullMarkup) {
         return;
      }

      return newRoot.environment.applyNewVNode(newRoot.fullMarkup, rebuildChangesIds, newRoot);
   }

   private __doRebuild(currentRoot: IControlNode): PromiseLike<void | Error> {
      let rootId = currentRoot.rootId;
      onStartSync(rootId);

      updateCurrentDirties(currentRoot.environment);
      let rootsRebuild: IMemoNode | PromiseLike<IMemoNode> = rebuildNode(currentRoot.environment, currentRoot, undefined, true);

      if ('then' in rootsRebuild) {
         return rootsRebuild.then((val) => this.__rebuildRoots(val),
            (err: any) => {
               Common.asyncRenderErrorLog(err);
               return err;
            }).then((res) => {
               onEndSync(rootId);
               return res;
            });
      }

      return this.__rebuildRoots(rootsRebuild);
   }

   private __rebuild(controlNode: IControlNode) {
      let self = this;

      /**
       * Такое происходит, когда слой совмместимости удаляет корневую ноду wasaby
       * Мы ничего сделать не можем и не должны.
       */
      if (self._rootNodes.length === 0 || !controlNode.environment) {
         return;
      }

      let currentRoot = self._rootNodes[0];
      for (let i = 1; i < self._rootNodes.length; i++) {
         if (controlNode.environment === self._rootNodes[i].environment) {
            currentRoot = self._rootNodes[i];
            break;
         }
      }

      let i: number;
      for (i = 0; i !== MAX_REBUILD; i++) {
         this.__doRebuild(currentRoot);
         if (isEmptyObject(currentRoot.environment._nextDirties)) {
            break;
         }
      }
      if (i === MAX_REBUILD) {
         var j: number;

         // If we reached MAX_REBUILD, we can assume that something went
         // wrong - nodes were rebuilt many times, but they are still dirty,
         // so we are stuck in an infinite loop.
         // To be able to debug the error, we enable view logs (to see which
         // components are being rebuilt) and run rebuild a couple of times
         // with logs enabled.
         // After we've logged the problematic components, we disable view
         // logs and throw an error to exit the infinite rebuild loop.
         Logger.setDebug(true);

         // make some rebuild iterations with logging
         for (j = 1; j <= MAX_REBUILD_LOGGED_ITERS; j++) {
            Logger.debug(`MAX_REBUILD error - Logged iteration: ' + ${j}`, []);
            this.__doRebuild(currentRoot);
         }

         Logger.setDebug(false);

         throw new Error('SBIS3.CORE.VDOM.Synchronizer: i === MAX_REBUILD');
      }
   }

   mountControlToDOM(
      control: TRequredControl,
      options: IControlNodeOptions,
      mountPoint: IWasabyHTMLElement,
      attributes: {}) {

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
      let controlNode: IControlNode = createNode(control, { user: options }, undefined, environment, null, state);
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
         carrier = Vdom.getReceivedState(
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
      if (controlNode.control.saveOptions) {
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
               Common.asyncRenderErrorLog(error, controlNode);
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

   cleanControlDomLink(node: any[], control?: { _instId: string | number; }) {
      if (control) {
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
         //@ts-ignore TODO - убрать использование
         var rootDOMNode = this._rootNodes[i].environment._rootDOMNode;

         // We only have one root dom node on vdom page, others are created inside of
         // compound controls. Compound control could be destroyed incorrectly, which would
         // leave an environment with undefined _rootDOMNode. We have to clean up these
         // environments as well.
         if ((domElement === rootDOMNode && this._rootNodes[i].environment._canDestroy(control)) || !rootDOMNode) {
            var nodeId = this._rootNodes[i].id,
               env = _environments.splice(i, 1)[0];

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
               foundControlEnvironment = env;
            } else {
               env.destroy();
            }
         }
      }

      // If control's environment was found, destroy it and the control itself.
      // Do this after loop, because destroying the control will destroy its children, that
      // could also call unMountControlFromDOM, which would change the _rootNodes array length
      // and lead to errors. For example, after control.destroy(), `i` could be out of bounds,
      // because child control environments were removed
      if (foundControlEnvironment) {
         //@ts-ignore private
         if (!control._destroyed) {
            let vnode;
            if (foundControlNode) {
               vnode = foundControlNode.vnode || foundControlNode;
               //@ts-ignore используется runtime hack
               onStartCommit(OperationType.DESTROY, control._moduleName, vnode);
            }
            control.destroy();
            if (foundControlNode) {
               onEndCommit(vnode);
            }
         }
         if (foundControlNode) {
            // We have to make sure that all of the child controls are destroyed, in case
            // synchronizer didn't run against this environment when destroy() was called
            // for the root control
            destroyReqursive(foundControlNode, foundControlEnvironment);
            onEndSync(foundControlNode.rootId)
         }
         //@ts-ignore используется runtime hack
         control._mounted = false;
         //@ts-ignore используется runtime hack
         control._unmounted = true;
         foundControlEnvironment.destroy();
      }
   }

   private __requestRebuild(controlId: string): void {
      //контрол здесь точно должен найтись, или быть корневым - 2 варианта попадания сюда:
      //    из конструктора компонента (тогда его нет, но тогда синхронизация активна) - тогда не нужно с ним ничего делать
      //    из внутреннего события компонента, меняющего его состояние, и вызывающего requestRebuild
      let controlNode = this._controlNodes[controlId];

      //@ts-ignore используется runtime hack
      let canUpdate = controlNode && !controlNode.environment._rebuildRequestStarted;

      if (canUpdate) {
         controlNode.environment._nextDirties[controlId] |= DirtyKind.DIRTY;

         forEachNodeParents(controlNode, function (parent: IControlNode) {
            controlNode.environment._nextDirties[parent.id] |= DirtyKind.CHILD_DIRTY;
         });

            controlNode.environment._haveRebuildRequest = true;
            const requestRebuildDelayed = () => {
               if (!controlNode.environment._haveRebuildRequest) {

                  /*Если _haveRebuildRequest=false значит
                  * циклы синхронизации смешались и в предыдущем тике у
                  * всех контролов был вызван _afterUpdate
                  * Такое может случиться только в слое совместимости,
                  * когда динамически удаляются и добавляются контрол ноды
                  * */
                  return;
               }
               //@ts-ignore используется runtime hack
               controlNode.environment._rebuildRequestStarted = true;

               restoreFocus(controlNode.control, () => this.__rebuild(controlNode));

               controlNode.environment.addTabListener();
            };
            delay(requestRebuildDelayed);

         return;
      }

      if (controlNode && controlNode.environment) {
         if (!controlNode.environment.queue) {
            controlNode.environment.queue = [];
         }
         if (!controlNode.environment.queue.includes(controlId)) {
            controlNode.environment.queue.push(controlId);
         }
      }
   }
}

export default new VDomSynchronizer();
