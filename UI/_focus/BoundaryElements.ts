/// <amd-module name="UI/_focus/BoundaryElements" />
/* tslint:disable */

import { Vdom } from 'View/Executor/Utils';
// @ts-ignore
import * as Inferno from 'Inferno/third-party/index.dev';

/**
 * check if container contains element strictly (container and element are not equal)
 */
function isContainsStrict(container: Element, element: Element): boolean {
   return container.contains(element) && container !== element;
}

function findFirstVNode(arr: Array<any>): Array<any> {
   if (!Array.isArray(arr)) {
      return null;
   }
   return arr.find(function(value) {
      return !!value;
   });
}

function fireEvent(e) {
   if (!this._rootDOMNode) {
      return;
   }

   let
      relatedTarget = e.relatedTarget || document.body,
      target = e.target;

   // If the 'focus' event fired from the tab event on vdom-focus-in or vdom-focus-out,
   // we can get the correct related target from _isTabPressed. relatedTarget given
   // by the browser could be wrong if the focus handler is called asynchronously
   if (this._isTabPressed && this._isTabPressed.tabTarget) {
      relatedTarget = this._isTabPressed.tabTarget;
   }

   const evt = document.createEvent('Events') as any;
   evt.initEvent('keydown', true, true);

   let shifted = false;
   if (target.className === 'vdom-focus-in') {
      if (isContainsStrict(this._rootDOMNode, relatedTarget)) {
         // в vdom-focus-in прилетели либо изнутри контейнера, либо сверху потому что зациклились, shift - только если изнутри
         if (!(relatedTarget.classList.contains('vdom-focus-out') && this._rootDOMNode['ws-tab-cycling'] === 'true')) {
            shifted = true;
         }
      }
   }
   if (target.className === 'vdom-focus-out') {
      if (!isContainsStrict(this._rootDOMNode, relatedTarget)) {
         // в vdom-focus-out прилетели либо снаружи контейнера, либо снизу потому что зациклились, shift - и если снаружи и если зациклились
         shifted = true;
      }
   }

   evt.view = window;
   evt.altKey = false;
   evt.ctrlKey = false;
   evt.shiftKey = shifted;
   evt.metaKey = false;
   evt.keyCode = 9;

   target.dispatchEvent(evt);
}

/**
 * We have to find focus elements, that belongs to the specific rootNode
 * @param elem
 * @param cssClass
 * @returns {*}
 */
function findDirectChildren(elem, cssClass) {
   return Array.prototype.filter.call(elem.children, function(el) { return el.matches(cssClass); });
}

/**
 * We have to insert focus elements are already in the DOM,  before virtual dom synchronization
 * @param rootElement
 */
function appendFocusElementsToDOM(rootElement) {
   const firstChild = rootElement.firstChild;
   if (firstChild && firstChild.classList && !firstChild.classList.contains('vdom-focus-in')) {
      const vdomFocusInElems = findDirectChildren(rootElement, '.vdom-focus-in');
      const vdomFocusOutElems = findDirectChildren(rootElement, '.vdom-focus-out');
      const focusInElem = vdomFocusInElems.length ? vdomFocusInElems[0] : document.createElement('a');
      focusInElem.classList.add('vdom-focus-in');
      (focusInElem as any).tabIndex = 1;
      const focusOutElem = vdomFocusOutElems.length ? vdomFocusOutElems[0] : document.createElement('a');
      focusOutElem.classList.add('vdom-focus-out');
      (focusOutElem as any).tabIndex = 0;
      rootElement.insertBefore(focusInElem, firstChild);
      rootElement.appendChild(focusOutElem);
      return true;
   }

   return false;
}

function appendFocusesElements(environment, vnode) {
   const firstChild = findFirstVNode(vnode.children),
      fireTab = function(e) {
         fireEvent.call(environment, e);
      },
      hookOut = function hookOut(node) {
         if (node) {
            node.addEventListener('focus', fireTab);
         }
      };
   // добавляем ноды vdom-focus-in и vdom-focus-out тольео если есть какие-то внутренние ноды
   if (firstChild && firstChild.key !== 'vdom-focus-in') {
      const focusInNode = Vdom.htmlNode(
         'a',
         {
            attributes: { class: 'vdom-focus-in', tabindex: '1' }
         },
         [],
         'vdom-focus-in',
         hookOut
      );
      const focusOutNode = Vdom.htmlNode(
         'a',
         {
            attributes: { class: 'vdom-focus-out', tabindex: '0' }
         },
         [],
         'vdom-focus-out',
         hookOut
      );

      vnode.children = [].concat(focusInNode, vnode.children, focusOutNode);
      return true;
   }

   return false;
}

export function insertBoundaryElements(environment, vnode) {
   const dom = vnode.dom || environment._rootDOMNode;
   if (dom === environment._rootDOMNode && environment._rootDOMNode.tagName !== 'HTML' || vnode.type === 'body') {
      if (vnode && vnode.children) {
         var appendedElements = appendFocusesElements(environment, vnode);
         if (appendedElements) {
            appendFocusElementsToDOM(environment._rootDOMNode);
         }
      }
   }
}

