/// <amd-module name="UI/_builder/Tmpl/core/Context" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Context.ts
 */

import { IdentifierNode, ProgramNode, Walker } from 'UI/_builder/Tmpl/expressions/_private/Nodes';
import { Parser } from 'UI/_builder/Tmpl/expressions/_private/Parser';

// <editor-fold desc="Public interfaces and functions">

export interface IProcessingContext {
   createContext(): IProcessingContext;

   declareIdentifier(name: string): void;
   getIdentifiers(): string[];

   registerBindProgram(program: ProgramNode): void;
   registerEventProgram(program: ProgramNode): void;
   registerProgram(program: ProgramNode): void;

   getProgramKeys(): string[];
   getProgram(key: string | null): ProgramNode | null;
   getPrograms(): ProgramNode[];
}

export function createGlobalContext(): IProcessingContext {
   return new ProcessingContext(null);
}

// </editor-fold>

// <editor-fold desc="Internal interfaces and functions">

interface IPrivateProcessingContext {
   generateNextKey(): string;
   hoistIdentifier(name: string): void;
}

interface IProgramStorage {
   [key: string]: ProgramNode;
}

interface IProgramStorageMap {
   [program: string]: string;
}

declare type IContext = IProcessingContext & IPrivateProcessingContext;

const PROGRAM_PREFIX = '_$e';

const FORBIDDEN_IDENTIFIERS = [
   '...',
   '_options',
   '_container',
   '_children',
   'rk'
];

function isForbiddenIdentifier(name: string): boolean {
   return FORBIDDEN_IDENTIFIERS.indexOf(name) > -1;
}

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

// TODO: Accept parser from config
const PARSER = new Parser();

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

function dropBindProgram(program: ProgramNode): ProgramNode[] {
   const result: ProgramNode[] = [];
   const callbacks = {
      Identifier: (node: any): any => {
         result.push(
            PARSER.parse(node.name)
         );
      },
      MemberExpression: (node: any): any => {
         result.push(
            PARSER.parse(node.string)
         );
      }
   };
   const walker = new Walker(callbacks);
   program.accept(walker, {
      fileName: SCOPE_FILE_NAME
   });
   // We need to return value-program and object-program.
   // Ex. for "a.b.c.d.e" we only return "a.b.c.d" and "a.b.c.d.e".
   return result.slice(-2);
}

// </editor-fold>

class ProcessingContext implements IContext {

   // <editor-fold desc="Context properties">

   private readonly parent: IContext | null;
   private keysCounter: number;

   private readonly identifiers: string[];

   private readonly programs: IProgramStorage;
   private readonly programsMap: IProgramStorageMap;

   // </editor-fold>

   constructor(parent: IContext | null) {
      this.parent = parent;
      this.keysCounter = 0;
      this.identifiers = [];
      this.programs = { };
      this.programsMap = { };
   }

   // <editor-fold desc="Public interface implementation">

   createContext(): IProcessingContext {
      return new ProcessingContext(this);
   }

   declareIdentifier(name: string): void {
      if (this.identifiers.indexOf(name) > -1) {
         throw new Error(`Переменная "${name}" уже определена`);
      }
      if (isForbiddenIdentifier(name)) {
         return;
      }
      this.identifiers.push(name);
   }

   getIdentifiers(): string[] {
      return this.identifiers;
   }

   registerBindProgram(program: ProgramNode): void {
      const programs = dropBindProgram(program);
      programs.forEach((program: ProgramNode) => {
         this.registerProgram(program);
      });
   }

   registerEventProgram(program: ProgramNode): void {
      const identifiers = collectIdentifiers(program);
      this.hoistIdentifiers(identifiers);
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
      this.hoistIdentifiers(identifiers);
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
      if (this.parent !== null) {
         return this.parent.generateNextKey();
      }
      return this.getNextId();
   }

   hoistIdentifier(name: string): void {
      if (this.identifiers.indexOf(name) > -1) {
         return;
      }
      if (isForbiddenIdentifier(name)) {
         return;
      }
      // Hoist all undeclared identifiers to global context
      if (this.parent !== null) {
         return this.parent.hoistIdentifier(name);
      }
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
      // TODO: check context identifiers in program, wrest program and hoist its available parts to global context
      const key = this.generateNextKey();
      this.programsMap[source] = key;
      this.programs[key] = program;
   }

   private hoistIdentifiers(names: string[]): void {
      names.forEach((name: string) => {
         this.hoistIdentifier(name);
      });
   }

   // </editor-fold>
}
