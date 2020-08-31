/// <amd-module name="UI/_builder/Tmpl/core/Scope" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Scope.ts
 */

import * as Ast from './Ast';

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
 * Represents methods to work with object that depends on scope.
 */
export default class Scope {

   /**
    * Collection of inner template representations.
    */
   private readonly templates: ITemplates;

   /**
    * Initialize new instance of scope.
    */
   constructor() {
      this.templates = { };
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
