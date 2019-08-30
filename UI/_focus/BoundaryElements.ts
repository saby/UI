/// <amd-module name="UI/_focus/BoundaryElements" />
/* tslint:disable */

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
      const focusInNode = Inferno.createVNode(Inferno.getFlagsForElementVnode('a'), 'a', 'vdom-focus-in', [], 0, {
         class: 'vdom-focus-in',
         tabindex: '1'
      }, 'vdom-focus-in', hookOut);
      const focusOutNode = Inferno.createVNode(Inferno.getFlagsForElementVnode('a'), 'a', 'vdom-focus-out', [], 0, {
         class: 'vdom-focus-out',
         tabindex: '0'
      }, 'vdom-focus-out', hookOut);

      vnode.children = [].concat(focusInNode, vnode.children, focusOutNode);
   }
}

export function insertBoundaryElements(environment, vnode) {
   const dom = vnode.dom || environment._rootDOMNode;
   if (dom === environment._rootDOMNode && environment._rootDOMNode.tagName !== 'HTML' || vnode.type === 'body') {
      appendFocusesElements(environment, vnode);
   }
}

