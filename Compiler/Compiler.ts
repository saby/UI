/**
 * @description Main wml compiler module.
 * @author Крылов М.А.
 */

import { parse } from './html/Parser';
import { createErrorHandler } from './utils/ErrorHandler';
import getWasabyTagDescription from './core/Tags';
import { traverseSync } from './core/bridge';
import * as codegenBridge from './codegen/bridge';
import * as templates from './codegen/templates';
import { ISource, Source } from './utils/Source';
import { IOptions, Options } from './utils/Options';
import { ModulePath } from './utils/ModulePath';
import { ITranslationKey } from './i18n/Dictionary';
import { ITranslationUnit } from './core/internal/Annotate';

/**
 * Флаг - генерировать rk-функции
 * @todo https://online.sbis.ru/opendoc.html?guid=ea8a25dd-5a2f-4330-8d6f-599c8c5878dd
 */
const USE_GENERATE_CODE_FOR_TRANSLATIONS = false;

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
   localizedDictionary: ITranslationKey[];

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
    * @param hasTranslations Translation unit contains translation constructions.
    */
   abstract generateModule(func: any, deps: string[], reactive: string[], path: ModulePath, hasTranslations: boolean): string;

   /**
    * Generate code for template.
    * @param unit {ITranslationUnit} Compilation unit.
    * @param options {IOptions} Compiler options.
    */
   generate(unit: ITranslationUnit, options: IOptions): string {
      const codeGenOptions = {
         ...options,
         generateTranslations: (
             options.generateCodeForTranslations && USE_GENERATE_CODE_FOR_TRANSLATIONS
             || !USE_GENERATE_CODE_FOR_TRANSLATIONS
         ) && unit.hasTranslations
      };
      // tslint:disable:prefer-const
      let tmplFunc = codegenBridge.getFunctionWithUnit(unit, codeGenOptions);
      if (!tmplFunc) {
         throw new Error('Шаблон не может быть построен. Не загружены зависимости.');
      }
      return this.generateModule(
          tmplFunc, unit.dependencies, unit.reactiveProps, options.modulePath, unit.hasTranslations
      );
   }

   /**
    * Traverse source code.
    * @param source Source code.
    * @param options Compiler options.
    */
   traverse(source: ISource, options: IOptions): ITranslationUnit {
      // TODO: реализовать whitespace visitor и убрать флаг needPreprocess
      const needPreprocess = options.modulePath.extension === 'wml';
      const errorHandler = createErrorHandler(!options.fromBuilderTmpl);
      const parsed = parse(source.text, options.fileName, {
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
         throw new Error(lastMessage);
      }
      return traverseSync(parsed, options) as ITranslationUnit;
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
            const unit = this.traverse(source, options);
            try {
               this.initWorkspace(unit.templateNames);
               artifact.text = this.generate(unit, options);
               artifact.localizedDictionary = unit.localizedDictionary;
               artifact.dependencies = unit.dependencies;
               artifact.stable = true;
               resolve(artifact);
            } catch (error) {
               artifact.errors.push(error);
               reject(artifact);
            } finally {
               this.cleanWorkspace();
            }
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
    * @param hasTranslations Translation unit contains translation constructions.
    */
   generateModule(func: any, deps: string[], reactive: string[], path: ModulePath, hasTranslations: boolean): string {
      return templates.generateTmplDefine(
         path.module, path.extension, func, deps, reactive, hasTranslations
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
    * @param hasTranslations Translation unit contains translation constructions.
    */
   generateModule(func: any, deps: string[], reactive: string[], path: ModulePath, hasTranslations: boolean): string {
      const module = templates.generateDefine(
         path.module, path.extension, func, deps, reactive, hasTranslations
      );
      return templates.clearSourceFromDeprecated(module);
   }
}

/**
 * This class only represents returning error.
 */
class ErrorCompiler implements ICompiler {
   compile(text: string, options: IOptions): Promise<IArtifact> {
      let artifact = createArtifact(options);
      artifact.errors.push(new Error(
         'Данное расширение шаблона не поддерживается. Получен шаблон с расширением "' + options.modulePath.extension + '". Ожидалось одно из следующих расширений: wml, tmpl.'
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
