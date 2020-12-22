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
import * as ParallelDeferred from 'Core/ParallelDeferred';
import createController, { IDependenciesController } from 'UI/_builder/Tmpl/core/Dependencies';

/**
 * Interface of collection of inner template representations.
 */
interface ITemplates {
   [name: string]: Ast.TemplateNode;
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
    * Controller of dependencies.
    */
   private readonly dependenciesController: IDependenciesController;

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
      this.dependenciesController = createController(loadDependencies);
      this.dictionary = new Dictionary();
   }

   /**
    * Register dependency.
    * @param path {IPath} Dependency path.
    */
   registerDependency(path: IPath): void {
      this.dependenciesController.registerDependency(path);
   }

   /**
    * Request all registered dependencies.
    */
   requestDependencies(): ParallelDeferred<unknown> {
      return this.dependenciesController.requestDependencies();
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
      this.templates[name] = ast;
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
      return this.templates[name];
   }
}
