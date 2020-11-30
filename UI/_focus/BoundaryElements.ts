/// <amd-module name="UI/_focus/BoundaryElements" />
/* tslint:disable */

/**
 * @author Тэн В.А.
 * В этом модуле содержится логика работы с элементами vdom-focus-in и vdom-focus-out
 */


import { VNode, createVNode, getFlagsForElementVnode } from 'Inferno/third-party/index';
import { IDOMEnvironment } from './Events';

interface IExtendedEvent extends Event {
   relatedTarget: Element | null;
   target: IExtendedEventTarget | null
}

interface IExtendedEventTarget extends EventTarget {
   className: string | null;
}

/**
 * check if container contains element strictly (container and element are not equal)
 */
function isContainsStrict(container: Element, element: Element): boolean {
   return container.contains(element) && container !== element;
}

function findFirstVNode(arr: VNode[]): VNode | null {
   if (!Array.isArray(arr)) {
      return null;
   }
   return arr.find(function(value) {
      return !!value;
   });
}

function fireEvent(e: IExtendedEvent): void {
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

function appendFocusesElements(environment: IDOMEnvironment, vnode: VNode): void {
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
      const focusInNode = createVNode(getFlagsForElementVnode('a'), 'a', 'vdom-focus-in', [], 0, {
         class: 'vdom-focus-in',
         tabindex: '1'
      }, 'vdom-focus-in', hookOut);
      const focusOutNode = createVNode(getFlagsForElementVnode('a'), 'a', 'vdom-focus-out', [], 0, {
         class: 'vdom-focus-out',
         tabindex: '0'
      }, 'vdom-focus-out', hookOut);

      vnode.children = [].concat(focusInNode, vnode.children, focusOutNode);
   }
}

export function insertBoundaryElements(environment: IDOMEnvironment, vnode: VNode): void {
   const dom = vnode.dom || environment._rootDOMNode;
   if (vnode.type === 'html') {
      for (var i = 0; i < vnode.children.length; i++) {
         if (vnode.children[i].type === 'body') {
            appendFocusesElements(environment, vnode.children[i]);
            return;
         }
      }
   }
   if (dom === environment._rootDOMNode && environment._rootDOMNode.tagName !== 'HTML' || vnode.type === 'body') {
      appendFocusesElements(environment, vnode);
   }
}

