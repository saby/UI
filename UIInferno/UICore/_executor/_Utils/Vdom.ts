/// <amd-module name="UICore/_executor/_Utils/Vdom" />

/* tslint:disable:no-string-literal */

/**
 * @author Тэн В.А.
 */

import {
   InfernoText, VNode, ChildFlags, TKey,
   getFlagsForElementVnode, createVNode, createTextVNode
} from 'Inferno/third-party/index';

function getChildFlags(children: VNode['children'], key: TKey): ChildFlags {
   if (Array.isArray(children) && children.length > 0) {
      if (key !== undefined) {
         return 8 /* HasKeyedChildren */;
      }
      return 4 /* HasNonKeyedChildren */;
   }
   return 0 /* UnknownChildren */;
}

/**
 * Create virtual node of html element.
 * @param tagName Html element name.
 * @param hprops Wasaby properties collection.
 * @param children Children virtual nodes collection.
 * @param key Virtual node key.
 * @param ref Hook function.
 */
export function htmlNode(
   tagName: VNode['type'],
   hprops: VNode['hprops'],
   children: VNode['children'],
   key: VNode['key'],
   ref?: VNode['ref']
): VNode {
   const flags = getFlagsForElementVnode(tagName);
   const className = (hprops && hprops.attributes && hprops.attributes['class']) || '';
   const childFlags = getChildFlags(children, key);
   const vnode = createVNode(
      flags,
      tagName,
      className,
      children,
      childFlags,
      hprops.attributes,
      key,
      ref);
   vnode.hprops = hprops;
   return vnode;
}

/**
 * Create virtual text node.
 * @param text Text data.
 * @param key Virtual node key.
 */
export function textNode(text: InfernoText, key?: TKey): VNode {
   return createTextVNode(text, key);
}

// TODO: Describe virtual wasaby control node.
export function controlNode(controlClass: any, controlProperties: any, key: any): any {
   return {
      controlClass,
      controlProperties,
      key,
      controlNodeIdx: -1
   };
}
