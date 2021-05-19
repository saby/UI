/// <amd-module name="UICore/_focus/ElementFinder" />
/* tslint:disable */

/**
 * @author Кондаков Р.Н.
 * Модуль содержит логику нахождения следующего элемента для фокусировки
 */

import { IControlElement } from './IFocus';

import { isElementVisible } from 'UICommon/Utils';

let NODE_NODE_TYPE = 1;

interface IFocusElementProps {
   enabled: boolean,
   tabStop: boolean,
   createsContext: boolean,
   tabIndex: number,
   delegateFocusToChildren: boolean,
   tabCycling: boolean
}

interface IProps {
   enabled: boolean;
   createsContext: Record<string, unknown>;
}

const CANDIDATE_SELECTOR = [
   'a[href]',
   'link',
   'button',
   'input',
   'select',
   'textarea',
];
const CLASS_HIDDEN_FLAG = 1;
const CLASS_DISABLED_FLAG = 2;
const CLASS_DELEGATES_TAB_FLAG = 4;
const CLASS_CREATES_CONTEXT = 8;
const CLASS_TAB_CYCLING = 16;
const CLASS_NAME_TO_FLAG = {
   hidden: CLASS_HIDDEN_FLAG,
   disabled: CLASS_DISABLED_FLAG,
   'delegates-tabfocus': CLASS_DELEGATES_TAB_FLAG,
   'creates-context': CLASS_CREATES_CONTEXT,
   'tab-cycling': CLASS_TAB_CYCLING
};

function assert(cond: boolean, msg?: Function): void {
   let message;
   if (!cond) {
      message = typeof msg === 'function' ? msg() : msg;
      throw new Error(message || 'assert');
   }
}

function getStyle(element: Element, style: string): string {
   return window.getComputedStyle(element)[style];
}

// Determines if the passed element can accept focus themselves instead of
// delegating it to children. These are the usual interactive controls
// (buttons, links, inputs) and containers with 'contenteditable'
function canAcceptSelfFocus(element: IControlElement): boolean {
   const tabIndex = element.tabIndex;

   return getTabStopState(element) || (tabIndex !== -1 && element.hasAttribute('contenteditable'));
}

function getTabStopState(element: IControlElement): boolean {
   let tabStopState = false;
   for (let selector = 0; selector < CANDIDATE_SELECTOR.length; selector++) {
      if (element.matches(CANDIDATE_SELECTOR[selector])) {
         tabStopState = true;
         break;
      }
   }
   return tabStopState;
}

const canHasHrefElements = ['a', 'area'];
const canBeDisabledElements = ['input', 'textArea', 'select', 'button'];

// Вычислим подходящий нашей системе фокусов табиндекс, если он не задан явно.
function fixInvalidTabindex(element: HTMLElement, isContentEditable: boolean): number {
   if (isContentEditable) {
      return 0;
   }
   const tagName: string = element.tagName.toLowerCase();
   if (canHasHrefElements.indexOf(tagName) !== -1) {
      return element.getAttribute('href') ? 0 : -1;
   }
   if (canBeDisabledElements.indexOf(tagName) !== -1) {
      return element.getAttribute('disabled') === null ? 0 : -1;
   }
   return -1;
}

export function getElementProps(element: HTMLElement): IFocusElementProps {
   let elementPropsClassRe = /\bws-(hidden|disabled)\b/g;
   let className = element.getAttribute('class');
   let classes;
   let tabIndex;
   let tabIndexAttr;
   let isContentEditable;
   let flags;
   let enabled;
   let result;

   flags = 0;
   while ((classes = className && elementPropsClassRe.exec(className))) {
      flags |= CLASS_NAME_TO_FLAG[classes[1]];
   }

   // todo совместимость! когда уберем совместимость, надо убрать element.getAttribute('ws-creates-context')
   if (element['ws-creates-context'] === 'true' || element.getAttribute('ws-creates-context') === 'true') {
      flags |= CLASS_NAME_TO_FLAG['creates-context'];
   }
   if (element['ws-delegates-tabfocus'] === 'true' || element.getAttribute('ws-delegates-tabfocus') === 'true') {
      flags |= CLASS_NAME_TO_FLAG['delegates-tabfocus'];
   }
   if (element['ws-tab-cycling'] === 'true' || element.getAttribute('ws-tab-cycling') === 'true') {
      flags |= CLASS_NAME_TO_FLAG['tab-cycling'];
   }

   enabled = (flags & (CLASS_HIDDEN_FLAG | CLASS_DISABLED_FLAG)) === 0;
   if (enabled) {
      enabled = getStyle(element, 'display') !== 'none' && getStyle(element, 'visibility') !== 'invisible';
   }
   if (enabled) {
      tabIndexAttr = element.getAttribute('tabindex');
      tabIndex = parseInt(tabIndexAttr, 10);
      if(isNaN(tabIndex)) {
         tabIndex = fixInvalidTabindex(element, isContentEditable);
      }
      isContentEditable = element.getAttribute('contenteditable') === 'true';
      result = {
         enabled: true,
         tabStop:
            (tabIndex >= 0) ||
            (tabIndexAttr === null && getTabStopState(element)) ||
            (tabIndex !== -1 && isContentEditable),
         createsContext: (flags & CLASS_CREATES_CONTEXT) !== 0,
         tabIndex: tabIndex,
         delegateFocusToChildren: ((flags & CLASS_DELEGATES_TAB_FLAG) !== 0 && !isContentEditable),
         tabCycling: (flags & CLASS_TAB_CYCLING) !== 0
      };
   } else {
      result = {
         enabled: false,
         tabStop: false,
         createsContext: false,
         tabIndex: 0,
         delegateFocusToChildren: false,
         tabCycling: false
      };
   }

   return result;
}

function firstElementChild(element: Element): Element | null {
   return element.firstElementChild ? element.firstElementChild : null;
}

function lastElementChild(element: Element): Element | null {
   return element.lastElementChild ? element.lastElementChild : null;
}

function previousElementSibling(element: Element): Element | null {
   return element.previousElementSibling ? element.previousElementSibling : null;
}

function nextElementSibling(element: Element): Element | null {
   return element.nextElementSibling ? element.nextElementSibling : null;
}

/**
 * сравнивает табиндексы по величине
 * @param i1
 * @param i2
 * @returns {number}
 * @param reverse
 */
function compareIndexes(i1: number, i2: number, reverse: boolean): number {
   let res;
   assert(typeof i1 === 'number' && typeof i2 === 'number');

   i1 = i1 === 0 ? Infinity : i1 > 0 ? i1 : -1;
   i2 = i2 === 0 ? Infinity : i2 > 0 ? i2 : -1;

   if (i2 === -1 && i1 !== -1) {
      return 1;
   }
   if (i1 === -1 && i2 !== -1) {
      return -1;
   }

   if (i1 > i2) {
      res = reverse ? -1 : 1;
   } else if (i1 < i2) {
      res = reverse ? 1 : -1;
   } else {
      res = 0;
   }

   return res;
}

function findNextElement(element: Element, props: IProps, reverse: boolean, contextElement: Element): Element {
   let
      stepInto = props.enabled && !props.createsContext,
      next,
      parent;

   if (stepInto) {
      next = reverse ? lastElementChild(element) : firstElementChild(element);
   }

   if (!next) {
      next = reverse ? previousElementSibling(element) : nextElementSibling(element);
      if (!next) {
         parent = element.parentNode;
         while (parent !== contextElement && !next) {
            next = reverse ? previousElementSibling(parent) : nextElementSibling(parent);
            if(!isElementVisible(next)) {
               next = undefined;
            }
            if (!next) {
               parent = parent.parentNode;
            }
         }
      }
   }

   return next || contextElement;
}

function findInner(elem: Element,
                   reverse: boolean,
                   propsGetter: (Element, boolean) => IFocusElementProps,
                   tabbable: boolean = false) {
   return find(elem, undefined, reverse ? 0 : 1, reverse, propsGetter, tabbable);
}

function startChildElement(parent, reverse) {
   return reverse ? lastElementChild(parent) : firstElementChild(parent);
}

/**
 * Обходит DOM, обход осуществляется в пределах rootElement. При этом если находит элемент, в который может провалиться,
 * проваливается и ищет там.
 */
function find(contextElement: Element,
              fromElement: Element | null,
              fromElementTabIndex: number,
              reverse: boolean,
              propsGetter:(Element, boolean) => IFocusElementProps,
              tabbable: boolean = false): HTMLElement {
   assert(
      contextElement &&
      (fromElement || fromElementTabIndex !== undefined) &&
      propsGetter &&
      contextElement !== fromElement
   );

   let
      next,
      nextProps,
      stage,
      result,
      cmp,
      props,
      nearestElement = null,
      nearestTabIndex = null,
      foundDelegated,
      savedDelegated;

   if (fromElement) {
      props = propsGetter(fromElement, tabbable);
      fromElementTabIndex = props.tabIndex;
      next = findNextElement(fromElement, props, reverse, contextElement);
   } else {
      next = reverse ? lastElementChild(contextElement) : firstElementChild(contextElement);
      next = next || contextElement;
   }

   function canDelegate(next, nextProps) {
      if (nextProps.delegateFocusToChildren && next.childElementCount) {
         if (next.wsControl && next.wsControl.canAcceptFocus && next.wsControl.canAcceptFocus()) {
            // todo костыль для совместимости, чтобы когда старый компонент внутри нового окружения, он мог принять фокус
            foundDelegated = next;
         } else {
            foundDelegated = findInner(next, reverse, propsGetter, tabbable);
         }
      }
      // элемент может принять фокус только если он не делегирует внутрь
      // или сам является фокусируемем элементом (тогда игнорируем флаг делегации внутрь, некуда там делегировать)
      // или делегирует внутрь и внутри есть что сфокусировать (тогда он делегирует фокус внутрь)
      return !!(
         !nextProps.delegateFocusToChildren ||
         canAcceptSelfFocus(next) ||
         foundDelegated
      );
   }

   let startFromFirst = false;
   for (stage = 0; stage !== 2 && !result; stage++) {
      while (next !== contextElement && next !== fromElement && !result) {
         nextProps = propsGetter(next, tabbable);

         if (nextProps.enabled && nextProps.tabStop) {
            cmp = compareIndexes(nextProps.tabIndex, fromElementTabIndex, reverse);
            if (cmp === 0 && stage === 0) {
               // если индекс совпал, мы уже нашли то что надо
               if (canDelegate(next, nextProps)) {
                  result = next;
                  savedDelegated = foundDelegated;
               }
            } else if (cmp > 0) {
               // обновляем ближайший, если ti у next больше fromElement.ti, но меньше ti ближайшего
               if (!result) {
                  // проверяем только если еще нет result
                  if (stage === 0) {
                     if (
                        nearestElement === null ||
                        compareIndexes(nextProps.tabIndex, nearestElement.tabIndex, reverse) < 0
                     ) {
                        if (canDelegate(next, nextProps)) {
                           nearestElement = next;
                           nearestTabIndex = nextProps.tabIndex;
                           savedDelegated = foundDelegated;
                        }
                     }
                  } else {
                     if (
                        nearestElement === null ||
                        compareIndexes(nextProps.tabIndex, nearestElement.tabIndex, reverse) < 0 ||
                        (startFromFirst && compareIndexes(nextProps.tabIndex, nearestElement.tabIndex, reverse) <= 0)
                     ) {
                        if (canDelegate(next, nextProps)) {
                           nearestElement = next;
                           nearestTabIndex = nextProps.tabIndex;
                           savedDelegated = foundDelegated;

                           startFromFirst = false;
                        }
                     }
                  }
               }
            }
         }

         // нативно так, если уходим с элемента с табиндексом -1, ищем любой первый элемент https://jsfiddle.net/2v4eq4rn/
         if (fromElementTabIndex === -1 && nearestElement) {
            result = nearestElement;
         }

         if (!result) {
            next = findNextElement(next, nextProps, reverse, contextElement);
            // if (stage === 0 && !next) { // todo ?? findNextElement
            //    next = contextElement;
            // }
         }
      }

      if (next === contextElement && stage === 0) {
         // завершение stage=0, элемент не найден
         if (
            fromElement &&
            ((reverse === false && fromElementTabIndex > 0) ||
               (reverse === true && fromElementTabIndex !== 1 && fromElementTabIndex !== -1))
         ) {
            next = startChildElement(contextElement, reverse);
         }
      }
      if (stage === 0) {
         startFromFirst = true;
      }
   }

   assert(!!result || next === fromElement || next === contextElement);

   if (!result && nearestElement) {
      // assert(fromElementTabIndex > 0 || (reverse && fromElementTabIndex === 0));
      if (nearestTabIndex >= 0) {
         result = nearestElement;
      }
   }

   // ищем подходящий элемент для всех элементов, пока можем проваливаться внутрь нового контекста
   if (result && savedDelegated) {
      result = savedDelegated;
      assert(!!result);
   }

   return result;
}

export function findFirstInContext(contextElement: Element,
                                   reverse: boolean,
                                   propsGetter:(Element, boolean) => IFocusElementProps = getElementProps,
                                   tabbable : boolean = false): HTMLElement {
   return find(contextElement, undefined, reverse ? 0 : 1, reverse, propsGetter, tabbable);
}

function getValidatedWithContext(element: Element,
                                 rootElement: Element,
                                 propsGetter: (Element, boolean) => IFocusElementProps,
                                 tabbable: boolean = false): {element: Element, context: Element} {
   let
      context,
      lastInvalid = null,
      validatedElement,
      parent = element;

   while (parent && parent !== rootElement) {
      if (!propsGetter(parent, tabbable).enabled) {
         lastInvalid = parent;
      }
      parent = parent.parentElement;
   }

   if (!parent) {
      throw new Error('Узел fromElement должен лежать внутри узла rootElement');
   }
   // ASSERT: !!parent

   validatedElement = lastInvalid || element;

   if (validatedElement !== rootElement) {
      parent = validatedElement.parentElement;
      while (parent !== rootElement && !propsGetter(parent, tabbable).createsContext) {
         parent = parent.parentElement;
      }
      context = parent;
   }

   return {
      element, // разрешённый/запрещённый, и лежит в разрешённой иерархии, лежит точно в элементе context
      context // разрешённый, и лежит в разрешённой иерархии
   };
}


function checkElement(element: Element, paramName: string): void {
   // разрешаются только рутовые элементы, у которых есть parentElement или они являются  documentElement
   let hasParentElement = element === document.documentElement || !!element.parentElement;
   if (!element || !element.ownerDocument || !hasParentElement || element.nodeType !== NODE_NODE_TYPE) {
      throw new Error('Плохой параметр ' + paramName);
   }
}

/**
 * ищем следующий элемент в обходе, с учетом того, что у некоторых элементов может быть свой контекст табиндексов
 */
export function findWithContexts(rootElement: Element,
                                 fromElement: Element,
                                 reverse: boolean,
                                 propsGetter:(Element, boolean) => IFocusElementProps = getElementProps,
                                 tabbable: boolean = false): IControlElement {

   checkElement(fromElement, 'fromElement');
   checkElement(rootElement, 'rootElement');

   let
      validated = getValidatedWithContext(fromElement, rootElement, propsGetter, tabbable),
      result = validated.element;

   if (result !== rootElement) {
      do {
         result = find(validated.context,
            validated.element,
            undefined,
            reverse,
            propsGetter,
            tabbable);
         if (!result) {
            if (propsGetter(validated.context, tabbable).tabCycling) {
               break;
            } else {
               validated = getValidatedWithContext(validated.context, rootElement, propsGetter, tabbable);
            }
         }
      } while (!result && validated.element !== rootElement);
   }

   // прокомментить
   if (result === rootElement) {
      result = findFirstInContext(rootElement, reverse, propsGetter, tabbable);
   }

   // прокомментить
   if (!result && propsGetter(validated.context || rootElement, tabbable).tabCycling) {
      result = findFirstInContext(validated.context || rootElement, reverse, propsGetter, tabbable);
      if (result === undefined) {
         result = fromElement;
      }
   }

   return result as IControlElement;
}
