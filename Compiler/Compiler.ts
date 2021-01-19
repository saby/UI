/**
 * @description Main wml compiler module.
 * @author Крылов М.А.
 */

import * as ComponentCollector from 'Compiler/core/_deprecated/ComponentCollector';
import { parse } from 'Compiler/html/Parser';
import { createErrorHandler } from 'Compiler/utils/ErrorHandler';
import getWasabyTagDescription from 'Compiler/core/Tags';
import { traverse } from 'Compiler/core/bridge';
import * as codegenBridge from 'Compiler/codegen/bridge';
import * as templates from 'Compiler/codegen/templates';
import { ISource, Source } from './utils/Source';
import { IOptions, Options } from './utils/Options';
import { ModulePath } from './utils/ModulePath';

/**
 * Represents compiler interface.
 */
export interface ICompiler {
   /**
    * Compile input text.
    * @param text Source code text.
    * @param options Compiler options.
    */
   compile(text: string, options: IOptions): Promise<IArtifact>;
}

/**
 * Represents artifact interface.
 */
export interface IArtifact {

   /**
    * Node name for require.
    */
   nodeName: string;

   /**
    * Array of happened errors.
    * FIXME: release error handler.
    */
   errors: Error[];

   /**
    * Compile result: Javascript source code.
    */
   text: string;

   /**
    * Translations dictionary.
    */
   localizedDictionary: IDictionaryItem[];

   /**
    * Array of input file dependencies.
    */
   dependencies: string[];

   /**
    * Flag whether compile result is stable.
    * It is stable if and only if there were not fatal errors.
    */
   stable: boolean;
}

/**
 * Create empty artifact with default values.
 */
function createArtifact(options: IOptions): IArtifact {
   return {
      nodeName: ModulePath.createNodeName(options.modulePath),
      errors: [],
      text: null,
      localizedDictionary: [],
      dependencies: null,
      stable: false
   };
}

/**
 * Record in translations dictionary.
 */
interface IDictionaryItem {

   /**
    * Text to translate.
    */
   key: string;

   /**
    * Translation context.
    */
   context: string;

   /**
    * Template module that contains this translation.
    */
   module: string;
}

/**
 * Represents abstract syntax tree interface as array of "object" - abstract syntax nodes.
 * FIXME: release interfaces for these nodes.
 */
interface IAST extends Array<Object> {
   childrenStorage: string[];
   reactiveProps: string[];
   templateNames: string[];
   __newVersion: boolean;
}

/**
 * Represents interface for traverse resulting object.
 */
interface ITraversed {

   /**
    * Abstract syntax tree.
    */
   ast: IAST;

   /**
    * Translations dictionary.
    */
   localizedDictionary: IDictionaryItem[];

   /**
    * Array of input file dependencies.
    */
   dependencies: string[];

   /**
    * Collection of inline template names.
    */
   templateNames: string[];
}

/**
 * Type for resolver controls function.
 */
declare type TResolver = (path: string) => string;

/**
 * Get resolver controls.
 * @param plugin Require plugin name.
 */
function getResolverControls(plugin: string): TResolver {
   return function resolverControls(path: string): string {
      return plugin + '!' + path;
   };
}

/**
 * Fix traverse result.
 * @param rawTraversed Actual traverse result.
 * @param dependencies Array of dependencies.
 */
function fixTraversed(rawTraversed: IAST | { astResult: IAST; words: IDictionaryItem[]; }, dependencies: string[]): ITraversed {
   if (Array.isArray(rawTraversed)) {
      return {
         ast: rawTraversed as IAST,
         localizedDictionary: [],
         templateNames: rawTraversed.templateNames,
         dependencies
      };
   }
   return {
      ast: rawTraversed.astResult as IAST,
      localizedDictionary: rawTraversed.words,
      templateNames: rawTraversed.astResult.templateNames,
      dependencies
   };
}

/**
 * Represents base compiler methods for wml and tmpl.
 */
abstract class BaseCompiler implements ICompiler {
   protected constructor() { }

   /**
    * Do initialize before compilation process.
    */
   abstract initWorkspace(templateNames: string[]): void;

   /**
    * Clean needed variables after compilation process.
    */
   abstract cleanWorkspace(): void;

   /**
    * Create source for input source text.
    * @param text Input source text.
    * @param fileName Source file name.
    */
   abstract createSource(text: string, fileName: string): ISource;

   /**
    * Generate template module.
    * @param func Template function.
    * @param deps Array of dependencies.
    * @param reactive Array of names of reactive variables.
    * @param path Template module path.
    */
   abstract generateModule(func: any, deps: string[], reactive: string[], path: ModulePath): string;

   /**
    * Generate code for template.
    * @param traversed Traverse object.
    * @param options Compiler options.
    */
   generate(traversed: ITraversed, options: IOptions): string {
      // tslint:disable:prefer-const
      let tmplFunc = codegenBridge.getFunction(traversed.ast, null, options, null);
      if (!tmplFunc) {
         throw new Error('Шаблон не может быть построен. Не загружены зависимости.');
      }
      return this.generateModule(tmplFunc, traversed.dependencies, traversed.ast.reactiveProps, options.modulePath);
   }

   /**
    * Traverse source code.
    * @param source Source code.
    * @param options Compiler options.
    */
   traverse(source: ISource, options: IOptions): Promise<ITraversed> {
      return new Promise<ITraversed>((resolve: any, reject: any) => {
         try {
            // TODO: реализовать whitespace visitor и убрать флаг needPreprocess
            const needPreprocess = options.modulePath.extension === 'wml';
            const resolver = getResolverControls(options.modulePath.extension);
            const errorHandler = createErrorHandler(!options.fromBuilderTmpl);
            // tslint:disable:prefer-const
            let parsed = parse(source.text, options.fileName, {
               xml: true,
               allowComments: true,
               allowCDATA: true,
               compatibleTreeStructure: true,
               rudeWhiteSpaceCleaning: true,
               normalizeLineFeed: true,
               cleanWhiteSpaces: true,
               needPreprocess: needPreprocess,
               tagDescriptor: getWasabyTagDescription,
               errorHandler
            });
            const hasFailures = errorHandler.hasFailures();
            const lastMessage = errorHandler.popLastErrorMessage();
            errorHandler.flush();
            if (hasFailures) {
               reject(new Error(lastMessage));
               return;
            }
            const dependencies = ComponentCollector.getComponents(parsed);
            // tslint:disable:prefer-const
            let traversed = traverse(parsed, resolver, options);
            traversed.addCallbacks(
               (rawTraversed) => resolve(fixTraversed(rawTraversed, dependencies)),
               (error) => reject(error)
            );
         } catch (error) {
            reject(error);
         }
      });
   }

   /**
    * Compile input source code into Javascript code.
    * @param text Input source code.
    * @param options Compiler options.
    */
   compile(text: string, options: IOptions): Promise<IArtifact> {
      return new Promise<IArtifact>((resolve: any, reject: any) => {
         let artifact: IArtifact = createArtifact(options);
         try {
            const source: ISource = this.createSource(text, options.fileName);
            this.traverse(source, options)
               .then((traversed) => {
                  try {
                     this.initWorkspace(traversed.templateNames);
                     artifact.text = this.generate(traversed, options);
                     artifact.localizedDictionary = traversed.localizedDictionary;
                     artifact.dependencies = traversed.dependencies;
                     artifact.stable = true;
                     resolve(artifact);
                  } catch (error) {
                     artifact.errors.push(error);
                     reject(artifact);
                  } finally {
                     this.cleanWorkspace();
                  }
               })
               .catch((error) => {
                  this.cleanWorkspace();
                  artifact.errors.push(error);
                  reject(artifact);
               });
         } catch (error) {
            artifact.errors.push(error);
            reject(artifact);
         }
      });
   }
}

/**
 * This class represents methods to compile tmpl files.
 */
// @ts-ignore
class CompilerTmpl extends BaseCompiler {
   constructor() {
      super();
   }

   /**
    * Do initialize before compilation process.
    */
   initWorkspace(templateNames: string[]): void {
      codegenBridge.initWorkspaceTMPL(templateNames);
   }

   /**
    * Clean needed variables after compilation process.
    */
   cleanWorkspace(): void {
      codegenBridge.cleanWorkspace();
   }

   /**
    * Create source for input source text.
    * @param text Input source text.
    * @param fileName Source file name.
    */
   createSource(text: string, fileName: string): ISource {
      return new Source(text, fileName);
   }

   /**
    * Generate template module.
    * @param func Template function.
    * @param deps Array of dependencies.
    * @param reactive Array of names of reactive variables.
    * @param path Template module path.
    */
   generateModule(func: any, deps: string[], reactive: string[], path: ModulePath): string {
      return templates.generateTmplDefine(
         path.module, path.extension, func, deps, reactive
      );
   }
}

/**
 * This class represents methods to compile wml files.
 */
// @ts-ignore
class CompilerWml extends BaseCompiler {
   constructor() {
      super();
   }

   /**
    * Do initialize before compilation process.
    */
   initWorkspace(templateNames: string[]): void {
      codegenBridge.initWorkspaceWML(templateNames);
   }

   /**
    * Clean needed variables after compilation process.
    */
   cleanWorkspace(): void {
      codegenBridge.cleanWorkspace();
   }

   /**
    * Create source for input source text.
    * @param text Input source text.
    * @param fileName Source file name.
    */
   createSource(text: string, fileName: string): ISource {
      return new Source(text, fileName);
   }

   /**
    * Generate template module.
    * @param func Template function.
    * @param deps Array of dependencies.
    * @param reactive Array of names of reactive variables.
    * @param path Template module path.
    */
   generateModule(func: any, deps: string[], reactive: string[], path: ModulePath): string {
      const module = templates.generateDefine(
         path.module, path.extension, func, deps, reactive
      );
      return templates.clearSourceFromDeprecated(module);
   }
}

let DoT;

/**
 * This class represents methods to compile xhtml files.
 */
class CompilerXHTML implements ICompiler {
   /**
    * Generate template module.
    * @param func Template function.
    * @param path Template module path.
    */
   generate(func: any, path: ModulePath): string {
      const localizationModule = 'i18n!' + path.getInterfaceModule();
      const templateModuleRequire = 'html!' + path.module;
      const template = func.toString().replace(/[\n\r]/g, '');
      return 'define("' + templateModuleRequire + '",["' + localizationModule + '"],function(){' +
         'var f=' + template + ';' +
         'f.toJSON=function(){' +
         'return {$serialized$:"func", module:"' + templateModuleRequire + '"}' +
         '};return f;});';
   }

   /**
    * Compile input source code into Javascript code.
    * @param text Input source code.
    * @param options Compiler options.
    */
   compile(text: string, options: IOptions): Promise<IArtifact> {
      return new Promise((resolve: any, reject: any) => {
         let artifact: IArtifact = createArtifact(options);
         if (!DoT) {
            DoT = requirejs.defined('Core/js-template-doT') && requirejs('Core/js-template-doT');
         }
         try {
            // tslint:disable:prefer-const
            let config = DoT.getSettings();
            // tslint:disable:prefer-const
            let template = DoT.template(text, config, undefined, undefined, options.modulePath.module);
            artifact.text = this.generate(template, options.modulePath);
            artifact.stable = true;
            resolve(artifact);
         } catch (error) {
            artifact.errors.push(error);
            reject(artifact);
         }
      });
   }
}

/**
 * This class only represents returning error.
 */
class ErrorCompiler implements ICompiler {
   compile(text: string, options: IOptions): Promise<IArtifact> {
      let artifact = createArtifact(options);
      artifact.errors.push(new Error(
         'Данное расширение шаблона не поддерживается. Получен шаблон с расширением "' + options.modulePath.extension + '". Ожидалось одно из следующих расширений: wml, tmpl, xhtml.'
      ));
      return Promise.reject(artifact);
   }
}

/**
 * Get actual compiler with input source file extension.
 * @param extension Source file extension.
 */
function getCompiler(extension: string): ICompiler {
   switch (extension) {
      case 'wml':
         return new CompilerWml();
      case 'tmpl':
         return new CompilerTmpl();
      case 'xhtml':
         return new CompilerXHTML();
      default:
         return new ErrorCompiler();
   }
}

/**
 * Common class for compiling.
 */
export class Compiler implements ICompiler {

   /**
    * Compile input source code into Javascript code.
    * @param text Input source code.
    * @param config Compiler options.
    */
   compile(text: string, config: IOptions): Promise<IArtifact> {
      const options = new Options(config);
      const compiler = getCompiler(options.modulePath.extension);
      return compiler.compile(text, options);
   }
}
