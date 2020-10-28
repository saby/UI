/// <amd-module name="UI/_builder/Tmpl/core/Context" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Context.ts
 */

import { IdentifierNode, ProgramNode, Walker } from 'UI/_builder/Tmpl/expressions/_private/Nodes';

// <editor-fold desc="Public interfaces and functions">

export interface IProcessingContext {
   declareIdentifier(name: string): void;
   getIdentifiers(): string[];

   registerProgram(program: ProgramNode): void;
   getProgramIdentifiers(): string[];
   getProgram(id: string | null): ProgramNode | null;
   getPrograms(): ProgramNode[];
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

interface IProgramStorage {
   [id: string]: ProgramNode;
}

interface IProgramStorageMap {
   [program: string]: string;
}

declare type IContext = IProcessingContext & IPrivateProcessingContext;

const PROGRAM_PREFIX = '_$e';

function hasBindings(program: ProgramNode): boolean {
   if (typeof program.string !== 'string') {
      return false;
   }
   return program.string.indexOf('|mutable') > -1 || program.string.indexOf('|bind') > -1;
}

function canRegisterProgram(program: ProgramNode): boolean {
   // Do not register program with bind and mutable decorators
   return !hasBindings(program);
}

// </editor-fold>

// <editor-fold desc="Program walkers">

const SCOPE_FILE_NAME = '[[Internal.scope]]';

function collectIdentifiers(program: ProgramNode): string[] {
   const result: string[] = [];
   const callbacks = {
      Identifier: (node: IdentifierNode): void => {
         result.push(node.name);
      }
   };
   const walker = new Walker(callbacks);
   program.accept(walker, {
      fileName: SCOPE_FILE_NAME
   });
   return result;
}

// </editor-fold>

class ProcessingContext implements IContext {

   // <editor-fold desc="Context properties">

   private idCounter: number;

   private readonly identifiers: string[];

   private readonly programs: IProgramStorage;
   private readonly programsMap: IProgramStorageMap;

   // </editor-fold>

   constructor() {
      this.idCounter = 0;
      this.identifiers = [];
      this.programs = { };
      this.programsMap = { };
   }

   // <editor-fold desc="Public interface implementation">

   declareIdentifier(name: string): void {
      if (this.hasIdentifier(name)) {
         throw new Error(`Переменная "${name}" уже определена`);
      }
      this.addIdentifier(name);
   }

   getIdentifiers(): string[] {
      return this.identifiers;
   }

   registerProgram(program: ProgramNode): void {
      if (!canRegisterProgram(program)) {
         return;
      }
      const identifiers = collectIdentifiers(program);
      // Do not register program without identifiers.
      if (identifiers.length === 0) {
         return;
      }
      this.addProgram(program);
      this.addIdentifiers(identifiers);
   }

   getProgramIdentifiers(): string[] {
      return Object.keys(this.programs);
   }

   getProgram(id: string | null): ProgramNode | null {
      if (id === null) {
         return null;
      }
      if (this.programs.hasOwnProperty(id)) {
         return this.programs[id];
      }
      throw new Error(`Выражение с идентификатором "${id}" не было зарегистрировано`);
   }

   getPrograms(): ProgramNode[] {
      const expressions: ProgramNode[] = [];
      for (const id in this.programs) {
         expressions.push(this.programs[id]);
      }
      return expressions;
   }

   // </editor-fold>

   // <editor-fold desc="Internal interface implementation">

   generateNextId(): string {
      return this.getNextId();
   }

   addIdentifier(name: string): void {
      this.identifiers.push(name);
   }

   // </editor-fold>

   // <editor-fold desc="Private methods">

   private getNextId(): string {
      return `${PROGRAM_PREFIX}${this.idCounter++}`;
   }

   private addProgram(program: ProgramNode): void {
      const source = program.string;
      if (this.programsMap.hasOwnProperty(source)) {
         return;
      }
      const id = this.getNextId();
      this.programsMap[source] = id;
      this.programs[id] = program;
   }

   private addIdentifiers(names: string[]): void {
      names.forEach((name: string) => {
         if (this.hasIdentifier(name)) {
            return;
         }
         this.addIdentifier(name);
      });
   }

   private hasIdentifier(name: string): boolean {
      return this.identifiers.indexOf(name) > -1;
   }

   // </editor-fold>
}
