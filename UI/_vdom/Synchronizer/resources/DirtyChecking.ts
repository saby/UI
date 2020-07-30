/// <amd-module name="UI/_vdom/Synchronizer/resources/DirtyChecking" />
/* tslint:disable */

// @ts-ignore
import { constants as isJs } from 'Env/Env';
import { composeWithResultApply } from '../../Utils/Functional';
import { Subscriber } from 'View/Executor/Expressions';
import * as VdomMarkup from './VdomMarkup';
import { Compatible, Vdom, Common, OptionsResolver } from 'View/Executor/Utils';
import { ContextResolver } from 'View/Executor/Expressions';
import { delay } from 'Types/function';
// @ts-ignore
import * as Serializer from 'Core/Serializer';
// @ts-ignore
import { Logger } from 'UI/Utils';
import * as _dcc from './DirtyCheckingCompatible';
// @ts-ignore
import * as ReactiveObserver from 'Core/ReactiveObserver';
import {
   onEndCommit,
   onStartCommit,
   saveChildren,
   OperationType,
   getNodeName
} from 'UI/DevtoolsHook';
import { IControlNode } from '../interfaces';
import { collectObjectVersions, getChangedOptions } from "./Options";

/**
 * @author Кондаков Р.Н.
 */

export { getChangedOptions } from "./Options";

var Slr = new Serializer();

var DirtyCheckingCompatible;
if (isJs.compat) {
   DirtyCheckingCompatible = _dcc;
}

export class MemoForNode {
    createdNodes: Array<any> = [];
    createdTemplateNodes: Array<any> = [];
    destroyedNodes: Array<any> = [];
    selfDirtyNodes: Array<any> = [];
    updatedChangedNodes: Array<any> = [];
    updatedChangedTemplateNodes: Array<any> = [];
    updatedNodes: Array<any> = [];
    updatedTemplateNodes: Array<any> = [];
    updatedUnchangedNodes: Array<any> = [];
}

export interface IMemoNode {
    memo: MemoForNode
    value: IControlNode
}

function subscribeToEvent(node) {
   if (node.control && node.control._getInternalOption && node.control._getInternalOption('parent')) {
      var events = Subscriber.getEventsListFromOptions(node.options);
      Subscriber.applyEvents(node.control, node.control._getInternalOption('parent'), events);
   }
}

const memoNames = [
    'createdNodes',
    'destroyedNodes',
    'updatedNodes',
    'createdTemplateNodes',
    'updatedTemplateNodes',
    'updatedUnchangedNodes',
    'updatedChangedNodes',
    'updatedChangedTemplateNodes',
    'selfDirtyNodes'
];

function concatArray(target: any[], source?: any[]): any[] {
    if (!source) {
        return;
    }
    for (let i = 0; i < source.length; i++) {
        target.push(source[i]);
    }
    return target;
}

function concatMemo(target: MemoForNode, source: MemoForNode): MemoForNode {
    for (let i = 0; i < memoNames.length; ++i) {
        concatArray(target[memoNames[i]], source[memoNames[i]]);
    }
    return target;
}

function createChildrenResult(childrenRebuildResults: IMemoNode[]): {value: IControlNode[], memo: MemoForNode} {
    const value = [];
    const memo = new MemoForNode();
    for (let i = 0; i < childrenRebuildResults.length; i++) {
        const childrenRebuildResult = childrenRebuildResults[i];
        value.push(childrenRebuildResult.value);
        concatMemo(memo, childrenRebuildResults[i].memo);
    }
    return {value, memo};
}

/**
 * Добавляет родителя во внутренние опции компонента, если он отсутствует
 * @param internalOptions
 * @param userOptions
 * @param parentNode
 */
function fixInternalParentOptions(internalOptions, userOptions, parentNode) {
   // У compound-контрола parent может уже лежать в user-опциях, берем его оттуда, если нет нашей parentNode
   internalOptions.parent = internalOptions.parent || (parentNode && parentNode.control) || userOptions.parent || null;
   internalOptions.logicParent =
      internalOptions.logicParent ||
      (parentNode && parentNode.control && parentNode.control.logicParent) ||
      userOptions.logicParent ||
      null;
}

export const DirtyKind = {
   NONE: 0,
   DIRTY: 1,
   CHILD_DIRTY: 2
};

function getModuleDefaultCtor(mod) {
   return typeof mod === 'function' ? mod : mod['constructor'];
}

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

function getControlNodeParams(control, controlClass, environment) {
   var composedDecorator = composeWithResultApply.call(undefined, [environment.getMarkupNodeDecorator()]).bind(control);
   return {
      markupDecorator: composedDecorator,
      defaultOptions: {} //нет больше понятия опция по умолчанию
   };
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
      var markup = VdomMarkup.getFullMarkup(controlNodes, result[k], true);
      resultsFromTemplate = resultsFromTemplate.concat(Array.isArray(markup) ? markup : [markup]);
   }
   for (k = 0; k < resultsFromTemplate.length; k++) {
      resultsFromTemplate[k] = VdomMarkup.mapVNode(
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

export function createNode(controlClass_, options, key, environment, parentNode, serialized, vnode?): IControlNode {
   var
      controlCnstr = getModuleDefaultCtor(controlClass_), // получаем конструктор из модуля
      compound = vnode && vnode.compound,
      serializedState = (serialized && serialized.state) || { vdomCORE: true }, // сериализованное состояние компонента
      userOptions = options.user, // прикладные опции
      internalOptions = options.internal || {}, // служебные опции
      result;

   fixInternalParentOptions(internalOptions, userOptions, parentNode);

   if (!key) {
      /*У каждой ноды должен быть ключ
       * for строит внутренние ноды относительно этого ключа
       * */
      key = '_';
   }

   if (compound) {
      if (parentNode.control._moduleName !== "Core/CompoundContainer") {
      Logger.error(`В wasaby-окружении неправильно создается ws3-контрол. Необходимо использовать Core/CompoundContainer, а не вставлять ws3-контрол в шаблон wasaby-контрола напрямую.
         Подробнее тут https://wi.sbis.ru/doc/platform/developmentapl/ws3/compound-wasaby/
         Вставляется контрол '${controlCnstr && controlCnstr.prototype && controlCnstr.prototype._moduleName}' в шаблоне контрола `,
         internalOptions && internalOptions.logicParent);
      } else {
         // Создаем виртуальную ноду для compound контрола
         if (!DirtyCheckingCompatible) {
            // @ts-ignore
            DirtyCheckingCompatible = _dcc;
         }
         result = DirtyCheckingCompatible.createCompoundControlNode(
            controlClass_,
            controlCnstr,
            userOptions,
            internalOptions,
            key,
            parentNode,
            vnode
         );
      }
   } else {
      // Создаем виртуальную ноду для не-compound контрола
      var
         invisible = vnode && vnode.invisible,
         // подмешиваем сериализованное состояние к прикладным опциям
         optionsWithState = serializedState ? shallowMerge(userOptions, serializedState) : userOptions,
         optionsVersions,
         internalVersions,
         contextVersions,
         control,
         params,
         context,
         instCompat,
         defaultOptions;

      if (typeof controlClass_ === 'function') {
         // создаем инстанс компонента
         instCompat = Compatible.createInstanceCompatible(controlCnstr, optionsWithState, internalOptions);
         control = instCompat.instance;
         optionsWithState = instCompat.resolvedOptions;
         defaultOptions = instCompat.defaultOptions;
      } else {
         // инстанс уже есть, работаем с его опциями
         control = controlClass_;
         defaultOptions = OptionsResolver.getDefaultOptions(controlClass_);
         if (isJs.compat) {
            optionsWithState = Compatible.combineOptionsIfCompatible(
               controlCnstr.prototype,
               optionsWithState,
               internalOptions
            );
            if (control._setInternalOptions) {
               control._options.doNotSetParent = true;
               control._setInternalOptions(internalOptions || {});
            }
         }
      }

      // check current options versions
      optionsVersions = collectObjectVersions(optionsWithState);
      // check current context field versions
      context = (vnode && vnode.context) || {};
      contextVersions = collectObjectVersions(context);
      internalVersions = collectObjectVersions(internalOptions);

      params = getControlNodeParams(control, controlCnstr, environment);

      result = {
         attributes: options.attributes,
         events: options.events,
         control: control,
         errors: serialized && serialized.errors,
         controlClass: controlCnstr,
         options: optionsWithState,
         internalOptions: internalOptions,
         optionsVersions: optionsVersions,
         internalVersions: internalVersions,
         id: control._instId || 0,
         parent: parentNode,
         key: key,
         defaultOptions: defaultOptions,
         markup: invisible ? Vdom.textNode('') : undefined,
         fullMarkup: undefined,
         childrenNodes: ARR_EMPTY,
         markupDecorator: params && params.markupDecorator,
         serializedChildren: serialized && serialized.childrenNodes,
         hasCompound: false,
         receivedState: undefined,
         invisible: invisible,

         contextVersions: contextVersions,
         context: (vnode && vnode.context) || {},
         inheritOptions: (vnode && vnode.inheritOptions) || {}
      };

      environment.setupControlNode(result);
   }
   // Девтулзы используют это значение в качестве идентификатора. Нельзя использовать саму контрол ноду, т.к.
   // иногда обход идёт по виртуальным нодам, а иногда по контрол нодам, и виртуальные ноды создаются раньше.
   result.vnode = vnode;

   return result;
}

function rebuildNodeWriter(environment, node, force, isRoot?) {
   if (node.receivedState && node.receivedState.then) {
      return node.receivedState.then(
         function rebuildNodeWriterCbk(state) {
            node.receivedState = state;
            return rebuildNode(environment, node, force, isRoot);
         },
         function (err) {
            const error = new Error('Promise со состоянием rejected был возвращен из _beforeMount. Перед возвратом promise из _beforeMount всегда добавлять catch обработчик.');
            Common.asyncRenderErrorLog(error, node);
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
         // Пометим контрол, как разрушаемый из DirtyChecking
         // слой совместимости попытается удалить контрол из дома,
         // этого не должно произойти, иначе синхронизатор упадет
         if (!childControlNode.control._destroyed) {
            childControlNode.control.__$destroyFromDirtyChecking = true;
            childControlNode.control.destroy();
         }

         delete childControlNode.controlProperties;
         delete childControlNode.oldOptions;
         delete childControlNode.markup;
         if (
            childControlNode.control._logicParent &&
            childControlNode.control._logicParent._template &&
            childControlNode.control._options.name
         ) {
            delete childControlNode.control._logicParent._children[childControlNode.control._options.name];
         }
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
         if (Vdom.isControlVNodeType(node.children[i])) {
            result.push(node.children[i]);
         } else if (Vdom.isTemplateVNodeType(node.children[i]) || Vdom.isVNodeType(node.children[i])) {
            addTemplateChildrenRecursive(node.children[i], result);
         }
      }
   }
}

export function rebuildNode(environment, node, force, isRoot) {
   var
      id = node.id,
      dirty = environment._currentDirties[id] || DirtyKind.NONE,
      isDirty = dirty !== DirtyKind.NONE || force,
      isSelfDirty = !!(dirty & DirtyKind.DIRTY) || force,
      oldMarkup = node.markup,
      shouldUpdate,
      needRenderMarkup = false,
      newNode,
      parentNode,
      diff,
      createdNodes,
      createdTemplateNodes,
      updatedNodes,
      updatedTemplateNodes,
      updatedUnchangedNodes,
      updatedChangedNodes,
      updatedChangedTemplateNodes = [],
      selfDirtyNodes,
      destroyedNodes,
      result,
      childrenRebuild,
      childrenNodes,
      createdStartIdx,
      changedNodes,
      parentNodeContext,
      resolvedContext;

   if (isDirty) {
      newNode = node;
      parentNodeContext = node.context;
      resolvedContext = ContextResolver.resolveContext(newNode.controlClass, parentNodeContext, newNode.control);

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
               !newNode.control._mounted ? OperationType.CREATE : OperationType.UPDATE,
               getNodeName(newNode),
               newNode
            );
         }
      }
      if (!newNode.compound) {
         /**
          *
          Вызываем _beforeUpdate и _shouldUpdate для корневой контрол ноды.
          */
         if (isSelfDirty && newNode.control._mounted && !force) {
            try {
               // Freeze options if control doesn't have compatible layer
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
            try {
               shouldUpdate = newNode.control._shouldUpdate(newNode.options, resolvedContext);
            } catch (error) {
               Logger.lifeError('_shouldUpdate', newNode.control, error);
            }
            isSelfDirty = isSelfDirty && shouldUpdate;
            if (!isSelfDirty) {
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
         }

         if (isSelfDirty) {
            Logger.debug(`[DirtyChecking:rebuildNode()] - requestRebuild "${id}" for "${newNode.control._moduleName}"`);
            parentNode = newNode;

            newNode.control.saveFullContext(ContextResolver.wrapContext(newNode.control, newNode.context || {}));
            if (!newNode.inheritOptions) {
               newNode.inheritOptions = {};
            }
            OptionsResolver.resolveInheritOptions(newNode.controlClass, newNode, newNode.options);
            newNode.control.saveInheritOptions(newNode.inheritOptions);

            newNode.markup = VdomMarkup.getDecoratedMarkup(newNode, isRoot);
            saveChildren(node.markup);

            diff = VdomMarkup.getMarkupDiff(oldMarkup, newNode.markup, false, false);
            Logger.debug('DirtyChecking (diff)', diff);

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

               createdTemplateNodes = diff.createTemplates.map(function rebuildCreateTemplateNodes(vnode) {
                  Logger.debug('DirtyChecking (create template)', vnode);
                  onStartCommit(OperationType.CREATE, getNodeName(vnode));
                  vnode.optionsVersions = collectObjectVersions(vnode.controlProperties);
                  // check current context field versions
                  vnode.contextVersions = collectObjectVersions(vnode.context);

                  vnode.children = getMarkupForTemplatedNode(vnode, newNode, environment);
                  saveChildren(vnode.children);
                  for (var i = 0; i < vnode.children.length; i++) {
                     var diffTmplOneNode = VdomMarkup.getMarkupDiff(null, vnode.children[i]);
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

               updatedTemplateNodes = diff.updateTemplates.map(function rebuildUpdateTemplateNodes(diffPair) {
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
                     let templateNodeDiff = VdomMarkup.getMarkupDiff(oldTemplateNode, newTemplateNode, true, true);
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
                           diffTmplOneNode = VdomMarkup.getMarkupDiff(oldChild, newChild, true, false);
                           createdNodesSimple = createdNodesSimple.concat(diffTmplOneNode.create);
                           createdTemplateNodesSimple = createdTemplateNodesSimple.concat(diffTmplOneNode.createTemplates);
                           updatedNodesSimple = updatedNodesSimple.concat(diffTmplOneNode.update);
                           updatedTemplateNodesSimple = updatedTemplateNodesSimple.concat(diffTmplOneNode.updateTemplates);
                           destroyedNodesSimple = destroyedNodesSimple.concat(diffTmplOneNode.destroy);
                           destroyedTemplateNodesSimple = destroyedTemplateNodesSimple.concat(diffTmplOneNode.destroyTemplates)
                        } else if (oldChild) {
                           // В этой ветке находим ноды, которые были задестроены, чтобы вызвать _beforeUnmount у контролов
                           if (Vdom.isControlVNodeType(oldChild)) {
                              diffTmpl.destroy.push(oldChild);
                           } else if (Vdom.isTemplateVNodeType(oldChild) || Vdom.isVNodeType(oldChild)) {
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
                        diffTmplOneNode = VdomMarkup.getMarkupDiff(
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
               var
                  controlNodeIdx = vnode.controlNodeIdx,
                  childControlNode = parentNode.childrenNodes[controlNodeIdx];
               destroyReqursive(childControlNode, environment);
               return childControlNode;
            });

            changedNodes = new Array(diff.create.length + diff.update.length);

            createdStartIdx = diff.update.length;

            createdTemplateNodes = [];
            updatedTemplateNodes = [];

            createdNodes = diff.create.map(function rebuildCreateNodes(vnode, idx) {
               var
                  nodeIdx = createdStartIdx + idx,
                  serializedChildren = parentNode.serializedChildren,
                  serialized = serializedChildren && serializedChildren[nodeIdx],
                  options,
                  carrier,
                  controlNode;
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
                     carrier = Vdom.getReceivedState(controlNode, vnode, Slr);
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

                        if (isJs.compat) {
                           // @ts-ignore
                           controlNode.control._container = $(controlNode.element);
                        }
                     }
                  }

                  // Only subscribe to event: from options if the environment is compatible AND control
                  // has compatible behavior mixed into it
                  if (isJs.compat && (!controlNode.control.hasCompatible || controlNode.control.hasCompatible())) {
                     subscribeToEvent(controlNode); //TODO Кусок слоя совместимости https://online.sbis.ru/opendoc.html?guid=95e5b595-f9ea-45a2-9a4d-97a714d384af
                  }
               } else {
                  controlNode = createNode(
                     vnode.controlClass,
                     {
                        user: shallowMerge(vnode.controlProperties, vnode.controlInternalProperties),
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

            updatedNodes = diff.update.map(function rebuildUpdateNodes(diffPair, idx) {
               Logger.debug('DirtyChecking (update node)', diffPair);
               onStartCommit(
                  OperationType.UPDATE,
                  getNodeName(diffPair.newNode),
                  diffPair.oldNode
               );


               var
                  newVNode = diffPair.newNode,
                  controlNodeIdx = diffPair.oldNode.controlNodeIdx,
                  childControlNode = parentNode.childrenNodes[controlNodeIdx],
                  childControl = childControlNode.control,
                  shouldUpdate = true,
                  newOptions = OptionsResolver.resolveDefaultOptions(newVNode.compound
                     ? Compatible.createCombinedOptions(
                        newVNode.controlProperties,
                        newVNode.controlInternalProperties
                     )
                     : newVNode.controlProperties, childControlNode.defaultOptions),
                  oldOptions = childControlNode.options,
                  oldOptionsVersions = childControlNode.optionsVersions,
                  oldInternalVersions = childControlNode.internalVersions,
                  newChildNodeContext = newVNode.context || {},
                  oldChildNodeContext = childControlNode.context,
                  oldContextVersions = childControlNode.contextVersions,
                  changedOptions = getChangedOptions(newOptions, oldOptions, newVNode.compound, oldOptionsVersions, false, '', newVNode.compound),
                  changedContext = getChangedOptions(
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
                           changedOptions = DirtyCheckingCompatible.clearNotChangedOptions(changedOptions, realCh);
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

                  //Атрибуты тоже учавствуют в DirtyChecking
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
                        /**
                         * TODO: удалить после синхронизации с контролами
                         */
                        var shouldUp = childControl._shouldUpdate
                           ? childControl._shouldUpdate(newOptions, newChildNodeContext) || changedInternalOptions
                           : true;
                        childControl._setInternalOptions(changedInternalOptions || {});

                        if (shouldUp) {
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
         } else {
            childrenNodes = node.childrenNodes;

            createdNodes = ARR_EMPTY;
            createdTemplateNodes = ARR_EMPTY;
            updatedNodes = ARR_EMPTY;
            updatedUnchangedNodes = ARR_EMPTY;
            updatedChangedNodes = ARR_EMPTY;
            updatedChangedTemplateNodes = ARR_EMPTY;
            destroyedNodes = ARR_EMPTY;
            selfDirtyNodes = ARR_EMPTY;
         }
      } else {
         childrenNodes = node.childrenNodes;
         createdNodes = ARR_EMPTY;
         createdTemplateNodes = ARR_EMPTY;
         updatedNodes = ARR_EMPTY;
         updatedUnchangedNodes = ARR_EMPTY;
         updatedChangedNodes = ARR_EMPTY;
         updatedChangedTemplateNodes = ARR_EMPTY;
         destroyedNodes = ARR_EMPTY;
         selfDirtyNodes = ARR_EMPTY;
         if (newNode.compound && newNode.parent.control._moduleName !== 'Core/CompoundContainer') {
            // Слой совместимости
            //Нужно установить hasCompound только тогда когда нода действительно со
            //старым контролом. В эту точку также попадаем и при создании контролллера
            //компонента без шаблона
            newNode.parent.hasCompound = true;
         }
      }

      if (isSelfDirty) {
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
      const currentMemo: MemoForNode = concatMemo(new MemoForNode(), {
          createdNodes,
          updatedNodes,
          destroyedNodes,
          updatedChangedNodes,
          updatedChangedTemplateNodes,
          updatedUnchangedNodes,
          selfDirtyNodes,
          createdTemplateNodes,
          updatedTemplateNodes
      });

      if (haveAsync) {
         return Promise.all(childrenRebuildResults).then((childrenRebuildFinalResults) => {
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
                     VdomMarkup.getFullMarkup(
                        newNode.childrenNodes,
                        newNode.markup,
                        undefined,
                        needRenderMarkup || isSelfDirty ? undefined : newNode.fullMarkup,
                        node.parent
                     ),
                     newNode
                  );
                  newNode.fullMarkup.changed =
                     wasChanged || newNode.fullMarkup.changed || (needRenderMarkup || isSelfDirty);
                  if (newNode.fullMarkup.changed) {
                     setChangedForNode(newNode);
                  }
               }

               return {
                  value: newNode,
                  memo: concatMemo(currentMemo, childrenRebuild.memo)
               };
            }, (err) => {
               Common.asyncRenderErrorLog(err);
               return err;
            }
         );
      }

      childrenRebuild = createChildrenResult(childrenRebuildResults);
      newNode.childrenNodes = childrenRebuild.value;
      if (needRenderMarkup || !newNode.fullMarkup || newNode.fullMarkup.changed || isSelfDirty) {
         var wasChanged = newNode.fullMarkup && newNode.fullMarkup.changed;
            newNode.fullMarkup = environment.decorateFullMarkup(
               VdomMarkup.getFullMarkup(
                  newNode.childrenNodes,
                  newNode.markup,
                  undefined,
                  needRenderMarkup || isSelfDirty ? undefined : newNode.fullMarkup,
                  node.parent
               ),
               newNode
            );
            newNode.fullMarkup.changed = wasChanged || newNode.fullMarkup.changed || (needRenderMarkup || isSelfDirty);
            if (newNode.fullMarkup.changed) {
               setChangedForNode(newNode);
            }
         }

         result = {
            value: newNode,
            memo: concatMemo(currentMemo, childrenRebuild.memo)
         };
   } else {
      result = {
         value: node,
         memo: new MemoForNode()
      };
   }
   return result;
}
