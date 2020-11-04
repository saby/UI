/// <amd-module name="UI/_builder/Tmpl/core/Context" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Context.ts
 */

import { ProgramNode, IdentifierNode, MemberExpressionNode, Walker } from 'UI/_builder/Tmpl/expressions/_private/Nodes';
import { IParser } from 'UI/_builder/Tmpl/expressions/_private/Parser';

// <editor-fold desc="Public interfaces and functions">

export interface IProcessingContextConfig {
   fileName: string;
   parser: IParser;
}

export interface IProcessingContext {
   createContext(): IProcessingContext;

   declareFloatProgram(program: ProgramNode): void;
   declareIdentifier(identifier: string): void;
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

export function createGlobalContext(config: IProcessingContextConfig): IProcessingContext {
   return new ProcessingContext(config, null);
}

// </editor-fold>

// <editor-fold desc="Internal interfaces and functions">

interface IContext extends IProcessingContext {
   generateNextKey(): string;
   hoistIdentifier(name: string): void;
   hoistProgram(program: ProgramNode): void;
   collectIdentifiers(identifiers: string[]): string[];
}

interface IProgramStorage {
   [key: string]: ProgramNode;
}

interface IProgramStorageMap {
   [program: string]: string;
}

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

function collectIdentifiers(program: ProgramNode, fileName: string): string[] {
   const identifiers: string[] = [];
   const callbacks = {
      Identifier: (node: IdentifierNode): void => {
         const identifier = node.name;
         // Do not produce duplicates
         if (identifiers.indexOf(identifier) === -1) {
            identifiers.push(node.name);
         }
      }
   };
   const walker = new Walker(callbacks);
   program.accept(walker, {
      fileName
   });
   return identifiers;
}

function dropBindProgram(program: ProgramNode, parser: IParser, fileName: string): ProgramNode[] {
   const programs: ProgramNode[] = [];
   const callbacks = {
      Identifier: (node: IdentifierNode): void => {
         programs.push(
            parser.parse(node.name)
         );
      },
      MemberExpression: (node: MemberExpressionNode): void => {
         programs.push(
            parser.parse(node.string)
         );
      }
   };
   const walker = new Walker(callbacks);
   program.accept(walker, {
      fileName
   });
   // We need to return value-program and object-program.
   // Ex. for "a.b.c.d.e" we only return "a.b.c.d" and "a.b.c.d.e".
   return programs.slice(-2);
}

function containsLocalIdentifiers(program: ProgramNode, local: string[], fileName: string): boolean {
   let hasLocalIdentifier = false;
   const callbacks = {
      Identifier: (data: IdentifierNode): void => {
         if (local.indexOf(data.name) > -1) {
            hasLocalIdentifier = true;
         }
      }
   };
   const walker = new Walker(callbacks);
   program.accept(walker, {
      fileName
   });
   return hasLocalIdentifier;
}

// </editor-fold>

class ProcessingContext implements IContext {

   // <editor-fold desc="Context properties">

   private keysCounter: number;

   private readonly fileName: string;
   private readonly parser: IParser;
   private readonly parent: IContext | null;

   private readonly identifiers: string[];

   private readonly programs: IProgramStorage;
   private readonly programsMap: IProgramStorageMap;

   // </editor-fold>

   constructor(config: IProcessingContextConfig, parent: IContext | null) {
      this.keysCounter = 0;
      this.fileName = config.fileName;
      this.parser = config.parser;
      this.parent = parent;
      this.identifiers = [];
      this.programs = { };
      this.programsMap = { };
   }

   // <editor-fold desc="Public interface implementation">

   createContext(): IProcessingContext {
      const config: IProcessingContextConfig = {
         fileName: this.fileName,
         parser: this.parser
      };
      return new ProcessingContext(config, this);
   }

   declareFloatProgram(program: ProgramNode): void {
      const identifiers = collectIdentifiers(program, this.fileName);
      identifiers.forEach((identifier: string): void => {
         this.declareIdentifier(identifier);
      });
   }

   declareIdentifier(identifier: string): void {
      if (this.identifiers.indexOf(identifier) > -1) {
         return;
      }
      if (isForbiddenIdentifier(identifier)) {
         return;
      }
      this.identifiers.push(identifier);
   }

   getLocalIdentifiers(): string[] {
      return this.identifiers;
   }

   getIdentifiers(): string[] {
      return this.collectIdentifiers();
   }

   registerBindProgram(program: ProgramNode): void {
      const programs = dropBindProgram(program, this.parser, this.fileName);
      this.registerPrograms(programs);
   }

   registerEventProgram(program: ProgramNode): void {
      const identifiers = collectIdentifiers(program, this.fileName);
      this.hoistIdentifiers(identifiers);
   }

   registerProgram(program: ProgramNode): void {
      if (!canRegisterProgram(program)) {
         return;
      }
      const identifiers = collectIdentifiers(program, this.fileName);
      // Do not register program without identifiers.
      if (identifiers.length === 0) {
         return;
      }
      this.hoistIdentifiers(identifiers);
      this.hoistIdentifiersAsPrograms(identifiers);
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
      return `${PROGRAM_PREFIX}${this.keysCounter++}`;
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
      const programContainsLocalIdentifiers = containsLocalIdentifiers(program, this.identifiers, this.fileName);
      if (!programContainsLocalIdentifiers && this.parent !== null) {
         return this.parent.hoistProgram(program);
      }
      this.commitProgram(program);
   }

   collectIdentifiers(identifiers: string[] = []): string[] {
      const additional: string[] = [];
      this.identifiers.forEach((identifier: string) => {
         if (identifiers.indexOf(identifier) === -1) {
            additional.push(identifier);
         }
      });
      const result: string[] = additional.concat(identifiers);
      if (this.parent !== null) {
         return this.parent.collectIdentifiers(result);
      }
      return result;
   }

   // </editor-fold>

   private commitProgram(program: ProgramNode): void {
      const source = program.string;
      const key = this.generateNextKey();
      this.programsMap[source] = key;
      this.programs[key] = program;
   }

   private registerPrograms(programs: ProgramNode[]): void {
      programs.forEach((program: ProgramNode) => {
         this.registerProgram(program);
      });
   }

   private hoistIdentifiers(identifiers: string[]): void {
      identifiers.forEach((identifier: string) => {
         this.hoistIdentifier(identifier);
      });
   }

   private hoistPrograms(programs: ProgramNode[]): void {
      programs.forEach((program: ProgramNode) => {
         this.hoistProgram(program);
      });
   }

   private hoistIdentifiersAsPrograms(identifiers: string[]): void {
      const programs: ProgramNode[] = [];
      let hasLocalIdentifiers: boolean = false;
      identifiers.forEach((identifier: string) => {
         if (this.identifiers.indexOf(identifier) > -1) {
            hasLocalIdentifiers = true;
            return;
         }
         const program = this.parser.parse(identifier);
         programs.push(program);
      });
      if (hasLocalIdentifiers) {
         this.hoistPrograms(programs);
      }
   }
}
