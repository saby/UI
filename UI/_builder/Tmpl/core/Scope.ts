/// <amd-module name="UI/_builder/Tmpl/core/Scope" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Scope.ts
 */

import * as Ast from 'UI/_builder/Tmpl/core/Ast';
import { ITranslationsRegistrar } from 'UI/_builder/Tmpl/core/Text';
import { IPath } from 'UI/_builder/Tmpl/core/Resolvers';
import { Dictionary, ITranslationKey } from 'UI/_builder/Tmpl/i18n/Dictionary';
// @ts-ignore TODO: This module can only be referenced with ECMAScript imports/exports
//             by turning on the 'esModuleInterop' flag and referencing its default export.
import * as Deferred from 'Core/Deferred';
// @ts-ignore TODO: This module can only be referenced with ECMAScript imports/exports
//             by turning on the 'esModuleInterop' flag and referencing its default export.
import * as ParallelDeferred from 'Core/ParallelDeferred';

/**
 * Interface of inner representation of template nodes.
 */
interface ITemplate {

   /**
    * Template node.
    */
   template: Ast.TemplateNode;

   /**
    * Template usages count.
    */
   usages: number;
}

/**
 * Interface of collection of inner template representations.
 */
interface ITemplates {
   [name: string]: ITemplate;
}

/**
 * Interface of collection of dependencies.
 */
interface IDependencies {
   [fullPath: string]: IPath;
}

/**
 * Represents methods to work with object that depends on scope.
 */
export default class Scope implements ITranslationsRegistrar {

   /**
    * Collection of inner template representations.
    */
   private readonly templates: ITemplates;

   /**
    * Flag for loading registered dependencies for only JIT compilation.
    */
   private readonly loadDependencies: boolean;

   /**
    * Collection of dependencies.
    */
   private readonly dependencies: IDependencies;

   /**
    * Collection of requested dependencies.
    */
   private readonly dependencyRequests: Deferred<unknown>[];

   /**
    * Translations dictionary.
    */
   private readonly dictionary: Dictionary;

   /**
    * Initialize new instance of scope.
    * @param loadDependencies {boolean} Load registered dependencies for only JIT compilation.
    */
   constructor(loadDependencies: boolean = false) {
      this.templates = { };
      this.dependencies = { };
      this.loadDependencies = loadDependencies;
      this.dependencyRequests = [];
      this.dictionary = new Dictionary();
   }

   /**
    * Register dependency.
    * @param path {IPath} Dependency path.
    */
   registerDependency(path: IPath): void {
      const fullPath = path.getFullPhysicalPath();
      if (!this.dependencies.hasOwnProperty(fullPath)) {
         this.dependencies[fullPath] = path;
      }
      if (!this.loadDependencies || requirejs.defined(fullPath)) {
         return;
      }
      const deferred = new Deferred();
      this.dependencyRequests.push(deferred);
      if (require.defined(fullPath)) {
         deferred.callback(require(fullPath));
         return;
      }
      require([fullPath], (module) => {
         if (module || module === null) {
            deferred.callback(module);
            return;
         }
         deferred.errback(new Error(`Не удалось загрузить файл "${fullPath}"`));
      }, (error) => {
         deferred.errback(error);
      });
   }

   /**
    * Request all registered dependencies.
    */
   requestDependencies(): ParallelDeferred<unknown> {
      const parallelDeferred = new ParallelDeferred();
      if (!this.loadDependencies || this.dependencyRequests.length === 0) {
         return parallelDeferred.done().getResult();
      }
      this.dependencyRequests.forEach((deferred) => {
         parallelDeferred.push(deferred);
      });
      return parallelDeferred.done().getResult();
   }

   /**
    * Register translation key.
    * @param module {string} Template file where translation item was discovered.
    * @param text {string} Translation text.
    * @param context {string} Translation context.
    */
   registerTranslation(module: string, text: string, context: string): void {
      this.dictionary.push(module, text, context);
   }

   /**
    * Get all collected keys.
    */
   getTranslationKeys(): ITranslationKey[] {
      return this.dictionary.getKeys();
   }

   /**
    * Register template definition.
    * @param name {string} Template name.
    * @param ast {TemplateNode} Template node.
    * @throws {Error} Throws error in case of template re-definition.
    */
   registerTemplate(name: string, ast: Ast.TemplateNode): void {
      if (this.templates.hasOwnProperty(name)) {
         throw new Error(`шаблон с именем "${name}" уже был определен`);
      }
      this.templates[name] = {
         template: ast,
         usages: 0
      };
   }

   /**
    * Check if template has been already declared.
    * @deprecated
    * @param name {string} Template name.
    * @returns {boolean} Returns true in case of declared template.
    */
   hasTemplate(name: string): boolean {
      return this.templates.hasOwnProperty(name);
   }

   /**
    * Register template usage.
    * @param name {string} Template name.
    * @throws {Error} Throws error in case of template is undefined.
    */
   registerTemplateUsage(name: string): void {
      if (!this.templates.hasOwnProperty(name)) {
         throw new Error(`шаблон с именем "${name}" не был определен`);
      }
      ++this.templates[name].usages;
   }

   /**
    * Get collection of defined template names.
    * @returns {string[]} Returns collection of defined template names.
    */
   getTemplateNames(): string[] {
      return Object.keys(this.templates);
   }

   /**
    * Get template node by its name.
    * @param name {string} Template name.
    * @returns {TemplateNode} Template node.
    * @throws {Error} Throws error in case of template is undefined.
    */
   getTemplate(name: string): Ast.TemplateNode {
      if (!this.templates.hasOwnProperty(name)) {
         throw new Error(`шаблон с именем "${name}" не был определен`);
      }
      return this.templates[name].template;
   }

   /**
    * Get template usages by its name.
    * @param name {string} Template name.
    * @returns {number} Template usages count.
    * @throws {Error} Throws error in case of template is undefined.
    */
   getTemplateUsages(name: string): number {
      if (!this.templates.hasOwnProperty(name)) {
         throw new Error(`шаблон с именем "${name}" не был определен`);
      }
      return this.templates[name].usages;
   }

   /**
    * Remove template by its name.
    * @param name
    */
   removeTemplate(name: string): void {
      delete this.templates[name];
   }
}
