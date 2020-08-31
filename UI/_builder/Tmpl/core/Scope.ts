/// <amd-module name="UI/_builder/Tmpl/core/Scope" />

/**
 * @author Крылов М.А.
 */

import * as Ast from './Ast';

interface ITemplate {
   template: Ast.TemplateNode;
   usages: number;
}

interface ITemplates {
   [name: string]: ITemplate;
}

export default class Scope {
   private readonly templates: ITemplates;

   constructor() {
      this.templates = { };
   }

   registerTemplate(name: string, ast: Ast.TemplateNode): void {
      if (this.templates.hasOwnProperty(name)) {
         throw new Error(`шаблон с именем "${name}" уже был определен`);
      }
      this.templates[name] = {
         template: ast,
         usages: 0
      };
   }

   registerTemplateUsage(name: string): void {
      if (!this.templates.hasOwnProperty(name)) {
         throw new Error(`шаблон с именем "${name}" не был определен`);
      }
      ++this.templates[name].usages;
   }

   getTemplateNames(): string[] {
      return Object.keys(this.templates);
   }

   getTemplate(name: string): ITemplate {
      if (!this.templates.hasOwnProperty(name)) {
         throw new Error(`шаблон с именем "${name}" не был определен`);
      }
      return this.templates[name];
   }

   removeTemplate(name: string): void {
      delete this.templates[name];
   }
}
