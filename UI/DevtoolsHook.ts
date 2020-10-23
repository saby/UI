import { TemplateFunction } from 'UI/Base';
import { IControlNode } from './_vdom/Synchronizer/interfaces';
import { IOptions } from './_vdom/Synchronizer/resources/Options';
import { GeneratorNode } from "UI/_executor/_Markup/Vdom/IVdomType";
import { VNode } from "Inferno/third-party/index";

interface IChangedReactiveProp {
   name: string;
   stack: string;
}

let onStartCommitFunc;
let onEndCommitFunc;
let onStartLifecycleFunc;
let onEndLifecycleFunc;
let onStartSyncFunc;
let onEndSyncFunc;
let saveChildrenFunc;
let foundDevtools = false;
let saveReactivePropsStacks = false;
let supportReactivePropsStacks = false;
let changedReactiveProps: WeakMap<
   IControlNode['control'],
   IChangedReactiveProp[] | string[] // TODO: string[] это обратная совместимость
>;

interface ITemplateNode {
   template?: TemplateFunction;
   children: ITemplateNode | IControlNode | Array<ITemplateNode | IControlNode>;
}

interface ITemplateChanges {
   template: TemplateFunction;
   options: object;
   logicParent: IControlNode['control'] | null;
   changedOptions?: object;
   attributes: Record<string, string | number>;
   changedAttributes?: IOptions;
   state: object;
}

interface IControlChanges extends ITemplateChanges {
   instance: IControlNode['control'];
   context?: object;
   changedContext?: object;
   changedReactiveProps?: string[] | IChangedReactiveProp[];
}

export enum OperationType {
   DESTROY,
   CREATE,
   UPDATE = 3
}

/**
 * При вызове пытается найти объект, внедрённый расширением. Если находит, то в расширение начинает передаваться отладочная информация.
 */
function injectHook(): boolean {
   if (
      typeof window === 'undefined' ||
      // @ts-ignore
      typeof window.__WASABY_DEV_HOOK__ === 'undefined'
   ) {
      return false;
   }
   // @ts-ignore
   const hook = window.__WASABY_DEV_HOOK__;
   supportReactivePropsStacks = hook.hasOwnProperty('saveReactivePropsStacks');
   saveReactivePropsStacks =
      supportReactivePropsStacks && hook.saveReactivePropsStacks;
   // @ts-ignore
   window.__WASABY_DEV_HOOK__.init({});
   onStartCommitFunc = (...args) => {
      hook.onStartCommit.apply(hook, args);
   };
   onEndCommitFunc = (...args) => {
      hook.onEndCommit.apply(hook, args);
   };
   onStartSyncFunc = (...args) => {
      hook.onStartSync.apply(hook, args);
   };
   onEndSyncFunc = (...args) => {
      hook.onEndSync.apply(hook, args);
   };
   onStartLifecycleFunc = (...args) => {
      hook.onStartLifecycle.apply(hook, args);
   };
   onEndLifecycleFunc = (...args) => {
      hook.onEndLifecycle.apply(hook, args);
   };
   saveChildrenFunc = (...args) => {
      hook.saveChildren.apply(hook, args);
   };
   foundDevtools = true;
   changedReactiveProps = new WeakMap();
   return true;
}

/**
 * Сообщает в расширение о старте работы над нодой
 * @param typeOfOperation
 * @param name
 * @param oldNode
 */
function onStartCommit(
   typeOfOperation: OperationType,
   name: string,
   oldNode?: IControlNode | ITemplateNode | any
): void {
   if (foundDevtools) {
      onStartCommitFunc(typeOfOperation, name, oldNode);
   }
}

function isControlChanges(
   data?: ITemplateChanges | IControlChanges
): data is IControlChanges {
   return data && data.hasOwnProperty('instance');
}

/**
 * Сообщает в расширение о завершении работы над нодой
 * @param node
 * @param data
 */
function onEndCommit(
   node: IControlNode | ITemplateNode | GeneratorNode | VNode | any,
   data?: ITemplateChanges | IControlChanges | any
): void {
   if (foundDevtools) {
      if (isControlChanges(data)) {
         const changedData = changedReactiveProps.get(data.instance);
         if (changedData) {
            data.changedReactiveProps = changedData;
            changedReactiveProps.delete(data.instance);
         }
      }
      onEndCommitFunc(node, data);
   }
}

/**
 * Сообщает в расширение о старте выполнения хука жизненного цикла.
 * Отличие от onStartCommit состоит в том, что расширение не может здесь полагаться на стек корней и контролов.
 * @param node
 */
function onStartLifecycle(node: IControlNode): void {
   if (foundDevtools) {
      onStartLifecycleFunc(node);
   }
}

/**
 * Сообщает в расширение о завершении выполнения хука жизненного цикла.
 * @param node
 */
function onEndLifecycle(node: IControlNode): void {
   if (foundDevtools) {
      onEndLifecycleFunc(node);
   }
}

/**
 * Сообщает в расширение о старте синхронизации.
 * @param rootId
 */
function onStartSync(rootId: number): void {
   if (foundDevtools) {
      onStartSyncFunc(rootId);
   }
}

/**
 * Сообщает в расширение о завершении синхронизации.
 * @param rootId
 */
function onEndSync(rootId: number): void {
   if (foundDevtools) {
      onEndSyncFunc(rootId);
   }
}

/**
 * Отдаёт в расширение список детей ноды, чтобы оно могло проставить правильных родителей.
 * @param children
 */
function saveChildren(
   children: ITemplateNode['children'] | IControlNode['markup'] | any
): void {
   if (typeof saveChildrenFunc === 'function') {
      saveChildrenFunc(children);
   }
}

/**
 * Если на странице есть расширение, то запоминает названия изменившихся свойств.
 * При ближайшем вызове endCommit для этого контрола массив свойств будет передан в расширение.
 * @param instance
 * @param propName
 */
function saveChangedProps(
   instance: IControlNode['control'],
   propName: string
): void {
   if (foundDevtools) {
      const reactiveProps = changedReactiveProps.get(instance);
      let newChangedProp;

      if (supportReactivePropsStacks) {
         newChangedProp = {
            name: propName,
            stack: saveReactivePropsStacks ? new Error().stack : undefined
         };
      } else {
         // TODO: обратная совместимость для расширения, можно удалить после того как в магазин долетит обновление
         newChangedProp = propName;
      }

      if (reactiveProps) {
         reactiveProps.push(newChangedProp);
      } else {
         changedReactiveProps.set(instance, [newChangedProp]);
      }
   }
}

function isControlNode(node: object): node is IControlNode {
   return node.hasOwnProperty('controlClass');
}

function getNodeName(node: IControlNode | ITemplateNode | any): string {
   if (foundDevtools) {
      if (isControlNode(node)) {
         if (node.controlClass && node.controlClass.prototype) {
            return node.controlClass.prototype._moduleName;
         } else if (node._moduleName) {
            return node._moduleName;
         }
      } else if (node.template) {
         return node.template.name;
      }
   }
   return 'Unknown';
}

export {
   injectHook,
   onStartCommit,
   onEndCommit,
   onStartSync,
   onEndSync,
   onStartLifecycle,
   onEndLifecycle,
   saveChildren,
   getNodeName,
   saveChangedProps
};
