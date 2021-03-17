import { TemplateFunction } from 'UI/Base';
import { IControlNode } from './_vdom/Synchronizer/interfaces';
import { IOptions } from './_vdom/Synchronizer/resources/Options';
import { GeneratorNode } from "UI/_executor/_Markup/Vdom/IVdomType";
import { VNode } from "Inferno/third-party/index";
/**
 * Модуль для общения с Wasaby Developer Tools.
 * Краткий порядок общения с расширением:
 * - Вызывается injectHook, устанавливается связь с расширением.
 *
 * - В процессе работы синхронизатора вызываются хуки расширения, по которым оно строит дерево контролов.
 * Хуки должны вызываться в таком порядке:
 * - onStartSync - должен вызываться перед началом работы над корнем. Может вызываться несколько раз для одной синхронизации,
 * подробнее в описании метода.
 *
 * - onStartCommit - должен вызываться перед началом работы над нодой. Нельзя вызывать несколько раз подряд для одной ноды,
 * но в рамках одной синхронизации для одной ноды может быть несколько пар onStartCommit-onEndCommit.
 *
 * - onEndCommit - должен вызываться после завершения работы над нодой.
 *
 * - onStartLifecycle - должен вызываться перед вызовом хука ЖЦ (кроме _beforeMount  и _beforeUnmount). Один раз для одного хука.
 *
 * - onEndLifecycle - должен вызываться после вызова хука ЖЦ (кроме _beforeMount и _beforeUnmount). Один раз для одного хука.
 *
 * - onEndSync - должен вызываться после завершения работы над корнем. Для одного корня вызывается один раз за синхронизацию.
 *
 *
 * По возможности, все хуки должны располагаться максимально близко к тем местам, на которые может повлиять прикладной разработчик.
 */

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
 * @return Возвращает true если расширение найдено, false если не найдено (можно использовать в дев билдах для показа сообщения с рекламой расширения).
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
 * Сообщает в расширение о старте работы над нодой. Нельзя вызывать несколько раз подряд для одной ноды,
 * но в рамках одной синхронизации для одной ноды может быть несколько пар onStartCommit-onEndCommit.
 * Несколько пар могут возникнуть в следующих ситуациях:
 * 1) Контрол строился асинхронно.
 * 2) Нода обходилась дважды: при обходе родителя и просто при обходе дерева.
 * @param typeOfOperation Тип операции (CREATE, UPDATE, DESTROY).
 * @param name Имя контрола/шаблона. Обычно, у контролов публичный путь, у шаблонов название функции. Подробнее см. getNodeName в этом же файле.
 * @param oldNode Старая виртуальная нода, используется девтулзами для генерации ключей нод. Если не передана, то девтулзы считают, что это новая нода.
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
 * Сообщает в расширение о завершении работы над нодой. Количество вызовов соответствует onStartCommit.
 * @param node Виртуальная нода, используется девтулзами для генерации ключей нод.
 * @param data Информация о контроле (изменившиеся опции, реактивные свойства, ссылка на шаблон и т.п.)
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
 * Сообщает в расширение о старте выполнения хука жизненного цикла (кроме _beforeMount и _beforeUnmount). Вызывается ровно один раз для одного хука.
 * _beforeMount и _beforeUnmount на данный момент исключаются, потому что они попадают в commit'ы, но в будущем можно будет их обернуть, чтобы более точно замерять время.
 * Оборачивание обязательно должно происходить с доработкой расширения, иначе там время будет завышено.
 * @param node
 */
function onStartLifecycle(node: IControlNode): void {
   if (foundDevtools) {
      onStartLifecycleFunc(node);
   }
}

/**
 * Сообщает в расширение о завершении выполнения хука жизненного цикла (кроме _beforeMount и _beforeUnmount). Вызывается ровно один раз для одного хука.
 * @param node
 */
function onEndLifecycle(node: IControlNode): void {
   if (foundDevtools) {
      onEndLifecycleFunc(node);
   }
}

/**
 * Сообщает в расширение о старте синхронизации. Должен вызываться всякий раз, когда начинается работа над корнем.
 * В данный момент вызывается в таких местах:
 * 1) Перед построением нового корня.
 * 2) Перед перестроением корня.
 * 3) Перед удалением корня.
 * 4) Перед вызовом хуков ЖЦ и передачей корня в движок (на данный момент, inferno).
 *
 * Может вызываться несколько раз для одной синхронизации из-за асинхронного построения.
 * Допустим, есть 2 корня - А и Б. Внутри корня А один из контролов начал асинхронную загрузку, синхронизация
 * прерывается на этом месте и ждёт его. onEndSync здесь не вызывается для удобства отображения - так в профиле будет заметно
 * где происходит загрузка данных.
 * В это время корень Б может провести синхронизацию, позовётся новая пара onStartSync-onEndSync.
 * После прихода данных корень А продолжит синхронизацию, в этот момент должен позваться новый onStartSynс, и если синхронизация
 * продолжится без прерываний, то в итоге позовётся onEndSync.
 * @param rootId Число, которое хранится на инстансе корня, и позволяет его идентифицировать. Нельзя использовать саму ноду, т.к. при первом построении ноды ещё нет, а хук дёргать уже надо.
 */
function onStartSync(rootId: number): void {
   if (foundDevtools) {
      onStartSyncFunc(rootId);
   }
}

/**
 * Сообщает в расширение о завершении синхронизации. Для одного корня вызывается один раз за синхронизацию.
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
