/**
 * @author Крылов М.А.
 */

import { ProgramNode } from 'Compiler/expressions/Nodes';
import { Parser } from 'Compiler/expressions/Parser';
import * as Walkers from 'Compiler/expressions/Walkers';

// <editor-fold desc="Constants">

const PARSER = new Parser();

const ALLOW_PROGRAM_DUPLICATES = true;

const USE_GLOBAL_INTERNAL_PROGRAM_INDEX = false;

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

function isCommittingAllowed(contextType: ContextType): boolean {
   return contextType !== ContextType.INTERMEDIATE;
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

// </editor-fold>

// <editor-fold desc="Program storage">

declare type TZipProgramFunction = (description: IProgramDescription, index?: number) => IProgramMeta;

class ProgramStorage {

   private readonly programs: IProgramDescription[];
   private readonly programsMap: Map<string, number>;

   constructor() {
      this.programs = [];
      this.programsMap = new Map<string, number>();
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

   get(program: ProgramNode): IProgramDescription | null {
      const source = program.string;
      if (!this.programsMap.has(source))  {
         return null;
      }
      const index = this.programsMap.get(source);
      return this.programs[index];
   }

   set(description: IProgramDescription): void {
      const source = description.node.string;
      // Do not append program that already exists
      if (this.programsMap.has(source)) {
         return;
      }
      // Description index in collection that will be set
      const index: number = this.programs.length;
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
   private readonly allowCommitting: boolean;

   private readonly identifiers: string[];
   private readonly programs: ProgramStorage;
   private readonly internals: ProgramStorage;

   // </editor-fold>

   constructor(parent: ILexicalContext | null, config: IConfig) {
      this.programIndex = 0;
      this.parent = parent;
      this.allowHoisting = isHoistingAllowed(config.type);
      this.allowCommitting = isCommittingAllowed(config.type);
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

   registerProgram(program: ProgramNode, specialProgramType: SpecialProgramType = SpecialProgramType.NONE): TProgramKey {
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
      if (this.parent !== null && !this.allowCommitting) {
         return this.parent.commitIdentifier(identifier);
      }
      if (this.identifiers.indexOf(identifier) > -1) {
         return;
      }
      if (isForbiddenIdentifier(identifier)) {
         return;
      }
      this.identifiers.push(identifier);
   }

   commitProgram(description: IProgramDescription): TProgramKey {
      if (this.parent !== null && !this.allowCommitting) {
         this.parent.commitProgram(description);
      }
      this.programs.set(description);
      return generateProgramKey(description.index);
   }

   commitInternalProgram(description: IProgramDescription): TProgramKey {
      this.internals.set(description);
      return generateInternalProgramKey(description.index);
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
      const programContainsLocalIdentifiers = Walkers.containsIdentifiers(
          description.node, this.identifiers, FILE_NAME
      );
      if (this.allowHoisting && this.parent !== null) {
         if (programContainsLocalIdentifiers) {
            const identifiers = Walkers.collectIdentifiers(description.node, FILE_NAME);
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
      const programs = Walkers.dropBindProgram(program, PARSER, FILE_NAME);
      let key = null;
      for (let index = 0; index < programs.length; ++index) {
         const isSynthetic = index + 1 < programs.length;
         const program = programs[index];
         key = this.applyProgram(program, isSynthetic);
      }
      // Actual (input) program is last program in collection and its program key must be returned.
      return key;
   }

   private registerEventProgram(program: ProgramNode): void {
      this.processIdentifiers(program);
   }

   private registerFloatProgram(program: ProgramNode): void {
      const identifiers = Walkers.collectIdentifiers(program, FILE_NAME);
      this.hoistIdentifiersAsPrograms(identifiers, EMPTY_ARRAY);
      for (let index = 0; index < identifiers.length; ++index) {
         const identifier = identifiers[index];
         this.hoistIdentifier(identifier);
         this.commitIdentifier(identifier);
      }
   }

   private registerNoneProgram(program: ProgramNode): TProgramKey | null {
      return this.applyProgram(program, false);
   }

   private applyProgram(program: ProgramNode, isSynthetic: boolean): TProgramKey {
      if (Walkers.hasDecorators(program, FILE_NAME)) {
         return null;
      }
      if (!this.processIdentifiers(program)) {
         return null;
      }
      return this.processProgram(program, isSynthetic);
   }

   private processIdentifiers(program: ProgramNode): boolean {
      const identifiers = Walkers.collectIdentifiers(program, FILE_NAME);
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
         const programContainsLocalIdentifiers = Walkers.containsIdentifiers(program, localIdentifiers, FILE_NAME);
         if (programContainsLocalIdentifiers) {
            const identifiers = Walkers.collectIdentifiers(program, FILE_NAME);
            this.hoistIdentifiersAsPrograms(identifiers, localIdentifiers);
            continue;
         }
         this.hoistInternalProgram(description);
      }
   }

   // </editor-fold>

}
