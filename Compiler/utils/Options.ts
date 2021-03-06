/**
 * @description Represents interfaces and classes to work with compiler options.
 * @author Крылов М.А.
 */

import { Config } from '../Config';
import { ModulePath } from './ModulePath';

/**
 * Разрешает использование флага useReact, принимаемый в качестве опций компилятора.
 */
const ALLOW_USE_REACT_FLAG = false;

/**
 * Represents interface for traverse config.
 */
interface ITraverseOptions {

   /**
    * Array of ignored nodes.
    * Usually has single 'comment' item.
    */
   ignored: string[];

   /**
    * Control names which must keep dots in its names.
    */
   mustBeDots: string[];

   /**
    * Maximum module name length.
    */
   moduleMaxNameLength: number;

   /**
    * Javascript reserved words.
    */
   reservedWords: string[];

   /**
    * HTML boolean attributes.
    */
   booleanAttributes: string[];
}

/**
 * Compiler options.
 */
export interface IOptions {

   /**
    * Relative path to module with its extension.
    */
   modulePath: ModulePath;

   /**
    * Relative path to module with its extension.
    * FIXME: Do refactor.
    */
   fileName: string;

   /**
    * Flag for saby/builder.
    * FIXME: Do refactor (useJIT).
    */
   fromBuilderTmpl: boolean;

   /**
    * Flag for creating translations dictionary.
    * FIXME: Do refactor (createTranslations).
    */
   createResultDictionary: boolean;

   /**
    * Translatable control options dictionary.
    * FIXME: Do refactor (controlsProperties).
    */
   componentsProperties: object;

   /**
    * Traverse options.
    * FIXME: Do refactor (traverseOptions).
    */
   config: ITraverseOptions;

   /**
    * Flag for wml templates.
    */
   isWasabyTemplate: boolean;

   /**
    * Generate rk-instructions.
    * TODO: Enable this option.
    */
   generateCodeForTranslations: boolean;

   /**
    * The template has references to inline-templates that defined in other file.
    */
   hasExternalInlineTemplates: boolean;

   /**
    * Use react features in template compiling.
    */
   useReact: boolean;
}

/**
 * Represents compiler options data.
 */
export class Options implements IOptions {

   /**
    * Relative path to module with its extension.
    */
   readonly modulePath: ModulePath;

   /**
    * Relative path to module with its extension.
    */
   readonly fileName: string;

   /**
    * Flag for saby/builder.
    */
   readonly fromBuilderTmpl: boolean;

   /**
    * Flag for creating translations dictionary.
    */
   readonly createResultDictionary: boolean;

   /**
    * The template has references to inline-templates that defined in other file.
    */
   readonly hasExternalInlineTemplates: boolean;

   /**
    * Use react features in template compiling.
    */
   readonly useReact: boolean;

   /**
    * Translatable control options dictionary.
    */
   componentsProperties: object;

   /**
    * Traverse options.
    */
   config: ITraverseOptions;

   /**
    * Flag for wml templates.
    */
   isWasabyTemplate: boolean;

   /**
    * Generate rk-instructions.
    */
   generateCodeForTranslations: boolean;

   /**
    * Initialize new instance of compiler options.
    * @param options {IOptions} Compiler options.
    */
   constructor(options: IOptions) {
      this.modulePath = new ModulePath(options.fileName);
      // FIXME: Compatibility with prev builder version (diff checking stage)
      this.fileName = this.modulePath.module;
      this.fromBuilderTmpl = !!options.fromBuilderTmpl;
      this.createResultDictionary = !!options.createResultDictionary;
      this.hasExternalInlineTemplates = !!options.hasExternalInlineTemplates;
      this.componentsProperties = options.componentsProperties || { };
      this.config = options.config || Config as ITraverseOptions;
      this.isWasabyTemplate = this.modulePath.extension === 'wml';
      this.generateCodeForTranslations = options.generateCodeForTranslations;
      this.useReact = ALLOW_USE_REACT_FLAG && !!options.useReact;
   }
}
