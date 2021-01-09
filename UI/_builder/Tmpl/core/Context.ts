/// <amd-module name="UI/_builder/Tmpl/core/Context" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Context.ts
 */

import { ProgramNode, IdentifierNode, MemberExpressionNode, Walker } from 'UI/_builder/Tmpl/expressions/_private/Nodes';
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

export interface IContext {
   createContext(config?: IConfig): IContext;
   joinContext(context: IContext, options?: IOptions): void;

   registerBindProgram(program: ProgramNode): TProgramKey;
   registerEventProgram(program: ProgramNode): void;
   registerFloatProgram(program: ProgramNode): void;
   registerProgram(program: ProgramNode): TProgramKey;

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

function containsIdentifiers(program: ProgramNode, identifiers: string[]): boolean {
   let hasLocalIdentifier = false;
   const callbacks = {
      Identifier: (data: IdentifierNode): void => {
         if (identifiers.indexOf(data.name) > -1) {
            hasLocalIdentifier = true;
         }
      }
   };
   const walker = new Walker(callbacks);
   program.accept(walker, {
      fileName: FILE_NAME
   });
   return hasLocalIdentifier;
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
      fileName: FILE_NAME
   });
   return identifiers;
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
      fileName: FILE_NAME
   });
   // We need to return value-program and object-program.
   // Ex. for "a.b.c.d.e" we only return "a.b.c.d" and "a.b.c.d.e".
   return programs.slice(-2);
}

// </editor-fold>

class LexicalContext implements ILexicalContext {

   // <editor-fold desc="Properties">

   private programIndex: number;

   private readonly parent: ILexicalContext | null;
   private readonly allowHoisting: boolean;
   private readonly identifiers: string[];

   private readonly programs: IProgramDescription[];
   private readonly programsMap: IProgramsMap;
   private readonly programKeysMap: IProgramsMap;

   private readonly internals: IProgramDescription[];
   private readonly internalsMap: IProgramsMap;
   private readonly internalKeysMap: IProgramsMap;

   // </editor-fold>

   constructor(parent: ILexicalContext | null, config: IConfig) {
      this.programIndex = 0;
      this.parent = parent;
      this.allowHoisting = isHoistingAllowed(config.type);
      this.identifiers = config.identifiers;
      this.programs = [];
      this.programsMap = { };
      this.programKeysMap = { };
      this.internals = [];
      this.internalsMap = { };
      this.internalKeysMap = { };
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

   registerBindProgram(program: ProgramNode): TProgramKey {
      const programs = dropBindProgram(program);
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

   registerEventProgram(program: ProgramNode): void {
      const identifiers = collectIdentifiers(program);
      for (let index = 0; index < identifiers.length; ++index) {
         const identifier = identifiers[index];
         this.hoistIdentifier(identifier);
      }
   }

   registerFloatProgram(program: ProgramNode): void {
      const identifiers = collectIdentifiers(program);
      this.hoistIdentifiersAsPrograms(identifiers, EMPTY_ARRAY);
      for (let index = 0; index < identifiers.length; ++index) {
         const identifier = identifiers[index];
         this.hoistIdentifier(identifier);
         this.commitIdentifier(identifier);
      }
   }

   registerProgram(program: ProgramNode): TProgramKey {
      if (!canRegisterProgram(program)) {
         return null;
      }
      if (!this.processIdentifiers(program)) {
         return null;
      }
      return this.processProgram(program, false);
   }

   getProgram(key: TProgramKey): ProgramNode | null {
      validateProgramKey(key);
      let collectionIndex;
      if (this.programKeysMap.hasOwnProperty(key)) {
         collectionIndex = this.programKeysMap[key];
         return this.programs[collectionIndex].node;
      }
      if (this.internalKeysMap.hasOwnProperty(key)) {
         collectionIndex = this.internalKeysMap[key];
         return this.internals[collectionIndex].node;
      }
      throw new Error(`Выражение с ключом "${key}" не было зарегистрировано в текущем контексте`);
   }

   getOwnIdentifiers(): string[] {
      return Array(...this.identifiers);
   }

   getOwnPrograms(): IProgramMeta[] {
      return this.programs.map(zipProgramMeta);
   }

   getInternalPrograms(): IProgramMeta[] {
      const collection: IProgramMeta[] = [];
      for (let index = 0; index < this.internals.length; ++index) {
         const description = this.internals[index];
         const meta = zipInternalProgramMeta(description, index);
         collection.push(meta);
      }
      return collection;
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
      const source = program.string;
      if (this.programsMap.hasOwnProperty(source)) {
         const collectionIndex = this.programsMap[source];
         return this.programs[collectionIndex].index;
      }
      return null;
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
      const source = description.node.string;
      // Description index in collection that will be set.
      const index: number = this.programs.length;
      const key = generateProgramKey(description.index);
      this.programKeysMap[key] = index;
      this.programsMap[source] = index;
      this.programs.push(description);
      return key;
   }

   commitInternalProgram(description: IProgramDescription): TProgramKey {
      const source = description.node.string;
      // Do not commit internal programs that already exists
      if (this.internalsMap.hasOwnProperty(source))  {
         return;
      }
      const index: number = this.programs.length;
      const key = generateInternalProgramKey(description.index);
      // Description index in collection that will be set.
      this.internalKeysMap[key] = index;
      this.internalsMap[source] = index;
      this.internals.push(description);
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
      const programContainsLocalIdentifiers = containsIdentifiers(description.node, this.identifiers);
      if (this.allowHoisting && this.parent !== null) {
         if (programContainsLocalIdentifiers) {
            const identifiers = collectIdentifiers(description.node);
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
      return this.internals;
   }

   // </editor-fold>

   // <editor-fold desc="Private methods">

   private processIdentifiers(program: ProgramNode): boolean {
      const identifiers = collectIdentifiers(program);
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
         const programContainsLocalIdentifiers = containsIdentifiers(program, localIdentifiers);
         if (programContainsLocalIdentifiers) {
            const identifiers = collectIdentifiers(program);
            this.hoistIdentifiersAsPrograms(identifiers, localIdentifiers);
            continue;
         }
         this.hoistInternalProgram(description);
      }
   }

   // </editor-fold>

}
