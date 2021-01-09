/// <amd-module name="UI/_builder/Tmpl/core/Context" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Context.ts
 */

import { ProgramNode } from 'UI/_builder/Tmpl/expressions/_private/Nodes';
import { Parser } from 'UI/_builder/Tmpl/expressions/_private/Parser';
import * as Helpers from 'UI/_builder/Tmpl/expressions/_private/Helpers';

// <editor-fold desc="Constants">

const PARSER = new Parser();

const USE_GLOBAL_INTERNAL_PROGRAM_INDEX = false;

const EMPTY_STRING = '';

const EMPTY_ARRAY = [];

const PROGRAM_PREFIX = '$p_';

const INTERNAL_PROGRAM_PREFIX = '__dirtyCheckingVars_';

const FILE_NAME = '[[context]]';

const FORBIDDEN_IDENTIFIERS = [
   '...',
   '_options',
   '_container',
   '_children',
   'rk'
];

// </editor-fold>

// <editor-fold desc="Public interfaces and functions">

export declare type TProgramKey = string;

export interface IConfig {
   allowHoisting?: boolean;
   identifiers?: string[];
}

export interface IOptions {
   identifiers?: string[];
}

export interface IProgramMeta {
   key: TProgramKey;
   node: ProgramNode;
}

export interface IContext {
   createContext(config?: IConfig): IContext;

   registerBindProgram(program: ProgramNode): TProgramKey;
   registerEventProgram(program: ProgramNode): void;
   registerFloatProgram(program: ProgramNode): void;
   registerProgram(program: ProgramNode): TProgramKey;

   joinContext(context: IContext, options?: IOptions): void;

   getProgram(key: TProgramKey): ProgramNode | null;

   getIdentifiers(localOnly: boolean): string[];
   getPrograms(localOnly: boolean): IProgramMeta[];
   getInternalPrograms(): IProgramMeta[];
}

export function createGlobalContext(): IContext {
   const cfg = prepareConfig();
   return new LexicalContext(null, cfg);
}

// </editor-fold>

// <editor-fold desc="Internal interfaces and functions">

interface IProgramsMap {

   // Reflection: feature (program source text or public program key) -> program index in collection
   [feature: string]: number;
}

interface IProgramDescription {
   index: number;
   node: ProgramNode;
   originContext: IContext;
   isSynthetic: boolean;
}

interface ILexicalContext extends IContext {
   allocateProgramIndex(): number;

   processProgram(program: ProgramNode, isSynthetic: boolean): TProgramKey;

   hoistIdentifier(identifier: string): void;
   hoistInternalProgram(description: IProgramDescription): void;

   hoistReactiveIdentifier(identifier: string): void;

   getInternalProgramDescriptions(): ProgramStorage;
}

function createProgramDescription(
   index: number,
   node: ProgramNode,
   originContext: IContext,
   isSynthetic: boolean
): IProgramDescription {
   return {
      index,
      node,
      originContext,
      isSynthetic
   };
}

function prepareConfig(config?: IConfig): IConfig {
   const cfg: IConfig = {
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

function createProgramMeta(key: string, node: ProgramNode): IProgramMeta {
   return {
      key,
      node
   };
}

function generateProgramKey(index: number): string {
   return `${PROGRAM_PREFIX}${index}`;
}

function zipProgramMeta(description: IProgramDescription): IProgramMeta {
   return createProgramMeta(
      generateProgramKey(description.index),
      description.node
   );
}

function generateInternalProgramKey(index: number): string {
   return `${INTERNAL_PROGRAM_PREFIX}${index}`;
}

function zipInternalProgramMeta(description: IProgramDescription, index: number): IProgramMeta {
   const programIndex = USE_GLOBAL_INTERNAL_PROGRAM_INDEX ? description.index : index;
   return createProgramMeta(
      generateInternalProgramKey(programIndex),
      description.node
   );
}

function isForbiddenIdentifier(name: string): boolean {
   return FORBIDDEN_IDENTIFIERS.indexOf(name) > -1;
}

function validateProgramKey(key: TProgramKey): void {
   const stringIndex = key
      .replace(PROGRAM_PREFIX, EMPTY_STRING)
      .replace(INTERNAL_PROGRAM_PREFIX, EMPTY_STRING);
   const index = parseInt(stringIndex, 10);
   if ((key.indexOf(PROGRAM_PREFIX) !== 0 && key.indexOf(INTERNAL_PROGRAM_PREFIX) !== 0) || isNaN(index)) {
      throw new Error(`Получен некорректный ключ выражения "${key}". Ожидался program или internal program ключ`);
   }
}

// </editor-fold>

// <editor-fold desc="Mustache expression functions">

function canRegisterProgram(program: ProgramNode): boolean {
   // Do not register program with bind and mutable decorators
   return !Helpers.hasBindings(program);
}

// </editor-fold>

class ProgramStorage {

   private readonly programs: IProgramDescription[];
   private readonly programsMap: IProgramsMap;
   private readonly programKeysMap: IProgramsMap;

   constructor() {
      this.programs = [];
      this.programsMap = { };
      this.programKeysMap = { };
   }

   zip(func: (desc: IProgramDescription, index?: number) =>IProgramMeta): IProgramMeta[] {
      const collection: IProgramMeta[] = [];
      for (let index = 0; index < this.programs.length; ++index) {
         const description = this.programs[index];
         const meta = func(description, index);
         collection.push(meta);
      }
      return collection;
   }

   findIndex(program: ProgramNode): number | null {
      const source = program.string;
      if (this.programsMap.hasOwnProperty(source)) {
         const collectionIndex = this.programsMap[source];
         return this.programs[collectionIndex].index;
      }
      return null;
   }

   get(key: TProgramKey): IProgramDescription {
      if (this.has(key)) {
         const index = this.programKeysMap[key];
         return this.programs[index];
      }
      return null;
   }

   has(key: TProgramKey): boolean {
      return this.programKeysMap.hasOwnProperty(key);
   }

   set(description: IProgramDescription, key: string): void {
      const source = description.node.string;
      // Do not append program that already exists
      if (this.programsMap.hasOwnProperty(source))  {
         return;
      }
      // Description index in collection that will be set
      const index: number = this.programs.length;
      this.programKeysMap[key] = index;
      this.programsMap[source] = index;
      this.programs.push(description);
   }

   getDescriptions(): IProgramDescription[] {
      return Array(...this.programs);
   }
}

class LexicalContext implements ILexicalContext {

   // <editor-fold desc="Properties">

   private programIndex: number;

   private readonly parent: ILexicalContext | null;
   private readonly allowHoisting: boolean;

   private readonly identifiers: string[];
   private readonly programs: ProgramStorage;
   private readonly internals: ProgramStorage;

   // </editor-fold>

   constructor(parent: ILexicalContext | null, config: IConfig) {
      this.programIndex = 0;
      this.parent = parent;
      this.allowHoisting = config.allowHoisting;
      this.identifiers = config.identifiers;
      this.programs = new ProgramStorage();
      this.internals = new ProgramStorage();
   }

   // <editor-fold desc="Public methods">

   createContext(config?: IConfig): IContext {
      const cfg = prepareConfig(config);
      return new LexicalContext(this, cfg);
   }

   registerBindProgram(program: ProgramNode): TProgramKey {
      let key = null;
      const programs = Helpers.dropBindProgram(program, PARSER, FILE_NAME);
      for (let index = 0; index < programs.length; ++index) {
         const isSynthetic = index + 1 < programs.length;
         const program = programs[index];
         // Actual (input) program is last program in collection
         // and its program key must be returned.
         key = this.applyProgram(program, isSynthetic);
      }
      return key;
   }

   registerEventProgram(program: ProgramNode): void {
      const identifiers = Helpers.collectIdentifiers(program, FILE_NAME);
      for (let index = 0; index < identifiers.length; ++index) {
         const identifier = identifiers[index];
         this.hoistIdentifier(identifier);
      }
   }

   registerFloatProgram(program: ProgramNode): void {
      const identifiers = Helpers.collectIdentifiers(program, FILE_NAME);
      this.hoistIdentifiersAsPrograms(identifiers, EMPTY_ARRAY);
      for (let index = 0; index < identifiers.length; ++index) {
         const identifier = identifiers[index];
         this.hoistIdentifier(identifier);
         this.commitIdentifier(identifier);
      }
   }

   registerProgram(program: ProgramNode): TProgramKey {
      return this.applyProgram(program, false);
   }

   joinContext(context: IContext, options?: IOptions): void {
      const lexicalContext = context as ILexicalContext;
      const localIdentifiers = Array.isArray(options && options.identifiers) ? options.identifiers : EMPTY_ARRAY;
      this.joinIdentifiers(lexicalContext, localIdentifiers);
      this.joinInternalPrograms(lexicalContext, localIdentifiers);
   }

   getProgram(key: TProgramKey): ProgramNode | null {
      const description = this.getProgramDescription(key);
      if (description !== null) {
         return description.node;
      }
      throw new Error(`Выражение с ключом "${key}" не было зарегистрировано в текущем контексте`);
   }

   getIdentifiers(localOnly: boolean): string[] {
      const identifiers = Array(...this.identifiers);
      if (localOnly || this.parent === null) {
         return identifiers;
      }
      const parentIdentifiers = this.parent.getIdentifiers(localOnly);
      for (let index = 0; index < parentIdentifiers.length; ++index) {
         const parentIdentifier = parentIdentifiers[index];
         if (identifiers.indexOf(parentIdentifier) === -1) {
            identifiers.push(parentIdentifier);
         }
      }
      return identifiers;
   }

   getPrograms(localOnly: boolean): IProgramMeta[] {
      const collection: IProgramMeta[] = this.programs.zip(zipProgramMeta);
      if (localOnly || this.parent === null) {
         return collection;
      }
      return this.parent.getPrograms(localOnly).concat(collection);
   }

   getInternalPrograms(): IProgramMeta[] {
      return this.internals.zip(zipInternalProgramMeta);
   }

   // </editor-fold>

   // <editor-fold desc="Internal methods">

   allocateProgramIndex(): number {
      if (this.parent === null) {
         return this.programIndex++;
      }
      return this.parent.allocateProgramIndex();
   }

   processProgram(program: ProgramNode, isSynthetic: boolean): TProgramKey {
      let index = this.programs.findIndex(program);
      if (index === null) {
         index = this.allocateProgramIndex();
      }
      const description = createProgramDescription(index, program, this, isSynthetic);
      this.commitProgram(description);
      this.hoistInternalProgram(description);
      return generateProgramKey(index);
   }

   hoistIdentifier(identifier: string): void {
      if (this.identifiers.indexOf(identifier) > -1 || isForbiddenIdentifier(identifier)) {
         return;
      }
      if (this.parent === null || !this.allowHoisting) {
         this.commitIdentifier(identifier);
         this.hoistReactiveIdentifier(identifier);
         return;
      }
      this.parent.hoistIdentifier(identifier);
   }

   hoistInternalProgram(description: IProgramDescription): void {
      const programContainsLocalIdentifiers = Helpers.containsIdentifiers(description.node, this.identifiers, FILE_NAME);
      if (this.allowHoisting && this.parent !== null) {
         if (programContainsLocalIdentifiers) {
            const identifiers = Helpers.collectIdentifiers(description.node, FILE_NAME);
            this.hoistIdentifiersAsPrograms(identifiers, this.identifiers);
         } else {
            this.parent.hoistInternalProgram(description);
         }
      }
      this.commitInternalProgram(description);
   }

   hoistReactiveIdentifier(identifier: string): void {
      if (this.parent === null) {
         this.commitIdentifier(identifier);
         return;
      }
      this.parent.hoistReactiveIdentifier(identifier);
   }

   getInternalProgramDescriptions(): ProgramStorage {
      return this.internals;
   }

   // </editor-fold>

   // <editor-fold desc="Private methods">

   private getProgramDescription(key: TProgramKey): IProgramDescription | null {
      validateProgramKey(key);
      if (this.programs.has(key)) {
         return this.programs.get(key);
      }
      if (this.internals.has(key)) {
         return this.internals.get(key);
      }
      return null;
   }

   private applyProgram(program: ProgramNode, isSynthetic: boolean): TProgramKey {
      if (!canRegisterProgram(program)) {
         return null;
      }
      if (!this.processIdentifiers(program)) {
         return null;
      }
      return this.processProgram(program, isSynthetic);
   }

   private processIdentifiers(program: ProgramNode): boolean {
      const identifiers = Helpers.collectIdentifiers(program, FILE_NAME);
      // Do not register program without identifiers.
      if (identifiers.length === 0) {
         return false;
      }
      for (let index = 0; index < identifiers.length; ++index) {
         const identifier = identifiers[index];
         this.hoistIdentifier(identifier);
      }
      return true;
   }

   private commitIdentifier(identifier: string): void {
      if (this.identifiers.indexOf(identifier) > -1) {
         return;
      }
      if (isForbiddenIdentifier(identifier)) {
         return;
      }
      this.identifiers.push(identifier);
   }

   private commitProgram(description: IProgramDescription): void {
      const key = generateProgramKey(description.index);
      this.programs.set(description, key);
   }

   private commitInternalProgram(description: IProgramDescription): void {
      const key = generateInternalProgramKey(description.index);
      this.internals.set(description, key);
   }

   private hoistIdentifiersAsPrograms(identifiers: string[], localIdentifiers: string[]): void {
      if (this.parent === null || !this.allowHoisting) {
         return;
      }
      for (let index = 0; index < identifiers.length; ++index) {
         const identifier = identifiers[index];
         if (this.identifiers.indexOf(identifier) > -1) {
            continue;
         }
         if (localIdentifiers.indexOf(identifier) > -1) {
            continue;
         }
         const program = PARSER.parse(identifier);
         this.parent.processProgram(program, true);
      }
   }

   private joinIdentifiers(context: ILexicalContext, localIdentifiers: string[]): void {
      const identifiers = context.getIdentifiers(true);
      for (let index = 0; index < identifiers.length; ++index) {
         const identifier = identifiers[index];
         if (localIdentifiers.indexOf(identifier) > -1) {
            continue;
         }
         this.hoistIdentifier(identifier);
      }
   }

   private joinInternalPrograms(context: ILexicalContext, localIdentifiers: string[]): void {
      const internals = context.getInternalProgramDescriptions().getDescriptions();
      for (let index = 0; index < internals.length; ++index) {
         const description = internals[index];
         const program = description.node;
         const programContainsLocalIdentifiers = Helpers.containsIdentifiers(program, localIdentifiers, FILE_NAME);
         if (programContainsLocalIdentifiers) {
            const identifiers = Helpers.collectIdentifiers(program, FILE_NAME);
            this.hoistIdentifiersAsPrograms(identifiers, localIdentifiers);
            continue;
         }
         this.hoistInternalProgram(description);
      }
   }

   // </editor-fold>
}
