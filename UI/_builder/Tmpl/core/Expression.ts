/// <amd-module name="UI/_builder/Tmpl/core/Expression" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Expression.ts
 */

import { ProgramNode } from 'UI/_builder/Tmpl/expressions/_private/Nodes';

export interface IExpressionRegistrar {
   registerExpression(node: ProgramNode): string;
}

export function createExpressionRegistrar(): IExpressionRegistrar {
   return new ExpressionRegistrar();
}

interface IExpressionStorage {
   [id: string]: ProgramNode;
}

interface IExpressionMap {
   [expression: string]: string;
}

const EXPRESSION_PREFIX = '_$e';

class ExpressionRegistrar implements IExpressionRegistrar {

   /**
    * Expressions storage (unique id -> program node).
    */
   private readonly storage: IExpressionStorage;

   /**
    * Expressions map (string expression -> unique id)
    */
   private readonly map: IExpressionMap;

   private counter: number;

   constructor() {
      this.storage = { };
      this.map = { };
      this.counter = 0;
   }

   registerExpression(node: ProgramNode): string {
      const rawExpression: string = node.string;
      if (this.map.hasOwnProperty(rawExpression)) {
         return this.map[rawExpression];
      }
      return this.addExpression(node);
   }

   private addExpression(node: ProgramNode): string {
      const id = `${EXPRESSION_PREFIX}${this.counter++}`;
      const rawExpression: string = node.string;
      this.map[rawExpression] = id;
      this.storage[id] = node;
      return id;
   }
}
