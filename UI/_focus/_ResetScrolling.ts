/// <amd-module name="UI/_focus/_ResetScrolling" />
/* tslint:disable */

/**
 * @author Кондаков Р.Н.
 * Модуль, в котором находится логика по отмене скролла, который произошел в результате фокусировки
 */
type TInput = NodeList | Element | HTMLCollection | Node[] | string | void;

// input may be undefined, selector-tring, Node, NodeList, HTMLCollection, array of Nodes
// yes, to some extent this is a bad replica of jQuery's constructor function
function nodeArray(input: TInput) {
   if (!input) {
      return [];
   }

   if (Array.isArray(input)) {
      return input;
   }

   // instanceof Node - does not work with iframes
   if ((input as Node).nodeType !== undefined) {
      return [input];
   }

   if (typeof input === 'string') {
      input = document.querySelectorAll(input);
   }

   if ((input as HTMLCollection).length !== undefined) {
      return [].slice.call(input, 0);
   }

   throw new TypeError('unexpected input ' + String(input));
}

function contextToElement({
                             context,
                             label = 'context-to-element',
                             resolveDocument,
                             defaultToDocument
                          }: {
   context: Element,
   label: string,
   resolveDocument: boolean,
   defaultToDocument: boolean
}) {
   let element = nodeArray(context)[0];

   if (resolveDocument && element && element.nodeType === Node.DOCUMENT_NODE) {
      element = element.documentElement;
   }

   if (!element && defaultToDocument) {
      return document.documentElement;
   }

   if (!element) {
      throw new TypeError(label + ' requires valid options.context');
   }

   if (element.nodeType !== Node.ELEMENT_NODE && element.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
      throw new TypeError(label + ' requires options.context to be an Element');
   }

   return element;
}

// [elem, elem.parent, elem.parent.parent, �, html]
// will not contain the shadowRoot (DOCUMENT_FRAGMENT_NODE) and shadowHost
function getParents({ context }: {context: Element}) {
   const list = [];
   let element = contextToElement({
      label: 'get/parents',
      context,
      resolveDocument: false,
      defaultToDocument: false
   });

   while (element) {
      list.push(element);
      // IE does know support parentElement on SVGElement
      element = element.parentNode;
      if (element && element.nodeType !== Node.ELEMENT_NODE) {
         element = null;
      }
   }

   return list;
}

export function collectScrollPositions(element) {
   const parents = getParents({context: element});
   const list = parents.slice(1).map((element) => {
      return {
         element,
         scrollTop: element.scrollTop,
         scrollLeft: element.scrollLeft
      };
   });

   return function resetScrollPositions() {
      list.forEach((entry) => {
         entry.element.scrollTop = entry.scrollTop;
         entry.element.scrollLeft = entry.scrollLeft;
      });
   };
}
