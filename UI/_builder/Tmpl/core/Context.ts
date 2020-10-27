/// <amd-module name="UI/_builder/Tmpl/core/Context" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Context.ts
 */

import { ProgramNode } from 'UI/_builder/Tmpl/expressions/_private/Nodes';

// <editor-fold desc="Public interfaces and functions">

export interface IProcessingContext {
   declareIdentifier(name: string): void;
   getIdentifiers(): string[];

   registerProgram(program: ProgramNode): void;

   getPrograms(): ProgramNode[];
   getProgram(id: string): ProgramNode;
}

export function createProcessingContext(): IProcessingContext {
   return new ProcessingContext();
}

// </editor-fold>

// <editor-fold desc="Internal interfaces and functions">

interface IPrivateProcessingContext {
   generateNextId(): string;
   addIdentifier(name: string): void;
}

declare type IContext = IProcessingContext & IPrivateProcessingContext;

// </editor-fold>

class ProcessingContext implements IContext {

   // <editor-fold desc="Public interface implementation">

   declareIdentifier(name: string): void {
      throw new Error('Not implemented yet');
   }

   getIdentifiers(): string[] {
      throw new Error('Not implemented yet');
   }

   registerProgram(program: ProgramNode): void {
      throw new Error('Not implemented yet');
   }

   getPrograms(): ProgramNode[] {
      throw new Error('Not implemented yet');
   }

   getProgram(id: string): ProgramNode {
      throw new Error('Not implemented yet');
   }

   // </editor-fold>

   // <editor-fold desc="Internal interface implementation">

   generateNextId(): string {
      throw new Error('Not implemented yet');
   }

   addIdentifier(name: string): void {
      throw new Error('Not implemented yet');
   }

   // </editor-fold>
}
