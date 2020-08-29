/// <amd-module name="UI/_builder/Tmpl/core/Resolvers" />

/**
 * @author Крылов М.А.
 */

const EMPTY_STRING = '';
const WS_PREFIX_PATTERN = /^ws:/i;

export interface IComplexPath {
   physicalPath: string[];
   logicalPath: string[];
}

export interface IResolver {
   // attr name
   resolveAttribute(name: string): string;
   // comp/obj prop
   resolveOption(name: string): string;
   // tmpl name
   resolveTemplate(name: string): string;
   // comp path
   resolveComponent(name: string): IComplexPath;
   // func path
   resolveFunction(name: string): IComplexPath;

   isComponentOptionName(name: string): boolean;
   getComponentOptionName(name: string): string;
   isComponentName(name: string): boolean;
   resolveTemplate(name: string): string;
   resolveComponent(name: string): IComplexPath;
   resolveFunction(name: string): IComplexPath;
}

// TODO: spec!!! valid!!
class Resolver implements IResolver {

   constructor() {
      // TODO: spec!!! valid!!
   }

   resolveAttribute(name: string): string {
      // TODO: spec!!! valid!!
      return name;
   }

   resolveOption(name: string): string {
      // TODO: spec!!! valid!!
      return name;
   }

   isComponentOptionName(name: string): boolean {
      // TODO: spec!!! valid!!
      return WS_PREFIX_PATTERN.test(name);
   }

   getComponentOptionName(name: string): string {
      // TODO: spec!!! valid!!
      return name.replace(WS_PREFIX_PATTERN, EMPTY_STRING);
   }

   isComponentName(name: string): boolean {
      // TODO: spec!!! valid!!
      return /(\w+[\.:])+\w+/gi.test(name);
   }

   resolveTemplate(name: string): string {
      // TODO: spec!!! valid!!
      if (!name.match(/^[a-zA-Z_]\w*$/g)) {
         throw new Error(`Некорректное имя шаблона "${name}"`);
      }
      return name;
   }

   // UIModule.dir.library:module
   resolveComponent(name: string): IComplexPath {
      // TODO: spec!!! valid!!
      const parts = name.split(':', 2);
      const physicalPath = parts[0].split('.');
      const logicalPath = parts[1] ? parts[1].split('.') : [];
      return {
         physicalPath,
         logicalPath
      };
   }

   // UIModule/dir/library:module.property.functionName
   resolveFunction(name: string): IComplexPath {
      // TODO: spec!!! valid!!
      const parts = name.split(':');
      if (parts.length !== 2) {
         throw new Error('Некорректный путь. Ожидался 1 colon-разделитель');
      }
      const [ fullModule, fullPath ] = parts;
      const physicalPath = fullModule.split('/');
      const logicalPath = fullPath.split('.');
      if (physicalPath.length < 1 || logicalPath.length < 1) {
         throw new Error('Задан некорректный путь');
      }
      return {
         physicalPath,
         logicalPath
      };
   }
}

export function createResolver(): IResolver {
   return new Resolver();
}
