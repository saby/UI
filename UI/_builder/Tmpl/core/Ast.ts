/// <amd-module name="UI/_builder/Tmpl/core/Ast" />

/**
 * @author Крылов М.А.
 */

import { ProgramNode } from 'UI/_builder/Tmpl/expressions/_private/Nodes';
import { IParser } from 'UI/_builder/Tmpl/expressions/_private/Parser';
import { replaceMatch } from '../expressions/_private/Statement';

export interface IAstVisitor {
   visitFor(node: ForNode, context: any): any;
   visitForeach(node: ForeachNode, context: any): any;
}

export enum Flags {
   BROKEN = 1,
   UNPACKED = 2,
   REPAIRED = 4
}

export abstract class Ast {
   flags: Flags;
   key: string;

   protected constructor(flags: Flags = 0) {
      this.flags = flags;
      this.key = '';
   }

   abstract accept(visitor: IAstVisitor, context: any): any;
}

export interface IForSource {
   START_FROM: any;
   CUSTOM_CONDITION: any;
   CUSTOM_ITERATOR: any;
}

export class ForNode extends Ast {

   forSource: IForSource;

   constructor(attribs: IForSource) {
      super();
      this.forSource = attribs;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitFor(this, context);
   }

   static createNode(data: string, parser: IParser): ForNode {
      const forArgs = data.split(';');
      const forSource = {
         START_FROM: replaceMatch({ data: forArgs[0] }),
         CUSTOM_CONDITION: replaceMatch({ data: forArgs[1] }),
         CUSTOM_ITERATOR: replaceMatch({ data: forArgs[2] })
      };
      return new ForNode(forSource);
   }
}

export interface IForeachSource {
   key: string;
   value: string;
   main: ProgramNode;
}

function createForConfig(key: string, value: string, main: ProgramNode): IForeachSource {
   return {
      key,
      value,
      main
   };
}

function findForAllArguments(value: string, main: ProgramNode): IForeachSource {
   var crStringArray = value.split(' as '),
      entityWhichIterates = crStringArray[0],
      key;
   if (crStringArray.length > 1) {
      entityWhichIterates = crStringArray[1];
      key = crStringArray[0];
   } else {
      crStringArray = value.replace(/\s/g, "").split(',');
      if (crStringArray.length > 1) {
         entityWhichIterates = crStringArray[1];
         key = crStringArray[0];
      }
   }
   return createForConfig(key, entityWhichIterates, main);
}

export class ForeachNode extends Ast {

   forSource: IForeachSource;

   constructor(forSource: IForeachSource) {
      super();
      this.forSource = forSource;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitForeach(this, context);
   }

   static createNode(data: string, parser: IParser): ForeachNode {
      const forStampArguments = data.split(' in ');
      const forSource = findForAllArguments(forStampArguments[0], parser.parse(forStampArguments[1]));
      return new ForeachNode(forSource);
   }
}

export function createCycleNode(data: string, parser: IParser): ForNode | ForeachNode {
   if (data.indexOf(';') > -1) {
      return ForNode.createNode(data, parser);
   }
   return ForeachNode.createNode(data, parser);
}
