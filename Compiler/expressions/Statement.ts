/**
 * @deprecated
 * @description Represents mustache expression wrappers.
 * @author Крылов М.А.
 */

import { Parser } from './Parser';
import { ProgramNode } from './Nodes';

export class BaseNode {
   type: string;
   value: string;

   constructor(type: string, value: string) {
      this.type = type;
      this.value = value;
   }
}

export class VariableNode extends BaseNode {
   name: ProgramNode;
   localized: boolean;
   // FIXME: wtf
   noEscape: boolean;

   isEvent: boolean;
   isBind: boolean;

   constructor(name: ProgramNode, localized: boolean, value: string) {
      super('var', value);
      this.name = name;
      this.localized = localized;
      this.noEscape = false;

      this.isEvent = false;
      this.isBind = false;
   }
}

export class TextNode extends BaseNode {
   constructor(value: string) {
      super('text', value);
   }
}

export class LocalizationNode extends BaseNode {
   name: string;
   localized: boolean;

   constructor(name: string) {
      super('var', undefined);
      this.name = name;
      this.localized = true;
   }
}

export function isStaticString(data: string): boolean {
   return !!(data && data.indexOf('{{') === -1);
}

/**
 * @deprecated
 */
export function processProperty(property: string): VariableNode {
   return new VariableNode(new Parser().parse(property), false, '');
}