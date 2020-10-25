/// <amd-module name="UI/_builder/Tmpl/core/Expression" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Expression.ts
 */

import { ProgramNode } from 'UI/_builder/Tmpl/expressions/_private/Nodes';

export interface IExpressionRegistrar {
   registerExpression(node: ProgramNode): string;
   registerProcessing(id: string): void;
   isRegisteredExpression(id: string): boolean;
   needCalculateExpression(id: string): boolean;
   getExpression(id: string): ProgramNode;
   getIdentifiersToProcess(): string[];
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

interface IExpressionDescription {
   usages: number;
   isProcessed: boolean;
}

interface IExpressionDescriptions {
   [id: string]: IExpressionDescription;
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

   /**
    * Expressions descriptions (unique id -> description)
    */
   private readonly descriptions: IExpressionDescriptions;

   /**
    * Expression unique id counter.
    */
   private counter: number;

   constructor() {
      this.storage = { };
      this.map = { };
      this.descriptions = { };
      this.counter = 0;
   }

   registerExpression(node: ProgramNode): string {
      const rawExpression: string = node.string;
      if (this.map.hasOwnProperty(rawExpression)) {
         return this.map[rawExpression];
      }
      return this.addExpression(node);
   }

   registerProcessing(id: string): void {
      if (id === null) {
         return;
      }
      ++this.descriptions[id].usages;
   }

   needCalculateExpression(id: string): boolean {
      if (id === null) {
         return true;
      }
      return this.descriptions[id].usages === 0;
   }

   getExpression(id: string): ProgramNode {
      if (id === null) {
         return null;
      }
      return this.storage[id];
   }

   isRegisteredExpression(id: string): boolean {
      if (id === null) {
         return false;
      }
      return !!this.storage[id];
   }

   getIdentifiersToProcess(): string[] {
      const ids: string[] = [];
      for (const id in this.descriptions) {
         const item = this.descriptions[id];
         if (!item.isProcessed && item.usages > 0) {
            ids.push(id);
            item.isProcessed = true;
         }
      }
      return ids;
   }

   private addExpression(node: ProgramNode): string {
      const id = `${EXPRESSION_PREFIX}${this.counter++}`;
      const rawExpression: string = node.string;
      this.map[rawExpression] = id;
      this.storage[id] = node;
      this.descriptions[id] = {
         usages: 0,
         isProcessed: false
      };
      return id;
   }
}
