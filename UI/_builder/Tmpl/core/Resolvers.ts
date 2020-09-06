/// <amd-module name="UI/_builder/Tmpl/core/Resolvers" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Resolvers.ts
 */

import { isLogicalPath } from 'UI/_builder/Tmpl/core/Path';

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
 * Physical and logical paths separator.
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
 * Special UI-module names that do not obey standard of naming UI-modules.
 */
const SPECIAL_UI_MODULE_NAMES = [
   'SBIS3.CONTROLS',
   'SBIS3.ENGINE'
];

/**
 * Pattern for extension of template file path.
 */
const TEMPLATE_FILE_EXTENSION_PATTER = /\.(tmpl|wml)/i;

/**
 * Get RequireJS plugin flag by plugin name.
 * @param plugin {string} RequireJS plugin name.
 * @returns {RequireJSPlugins} Returns found RequireJS plugin flag.
 */
function getPluginFlag(plugin: string): RequireJSPlugins {
   const pluginName = plugin.toUpperCase();
   if (RequireJSPlugins[pluginName]) {
      return RequireJSPlugins[pluginName];
   }
   throw new Error(
      `обнаружен неизвестный плагин "${plugin}" RequireJS`
   );
}

/**
 * Find special UI module name if input name starts with its.
 * @param physicalPath {string} Physical path.
 * @returns {string} Found UI-module name or empty string.
 */
function findSpecialUIModulePrefix(physicalPath: string): string {
   for (let index = 0; index < SPECIAL_UI_MODULE_NAMES.length; ++index) {
      const specialUIModuleName = SPECIAL_UI_MODULE_NAMES[index];
      if (physicalPath.startsWith(specialUIModuleName)) {
         return specialUIModuleName;
      }
   }
   return EMPTY_STRING;
}

/**
 * Extract RequireJS plugins from full path.
 * @param fullPath {string} Full path to source with RequireJS plugins.
 */
function extractPlugins(fullPath: string): { plugins: RequireJSPlugins; path: string; } {
   const parts = fullPath.split(REQUIRE_JS_PLUGIN_SEPARATOR);
   const path = parts.pop();
   let plugins = RequireJSPlugins.NONE;
   for (let index = 0; index < parts.length; ++index) {
      plugins = plugins | getPluginFlag(parts[index]);
   }
   return {
      plugins,
      path
   };
}

/**
 * Check if first character is capitalized.
 * @param name {string} Any name.
 */
function isCapitalized(name: string): boolean {
   return name[0] === name[0].toUpperCase();
}

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

/**
 * Interface for complex paths.
 */
export interface IComplexPath {

   /**
    * Mounted RequireJS plugins.
    */
   plugins: RequireJSPlugins;

   /**
    * Physical path to module.
    */
   physicalPath: string[];

   /**
    * Logical path to value.
    */
   logicalPath: string[];
}

/**
 * Parse component name into complex path.
 * @param fullPath {string} Component name.
 * @returns {IComplexPath} Returns complex path description for component.
 * @throws {Error} Throws Error in case of invalid path for component.
 */
export function parseComponentPath(fullPath: string): IComplexPath {
   const paths = fullPath.split(INTER_PATH_SEPARATOR);
   if (paths.length > 2) {
      throw new Error(
         `некорректное имя компонента "${fullPath}" - ожидалось не более 1 COLON(:)-разделителя`
      );
   }
   // TODO: validate paths
   const physicalPathString = paths.shift();
   const logicalPathString = paths.length === 1 ? paths.shift() : EMPTY_STRING;
   const prefix = findSpecialUIModulePrefix(physicalPathString);
   const physicalPathOffset = prefix !== EMPTY_STRING? prefix.length + 1 : 0;
   const physicalPath = physicalPathString
      .slice(physicalPathOffset)
      .split(LOGICAL_PATH_SEPARATOR);
   if (prefix !== EMPTY_STRING) {
      physicalPath.unshift(prefix);
   }
   const logicalPath = logicalPathString !== EMPTY_STRING
      ? logicalPathString.split(LOGICAL_PATH_SEPARATOR)
      : [ ];
   return {
      plugins: RequireJSPlugins.NONE,
      physicalPath,
      logicalPath
   };
}

/**
 * Parse function path.
 * @param fullPath {string} Full path to source with RequireJS plugins.
 * @returns {IComplexPath} Returns complex path description for function.
 * @throws {Error} Throws Error in case of invalid path for function.
 */
export function parseFunctionPath(fullPath: string): IComplexPath {
   const { plugins, path } = extractPlugins(fullPath);
   const paths = path.split(INTER_PATH_SEPARATOR);
   if (paths.length > 2) {
      throw new Error(
         `некорректный путь к функции "${fullPath}" - ожидалось не более 1 COLON(:)-разделителя`
      );
   }
   // TODO: validate paths
   const physicalPathString = paths.shift();
   if (TEMPLATE_FILE_EXTENSION_PATTER.test(physicalPathString)) {
      throw new Error(`некорректный путь к функции "${fullPath}" - указано расширение файла`);
   }
   const logicalPathString = paths.length === 1 ? paths.shift() : EMPTY_STRING;
   const prefix = findSpecialUIModulePrefix(physicalPathString);
   const physicalPathOffset = prefix !== EMPTY_STRING ? prefix.length + 1 : 0;
   const physicalPath = physicalPathString
      .slice(physicalPathOffset)
      .split(PHYSICAL_PATH_SEPARATOR);
   if (prefix !== EMPTY_STRING) {
      physicalPath.unshift(prefix);
   }
   const logicalPath = logicalPathString !== EMPTY_STRING
      ? logicalPathString.split(LOGICAL_PATH_SEPARATOR)
      : [ ];
   if (physicalPath.length === 0) {
      throw new Error(
         `некорректный путь к функции "${fullPath}" - отсутствует физический путь к модулю, в котором находится запрашиваемая функция`
      );
   }
   if (logicalPath.length === 0) {
      throw new Error(
         `некорректный путь к функции "${fullPath}" - отсутствует логический путь к функции, по которому функция должна быть разрешена внутри указанного модуля`
      );
   }
   if (plugins !== RequireJSPlugins.NONE) {
      throw new Error(
         `некорректный путь к функции "${fullPath}" - использовать плагины RequireJS запрещено`
      );
   }
   return {
      plugins,
      physicalPath,
      logicalPath
   };
}

/**
 * Parse template file path.
 * @param fullPath {string} Full path to source with RequireJS plugins.
 * @returns {IComplexPath} Returns complex path description for template file path.
 * @throws {Error} Throws Error in case of invalid path for template file path.
 */
export function parseTemplatePath(fullPath: string): IComplexPath {
   const { plugins, path } = extractPlugins(fullPath);
   // TODO: validate paths
   const logicalPath = [ ];
   if (TEMPLATE_FILE_EXTENSION_PATTER.test(path)) {
      throw new Error(`некорректный путь к файлу "${fullPath}" - указано расширение файла`);
   }
   const prefix = findSpecialUIModulePrefix(path);
   const physicalPathOffset = prefix !== EMPTY_STRING ? prefix.length + 1 : 0;
   const physicalPath = path
      .slice(physicalPathOffset)
      .split(PHYSICAL_PATH_SEPARATOR);
   if (prefix !== EMPTY_STRING) {
      physicalPath.unshift(prefix);
   }
   if (physicalPath.length === 0) {
      throw new Error(
         `некорректный путь к файлу "${fullPath}" - отсутствует физический путь к модулю, в котором находится запрашиваемый шаблон`
      );
   }
   return {
      plugins,
      physicalPath,
      logicalPath
   };
}

/**
 * Check if name is valid option name.
 * @param name {string} Option name.
 */
export function isOption(name: string): boolean {
   return WS_PREFIX_PATTERN.test(name);
}

/**
 * Resolve option name.
 * @param name {string} Option name.
 */
export function resolveOption(name: string): string {
   return name.replace(WS_PREFIX_PATTERN, EMPTY_STRING);
}

/**
 * Fast check if name represents component name.
 * @param name {string} Component name.
 * @returns {boolean} Returns true if name is valid logical path and first letter is capitalized.
 */
export function isComponent(name: string): boolean {
   return isLogicalPath(name) && isCapitalized(name);
}
