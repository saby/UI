/// <amd-module name="UI/_vdom/Synchronizer/resources/DirtyChecking" />
/**
 * @author Кондаков Р.Н.
 */

/* tslint:disable */
// @ts-nocheck
// @ts-ignore
import { constants } from 'Env/Env';
import { Subscriber } from 'UI/Events';
import {
   getFullMarkup,
   mapVNode,
   getDecoratedMarkup,
   getMarkupDiff,
   isVNodeType,
   isControlVNodeType,
   isTemplateVNodeType
} from './VdomMarkup';
import { OptionsResolver } from 'UI/Executor';
import { ContextResolver } from 'UI/Contexts';
import { delay } from 'Types/function';
// @ts-ignore
import { Serializer } from 'UI/State';
// @ts-ignore
import { FunctionUtils, Logger, needToBeCompatible } from 'UI/Utils';
import { clearNotChangedOptions } from './DirtyCheckingCompatible';
import { ReactiveObserver } from 'UI/Reactivity';
import {
   onEndCommit,
   onStartCommit,
   saveChildren,
   OperationType,
   getNodeName
} from 'UI/DevtoolsHook';
import { IControlNode, IDOMEnvironment} from '../interfaces';
import { getChangedOptions, collectObjectVersions } from './Options';
import { createNode } from './ControlNode';
import * as AppEnv from 'Application/Env';
import * as AppInit from 'Application/Initializer';
import { GeneratorNode } from 'UI/Executor';
// import { VNode } from 'Inferno/third-party/index';
import { ITemplateNode } from 'UI/_executor/_Markup/IGeneratorType';
import { getCompatibleUtils } from 'UI/_vdom/Synchronizer/resources/DirtyCheckingCompatible';

type TDirtyCheckingTemplate = ITemplateNode & {
    children: GeneratorNode[];  // нужно понять почему у нас такое ограничение
};

var Slr = new Serializer();

interface IMemoForNode {
    createdNodes: Array<any>;
    createdTemplateNodes: Array<any>;
    destroyedNodes: Array<any>;
    selfDirtyNodes: Array<any>;
    updatedChangedNodes: Array<any>;
    updatedChangedTemplateNodes: Array<any>;
    updatedNodes: Array<any>;
    updatedUnchangedNodes: Array<any>;
}

export class MemoForNode implements IMemoForNode {
    createdNodes: Array<any>;
    createdTemplateNodes: Array<any>;
    destroyedNodes: Array<any>;
    selfDirtyNodes: Array<any>;
    updatedChangedNodes: Array<any>;
    updatedChangedTemplateNodes: Array<any>;
    updatedNodes: Array<any>;
    updatedUnchangedNodes: Array<any>;

    constructor(start?: Partial<IMemoForNode>) {
        if (!start) {
            this.createdNodes =  [];
            this.createdTemplateNodes =  [];
            this.destroyedNodes = [];
            this.selfDirtyNodes = [];
            this.updatedChangedNodes = [];
            this.updatedChangedTemplateNodes = [];
            this.updatedNodes = [];
            this.updatedUnchangedNodes = [];
            return this;
        }

        this.createdNodes = start.createdNodes ? start.createdNodes.slice() : [];
        this.createdTemplateNodes = start.createdTemplateNodes ? start.createdTemplateNodes.slice() : [];
        this.destroyedNodes = start.destroyedNodes ? start.destroyedNodes.slice() : [];
        this.selfDirtyNodes = start.selfDirtyNodes ? start.selfDirtyNodes.slice() : [];
        this.updatedChangedNodes = start.updatedChangedNodes ? start.updatedChangedNodes.slice() : [];
        this.updatedChangedTemplateNodes = start.updatedChangedTemplateNodes ? start.updatedChangedTemplateNodes.slice() : [];
        this.updatedNodes = start.updatedNodes ? start.updatedNodes.slice() : [];
        this.updatedUnchangedNodes = start.updatedUnchangedNodes ? start.updatedUnchangedNodes.slice() : [];
    }

    concat(source: MemoForNode): void {
        MemoForNode.concatArray(this.createdNodes, source.createdNodes);
        MemoForNode.concatArray(this.createdTemplateNodes, source.createdTemplateNodes);
        MemoForNode.concatArray(this.destroyedNodes, source.destroyedNodes);
        MemoForNode.concatArray(this.selfDirtyNodes, source.selfDirtyNodes);
        MemoForNode.concatArray(this.updatedChangedNodes, source.updatedChangedNodes);
        MemoForNode.concatArray(this.updatedChangedTemplateNodes, source.updatedChangedTemplateNodes);
        MemoForNode.concatArray(this.updatedNodes, source.updatedNodes);
        MemoForNode.concatArray(this.updatedUnchangedNodes, source.updatedUnchangedNodes);
    }

    private static concatArray(target: any[], source?: any[]): void {
        if (!source) {
            return;
        }
        for (let i = 0; i < source.length; i++) {
            target.push(source[i]);
        }
    }
}

export interface IMemoNode {
    memo: MemoForNode
    value: IControlNode
}

const configName = 'cfg-';

/**
 * Для того чтобы всегда брать верхний компонент из конфига
 * @param configId
 * @returns {*}
 */
function findTopConfig(configId: string): string {
   return (configId + '').replace(configName, '').split(',')[0];
}

function fillCtx(control: any, vnode: any, resolvedCtx: any): void {
   control._saveContextObject(resolvedCtx);
   control.saveFullContext(ContextResolver.wrapContext(control, vnode.context || {}));
}

/**
 * Получаем state из сгенерированного script
 * @param controlNode TODO: Describe
 * @param vnodeP TODO: Describe
 * @param serializer TODO: Describe
 * @returns {*} TODO: Describe
 */
export function getReceivedState(controlNode: IControlNode, vnodeP: GeneratorNode, serializer: any): any {
   const control = controlNode.control;
   const stateVar = controlNode.key ? findTopConfig(controlNode.key) : '';
   if (!control.__beforeMount) {
      // TODO https://online.sbis.ru/opendoc.html?guid=4936d2f7-38c1-43c6-b64c-3ae650e0e612
      // There is a _beforeMount function call inside of getStateReadyOrCall
      // So we need to pass options processed by optionsResolver.
      // Options on vnode are not processed by optionsResolver(it isn't validated and initialized with default values)
      // That's why we should pass options from controlNode
      // Also getStateReadyOrCall has side-effect on vnode. It saves inherit options.
      // So we need to save inherit options outside of the getStateReadyOrCall.
      return;
   }

   OptionsResolver.resolveInheritOptions(vnodeP.controlClass, vnodeP, vnodeP.controlProperties);
   //@ts-ignore private
   control.saveInheritOptions(vnodeP.inheritOptions);

   let data;
   let srec;
   const vnode = {
      controlProperties: controlNode.options,
      context: controlNode.context
   };

   if (AppInit.isInit()) {
      srec = AppEnv.getStateReceiver();
   }

   if (srec && srec.register) {
      if (srec && srec.unregister) {
         srec.unregister(stateVar);
      }
      srec.register(stateVar, {
         setState: (rState: any): any => {
            data = rState;
         },
         getState: () => ({})
      });
      if (srec && srec.unregister) {
         srec.unregister(stateVar);
      }
   }

   /* Compat layer. For page without Controls.Application */
   if (!data && window['inline' + stateVar]) {
      data = JSON.parse(window['inline' + stateVar], serializer.deserialize);
      if (window['inline' + stateVar]) {
         window['inline' + stateVar] = undefined;
      }
   }

   const ctx = ContextResolver.resolveContext(control.constructor, vnode.context || {}, control);
   let res;

   // Freeze options if control doesn't have compatible layer
   //@ts-ignore hasCompatible добавляет Core/helpers/Hcontrol/makeInstanceCompatible
   if (Object.freeze && !(control.hasCompatible && control.hasCompatible())) {
      //@ts-ignore private
      Object.freeze(control._options);
   }

   try {
      res = data ? control.__beforeMount(
         vnode.controlProperties,
         //@ts-ignore TODO разобраться
         ctx,
         data
         ) :
         //@ts-ignore TODO разобраться
         control.__beforeMount(vnode.controlProperties, ctx);
   } catch (error) {
      Logger.lifeError('_beforeMount', control, error);
   }

   if (res && res.then) {
      res.then((resultDef: any): any => {
         fillCtx(control, vnode, ctx);
         return resultDef;
      });
   } else {
      fillCtx(control, vnode, ctx);
   }

   //@ts-ignore TODO разобраться
   if (!vnode.inheritOptions) {
      //@ts-ignore TODO разобраться
      vnode.inheritOptions = {};
   }
   return res;
}

function subscribeToEvent(node) {
   if (node.control && node.control._getInternalOption && node.control._getInternalOption('parent')) {
      var events = Subscriber.getEventsListFromOptions(node.options);
      Subscriber.applyEvents(node.control, node.control._getInternalOption('parent'), events);
   }
}

export const DirtyKind = {
   NONE: 0,
   DIRTY: 1,
   CHILD_DIRTY: 2
};

const ARR_EMPTY = [];

function shallowMerge(dest, src) {
   var i;
   for (i in src) {
      if (src.hasOwnProperty(i)) {
         dest[i] = src[i];
      }
   }
   return dest;
}

function getMarkupForTemplatedNode(vnode, controlNodes, environment) {
   var result = vnode.parentControl
      ? vnode.template.call(vnode.parentControl, vnode.controlProperties, vnode.attributes, vnode.context, true)
      : vnode.template(vnode.controlProperties, vnode.attributes, vnode.context, true);

   var
      resultsFromTemplate = [],
      k;
   if (!Array.isArray(result)) {
      result = [result];
   }

   for (k = 0; k < result.length; k++) {
      /*return controlNodes "as is" without inner full markup
        it must be controlNode for dirty cheking
        */
      var markup = getFullMarkup(controlNodes, result[k], true);
      resultsFromTemplate = resultsFromTemplate.concat(Array.isArray(markup) ? markup : [markup]);
   }
   for (k = 0; k < resultsFromTemplate.length; k++) {
      resultsFromTemplate[k] = mapVNode(
         environment.getMarkupNodeDecorator(),
         controlNodes,
         resultsFromTemplate[k]
      );
   }
   result = resultsFromTemplate;

   return result;
}

// Собирает контрол-ноды, являющиеся детьми темплейт-нод
function getTemplateChildControls(templateNodes, result?) {
   result = result || [];
   for (let i = 0; i < templateNodes.length; i++) {
      const node = templateNodes[i];
      if (typeof node.controlNodeIdx !== 'undefined') {
         // controlNodeIdx есть только у контрол-нод
         result.push(node);
      } else if (Array.isArray(node.children)) {
         getTemplateChildControls(node.children, result);
      }
   }
   return result;
}

function collectChildrenKeys(next: { key }[], prev: { key }[]): { prev, next }[] {
   let keysMap = {};
   const max = next.length > prev.length ? next.length : prev.length;
   for (let idx = 0; idx < max; idx++) {
      if (next[idx]) {
         const nextNode = next[idx];
         if (!keysMap[nextNode.key]) {
            keysMap[nextNode.key] = { };
         }
         keysMap[nextNode.key].next = idx;
      }
      if (prev[idx]) {
         const prevNode = prev[idx];
         if (!keysMap[prevNode.key]) {
            keysMap[prevNode.key] = { };
         }
         keysMap[prevNode.key].prev = idx;
      }
   }
   return Object.values(keysMap);
}

function rebuildNodeWriter(environment, node, force, isRoot?) {
   if (node.receivedState && node.receivedState.then) {
      return node.receivedState.then(
         function rebuildNodeWriterCbk(state) {
            node.receivedState = state;
            return rebuildNode(environment, node, force, isRoot);
         },
         function (err) {
            const error = new Error(`Promise со состоянием rejected был возвращен из _beforeMount.
            Перед возвратом promise из _beforeMount всегда добавлять catch обработчик. \n Ошибка: ${err}`);
            Logger.asyncRenderErrorLog(error, node);
            /*_beforeMount can return errback
             * send error and create control
             */
            node.receivedState = null;
            return rebuildNode(environment, node, force, isRoot);
         }
      );
   } else {
      return rebuildNode(environment, node, force, isRoot);
   }
}

export function destroyReqursive(childControlNode, environment) {
   try {
      environment.setRebuildIgnoreId(childControlNode.id);
      if (childControlNode.compound) {
         if(!childControlNode.parent || childControlNode.parent.control._moduleName !== 'Core/CompoundContainer') {
            Logger.error(`В wasaby-окружении неправильно создается ws3-контрол. Необходимо использовать Core/CompoundContainer, а не вставлять ws3-контрол в шаблон wasaby-контрола напрямую.
               Подробнее тут https://wi.sbis.ru/doc/platform/developmentapl/ws3/compound-wasaby/`,
               childControlNode);
         } else {
            var
               oldOptions = childControlNode.options,
               instanceCtr = oldOptions.__vdomOptions && oldOptions.__vdomOptions.controlNode.instance;

            /**
             * CompoundControl может быть разрушен в любой момент времени
             * при этом он удалится из списка детей
             * Просто не разрушаем если его уже нет
             */
            if (instanceCtr) {
               delay(function () {
                  if (!instanceCtr._destroyed) {
                     instanceCtr.destroy();
                  }
               });
            }
         }
      } else {
         for (var i = 0; i < childControlNode.childrenNodes.length; i++) {
            const child = childControlNode.childrenNodes[i];
            if (child) {
               destroyReqursive(child, environment);
            }
         }

         const vnode = childControlNode.vnode || childControlNode;
         onStartCommit(OperationType.DESTROY, getNodeName(childControlNode), vnode);
         let logicParent;
         let controlName: string;
         // Пометим контрол, как разрушаемый из DirtyChecking
         // слой совместимости попытается удалить контрол из дома,
         // этого не должно произойти, иначе синхронизатор упадет
         if (!childControlNode.control._destroyed) {
            logicParent = childControlNode.control._logicParent;
            controlName = childControlNode.control._options.name;
            childControlNode.control.__$destroyFromDirtyChecking = true;
            childControlNode.control.destroy();
         }

         delete childControlNode.controlProperties;
         delete childControlNode.oldOptions;
         delete childControlNode.markup;
         if (
            logicParent &&
            !logicParent._destroyed &&
            logicParent._template &&
            controlName
         ) {
            delete logicParent._children[controlName];
         }
         logicParent = undefined;
         onEndCommit(vnode);
         if (vnode.controlEvents) {
             vnode.controlEvents = undefined;
         }
      }
   } finally {
      environment.setRebuildIgnoreId(childControlNode.id);
   }
}

function setChangedForNode(node) {
   if (node.fullMarkup) {
      node.fullMarkup.changed = true;
   }
   if (node.parent && node.parent.fullMarkup && !node.parent.fullMarkup.changed) {
      setChangedForNode(node.parent);
   }
}

function addTemplateChildrenRecursive(node, result) {
   if (node.children) {
      for (var i = 0; i < node.children.length; i++) {
         if (isControlVNodeType(node.children[i])) {
            result.push(node.children[i]);
         } else if (isTemplateVNodeType(node.children[i]) || isVNodeType(node.children[i])) {
            addTemplateChildrenRecursive(node.children[i], result);
         }
      }
   }
}

export function rebuildNode(environment: IDOMEnvironment, node: IControlNode, force: boolean, isRoot): IMemoNode | Promise<IMemoNode> {
    let id = node.id;
    let dirty = environment._currentDirties[id] || DirtyKind.NONE;
    let isDirty = dirty !== DirtyKind.NONE || force;
    let isSelfDirty = !!(dirty & DirtyKind.DIRTY) || force;

    if (!isDirty) {
        return {
            value: node,
            memo: new MemoForNode()
        };
    }

    let newNode = node;
    let parentNodeContext = node.context;

    if (isSelfDirty) {
        // Корни не маунтятся сразу после создания, так что чтобы избежать двух Create подряд делаем так:
        if (isRoot) {
            onStartCommit(
                OperationType.UPDATE,
                getNodeName(newNode),
                newNode
            );
        } else {
            onStartCommit(
                // @ts-ignore
                !newNode.control._mounted ? OperationType.CREATE : OperationType.UPDATE,
                getNodeName(newNode),
                newNode
            );
        }
    }

    let createdNodes;
    let createdTemplateNodes;
    let updatedUnchangedNodes;
    let updatedChangedNodes;
    let updatedChangedTemplateNodes = [];
    let selfDirtyNodes;
    let destroyedNodes;
    let childrenNodes;
    let createdStartIdx;

    if (!isSelfDirty) {
        return __afterRebuildNode(environment, node, false, undefined, node.childrenNodes, new MemoForNode(), false);
    }

    /**
     * Вызываем _beforeUpdate и _shouldUpdate для корневой контрол ноды.
     */
    // @ts-ignore
    if (newNode.control._mounted && !force) {
        let resolvedContext = ContextResolver.resolveContext(newNode.controlClass, parentNodeContext, newNode.control);
        try {
            // Freeze options if control doesn't have compatible layer
            // @ts-ignore
            if (Object.freeze && !(newNode.control.hasCompatible && newNode.control.hasCompatible())) {
                Object.freeze(newNode.options);
            }

            // pause reactive behaviour of properties while _beforeUpdate executes
            ReactiveObserver.pauseReactive(newNode.control, () => {
                // Forbid force update in the time between _beforeUpdate and _afterUpdate
                //newNode.control._canForceUpdate = false;
                newNode.control.__beforeUpdate(newNode.options, resolvedContext);
            });
        } catch (error) {
            Logger.lifeError('_beforeUpdate', newNode.control, error);
        }

        let shouldUpdate;
        try {
            // @ts-ignore
            shouldUpdate = newNode.control._shouldUpdate(newNode.options, resolvedContext);
        } catch (error) {
            Logger.lifeError('_shouldUpdate', newNode.control, error);
        }
        isSelfDirty = isSelfDirty && shouldUpdate;
        if (!isSelfDirty) {
            // если нода содержит RawMarkupNode - internalOptions не существует
            const logicParent = newNode.internalOptions?.logicParent || newNode.options?.logicParent;
            onEndCommit(newNode, {
                // @ts-ignore
                template: newNode.control._template,
                // @ts-ignore
                state: newNode.control.reactiveValues,
                options: newNode.options,
                attributes: newNode.attributes,
                instance: newNode.control,
                logicParent: logicParent
            });
        }
    }

    // @ts-ignore
    Logger.debug(`[DirtyChecking:rebuildNode()] - requestRebuild "${id}" for "${newNode.control._moduleName}"`);
    let parentNode = newNode;

    // @ts-ignore
    newNode.control.saveFullContext(ContextResolver.wrapContext(newNode.control, newNode.context || {}));
    if (!newNode.inheritOptions) {
        newNode.inheritOptions = {};
    }
    OptionsResolver.resolveInheritOptions(newNode.controlClass, newNode, newNode.options);
    // @ts-ignore
    newNode.control.saveInheritOptions(newNode.inheritOptions);

    let oldMarkup = node.markup;
    newNode.markup = getDecoratedMarkup(newNode);
    if (isSelfDirty) {
       /*
       TODO: Раньше эта функция была вместе со всем остальным кодом под условием isSelfDirty,
       большая часть кода из этой функции не выполнялась. После рефакторинга код
       начал выполняться для всех нод, и по сути разбираться нужно с этим
       */
       saveChildren(newNode.markup);
    }

    let diff = getMarkupDiff(oldMarkup, newNode.markup, false, false);
    Logger.debug('DirtyChecking (diff)', diff);

    let needRenderMarkup = false;
    if (diff.destroy.length || diff.vnodeChanged) {
        setChangedForNode(newNode);
        needRenderMarkup = true;
    }

    while (diff.createTemplates.length > 0 || diff.updateTemplates.length > 0) {
        var diffTmpl = {
            create: [],
            createTemplates: [],
            destroy: [],
            destroyTemplates: [],
            update: [],
            updateTemplates: []
        };

        createdTemplateNodes = diff.createTemplates.map(function rebuildCreateTemplateNodes(vnode: TDirtyCheckingTemplate) {
            Logger.debug('DirtyChecking (create template)', vnode);
            onStartCommit(OperationType.CREATE, getNodeName(vnode));
            vnode.optionsVersions = collectObjectVersions(vnode.controlProperties);
            // check current context field versions
            vnode.contextVersions = collectObjectVersions(vnode.context);

            vnode.children = getMarkupForTemplatedNode(vnode, newNode, environment);
            saveChildren(vnode.children);
            for (var i = 0; i < vnode.children.length; i++) {
                var diffTmplOneNode = getMarkupDiff(null, vnode.children[i]);
                diffTmpl.create = diffTmpl.create.concat(diffTmplOneNode.create);
                diffTmpl.createTemplates = diffTmpl.createTemplates.concat(diffTmplOneNode.createTemplates);
                diffTmpl.update = diffTmpl.update.concat(diffTmplOneNode.update);
                diffTmpl.updateTemplates = diffTmpl.updateTemplates.concat(diffTmplOneNode.updateTemplates);
            }
            onEndCommit(vnode, {
                template: vnode.template,
                state: vnode.template.reactiveProps,
                options: vnode.controlProperties,
                attributes: vnode.attributes.attributes,
                logicParent: vnode.attributes.internal.logicParent
            });
            return vnode;
        });

        diff.createTemplates = diffTmpl.createTemplates;
        diff.updateTemplates = diff.updateTemplates.concat(diffTmpl.updateTemplates);

        diffTmpl.createTemplates = [];
        diffTmpl.updateTemplates = [];

        diff.updateTemplates.map(function rebuildUpdateTemplateNodes(diffPair) {
            Logger.debug('DirtyChecking (update template)', diffPair);

            let newTemplateNode = diffPair.newNode;
            let oldTemplateNode = diffPair.oldNode;
            let oldOptions = oldTemplateNode.controlProperties;
            let newOptions = newTemplateNode.controlProperties;
            let changedOptions = getChangedOptions(newOptions, oldOptions, false, oldTemplateNode.optionsVersions);
            let oldAttrs = oldTemplateNode.attributes.attributes;
            let newAttrs = newTemplateNode.attributes.attributes || {};
            let changedAttrs = getChangedOptions(newAttrs, oldAttrs, newTemplateNode.compound, {}, true, '', newTemplateNode.compound);
            let changedTemplate = oldTemplateNode.template !== newTemplateNode.template;
            let diffTmplOneNode;
            let i;

            // Собрать версии новых опций необходимо до вызова функции шаблона
            newTemplateNode.optionsVersions = collectObjectVersions(newOptions);

            onStartCommit(OperationType.UPDATE, getNodeName(newTemplateNode), oldTemplateNode);
            if (changedOptions || changedAttrs || changedTemplate) {
                Logger.debug('DirtyChecking (update template with changed options)', changedOptions);

                /* newTemplateNode === oldTemplateNode but they children have changed */
                let oldChildren = oldTemplateNode.children || [];
                newTemplateNode.children = getMarkupForTemplatedNode(newTemplateNode, newNode, environment);
                saveChildren(newTemplateNode.children);
                // We have to find diff between template nodes children to improve perfomance of rendering updated markup
                let templateNodeDiff = getMarkupDiff(oldTemplateNode, newTemplateNode, true, true);
                let updatedTemplateNodesSimple = [];
                let createdTemplateNodesSimple = [];
                let destroyedTemplateNodesSimple = [];
                let createdNodesSimple = [];
                let updatedNodesSimple = [];
                let destroyedNodesSimple = [];
                const childrenMap = collectChildrenKeys(newTemplateNode.children, oldChildren);
                for (i = 0; i < childrenMap.length; i++) {
                    let oldChild = oldChildren[childrenMap[i].prev];
                    let newChild = newTemplateNode.children[childrenMap[i].next];
                    if (newChild) {
                        diffTmplOneNode = getMarkupDiff(oldChild, newChild, true, false);
                        createdNodesSimple = createdNodesSimple.concat(diffTmplOneNode.create);
                        createdTemplateNodesSimple = createdTemplateNodesSimple.concat(diffTmplOneNode.createTemplates);
                        updatedNodesSimple = updatedNodesSimple.concat(diffTmplOneNode.update);
                        updatedTemplateNodesSimple = updatedTemplateNodesSimple.concat(diffTmplOneNode.updateTemplates);
                        destroyedNodesSimple = destroyedNodesSimple.concat(diffTmplOneNode.destroy);
                        destroyedTemplateNodesSimple = destroyedTemplateNodesSimple.concat(diffTmplOneNode.destroyTemplates)
                    } else if (oldChild) {
                        // В этой ветке находим ноды, которые были задестроены, чтобы вызвать _beforeUnmount у контролов
                        if (isControlVNodeType(oldChild)) {
                            diffTmpl.destroy.push(oldChild);
                        } else if (isTemplateVNodeType(oldChild) || isVNodeType(oldChild)) {
                            addTemplateChildrenRecursive(oldChild, diffTmpl.destroy);
                        }
                    }
                }
                // from the two sets of supposed updated template nodes we have to choose
                // one, which will satisfy our need of minimum operations in one cycle
                if (updatedTemplateNodesSimple.length > templateNodeDiff.updateTemplates.length) {
                    diffTmpl.updateTemplates = diffTmpl.updateTemplates.concat(templateNodeDiff.updateTemplates);
                    diffTmpl.createTemplates = diffTmpl.createTemplates.concat(templateNodeDiff.createTemplates);
                    diffTmpl.destroyTemplates = diffTmpl.destroyTemplates.concat(templateNodeDiff.destroyTemplates);
                    diffTmpl.create = diffTmpl.create.concat(templateNodeDiff.create);
                    diffTmpl.update = diffTmpl.update.concat(templateNodeDiff.update);
                    diffTmpl.destroy = diffTmpl.destroy.concat(templateNodeDiff.destroy);
                } else {
                    diffTmpl.updateTemplates = diffTmpl.updateTemplates.concat(updatedTemplateNodesSimple);
                    diffTmpl.createTemplates = diffTmpl.createTemplates.concat(createdTemplateNodesSimple);
                    diffTmpl.destroyTemplates = diffTmpl.destroyTemplates.concat(destroyedTemplateNodesSimple);
                    diffTmpl.update = diffTmpl.update.concat(updatedNodesSimple);
                    diffTmpl.create = diffTmpl.create.concat(createdNodesSimple);
                    diffTmpl.destroy = diffTmpl.destroy.concat(destroyedNodesSimple);
                }
            } else {
                newTemplateNode.children = oldTemplateNode.children;
                for (i = 0; i < newTemplateNode.children.length; i++) {
                    /*template can contains controlNodes and we try find all of them
                        * all controlNodes must be in array "childrenNodes"
                        */
                    diffTmplOneNode = getMarkupDiff(
                        oldTemplateNode.children[i],
                        newTemplateNode.children[i],
                        true
                    );
                    diffTmpl.create = diffTmpl.create.concat(diffTmplOneNode.create);
                    diffTmpl.createTemplates = diffTmpl.createTemplates.concat(diffTmplOneNode.createTemplates);
                    diffTmpl.update = diffTmpl.update.concat(diffTmplOneNode.update);
                    diffTmpl.updateTemplates = diffTmpl.updateTemplates.concat(diffTmplOneNode.updateTemplates);
                    diffTmpl.destroy = diffTmpl.destroy.concat(diffTmplOneNode.destroy);
                }
            }
            onEndCommit(newTemplateNode, {
                template: newTemplateNode.template,
                state: newTemplateNode.template.reactiveProps,
                options: newTemplateNode.controlProperties,
                changedOptions: changedOptions,
                attributes: newTemplateNode.attributes.attributes,
                changedAttributes: changedAttrs,
                logicParent: newTemplateNode.attributes.internal.logicParent
            });
            return newTemplateNode;
        });

        diff.updateTemplates = diffTmpl.updateTemplates;
        diff.destroyTemplates = diff.destroyTemplates.concat(diffTmpl.destroyTemplates);
        diff.create = diff.create.concat(diffTmpl.create);
        diff.destroy = diff.destroy.concat(diffTmpl.destroy);
        diff.update = diff.update.concat(diffTmpl.update);
        diff.createTemplates = diff.createTemplates.concat(diffTmpl.createTemplates);
    }

    if (diff.destroyTemplates.length > 0) {
        // Если есть уничтоженные шаблоны, нужно проверить, есть ли внутри них
        // контрол-ноды
        var templateControlsToDestroy = getTemplateChildControls(diff.destroyTemplates);

        // Все контрол-ноды внутри уничтожаемых шаблонов добавляем в список на удаление,
        // иначе они зависнут в памяти
        diff.destroy = diff.destroy.concat(templateControlsToDestroy);

        // не знаю что именно исправлял Никита, но я столкнулся с кейсом, что в destroy дублируются значения,
        // а значит будет зваться _beforeUnmount более одного раза на удаляемом контроле
        // удалю дубли через filter
        diff.destroy = diff.destroy.filter((v, i, a) => a.indexOf(v) === i);
    }

    destroyedNodes = diff.destroy.map(function rebuildDestroyNodes(vnode) {
        let controlNodeIdx = vnode.controlNodeIdx;
        let childControlNode = parentNode.childrenNodes[controlNodeIdx];
        destroyReqursive(childControlNode, environment);
        return childControlNode;
    });

    let changedNodes = new Array(diff.create.length + diff.update.length);

    createdStartIdx = diff.update.length;

    createdTemplateNodes = [];

    createdNodes = diff.create.map(function rebuildCreateNodes(vnode: GeneratorNode, idx) {
        let nodeIdx = createdStartIdx + idx;
        let serializedChildren = parentNode.serializedChildren;
        let serialized = serializedChildren && serializedChildren[nodeIdx];
        let options;
        let carrier;
        let controlNode;
        Logger.debug('DirtyChecking (create node)' + idx, vnode);
        onStartCommit(OperationType.CREATE, getNodeName(vnode));

        needRenderMarkup = true;
        if (!vnode.compound) {
            options = vnode.controlProperties;
            controlNode = createNode(
                vnode.controlClass,
                {
                    user: options,
                    internal: vnode.controlInternalProperties,
                    attributes: vnode.controlAttributes,
                    events: vnode.controlEvents
                },
                vnode.key,
                environment,
                parentNode,
                serialized,
                vnode
            );
            if (!controlNode.control._mounted && !controlNode.control._unmounted) {
                carrier = getReceivedState(controlNode, vnode, Slr);
                if (carrier) {
                    controlNode.receivedState = carrier;
                }
                if (controlNode.control.saveOptions) {
                    controlNode.control.saveOptions(controlNode.options, controlNode);
                } else {
                    /**
                     * Поддержка для совместимости версий контролов
                     */
                    controlNode.control._options = controlNode.options;
                    controlNode.control._container = controlNode.element;
                    controlNode.control._setInternalOptions(vnode.controlInternalProperties || {});

                    if (constants.compat) {
                        // @ts-ignore
                        controlNode.control._container = $(controlNode.element);
                    }
                }
            }

            // Only subscribe to event: from options if the environment is compatible AND control
            // has compatible behavior mixed into it
            if (constants.compat && (!controlNode.control.hasCompatible || controlNode.control.hasCompatible())) {
                subscribeToEvent(controlNode); //TODO Кусок слоя совместимости https://online.sbis.ru/opendoc.html?guid=95e5b595-f9ea-45a2-9a4d-97a714d384af
            }
        } else {
            controlNode = createNode(
                vnode.controlClass,
                {
                    user: shallowMerge(vnode.controlProperties, vnode.controlInternalProperties),
                    internal: {},
                    attributes: vnode.controlAttributes,
                    events: vnode.controlEvents
                },
                vnode.key,
                environment,
                parentNode,
                serialized,
                vnode
            );
        }
        vnode.controlNodeIdx = nodeIdx;
        changedNodes[vnode.controlNodeIdx] = true;
        onEndCommit(vnode, {
            template: controlNode.control._template,
            state: controlNode.control.reactiveValues,
            options: controlNode.options,
            attributes: controlNode.attributes,
            instance: controlNode.control,
            logicParent: vnode.controlInternalProperties.logicParent
        });
        return controlNode;
    });

    let updatedNodes = diff.update.map(function rebuildUpdateNodes(diffPair, idx) {
        Logger.debug('DirtyChecking (update node)', diffPair);
        onStartCommit(
            OperationType.UPDATE,
            getNodeName(diffPair.newNode),
            diffPair.oldNode
        );


        let newVNode = diffPair.newNode;
        let controlNodeIdx = diffPair.oldNode.controlNodeIdx;
        let childControlNode = parentNode.childrenNodes[controlNodeIdx];
        let childControl = childControlNode.control;
        let shouldUpdate = true;
        let newOptions = OptionsResolver.resolveDefaultOptions(newVNode.compound
            ? getCompatibleUtils().createCombinedOptions(
                newVNode.controlProperties,
                newVNode.controlInternalProperties
            )
            : newVNode.controlProperties, childControlNode.defaultOptions);
        let oldOptionsVersions = childControlNode.optionsVersions;
        let oldOptions = childControlNode.options;
        let oldInternalVersions = childControlNode.internalVersions;
        let newChildNodeContext = newVNode.context || {};
        let oldChildNodeContext = childControlNode.context;
        let oldContextVersions = childControlNode.contextVersions;
        let changedOptions = getChangedOptions(newOptions, oldOptions, newVNode.compound, oldOptionsVersions, false, '', newVNode.compound);
        let changedContext = getChangedOptions(
                newChildNodeContext,
                oldChildNodeContext,
                false,
                oldContextVersions
            ),
            changedContextProto = changedContext
                ? changedContext
                : getChangedOptions(newChildNodeContext, oldChildNodeContext, false, oldContextVersions, true),
            oldAttrs = childControlNode.controlAttributes || childControlNode.attributes,
            newAttrs = newVNode.controlAttributes || {},
            changedAttrs = getChangedOptions(newAttrs, oldAttrs, newVNode.compound, {}, true, '', newVNode.compound),
            changedInternalOptions;

        childControlNode.optionsVersions = collectObjectVersions(newVNode.controlProperties);
        childControlNode.contextVersions = collectObjectVersions(newChildNodeContext);

        if (newVNode.compound) {
            newOptions.__vdomOptions = oldOptions.__vdomOptions;
            if (changedOptions) {
                /**
                 * Сложнейшая логика синхронизации CompoundControls
                 * Суть в том, что разные контролы при получении нового значения опции
                 * реагируют по разному.
                 * Отсюда получается, что мы устанавливаем в контрол одни данные, а по факту
                 * устанавливаются другие и в том месте, куда мы что-то присвоили уже лежит не то, что мы туда присваивали
                 * Поэтому здесь двойная проверка, которая не позволяет синхронно установить
                 * какие-либо данные в контрол дважды.
                 */
                var instanceCtr = oldOptions.__vdomOptions && oldOptions.__vdomOptions.controlNode.instance;
                if (instanceCtr && !instanceCtr.__$$blockSetProperties) {
                    // CompoundControld could have changed its options by itself, so we have to check which options
                    // really have to be updated
                    var realCh = getChangedOptions(newOptions, instanceCtr._options || {}, newVNode.compound, {}, false, '', newVNode.compound);
                    if (realCh) {
                        instanceCtr.__$$blockSetProperties = true;

                        // Remove all options that were updated by CompoundControl already from changedOptions
                        changedOptions = clearNotChangedOptions(changedOptions, realCh);
                        instanceCtr.setProperties(changedOptions);

                        delay(function () {
                            instanceCtr.__$$blockSetProperties = false;
                        });
                    }
                }
            }
            childControlNode.options = newOptions;
        } else {
            // для не-compound контролов делаем проверку изменения служебных опций
            changedInternalOptions = getChangedOptions(
                newVNode.controlInternalProperties,
                childControlNode.internalOptions,
                false,
                oldInternalVersions
            );
            childControlNode.internalVersions = collectObjectVersions(newVNode.controlInternalProperties);

            // @ts-ignore Атрибуты тоже учавствуют в DirtyChecking
            if ((changedOptions || changedInternalOptions || changedAttrs || changedContext) && !childControl._destroyed) {
                try {
                    var resolvedContext;
                    var data = changedOptions || changedInternalOptions || changedAttrs || changedContext;
                    Logger.debug('DirtyChecking (update node with changed)', data);

                    environment.setRebuildIgnoreId(childControlNode.id);

                    OptionsResolver.resolveInheritOptions(
                        childControlNode.controlClass,
                        childControlNode,
                        newOptions
                    );
                    // @ts-ignore
                    childControl.saveInheritOptions(childControlNode.inheritOptions);

                    resolvedContext = ContextResolver.resolveContext(
                        childControlNode.controlClass,
                        newChildNodeContext,
                        childControlNode.control
                    );

                    OptionsResolver.validateOptions(childControlNode.controlClass,
                        newOptions,
                        childControlNode.parent.control._moduleName);

                    // Freeze options if control doesn't have compatible layer
                    if (Object.freeze && !(childControl.hasCompatible && childControl.hasCompatible())) {
                        Object.freeze(newOptions);
                    }

                    // pause reactive behaviour of properties while _beforeUpdate executes
                    ReactiveObserver.pauseReactive(childControl, () => {
                        // Forbid force update in the time between _beforeUpdate and _afterUpdate
                        childControl._beforeUpdate && childControl.__beforeUpdate(newOptions, resolvedContext);
                    });

                    childControl._options = newOptions;
                    shouldUpdate = (childControl._shouldUpdate ? childControl._shouldUpdate(newOptions, resolvedContext) : true) ||
                        changedInternalOptions ||
                        changedAttrs ||
                        changedContext;

                    childControl._setInternalOptions(changedInternalOptions || {});

                    childControlNode.oldOptions = oldOptions; //TODO Для afterUpdate подумать, как еще можно передать
                    childControlNode.oldContext = oldChildNodeContext; //TODO Для afterUpdate подумать, как еще можно передать
                    childControlNode.attributes = newVNode.controlAttributes;
                    childControlNode.events = newVNode.controlEvents;

                    childControl._saveContextObject(resolvedContext);
                    childControl.saveFullContext(ContextResolver.wrapContext(childControl, childControl._context));
                } finally {
                    if (shouldUpdate) {
                        environment.setRebuildIgnoreId(null);
                    }

                    childControlNode.options = newOptions;
                    childControlNode.context = newChildNodeContext;
                    childControlNode.internalOptions = newVNode.controlInternalProperties;
                }
            } else if (changedContextProto) {
                var childCN = childControlNode.childrenNodes;
                for (var i = 0; i < childCN.length; i++) {
                    environment._currentDirties[childCN[i].id] |= DirtyKind.CHILD_DIRTY;
                }
            }
        }
        changedNodes[idx] =
            (!!changedOptions || !!changedInternalOptions || !!changedContext || !!changedAttrs) && shouldUpdate;
        newVNode.controlNodeIdx = idx;
        // In case of empty diff, events property has to be updated, because of the closure
        childControlNode.events = newVNode.controlEvents;

        // если нода содержит RawMarkupNode - internalOptions не существует
        const logicParent = childControlNode.internalOptions?.logicParent || childControlNode.options?.logicParent;
        onEndCommit(newVNode, {
            template: childControlNode.control._template,
            state: childControlNode.control.reactiveValues,
            options: childControlNode.options,
            changedOptions: changedOptions,
            attributes: childControlNode.attributes,
            changedAttributes: changedAttrs,
            context: childControlNode.context,
            changedContext: changedContext,
            instance: childControlNode.control,
            logicParent: logicParent
        });
        return childControlNode;
    });

    childrenNodes = updatedNodes.concat(createdNodes);

    updatedUnchangedNodes = ARR_EMPTY;
    updatedChangedNodes = ARR_EMPTY;
    selfDirtyNodes = ARR_EMPTY;

    for (let idx = 0; idx < updatedNodes.length; idx++) {
        const node = updatedNodes[idx];
        if (changedNodes[idx]) {
            if (updatedChangedNodes === ARR_EMPTY) {
                updatedChangedNodes = [];
            }
            updatedChangedNodes.push(node);
        } else {
            if (updatedUnchangedNodes === ARR_EMPTY) {
                updatedUnchangedNodes = [];
            }
            updatedUnchangedNodes.push(node);
        }
    }

    if (updatedChangedNodes.length || createdNodes.length) {
        setChangedForNode(newNode);
        needRenderMarkup = true;
    }

    // храним еще незаапдейченные ноды, которые сами были грязными
    if (childrenNodes.indexOf(newNode) === -1) {
        if (selfDirtyNodes === ARR_EMPTY) {
            selfDirtyNodes = [];
        }
        selfDirtyNodes.push(newNode);
    }

   if (isSelfDirty) {
      /*
       TODO: Раньше эта функция была вместе со всем остальным кодом под условием isSelfDirty,
       большая часть кода из этой функции не выполнялась. После рефакторинга код
       начал выполняться для всех нод, и по сути разбираться нужно с этим
       */
      // если нода содержит RawMarkupNode - internalOptions не существует
      const logicParent = newNode.internalOptions?.logicParent || newNode.options?.logicParent;
      onEndCommit(newNode, {
         template: newNode.control._template,
         state: newNode.control.reactiveValues,
         options: newNode.options,
         attributes: newNode.attributes,
         instance: newNode.control,
         logicParent: logicParent
      });
   }

    const currentMemo: MemoForNode = new MemoForNode({
        createdNodes,
        updatedNodes,
        destroyedNodes,
        updatedChangedNodes,
        updatedChangedTemplateNodes,
        updatedUnchangedNodes,
        selfDirtyNodes,
        createdTemplateNodes
    });

    return __afterRebuildNode(environment, newNode, needRenderMarkup,
        changedNodes, childrenNodes, currentMemo, isSelfDirty);
}

function createChildrenResult(childrenRebuildResults: IMemoNode[]): { value: IControlNode[], memo: MemoForNode } {
    const value = [];
    const memo = new MemoForNode();
    for (let i = 0; i < childrenRebuildResults.length; i++) {
        const childrenRebuildResult = childrenRebuildResults[i];
        value.push(childrenRebuildResult.value);
        memo.concat(childrenRebuildResults[i].memo);
    }
    return { value, memo };
}

function mapChildren(currentMemo: MemoForNode, newNode, childrenRebuildFinalResults, environment, needRenderMarkup, isSelfDirty) {
    const childrenRebuild = createChildrenResult(childrenRebuildFinalResults);
    if (!newNode.markup) {
        // Во время ожидания асинхронного ребилда контрол уничтожился, обновлять его уже не нужно.
        return {
            value: newNode,
            memo: childrenRebuild.memo
        };
    }

    newNode.childrenNodes = childrenRebuild.value;
    if (needRenderMarkup || !newNode.fullMarkup || newNode.fullMarkup.changed || isSelfDirty) {
        var wasChanged = newNode.fullMarkup && newNode.fullMarkup.changed;
        newNode.fullMarkup = environment.decorateFullMarkup(
            getFullMarkup(
                newNode.childrenNodes,
                newNode.markup,
                undefined,
                needRenderMarkup || isSelfDirty ? undefined : newNode.fullMarkup,
                newNode.parent
            ),
            newNode
        );
        newNode.fullMarkup.changed =
            wasChanged || newNode.fullMarkup.changed || (needRenderMarkup || isSelfDirty);
        if (newNode.fullMarkup.changed) {
            setChangedForNode(newNode);
        }
    }

    currentMemo.concat(childrenRebuild.memo);
    return {
        value: newNode,
        memo: currentMemo
    };
}

function __afterRebuildNode(environment: IDOMEnvironment, newNode: IControlNode, needRenderMarkup: boolean,
    changedNodes, childrenNodes, currentMemo: MemoForNode, isSelfDirty): IMemoNode | Promise<IMemoNode> {

    const childrenRebuildResults: IMemoNode[] = [];

    let haveAsync: boolean = false;
    for (let i = 0; i < childrenNodes.length; i++) {
        const childrenNode = childrenNodes[i];
        const isChildChanged = changedNodes && changedNodes[i];
        if (isChildChanged) {
            setChangedForNode(childrenNode);
        }
        const childRebuildResult = rebuildNodeWriter(environment, childrenNode, isChildChanged, false);
        haveAsync = haveAsync || !!childRebuildResult.then;
        childrenRebuildResults.push(childRebuildResult);
    }

    if (!haveAsync) {
        return mapChildren(currentMemo, newNode, childrenRebuildResults, environment, needRenderMarkup, isSelfDirty);
    }

    return Promise.all(childrenRebuildResults).then(
        (res) => mapChildren(currentMemo, newNode, res, environment, needRenderMarkup, isSelfDirty),
        (err) => {
            Logger.asyncRenderErrorLog(err);
            return err;
        }
    );
}
