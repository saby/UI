/// <amd-module name="UI/_builder/Tmpl/core/Context" />

// @ts-nocheck TODO: Remove after dev

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Context.ts
 */

import { ProgramNode, IdentifierNode, MemberExpressionNode, Walker } from 'UI/_builder/Tmpl/expressions/_private/Nodes';
import { Parser } from 'UI/_builder/Tmpl/expressions/_private/Parser';

// <editor-fold desc="Constants">

const PARSER = new Parser();

const ALLOW_PROGRAM_DUPLICATES = true;

const PROGRAM_PREFIX = '$p';

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

export interface ILexicalContextConfig {
   allowHoisting?: boolean;
   identifiers?: string[];
}

export interface ILexicalContextOptions {
   identifiers?: string[];
}

export interface IContext {
   createContext(config?: ILexicalContextConfig): IContext;

   registerBindProgram(program: ProgramNode): TProgramKey;
   registerEventProgram(program: ProgramNode): void;
   registerFloatProgram(program: ProgramNode): void;
   registerProgram(program: ProgramNode): TProgramKey;

   joinContext(context: IContext, options?: ILexicalContextOptions): void;

   getProgram(key: TProgramKey): ProgramNode | null;

   getIdentifiers(localOnly: boolean): string[];
   getPrograms(localOnly: boolean): ProgramNode[];
   getInternalPrograms(): ProgramNode[];
}

export function createGlobalContext(): IContext {
   const cfg = prepareContextConfig();
   return new LexicalContext(null, cfg);
}

// </editor-fold>

// <editor-fold desc="Internal interfaces and functions">

interface ILexicalContext extends IContext {
   // TODO: Implement
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

   private readonly parent: IContext | null;
   private readonly allowHoisting: boolean;
   private readonly identifiers: string[];

   // </editor-fold>

   constructor(parent: IContext | null, config: ILexicalContextConfig) {
      this.parent = parent;
      this.allowHoisting = config.allowHoisting;
      this.identifiers = config.identifiers;
   }

   // <editor-fold desc="Public methods">

   createContext(config?: ILexicalContextConfig): IContext {
      const cfg = prepareContextConfig(config);
      return new LexicalContext(this, cfg);
   }

   registerBindProgram(program: ProgramNode): TProgramKey {
      throw new Error('Not implemented yet');
   }

   registerEventProgram(program: ProgramNode): void {
      throw new Error('Not implemented yet');
   }

   registerFloatProgram(program: ProgramNode): void {
      throw new Error('Not implemented yet');
   }

   registerProgram(program: ProgramNode): TProgramKey {
      throw new Error('Not implemented yet');
   }

   joinContext(context: IContext, options?: ILexicalContextOptions): void {
      throw new Error('Not implemented yet');
   }

   getProgram(key: TProgramKey): ProgramNode | null {
      throw new Error('Not implemented yet');
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

   getPrograms(localOnly: boolean): ProgramNode[] {
      throw new Error('Not implemented yet');
   }

   getInternalPrograms(): ProgramNode[] {
      throw new Error('Not implemented yet');
   }

   // </editor-fold>

   // <editor-fold desc="Internal methods">

   // TODO: Implement

   // </editor-fold>

   // <editor-fold desc="Private methods">

   // TODO: Implement

   // </editor-fold>

}
