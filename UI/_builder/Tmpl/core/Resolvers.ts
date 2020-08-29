/// <amd-module name="UI/_builder/Tmpl/core/Resolvers" />

/**
 * @author Крылов М.А.
 */

const EMPTY_STRING = '';
const WS_PREFIX_PATTERN = /^ws:/i;

/**
 * Resolve component name
 * TODO: spec!!! valid!!
 * @param name
 */
export function resolveComponentName(name: string): { name: string; path: string[]; } {
   const parts = name.split(':', 2);
   return {
      name: parts[0],
      path: parts[1] ? parts[1].split('.') : []
   };
}

/**
 * Resolve component name:  UIModule.dir.library:module
 * TODO: spec!!! valid!!
 * @param name
 */
export function resolveComponent(name: string): { library: string[]; module: string[]; } {
   const meta = resolveComponentName(name);
   return {
      library: meta.name.split('.'),
      module: meta.path
   }
}

/**
 * Resolve function path: UIModule/dir/library:module.property.functionName
 * TODO: spec!!! valid!!
 * @param name {string} Function path.
 */
export function resolveFunction(name: string): { module: string[]; path: string[]; } {
   const parts = name.split(':');
   if (parts.length !== 2) {
      throw new Error('Некорректный путь. Ожидался 1 colon-разделитель');
   }
   const [ fullModule, fullPath ] = parts;
   const module = fullModule.split('/');
   const path = fullPath.split('.');
   if (module.length < 1 || path.length < 1) {
      throw new Error('Задан некорректный путь');
   }
   return {
     module,
     path
   };
}

/**
 * TODO: spec!!! valid!!
 * @param name
 */
export function isComponentOptionName(name: string): boolean {
   return WS_PREFIX_PATTERN.test(name);
}

/**
 * TODO: spec!!! valid!!
 * @param name
 */
export function getComponentOptionName(name: string): string {
   return name.replace(WS_PREFIX_PATTERN, EMPTY_STRING);
}

/**
 * TODO: spec!!! valid!!
 * @param name
 */
export function isComponentName(name: string): boolean {
   return /(\w+[\.:])+\w+/gi.test(name);
}

/**
 * TODO: spec!!! valid!!
 * @param name
 */
export function validateTemplateName(name: string): string {
   if (!name.match(/^[a-zA-Z_]\w*$/g)) {
      throw new Error(`Некорректное имя шаблона "${name}"`);
   }
   return name;
}
