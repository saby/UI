/// <amd-module name="UI/_builder/Tmpl/core/Context" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Context.ts
 */

import { ProgramNode } from 'UI/_builder/Tmpl/expressions/_private/Nodes';
import * as Helpers from 'UI/_builder/Tmpl/expressions/_private/Helpers';
import { Parser } from 'UI/_builder/Tmpl/expressions/_private/Parser';

// <editor-fold desc="Constants">

const PARSER = new Parser();

const ALLOW_PROGRAM_DUPLICATES = true;

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

export enum ContextType {
   USUAL = 0,
   ISOLATED = 1,
   INTERMEDIATE = 2
}

export interface IConfig {
   identifiers?: string[];
   type?: ContextType;
}

export interface IOptions {
   identifiers?: string[];
}

export interface IProgramMeta {
   key: TProgramKey;
   node: ProgramNode;
}

export enum SpecialProgramType {
   NONE = 0,
   BIND = 1,
   EVENT= 2,
   FLOAT = 4
}

export interface IContext {
   createContext(config?: IConfig): IContext;
   joinContext(context: IContext, options?: IOptions): void;

   registerProgram(program: ProgramNode, specialProgramType?: SpecialProgramType): TProgramKey | null;

   getProgram(key: TProgramKey): ProgramNode | null;

   getOwnIdentifiers(): string[];
   getOwnPrograms(): IProgramMeta[];
   getInternalPrograms(): IProgramMeta[];
}

export function createGlobalContext(): IContext {
   const cfg = prepareContextConfig();
   return new LexicalContext(null, cfg);
}

// </editor-fold>

// <editor-fold desc="Internal interfaces and functions">

interface IProgramDescription {
   index: number;
   node: ProgramNode;
   originContext: IContext;
   isSynthetic: boolean;
}

interface ILexicalContext extends IContext {
   allocateProgramIndex(): number;
   findProgramIndex(program: ProgramNode): number | null;

   commitIdentifier(identifier: string): void;
   commitProgram(description: IProgramDescription): TProgramKey;
   commitInternalProgram(description: IProgramDescription): TProgramKey;

   hoistIdentifier(identifier: string): void;
   hoistReactiveIdentifier(identifier: string): void;
   hoistInternalProgram(description: IProgramDescription): void;

   processProgram(program: ProgramNode, isSynthetic: boolean): TProgramKey;

   getInternalProgramDescriptions(): IProgramDescription[];
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

function prepareContextConfig(config?: IConfig): IConfig {
   const cfg: IConfig = {
      identifiers: [],
      type: ContextType.USUAL
   };
   if (typeof config === 'undefined') {
      return cfg;
   }
   if (Array.isArray(config.identifiers)) {
      cfg.identifiers = Array(...config.identifiers);
   }
   if (typeof config.type === 'number') {
      cfg.type = config.type;
   }
   return cfg;
}

function isHoistingAllowed(contextType: ContextType): boolean {
   return contextType !== ContextType.ISOLATED;
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

// <editor-fold desc="Program storage">

declare type TZipProgramFunction = (description: IProgramDescription, index?: number) => IProgramMeta;

class ProgramStorage {

   private readonly programs: IProgramDescription[];
   private readonly programsMap: Map<string, number>;
   private readonly programKeysMap: Map<string, number>;

   constructor() {
      this.programs = [];
      this.programsMap = new Map<string, number>();
      this.programKeysMap = new Map<string, number>();
   }

   zip(func: TZipProgramFunction): IProgramMeta[] {
      return this.programs.map(func);
   }

   findIndex(program: ProgramNode): number | null {
      const source = program.string;
      if (this.programsMap.has(source)) {
         const index = this.programsMap.get(source);
         return this.programs[index].index;
      }
      return null;
   }

   get(key: TProgramKey): IProgramDescription {
      if (this.has(key)) {
         const index = this.programKeysMap.get(key);
         return this.programs[index];
      }
      return null;
   }

   has(key: TProgramKey): boolean {
      return this.programKeysMap.has(key);
   }

   set(description: IProgramDescription, key: string): void {
      const source = description.node.string;
      // Do not append program that already exists
      if (this.programsMap.has(source))  {
         return;
      }
      // Description index in collection that will be set
      const index: number = this.programs.length;
      this.programKeysMap.set(key, index);
      this.programsMap.set(source, index);
      this.programs.push(description);
   }

   getDescriptions(): IProgramDescription[] {
      return Array(...this.programs);
   }
}

// </editor-fold>

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
      this.allowHoisting = isHoistingAllowed(config.type);
      this.identifiers = config.identifiers;
      this.programs = new ProgramStorage();
      this.internals = new ProgramStorage();
   }

   // <editor-fold desc="Public methods">

   createContext(config?: IConfig): IContext {
      const cfg = prepareContextConfig(config);
      return new LexicalContext(this, cfg);
   }

   joinContext(context: IContext, options?: IOptions): void {
      const lexicalContext = context as ILexicalContext;
      const localIdentifiers = Array.isArray(options && options.identifiers) ? options.identifiers : EMPTY_ARRAY;
      this.joinIdentifiers(lexicalContext, localIdentifiers);
      this.joinInternalPrograms(lexicalContext, localIdentifiers);
   }

   registerProgram(program: ProgramNode, specialProgramType: SpecialProgramType = SpecialProgramType.NONE): TProgramKey | null {
      switch (specialProgramType) {
         case SpecialProgramType.BIND:
            return this.registerBindProgram(program);
         case SpecialProgramType.EVENT:
            this.registerEventProgram(program);
            return null;
         case SpecialProgramType.FLOAT:
            this.registerFloatProgram(program);
            return null;
         case SpecialProgramType.NONE:
            return this.registerNoneProgram(program);
         default:
            throw new Error('Получен неизвестный тип program-выражения');
      }
   }

   getProgram(key: TProgramKey): ProgramNode | null {
      validateProgramKey(key);
      if (this.programs.has(key)) {
         return this.programs.get(key).node;
      }
      if (this.internals.has(key)) {
         return this.internals.get(key).node;
      }
      throw new Error(`Выражение с ключом "${key}" не было зарегистрировано в текущем контексте`);
   }

   getOwnIdentifiers(): string[] {
      return Array(...this.identifiers);
   }

   getOwnPrograms(): IProgramMeta[] {
      return this.programs.zip(zipProgramMeta);
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

   findProgramIndex(program: ProgramNode): number | null {
      if (ALLOW_PROGRAM_DUPLICATES) {
         return null;
      }
      return this.programs.findIndex(program);
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

   commitProgram(description: IProgramDescription): TProgramKey {
      const key = generateProgramKey(description.index);
      this.programs.set(description, key);
      return key;
   }

   commitInternalProgram(description: IProgramDescription): TProgramKey {
      const key = generateInternalProgramKey(description.index);
      this.internals.set(description, key);
      return key;
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

   hoistReactiveIdentifier(identifier: string): void {
      if (this.parent === null) {
         this.commitIdentifier(identifier);
         return;
      }
      this.parent.hoistReactiveIdentifier(identifier);
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

   processProgram(program: ProgramNode, isSynthetic: boolean): TProgramKey {
      let index = this.findProgramIndex(program);
      if (index === null) {
         index = this.allocateProgramIndex();
      }
      const description = createProgramDescription(index, program, this, isSynthetic);
      this.commitProgram(description);
      this.hoistInternalProgram(description);
      return generateProgramKey(index);
   }

   getInternalProgramDescriptions(): IProgramDescription[] {
      return this.internals.getDescriptions();
   }

   // </editor-fold>

   // <editor-fold desc="Private methods">

   private registerBindProgram(program: ProgramNode): TProgramKey {
      const programs = Helpers.dropBindProgram(program, PARSER, FILE_NAME);
      let key = null;
      for (let index = 0; index < programs.length; ++index) {
         const program = programs[index];
         key = null;
         if (!canRegisterProgram(program)) {
            continue;
         }
         if (!this.processIdentifiers(program)) {
            continue;
         }
         const isSynthetic = index + 1 < programs.length;
         key = this.processProgram(program, isSynthetic);
      }
      // Actual (input) program is last program in collection and its program key must be returned.
      return key;
   }

   private registerEventProgram(program: ProgramNode): void {
      const identifiers = Helpers.collectIdentifiers(program, FILE_NAME);
      for (let index = 0; index < identifiers.length; ++index) {
         const identifier = identifiers[index];
         this.hoistIdentifier(identifier);
      }
   }

   private registerFloatProgram(program: ProgramNode): void {
      const identifiers = Helpers.collectIdentifiers(program, FILE_NAME);
      this.hoistIdentifiersAsPrograms(identifiers, EMPTY_ARRAY);
      for (let index = 0; index < identifiers.length; ++index) {
         const identifier = identifiers[index];
         this.hoistIdentifier(identifier);
         this.commitIdentifier(identifier);
      }
   }

   private registerNoneProgram(program: ProgramNode): TProgramKey | null {
      if (!canRegisterProgram(program)) {
         return null;
      }
      if (!this.processIdentifiers(program)) {
         return null;
      }
      return this.processProgram(program, false);
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
      const identifiers = context.getOwnIdentifiers();
      for (let index = 0; index < identifiers.length; ++index) {
         const identifier = identifiers[index];
         if (localIdentifiers.indexOf(identifier) > -1) {
            continue;
         }
         this.hoistIdentifier(identifier);
      }
   }

   private joinInternalPrograms(context: ILexicalContext, localIdentifiers: string[]): void {
      const internals = context.getInternalProgramDescriptions();
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
