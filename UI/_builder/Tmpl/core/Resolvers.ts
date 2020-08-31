/// <amd-module name="UI/_builder/Tmpl/core/Resolvers" />

/**
 * @author Крылов М.А.
 */

/**
 * Separator for RequireJS plugins.
 */
const REQUIRE_JS_PLUGIN_SEPARATOR = '!';

/**
 * Physical path separator.
 */
const PHYSICAL_PATH_SEPARATOR = '/';

/**
 * Logical path separator.
 */
const LOGICAL_PATH_SEPARATOR = '.';

/**
 *
 */
const INTER_PATH_SEPARATOR = ':';

/**
 * Empty string constant.
 */
const EMPTY_STRING = '';

/**
 * Special prefix for component and object options.
 */
const WS_PREFIX_PATTERN = /^ws:/i;

/**
 * Inline template name pattern.
 */
const INLINE_TEMPLATE_PATTERN = /^[a-zA-Z_]\w*$/i;

/**
 * RequireJS plugin flags.
 */
export enum RequireJSPlugins {
   NONE = 0,
   BROWSER = 1,
   CDN = 1 << 2,
   CSS = 1 << 3,
   HTML = 1 << 4,
   IS = 1 << 5,
   JS = 1 << 6,
   JSON = 1 << 7,
   NORMALIZE = 1 << 8,
   OPTIONAL = 1 << 9,
   ORDER = 1 << 10,
   PRELOAD = 1 << 11,
   TEMPLATE = 1 << 12,
   TEXT = 1 << 13,
   TMPL = 1 << 14,
   WML = 1 << 15,
   XML = 1 << 16
}

function getPluginFlag(plugin: string): RequireJSPlugins {
   const pluginName = plugin.toUpperCase();
   if (RequireJSPlugins[pluginName]) {
      return RequireJSPlugins[pluginName];
   }
   return RequireJSPlugins.NONE;
}

function isCapitalized(name: string): boolean {
   return name[0] === name[0].toUpperCase();
}

export interface IPhysicalPathDescription {
   plugins: RequireJSPlugins;
   physicalPath: string;
}

export function getPhysicalPathDescription(path: string): IPhysicalPathDescription {
   const parts = path.split(REQUIRE_JS_PLUGIN_SEPARATOR);
   const physicalPath = parts.pop();
   let plugins = RequireJSPlugins.NONE;
   for (let index = 0; index < parts.length; ++index) {
      plugins = plugins | getPluginFlag(parts[index]);
   }
   return {
      physicalPath,
      plugins
   };
}

export function isPhysicalPath(path: string): boolean {
   return path.indexOf(PHYSICAL_PATH_SEPARATOR) > -1;
}

export function isLogicalPath(path: string): boolean {
   return path.indexOf(LOGICAL_PATH_SEPARATOR) > -1;
}

export function isOption(name: string): boolean {
   return WS_PREFIX_PATTERN.test(name);
}

export function resolveOption(name: string): string {
   return name.replace(WS_PREFIX_PATTERN, EMPTY_STRING);
}

export function isComponent(name: string): boolean {
   return isLogicalPath(name) && isCapitalized(name);
}

/**
 * Interface for complex paths.
 */
export interface IComplexPath {

   /**
    * Physical path to module.
    */
   physicalPath: string[];

   /**
    * Logical path to value.
    */
   logicalPath: string[];
}

export function isDynamicTemplateFile(path: string): boolean {
   // FIXME: legacy - UI/_builder/Tmpl/modules/utils/names @ isTemplateString
   const ALLOWED_PLUGINS = RequireJSPlugins.TMPL | RequireJSPlugins.HTML | RequireJSPlugins.WML;
   const description = getPhysicalPathDescription(path);
   return !!(description.plugins & ALLOWED_PLUGINS);
}

export function isDynamicControl(path: string): boolean {
   // FIXME: legacy - UI/_builder/Tmpl/modules/utils/names @ isControlString
   const ALLOWED_PLUGINS = RequireJSPlugins.JS;
   const description = getPhysicalPathDescription(path);
   return !!(description.plugins & ALLOWED_PLUGINS);
}

export function resolveInlineTemplate(name: string): string {
   // FIXME: legacy - UI/_builder/Tmpl/modules/template @ validateTemplateName
   if (!INLINE_TEMPLATE_PATTERN.test(name)) {
      throw new Error(`некорректное имя шаблона "${name}"`);
   }
   return name;
}

// UIModule.dir.library:module
export function resolveComponent(name: string): IComplexPath {
   const parts = name.split(INTER_PATH_SEPARATOR, 2);
   const physicalPath = parts[0].split(LOGICAL_PATH_SEPARATOR);
   const logicalPath = parts[1] ? parts[1].split(LOGICAL_PATH_SEPARATOR) : [];
   return {
      physicalPath,
      logicalPath
   };
}
// UIModule/dir/library:module.property.functionName
export function resolveFunction(name: string): IComplexPath {
   const parts = name.split(INTER_PATH_SEPARATOR);
   if (parts.length !== 2) {
      throw new Error('Некорректный путь. Ожидался 1 colon-разделитель');
   }
   const [ fullModule, fullPath ] = parts;
   const physicalPath = fullModule.split(PHYSICAL_PATH_SEPARATOR);
   const logicalPath = fullPath.split(LOGICAL_PATH_SEPARATOR);
   if (physicalPath.length < 1 || logicalPath.length < 1) {
      throw new Error('Задан некорректный путь');
   }
   return {
      physicalPath,
      logicalPath
   };
}
