/// <amd-module name="UICore/_vdom/Synchronizer/resources/VdomMarkup" />

import { ArrayUtils } from 'UICore/Utils';

import { coreDebug, constants } from 'Env/Env';
import { ListMonad } from '../../Utils/Monad';
import { setControlNodeHook } from './Hooks';
import { Logger } from 'UICore/Utils';
import { WasabyProperties, VNode } from 'Inferno/third-party/index';
import { Map, Set } from 'Types/shim';

import { htmlNode, textNode, TGeneratorNode, ITemplateNode } from 'UICore/Executor';
import { IControlNode } from '../interfaces';
import { TControlConstructor } from 'UICore/Base';
import { invisibleNodeTagName } from 'UICore/Executor';

// this.childFlags = childFlags;
// this.children = children;
// this.className = className;
// this.dom = null;
// this.flags = flags;
// this.key = key === void 0 ? null : key;
// this.props = props === void 0 ? null : props;
// this.ref = ref === void 0 ? null : ref;
// this.type = type;
// this.markup = markup;

/**
 * @author Кондаков Р.Н.
 */

function isString(string) {
   return (Object.prototype.toString.call(string) === '[object String]');
}

// TODO: Release type flag on virtual nodes to distinguish virtual nodes.
export function isVNodeType(vnode: any): any {
   return vnode && (!isString(vnode.children) && typeof vnode.children !== 'number') && vnode.hasOwnProperty('dom');
   // return vnode && typeof vnode === 'object' && vnode.type === 'VirtualNode';
}

// TODO: Release type flag on virtual nodes to distinguish virtual nodes.
export function isTextNodeType(vnode: any): any {
   return vnode && (isString(vnode.children) || typeof vnode.children === 'number') && vnode.hasOwnProperty('dom');
   // return vnode && typeof vnode === 'object' && vnode.type === 'VirtualText';
}

// TODO: Release type flag on virtual nodes to distinguish virtual nodes.
export function isControlVNodeType(vnode: VNode | VNodeControl): boolean {
   return vnode && typeof vnode === 'object' && 'controlClass' in vnode;
}

// TODO: Release type flag on virtual nodes to distinguish virtual nodes.
export function isTemplateVNodeType(vnode: any): boolean {
   return vnode && typeof vnode === 'object' && vnode.type === 'TemplateNode';
}

// TODO: Release type flag on virtual nodes to distinguish virtual nodes.
export function isInvisibleNodeType(vnode: any): any {
   return vnode && typeof vnode === 'object' && vnode.type && vnode.type === invisibleNodeTagName;
}

// TODO модификация этой функции приводит к большим проблемам. Нужно точнее разобрать
export function getVNodeChidlren(vnode: VNode, getFromTemplateNodes: boolean = false): Array<TGeneratorNode | VNode> {
   if (!vnode) {
      return [];
   }

   if (getFromTemplateNodes) {
      // @ts-ignore
      return vnode.children || [];
   }

   if (!isVNodeType(vnode)) {
      return [];
   }

   // @ts-ignore
   return vnode.children === null ? [] : vnode.children;
}

export function mapVNode(
   fn: any,
   controlNode: any,
   vnode: any,
   setHookToVNode?: any,
   modify?: boolean
): any {
   /* mapVNode must be refactor
    * recursive dom with many root kills browser
    * */
   if (vnode.stopped) {
      return vnode;
   }
   //Template node doesn't have properties, and we must set controlNodeHook to first child element
   if (setHookToVNode && isTemplateVNodeType(vnode) && vnode.children && vnode.children[0]) {
      vnode.children[0] = mapVNode(fn, controlNode, vnode.children[0], setHookToVNode);
      return vnode;
   }
   if (isControlVNodeType(vnode) && setHookToVNode) {
      const controlNodeRef = setControlNodeHook(
         vnode.type,
         vnode.props,
         vnode.children,
         controlNode.key,
         controlNode,
         vnode.ref
      );
      vnode.ref = controlNodeRef[4];
   }
   // Markup Decorator builds tree of outer correspondence with too many root nodes.
   // This kills browser, so mapping should be stopped.
   // Will be removed in project https://online.sbis.ru/opendoc.html?guid=11776bc8-39b7-4c55-b5b5-5cc2ea8d9fbe.
   if (isVNodeType(vnode)) {
      if (controlNode.control && controlNode.control._moduleName === 'Controls/decorator:Markup') {
         if (vnode.children && vnode.children[0]) {
            // Not only the first child can overgrow, stop them all.
            vnode.children.forEach((childVnode) => {
               childVnode.stopped = true;
            });
         }
      }
      const newNodeArgs = fn(vnode.type, vnode.hprops, vnode.children, vnode.key, controlNode, vnode.ref, vnode);
      const sameNode =
         vnode.type === newNodeArgs[0] &&
         vnode.props === newNodeArgs[1] &&
         vnode.children === newNodeArgs[2] &&
         vnode.key === newNodeArgs[3];
      if (modify) {
         /**
          * We have to modify exisiting vnode, so we don't lose object link
          */
         vnode.type = newNodeArgs[0];
         vnode.props = newNodeArgs[1];
         vnode.children = newNodeArgs[2];
         vnode.key = newNodeArgs[3];

         // Only attach control hook to vnode if it wasn't attached already
         // for the same control
         if (!vnode.hookedInvControlIds || vnode.hookedInvControlIds.indexOf(controlNode.id) === -1) {
            vnode.ref = newNodeArgs[4];
            if (vnode.hookedInvControlIds) {
               // Keep track of control node ids that already have a control
               // node hook attached
               vnode.hookedInvControlIds.push(controlNode.id);
            }
         }
      } else {
         return sameNode ? vnode : htmlNode.apply(undefined, newNodeArgs);
      }
   } else {
      return vnode;
   }
}
function mapVNodeChildren(recursive: any, vnode: any, mapFn: any, filterFn: any, getFromTemplateNodes?: any): any {
   function join(vnode: any): any {
      const mapped = filterFn(vnode) ? [mapFn(vnode)] : [];
      return recursive ? mapped.concat(ListMonad.join(getVNodeChidlren(vnode, getFromTemplateNodes), join)) : mapped;
   }

   return ListMonad.join(getVNodeChidlren(vnode, getFromTemplateNodes), join);
}

function identity(v: any): any {
   return v;
}
function collectChildControlVNodes(vnode: any, getFromTemplateNodes?: any): any {
   return mapVNodeChildren(true, vnode, identity, isControlVNodeType, getFromTemplateNodes);
}

function collectChildTemplateVNodes(vnode: any): any {
   return mapVNodeChildren(true, vnode, identity, isTemplateVNodeType);
}

type VNodeControl = VNode & { controlClass: TControlConstructor };

interface IMarkupDiff {
   create: TGeneratorNode[];
   createTemplates: ITemplateNode[];
   destroy: TGeneratorNode[];
   destroyTemplates: ITemplateNode[];
   update: Array<{ oldNode: TGeneratorNode, newNode: TGeneratorNode }>;
   updateTemplates: Array<{ oldNode: ITemplateNode, newNode: ITemplateNode }>;
   vnodeChanged: boolean;
}

export function getMarkupDiff(oldNode: TGeneratorNode, newNode: TGeneratorNode,
                              ignoreLinkEqual: boolean = false, goin: boolean = false): IMarkupDiff {
   const result: IMarkupDiff = {
      create: [],
      createTemplates: [],
      destroy: [],
      destroyTemplates: [],
      update: [],
      updateTemplates: [],
      vnodeChanged: false
   };

   let childrenResult;
   let oldChildren;
   let newChildren;
   let childLn;
   let i;
   let oldChild;
   let newChild;

   function reorder(oldChildren: TGeneratorNode[], newChildren: TGeneratorNode[]): any {
      function haveKeys(children: TGeneratorNode[]): boolean {
         if (children) {
            for (let i = 0, length = children.length; i !== length; i++) {
               if (children[i].key !== undefined) {
                  return true;
               }
            }
         }
         return false;
      }

      function keyIndex(children: TGeneratorNode[]): any {
         const keys = new Map();
         const free = [];
         const length = children.length;

         for (let i = 0; i < length; i++) {
            const child = children[i];
            const key = child.key;

            if (key !== undefined) {
               keys.set(key, i);
            } else {
               free.push(i);
            }
         }

         return {
            keys,
            free
         };
      }

      let result;
      let oldKeys;
      let newKeys;
      let newFree;
      let newFreeLn;
      let oldKI;
      let newKI;
      let i;
      let freeIndex;
      let lastFreeIndex;
      let oldLength;
      let newLength;
      let oldChild;

      if (haveKeys(oldChildren) && haveKeys(newChildren)) {
         oldKI = keyIndex(oldChildren);
         newKI = keyIndex(newChildren);
         oldKeys = oldKI.keys;
         oldLength = oldChildren.length;
         newKeys = newKI.keys;
         newLength = newChildren.length;
         newFree = newKI.free;
         newFreeLn = newFree.length;

         freeIndex = 0;
         result = new Array(newLength);

         for (i = 0; i !== oldLength; i++) {
            oldChild = oldChildren[i];
            if (oldChild.key !== undefined) {
               if (newKeys.has(oldChild.key)) {
                  result[i] = newChildren[newKeys.get(oldChild.key)];
               } else {
                  result[i] = null;
               }
            } else if (freeIndex !== newFreeLn) {
               result[i] = newChildren[newFree[freeIndex]];
               freeIndex++;
            } else {
               result[i] = null;
            }
         }

         lastFreeIndex = freeIndex !== newFreeLn ? newFree[freeIndex] : newLength;
         for (i = 0; i !== newLength; i++) {
            newChild = newChildren[i];
            if (newChild.key !== undefined) {
               if (!oldKeys.has(newChild.key)) {
                  result.push(newChild);
               }
            } else if (i >= lastFreeIndex) {
               result.push(newChildren[i]);
            }
         }
      } else {
         result = newChildren;
      }
      return result;
   }

   function isEqualNode(n1: TGeneratorNode, n2: TGeneratorNode): boolean {
      const isControl1 = n1 && isControlVNodeType(n1);
      const isControl2 = n2 && isControlVNodeType(n2);
      const isTemplate1 = n1 && isTemplateVNodeType(n1);
      const isTemplate2 = n2 && isTemplateVNodeType(n2);
      const resultTemplate = isTemplate1 === isTemplate2;
      let result = isControl1 === isControl2;

      if (result) {
         if (isControl1) {
            result = n1.controlClass === n2.controlClass && n1.key === n2.key;
         } else {
            result = n1.type === n2.type;
            if (result && isVNodeType(n1)) {
               result = n1.tagName === n2.tagName && n1.namespace === n2.namespace && n1.key === n2.key;
            }
         }
      } else if (resultTemplate) {
         if (isTemplate1) {
            result = n1.template === n2.template && n1.key === n2.key;
         } else {
            result = n1.type === n2.type && n1.compound === n2.compound;

            if (result && isVNodeType(n1)) {
               result = n1.tagName === n2.tagName && n1.namespace === n2.namespace && n1.key === n2.key;
            }
         }
      }

      return result;
   }

   function concatResults(partResult: any[], part: any[]): void {
      for (let i = 0; i < part.length; i++) {
         partResult.push(part[i]);
      }
   }

   function complexDiffFinder(oldNode: TGeneratorNode, newNode: TGeneratorNode,
      isTemplateNode: boolean, goin: boolean): void {
      oldChildren = getVNodeChidlren(oldNode, isTemplateNode);
      newChildren = reorder(oldChildren, getVNodeChidlren(newNode, isTemplateNode));

      childLn = Math.max(oldChildren.length, newChildren.length);
      let newChildrenOffset = 0;
      const wasReordered = newChildren !== newNode.children;
      if (oldChildren.length !== newChildren.length) {
         result.vnodeChanged = true;
      }
      for (i = 0; i !== childLn; i++) {
         oldChild = oldChildren[i];
         if (oldChild && oldChild.key === 'vdom-focus-in' && !wasReordered) {
            newChildrenOffset++;
            continue;
         }
         newChild = newChildren[i - newChildrenOffset];

         if (oldChild && newChild) {
            childrenResult = getMarkupDiff(oldChild, newChild, ignoreLinkEqual, goin);
            result.vnodeChanged = result.vnodeChanged || childrenResult.vnodeChanged;
            concatResults(result.create, childrenResult.create);
            concatResults(result.destroy, childrenResult.destroy);
            concatResults(result.update, childrenResult.update);
            concatResults(result.createTemplates, childrenResult.createTemplates);
            concatResults(result.destroyTemplates, childrenResult.destroyTemplates);
            concatResults(result.updateTemplates, childrenResult.updateTemplates);
         } else if (oldChild) {
            if (isControlVNodeType(oldChild)) {
               result.destroy.push(oldChild);
            } else if (isTemplateVNodeType(oldChild)) {
               concatResults(result.destroy, collectChildControlVNodes(oldChild, true));
               result.destroyTemplates.push(oldChild);
            } else {
               concatResults(result.destroy, collectChildControlVNodes(oldChild, false));
               concatResults(result.destroyTemplates, collectChildTemplateVNodes(oldChild));
            }
         } else {
            if (isControlVNodeType(newChild)) {
               result.create.push(newChild);
            } else if (isTemplateVNodeType(newChild)) {
               result.createTemplates.push(newChild);
            } else {
               concatResults(result.create, collectChildControlVNodes(newChild));
               concatResults(result.createTemplates, collectChildTemplateVNodes(newChild));
            }
         }
      }
   }

   if (oldNode !== newNode || ignoreLinkEqual) {
      coreDebug.checkAssertion(!!newNode, 'newNode !== null');

      if (isEqualNode(oldNode, newNode)) {
         if (isControlVNodeType(newNode)) {
            // @ts-ignore
            if (oldNode.controlNodeIdx === -1) {
               // @ts-ignore
               result.create.push(newNode);
            } else {
               // @ts-ignore
               result.update.push({ oldNode, newNode });
            }
         } else if (isTemplateVNodeType(newNode)) {
            if (!newNode.children && newNode === oldNode) {
               // Раньше здесь newNode добавлялся в createTemplates, но вроде
               // бы это не нужно. Если newNode === oldNode и мы попали сюда,
               // значит включен ignoreLinkEqual, то есть diff вызывают принудительно,
               // зная что опции обновились.
               // Если обновились опции, а сами ноды совпадают, нам достаточно обновить
               // template, а не создавать его. При создании нового утекают старые контролы
               // @ts-ignore
               result.updateTemplates.push({ oldNode, newNode });
            } else {
               // we have to find and reorder by keys existing template nodes
               // in order to get the best possible diff we can get
               if (newNode.children && goin) {
                  complexDiffFinder(oldNode, newNode, true, goin);
               } else {
                  // @ts-ignore
                  result.updateTemplates.push({ oldNode, newNode });
               }
            }
         } else {
            complexDiffFinder(oldNode, newNode, false, false);
         }
      } else {
         result.vnodeChanged = true;

         if (isControlVNodeType(newNode)) {
            // @ts-ignore
            result.create.push(newNode);
         } else if (isTemplateVNodeType(newNode)) {
            // @ts-ignore
            result.createTemplates.push(newNode);
         } else {
            concatResults(result.create, collectChildControlVNodes(newNode));
            concatResults(result.createTemplates, collectChildTemplateVNodes(newNode));
         }

         if (oldNode) {
            if (isControlVNodeType(oldNode)) {
               // @ts-ignore
               result.destroy.push(oldNode);
            } else if (isTemplateVNodeType(oldNode)) {
               concatResults(result.destroy, collectChildControlVNodes(oldNode, true));
            } else {
               concatResults(result.destroy, collectChildControlVNodes(oldNode, true));
            }
         }
      }
   }

   return result;
}

function hasChangedFields(newObj: any, oldObj: any): any {
   let key;

   // check if any properties were removed or changed
   for (key in oldObj) {
      if (oldObj.hasOwnProperty(key)) {
         if (!newObj.hasOwnProperty(key) || newObj[key] !== oldObj[key]) {
            return true;
         }
      }
   }

   // check if there are any new properties
   for (key in newObj) {
      if (newObj.hasOwnProperty(key) && !oldObj.hasOwnProperty(key)) {
         return true;
      }
   }

   return false;
}

function arePropertiesChanged(newProps: any, oldProps: any): any {
   return (
      hasChangedFields(newProps.attributes, oldProps.attributes) ||
      hasChangedFields(newProps.events, oldProps.events) ||
      hasChangedFields(newProps.hooks, oldProps.hooks)
   );
}

function getStringVnode(vnode: any): string {
   const className = (vnode.hprops && vnode.hprops.attributes && vnode.hprops.attributes.class)
      ? ` class="${vnode.hprops.attributes.class}"`
      : '';
   return `<${vnode.type}${className}>...</${vnode.type}>`;
}

function validateKeys(children: any[]): void {
   if (constants.isProduction) {
      // Do not validate keys in production mode
      return;
   }
   if (!Array.isArray(children)) {
      return;
   }
   const keys = new Set();
   for (let i = 0; i < children.length; ++i) {
      const child = children[i];
      const key = child.key;
      if (keys.has(key)) {
         const markup = getStringVnode(child);
         Logger.error(`Встречены несколько детей с одинаковыми ключами: "${key}". Разметка: ${markup}`, child.parentControl);
      } else {
         keys.add(key);
      }
   }
}

export function getFullMarkup(
   controlNodes: any,
   vnode: any,
   ignoreInnerComponent: any,
   currentFullMarkup?: any,
   parentNode?: any
): any {
   let result;
   let i;
   let children;
   let ln;
   let childMarkup;
   let newChildren;
   let childrenAfter;
   let changed = false;

   if (isControlVNodeType(vnode)) {
      if (ignoreInnerComponent) {
         return vnode;
      }
      result = controlNodes[vnode.controlNodeIdx].fullMarkup;
      const controlNode: IControlNode = controlNodes[vnode.controlNodeIdx];
      if (!controlNode || controlNode.key !== vnode.key) {
         Logger.error('Ошибка синхронизации: отсутствует элемент в дереве controlNodes или неверное значение поля controlNodeIdx у vnode', vnode?.controlClass?.prototype);
         result = textNode('', vnode.key);
      } else if (isInvisibleNodeType(result)) {
         /**
         * In case of invisible node we have to hold on to parent dom node
         */
         if (parentNode && parentNode.type) {
            // Invisible control node is attached to a parent vnode, which
            // should keep track of every invisible control attached to it
            if (!parentNode.hookedInvControlIds) {
               parentNode.hookedInvControlIds = [];
            }
            mapVNode(
               setControlNodeHook,
               controlNode,
               parentNode,
               true,
               true
            );
         }
         result = textNode('', controlNode.key);
      }
   } else if (isTemplateVNodeType(vnode) && !vnode.children) {
      result = vnode;
   } else if (
      (!isTemplateVNodeType(vnode) && !isVNodeType(vnode)) ||
      !vnode.children ||
      vnode.children.length === 0
   ) {
      result = vnode;
   } else {
      i = 0;
      children = isTemplateVNodeType(vnode) ? vnode.children : getVNodeChidlren(vnode);

      // Бывает, что среди детей несколько темплейт нод, часть из которых заменятся на нормальные вноды инферно, а часть - нет.
      // При замене ключ поменяется, поэтому проверим одинаковые сразу.
      validateKeys(children);

      ln = children.length;

      while (i !== ln) {
         childMarkup = getFullMarkup(controlNodes, children[i], ignoreInnerComponent, undefined, vnode);
         if (childMarkup.changed) {
            changed = true;
         }
         if (childMarkup !== children[i]) {
            break;
         }

         i++;
      }

      //    childMarkup = ArrayUtils.flatten(childMarkup, true);

      if (i === ln) {
         result = vnode;
         if (!changed && currentFullMarkup) {
            if (result.children && currentFullMarkup.children) {
               if (result.children.length !== currentFullMarkup.children.length) {
                  changed = true;
               } else {
                  for (let chi = 0; chi < result.children.length; chi++) {
                     if (
                        result.children[chi] !== currentFullMarkup.children[chi] ||
                        (currentFullMarkup.children[chi] && currentFullMarkup.children[chi].changed)
                     ) {
                        changed = true;
                        break;
                     }
                  }
               }
            }
         }
      } else {
         childrenAfter = children.slice(i + 1).map((item: any): any => {
            /*function map has 3 arguments, but function getFullMarkup has another 3 arguments*/
            const fullMarkup = getFullMarkup(controlNodes, item, ignoreInnerComponent, undefined, vnode);
            if (fullMarkup.changed) {
               changed = true;
            }
            if (fullMarkup.type === 'TemplateNode' && !fullMarkup.children) {
               Logger.error(`Дублирование ключей controlNode в списке: ${item.key}`);
               return [];
            }
            return fullMarkup;
         });
         childrenAfter = ArrayUtils.flatten(childrenAfter, true);
         newChildren = children
            .slice(0, i)
            .concat(Array.isArray(childMarkup) ? childMarkup : [childMarkup])
            .concat(childrenAfter);

         if (isTemplateVNodeType(vnode)) {
            validateKeys(newChildren);
            return newChildren;
         }

         if (currentFullMarkup) {
            // check if any of the children have changed
            if (!changed) {
               if (
                  (!currentFullMarkup.children && newChildren) ||
                  currentFullMarkup.children.length !== newChildren.length
               ) {
                  changed = true;
               } else {
                  for (let chi = 0; chi < currentFullMarkup.children.length; chi++) {
                     if (currentFullMarkup.children[chi] !== newChildren[chi] || newChildren[chi].changed) {
                        changed = true;
                        break;
                     }
                  }
               }
            }

            // check if any of the properties have changed
            if (!changed) {
               changed = arePropertiesChanged(vnode.hprops, currentFullMarkup.hprops);
            }

            if (changed) {
               result = htmlNode(vnode.type, vnode.hprops, newChildren, vnode.key, vnode.ref);
               result.changed = true;
            } else {
               result = currentFullMarkup;
            }
         } else {
            result = htmlNode(vnode.type, vnode.hprops, newChildren, vnode.key, vnode.ref);
            result.changed = true;
         }
      }
   }
   if (isTemplateVNodeType(result)) {
      if (result.children) {
         result = result.children;
      } else {
         textNode('', result.attributes.key);
      }
   }

   if (changed) {
      result.changed = true;
   }

   validateKeys(result.children);

   return result;
}

function createErrVNode(err: any, key: any): any {
   return htmlNode(
      'span',
      { } as WasabyProperties,
      [textNode(err, (key || 'err_' + Math.trunc(Math.random() * 1000)) + '_inner_text')],
      key || 'err_' + Math.trunc(Math.random() * 1000)
   );
}

export function getDecoratedMarkup(controlNode: IControlNode): any {
   //Теперь передададим еще и атрибуты, которые нам дали сверху для построения верстки
   //там они будут мержиться
   const markupRes = controlNode.control._getMarkup(controlNode.key, {
      key: controlNode.key,
      attributes: controlNode.attributes,
      // @ts-ignore
      events: controlNode.events,
      // @ts-ignore
      inheritOptions: controlNode.inheritOptions,
      // @ts-ignore
      templateContext: controlNode.templateContext,
      // @ts-ignore
      internal: controlNode.internal,
      // @ts-ignore
      domNodeProps: controlNode.domNodeProps
   });
   let result;

   if (isVNodeType(markupRes)) {
      result = mapVNode(controlNode.markupDecorator, controlNode, markupRes);
   } else {
      result = markupRes;
   }
   const hasMarkup = !!result.length;
   if (hasMarkup) {
      result.hasTemplateRootElement = true;
   }
   if (
      !isControlVNodeType(result) &&
      !isVNodeType(result) &&
      !isTemplateVNodeType(result)
   ) {
      // если корневой элемент отсутствует при первой синхронизации создаем текстовую ноду с ошибкой
      // и кидаем предупреждение в консоль со стеком
      // @ts-ignore
      const message = `Шаблон контрола ${controlNode.control._moduleName} ` +
         // @ts-ignore
         `(name: ${controlNode.control._options.name}) не построил верстку. Должен быть корневой элемент!`;
      result = createErrVNode(message, controlNode.key);
      Logger.error(message, controlNode.control);
      if (hasMarkup) {
         result.hasTemplateRootElement = false;
      }
   }

   if (
      !result.hasTemplateRootElement &&
      controlNode.markup &&
      // @ts-ignore
      controlNode.markup.hasTemplateRootElement !== result.hasTemplateRootElement
   ) {
      // если при первой синхронизации все нода построилась успешно,
      // но при следующих циклах синхронизации корневой элемент пропал
      // требуется для отладки причины возникновения ошибки пропажи корневого элемента при его наличии
      // https://online.sbis.ru/opendoc.html?guid=80ec2fd6-ce3c-4e7a-94e3-ccb47c0c8dcb
      // TODO: найти причину пропажи корневой ноды по задаче выше
      Logger.warn(
         // @ts-ignore
         `В контроле ${controlNode.control._moduleName} был потерян корневой элемент`,
         controlNode.control
      );
      if (hasMarkup) {
         result.hasTemplateRootElement = true;
      }
   }
   return result;
}
