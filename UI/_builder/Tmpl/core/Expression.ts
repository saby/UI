/// <amd-module name="UI/_builder/Tmpl/core/Expression" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Expression.ts
 */

import { ProgramNode } from 'UI/_builder/Tmpl/expressions/_private/Nodes';

export interface IExpressionRegistrar {
   registerExpression(node: ProgramNode): string;
   getExpression(id: string): ProgramNode;
   commitProcessing(ids: string[]): void;
   finalize(): void;
}

export function createExpressionRegistrar(): IExpressionRegistrar {
   return new ExpressionRegistrar();
}

interface IExpressionStorage {
   [id: string]: ProgramNode;
}

interface IExpressionDescription {
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
    * Expressions descriptions (unique id -> description)
    */
   private readonly descriptions: IExpressionDescriptions;

   /**
    * Expression unique id counter.
    */
   private counter: number;

   constructor() {
      this.storage = { };
      this.descriptions = { };
      this.counter = 0;
   }

   registerExpression(node: ProgramNode): string {
      const id = `${EXPRESSION_PREFIX}${this.counter++}`;
      this.storage[id] = node;
      this.descriptions[id] = {
         isProcessed: false
      };
      return id;
   }

   getExpression(id: string): ProgramNode {
      if (id === null) {
         return null;
      }
      return this.storage[id];
   }

   commitProcessing(ids: string[]): void {
      ids.forEach((id: string) => {
         this.descriptions[id].isProcessed = true;
      });
   }

   finalize(): void {
      const unprocessedIds: string[] = [];
      for (const id in this.descriptions) {
         if (!this.descriptions[id].isProcessed) {
            unprocessedIds.push(`(${id} -> ${this.storage[id].string})`);
         }
      }
      if (unprocessedIds.length > 0) {
         throw new Error(`Внутренняя ошибка шаблонизатора. Обнаружены выражения, которые не были вычислены: ${unprocessedIds.join(',')}`);
      }
   }
}
