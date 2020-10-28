/// <amd-module name="UI/_builder/Tmpl/core/Context" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Context.ts
 */

import { IdentifierNode, MemberExpressionNode, ProgramNode, Walker } from 'UI/_builder/Tmpl/expressions/_private/Nodes';
import { Parser } from 'UI/_builder/Tmpl/expressions/_private/Parser';

// <editor-fold desc="Public interfaces and functions">

export interface IProcessingContext {
   createContext(): IProcessingContext;

   declareIdentifier(name: string): void;
   getLocalIdentifiers(): string[];
   getIdentifiers(): string[];

   registerBindProgram(program: ProgramNode): void;
   registerEventProgram(program: ProgramNode): void;
   registerProgram(program: ProgramNode): void;

   getProgramKeys(): string[];
   getLocalProgramKeys(): string[];
   getProgram(key: string | null): ProgramNode | null;
   getLocalPrograms(): ProgramNode[];
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
   hoistProgram(program: ProgramNode): void;
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
      Identifier: (node: IdentifierNode): void => {
         result.push(
            PARSER.parse(node.name)
         );
      },
      MemberExpression: (node: MemberExpressionNode): void => {
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

function containsLocalIdentifiers(program: ProgramNode, local: string[]): boolean {
   let hasLocalIdentifier = false;
   const callbacks = {
      Identifier: (data: IdentifierNode): void => {
         if (local.indexOf(data.name)) {
            hasLocalIdentifier = true;
         }
      }
   };
   const walker = new Walker(callbacks);
   program.accept(walker, {
      fileName: SCOPE_FILE_NAME
   });
   return hasLocalIdentifier;
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

   getLocalIdentifiers(): string[] {
      return this.identifiers;
   }

   getIdentifiers(): string[] {
      const local = this.getLocalIdentifiers();
      if (this.parent !== null) {
         return this.parent.getIdentifiers().concat(local);
      }
      return local;
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
      this.hoistIdentifiers(identifiers);
      this.hoistProgram(program);
   }

   getLocalProgramKeys(): string[] {
      return Object.keys(this.programs);
   }

   getProgramKeys(): string[] {
      const local = this.getLocalProgramKeys();
      if (this.parent !== null) {
         return this.parent.getProgramKeys().concat(local);
      }
      return local;
   }

   getProgram(key: string | null): ProgramNode | null {
      if (key === null) {
         return null;
      }
      if (this.programs.hasOwnProperty(key)) {
         return this.programs[key];
      }
      if (this.parent !== null) {
         return this.parent.getProgram(key);
      }
      throw new Error(`Выражение с ключом "${key}" не было зарегистрировано`);
   }

   getLocalPrograms(): ProgramNode[] {
      // @ts-ignore This function exists on Object constructor and it has polyfill.
      return Object.values(this.programs);
   }

   getPrograms(): ProgramNode[] {
      const local = this.getLocalPrograms();
      if (this.parent !== null) {
         return this.parent.getPrograms().concat(local);
      }
      return local;
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

   hoistProgram(program: ProgramNode): void {
      const source = program.string;
      if (this.programsMap.hasOwnProperty(source)) {
         return;
      }
      const programContainsLocalIdentifiers = containsLocalIdentifiers(program, this.identifiers);
      if (!programContainsLocalIdentifiers && this.parent !== null) {
         return this.parent.hoistProgram(program);
      }
      const key = this.generateNextKey();
      this.programsMap[source] = key;
      this.programs[key] = program;
   }

   // </editor-fold>

   // <editor-fold desc="Private methods">

   private getNextId(): string {
      return `${PROGRAM_PREFIX}${this.keysCounter++}`;
   }

   private hoistIdentifiers(names: string[]): void {
      names.forEach((name: string) => {
         this.hoistIdentifier(name);
      });
   }

   // </editor-fold>
}
