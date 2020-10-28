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
   getProgramKeys(): string[];
   getProgram(key: string | null): ProgramNode | null;
   getPrograms(): ProgramNode[];
}

export function createProcessingContext(): IProcessingContext {
   return new ProcessingContext();
}

// </editor-fold>

// <editor-fold desc="Internal interfaces and functions">

interface IPrivateProcessingContext {
   generateNextKey(): string;
   addIdentifier(name: string): void;
}

interface IProgramStorage {
   [key: string]: ProgramNode;
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

   private keysCounter: number;

   private readonly identifiers: string[];

   private readonly programs: IProgramStorage;
   private readonly programsMap: IProgramStorageMap;

   // </editor-fold>

   constructor() {
      this.keysCounter = 0;
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

   getProgramKeys(): string[] {
      return Object.keys(this.programs);
   }

   getProgram(key: string | null): ProgramNode | null {
      if (key === null) {
         return null;
      }
      if (this.programs.hasOwnProperty(key)) {
         return this.programs[key];
      }
      throw new Error(`Выражение с ключом "${key}" не было зарегистрировано`);
   }

   getPrograms(): ProgramNode[] {
      // @ts-ignore This function exists on Object constructor and it has polyfill.
      return Object.values(this.programs);
   }

   // </editor-fold>

   // <editor-fold desc="Internal interface implementation">

   generateNextKey(): string {
      return this.getNextId();
   }

   addIdentifier(name: string): void {
      this.identifiers.push(name);
   }

   // </editor-fold>

   // <editor-fold desc="Private methods">

   private getNextId(): string {
      return `${PROGRAM_PREFIX}${this.keysCounter++}`;
   }

   private addProgram(program: ProgramNode): void {
      const source = program.string;
      if (this.programsMap.hasOwnProperty(source)) {
         return;
      }
      const key = this.generateNextKey();
      this.programsMap[source] = key;
      this.programs[key] = program;
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
