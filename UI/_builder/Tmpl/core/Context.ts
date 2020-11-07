/// <amd-module name="UI/_builder/Tmpl/core/Context" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Context.ts
 */

import { ProgramNode, IdentifierNode, MemberExpressionNode, Walker } from 'UI/_builder/Tmpl/expressions/_private/Nodes';
import { Parser } from 'UI/_builder/Tmpl/expressions/_private/Parser';

// <editor-fold desc="Public interfaces and functions">

const OPTIMIZE_PROGRAM_PROCESSING = true;

export function needOptimizeProgramProcessing(): boolean {
   return OPTIMIZE_PROGRAM_PROCESSING;
}

export declare type TProgramKey = string | null;

export interface ILexicalContextConfig {
   allowHoisting?: boolean;
   identifiers?: string[];
}

export interface ILexicalContextOptions {
   identifiers?: string[];
}

export interface ILexicalContext {
   createContext(config?: ILexicalContextConfig): ILexicalContext;

   registerBindProgram(program: ProgramNode): TProgramKey;
   registerEventProgram(program: ProgramNode): void;
   registerFloatProgram(program: ProgramNode): void;
   registerProgram(program: ProgramNode): TProgramKey;

   joinContext(context: ILexicalContext, options?: ILexicalContextOptions): void;

   getLocalIdentifiers(): string[];
   getLocalProgramKeys(): string[];
   getLocalPrograms(): ProgramNode[];

   getInternalPrograms(): ProgramNode[];

   getIdentifiers(): string[];
   getProgramKeys(): string[];
   getPrograms(): ProgramNode[];

   getProgram(key: TProgramKey): ProgramNode | null;

   startProcessing(): void;
   commitProcessing(key: TProgramKey): void;
   endProcessing(): void;
}

export function createGlobalContext() {
   const config = prepareContextConfig();
   return new Context(null, config);
}

// </editor-fold>

// <editor-fold desc="Constants">

const PARSER = new Parser();

const PROGRAM_PREFIX = '$p';

const CONTEXT_FILE_NAME = '[[context]]';

const FORBIDDEN_IDENTIFIERS = [
   '...',
   '_options',
   '_container',
   '_children',
   'rk'
];

// </editor-fold>

// <editor-fold desc="Internal interfaces and functions">

interface IContext extends ILexicalContext {
   generateProgramKey(): TProgramKey;
   findProgramKey(program: ProgramNode): TProgramKey;

   hoistIdentifier(identifier: string): void;
   hoistProgram(program: ProgramNode): TProgramKey;
   hoistInternalProgram(program: ProgramNode, key: TProgramKey): void;

   commitIdentifier(identifier: string): void;
   commitProgram(program: ProgramNode, key: TProgramKey): void;
   commitInternalProgram(program: ProgramNode, key: TProgramKey): void;

   collectIdentifiers(identifiers: string[]): string[];

   processProgram(program: ProgramNode): TProgramKey;
}

interface IPrograms {
   [key: string]: ProgramNode;
}

interface IProgramsMap {
   [program: string]: string;
}

interface IProcessingKeysMap {
   [program: string]: boolean;
}

function prepareContextConfig(config?: ILexicalContextConfig): ILexicalContextConfig {
   const cfg: ILexicalContextConfig = {
      allowHoisting: true,
      identifiers: []
   };
   if (typeof config === 'undefined') {
      return cfg;
   }
   if (typeof config.allowHoisting === 'boolean') {
      cfg.allowHoisting = config.allowHoisting;
   }
   if (Array.isArray(config.identifiers)) {
      cfg.identifiers = config.identifiers;
   }
   return cfg;
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

function isForbiddenIdentifier(name: string): boolean {
   return FORBIDDEN_IDENTIFIERS.indexOf(name) > -1;
}

function collectIdentifiers(program: ProgramNode): string[] {
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
      fileName: CONTEXT_FILE_NAME
   });
   return identifiers;
}

function containsLocalIdentifiers(program: ProgramNode, local: string[]): boolean {
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
      fileName: CONTEXT_FILE_NAME
   });
   return hasLocalIdentifier;
}

function dropBindProgram(program: ProgramNode): ProgramNode[] {
   const programs: ProgramNode[] = [];
   const callbacks = {
      Identifier: (node: IdentifierNode): void => {
         programs.push(
            PARSER.parse(node.name)
         );
      },
      MemberExpression: (node: MemberExpressionNode): void => {
         programs.push(
            PARSER.parse(node.string)
         );
      }
   };
   const walker = new Walker(callbacks);
   program.accept(walker, {
      fileName: CONTEXT_FILE_NAME
   });
   // We need to return value-program and object-program.
   // Ex. for "a.b.c.d.e" we only return "a.b.c.d" and "a.b.c.d.e".
   return programs.slice(-2);
}

// </editor-fold>

class Context implements IContext {

   // <editor-fold desc="Properties">

   private programKeyIndex: number;
   private inProcessing: boolean;
   private readonly processingKeysMap: IProcessingKeysMap;
   private readonly parent: IContext | null;
   private readonly allowHoisting: boolean;
   private readonly identifiers: string[];
   private readonly programs: IPrograms;
   private readonly programsMap: IProgramsMap;
   private readonly internalPrograms: IPrograms;
   private readonly internalProgramsMap: IProgramsMap;

   // </editor-fold>

   constructor(parent: IContext | null, config: ILexicalContextConfig) {
      this.programKeyIndex = 0;
      this.inProcessing = false;
      this.processingKeysMap = { };
      this.parent = parent;
      this.allowHoisting = config.allowHoisting;
      this.identifiers = config.identifiers;
      this.programs = { };
      this.programsMap = { };
      this.internalPrograms = { };
      this.internalProgramsMap = { };
   }

   // <editor-fold desc="Public methods">

   createContext(config?: ILexicalContextConfig): ILexicalContext {
      const cfg = prepareContextConfig(config);
      return new Context(this, cfg);
   }

   registerBindProgram(program: ProgramNode): TProgramKey {
      const programs = dropBindProgram(program);
      return this.registerPrograms(programs);
   }

   registerEventProgram(program: ProgramNode): void {
      const identifiers = collectIdentifiers(program);
      this.hoistIdentifiers(identifiers);
   }

   registerFloatProgram(program: ProgramNode): void {
      const identifiers = collectIdentifiers(program);
      this.hoistProgramIdentifiersAsPrograms(program);
      this.commitIdentifiers(identifiers);
   }

   registerProgram(program: ProgramNode): TProgramKey {
      if (!canRegisterProgram(program)) {
         return null;
      }
      const identifiers = collectIdentifiers(program);
      // Do not register program without identifiers.
      if (identifiers.length === 0) {
         return null;
      }
      this.hoistIdentifiers(identifiers);
      return this.processProgram(program);
   }

   joinContext(context: ILexicalContext, options?: ILexicalContextOptions): void {
      const cfg = prepareContextConfig({
         identifiers: Array.isArray(options && options.identifiers) ? options.identifiers : []
      });
      const fakeContext = new Context(this, cfg);
      const identifiers = context.getLocalIdentifiers();
      const programs = context.getLocalPrograms();
      fakeContext.hoistIdentifiers(identifiers);
      fakeContext.registerPrograms(programs);
   }

   getLocalIdentifiers(): string[] {
      return Array(...this.identifiers);
   }

   getLocalProgramKeys(): string[] {
      return Object.keys(this.programs);
   }

   getLocalPrograms(): ProgramNode[] {
      const programs = [];
      for (const key in this.programs) {
         const program = this.programs[key];
         programs.push(program);
      }
      return programs;
   }

   getInternalPrograms(): ProgramNode[] {
      const programs = [];
      for (const key in this.internalPrograms) {
         const program = this.internalPrograms[key];
         programs.push(program);
      }
      return programs;
   }

   getIdentifiers(): string[] {
      return this.collectIdentifiers();
   }

   getProgramKeys(): string[] {
      const local = this.getLocalProgramKeys();
      if (this.parent === null) {
         return local;
      }
      return this.parent.getProgramKeys().concat(local);
   }

   getPrograms(): ProgramNode[] {
      const local = this.getLocalPrograms();
      if (this.parent === null) {
         return local;
      }
      return this.parent.getPrograms().concat(local);
   }

   getProgram(key: TProgramKey): ProgramNode | null {
      if (key === null) {
         return null;
      }
      if (this.programs.hasOwnProperty(key)) {
         return this.programs[key];
      }
      if (this.parent === null) {
         throw new Error(`Выражение с ключом "${key}" не было зарегистрировано`);
      }
      return this.parent.getProgram(key);
   }

   startProcessing(): void {
      if (this.parent !== null) {
         return this.parent.startProcessing();
      }
      if (this.inProcessing) {
         throw new Error('Контекст уже находится в состоянии вычисления');
      }
      this.inProcessing = true;
   }

   commitProcessing(key: TProgramKey): void {
      if (this.parent !== null) {
         return this.parent.commitProcessing(key);
      }
      if (!this.inProcessing) {
         throw new Error('Контекст не находится в состоянии вычисления');
      }
      // if (this.processingKeysMap[key]) {
      //    throw new Error(`Выражение с ключом "${key}" уже было вычислено`);
      // }
      this.processingKeysMap[key] = true;
   }

   endProcessing(): void {
      if (this.parent !== null) {
         return this.parent.endProcessing();
      }
      if (!this.inProcessing) {
         throw new Error('Контекст не находится в состоянии вычисления');
      }
      this.inProcessing = false;
      if (!OPTIMIZE_PROGRAM_PROCESSING) {
         return;
      }
      const missedKeys = [];
      for (const key in this.processingKeysMap) {
         if (!this.processingKeysMap[key]) {
            missedKeys.push(key);
         }
      }
      const description = missedKeys.map((key: string): string => `"${key}"`).join(',');
      if (missedKeys.length > 0) {
         throw new Error(`В контексте остались не вычисленные выражения: ${description}`);
      }
   }

   // </editor-fold>

   // <editor-fold desc="Internal methods">

   generateProgramKey(): TProgramKey {
      if (this.parent === null) {
         const key = `${PROGRAM_PREFIX}${this.programKeyIndex++}`;
         this.processingKeysMap[key] = false;
         return key;
      }
      return this.parent.generateProgramKey();
   }

   findProgramKey(program: ProgramNode): TProgramKey {
      const source = program.string;
      if (this.programsMap.hasOwnProperty(source)) {
         return this.programsMap[source];
      }
      const programContainsLocalIdentifiers = containsLocalIdentifiers(program, this.identifiers);
      if (this.parent === null || programContainsLocalIdentifiers || !this.allowHoisting) {
         return null;
      }
      return this.parent.findProgramKey(program);
   }

   hoistIdentifier(identifier: string): void {
      if (this.identifiers.indexOf(identifier) > -1 || isForbiddenIdentifier(identifier)) {
         return;
      }
      if (this.parent === null || !this.allowHoisting) {
         this.commitIdentifier(identifier);
         return;
      }
      this.parent.hoistIdentifier(identifier);
   }

   hoistProgram(program: ProgramNode): TProgramKey {
      const programContainsLocalIdentifiers = containsLocalIdentifiers(program, this.identifiers);
      if (!programContainsLocalIdentifiers && this.parent !== null && this.allowHoisting) {
         return this.parent.hoistProgram(program);
      }
      if (programContainsLocalIdentifiers) {
         this.hoistProgramIdentifiersAsPrograms(program);
      }
      const key = this.generateProgramKey();
      this.commitProgram(program, key);
      return key;
   }

   hoistInternalProgram(program: ProgramNode, key: TProgramKey): void {
      const programContainsLocalIdentifiers = containsLocalIdentifiers(program, this.identifiers);
      if (this.parent !== null && this.allowHoisting && !programContainsLocalIdentifiers) {
         this.parent.hoistInternalProgram(program, key);
      }
      this.commitInternalProgram(program, key);
   }

   commitIdentifier(identifier: string): void {
      if (this.identifiers.indexOf(identifier) > -1) {
         return;
      }
      if (isForbiddenIdentifier(identifier)) {
         return;
      }
      this.identifiers.push(identifier);
   }

   commitProgram(program: ProgramNode, key: TProgramKey): void {
      const source = program.string;
      this.programsMap[source] = key;
      this.programs[key] = program;
   }

   commitInternalProgram(program: ProgramNode, key: TProgramKey): void {
      const source = program.string;
      this.internalProgramsMap[source] = key;
      this.internalPrograms[key] = program;
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

   processProgram(program: ProgramNode): TProgramKey {
      // If program already exists in current scope branch then just take its key.
      let key = this.findProgramKey(program);
      if (key === null) {
         key = this.hoistProgram(program);
      }
      this.hoistInternalProgram(program, key);
      return key;
   }

   // </editor-fold>

   private commitIdentifiers(identifiers: string[]): void {
      for (let index = 0; index < identifiers.length; ++index) {
         this.commitIdentifier(identifiers[index]);
      }
   }

   private hoistIdentifiers(identifiers: string[]): void {
      for (let index = 0; index < identifiers.length; ++index) {
         this.hoistIdentifier(identifiers[index]);
      }
   }

   private hoistProgramIdentifiersAsPrograms(program: ProgramNode): void {
      if (this.parent === null || !this.allowHoisting) {
         return;
      }
      const identifiers = collectIdentifiers(program);
      identifiers.forEach((identifier: string): void => {
         if (this.identifiers.indexOf(identifier) > -1) {
            return;
         }
         const program = PARSER.parse(identifier);
         this.parent.processProgram(program);
      });
   }

   private registerPrograms(programs: ProgramNode[]): TProgramKey {
      let key = null;
      for (let index = 0; index < programs.length; ++index) {
         key = this.registerProgram(programs[index]);
      }
      return key;
   }
}
