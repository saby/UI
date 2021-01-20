/// <amd-module name="UI/_builder/Tmpl/core/Resolvers" />

/**
 * @description Represents interfaces, methods and classes to work with UI paths.
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Resolvers.ts
 */

/**
 * Empty string constant.
 */
const EMPTY_STRING = '';

/**
 * Special prefix for component and object options.
 */
const WS_PREFIX_PATTERN = /^ws:/i;

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
 * Pattern for extension of template file path.
 */
const TEMPLATE_FILE_EXTENSION_PATTER = /\.(tmpl|wml)/i;

/**
 * Pattern for cyrillic characters.
 */
const CYRILLIC_PATTERN = /[\u0400-\u04FF]/i;

/**
 * Special UI-module names that do not obey standard of naming UI-modules.
 */
const SPECIAL_UI_MODULE_NAMES = [
   'SBIS3.CONTROLS',
   'SBIS3.ENGINE'
];


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
 * Complex path interface.
 */
export interface IPath {

   /**
    * Get full path.
    */
   getFullPath(): string;

   /**
    * Get full physical path.
    */
   getFullPhysicalPath(): string;

   /**
    * Get logical path.
    */
   getLogicalPath(): string[];

   /**
    * Check if path has logical part.
    */
   hasLogicalPath(): boolean;

   /**
    * Check if path has plugins.
    */
   hasPlugins(): boolean;
}


/**
 * Represents complex path.
 */
class Path implements IPath {

   /**
    * Physical part path.
    */
   private readonly physicalPath: string[];

   /**
    * Logical part path.
    */
   private readonly logicalPath: string[];

   /**
    * Sequence of plugin names.
    */
   private readonly plugins: string[];

   /**
    * Initialize new instance of complex path.
    * @param physicalPath {string[]} Physical part path.
    * @param logicalPath {string[]} Logical part path.
    * @param plugins {string[]} Sequence of plugin names.
    */
   constructor(physicalPath: string[], logicalPath: string[], plugins: string[]) {
      this.physicalPath = physicalPath;
      this.logicalPath = logicalPath;
      this.plugins = plugins;
   }

   /**
    * Get full path.
    */
   getFullPath(): string {
      const fullPhysicalPath = this.getFullPhysicalPath();
      const logicalPath = this.logicalPath.length > 0
         ? INTER_PATH_SEPARATOR + this.logicalPath.join(LOGICAL_PATH_SEPARATOR)
         : EMPTY_STRING;
      return fullPhysicalPath + logicalPath;
   }

   /**
    * Get full physical path.
    */
   getFullPhysicalPath(): string {
      const plugins = this.plugins.length > 0
         ? this.plugins.join(REQUIRE_JS_PLUGIN_SEPARATOR) + REQUIRE_JS_PLUGIN_SEPARATOR
         : EMPTY_STRING;
      const physicalPath = this.physicalPath.join(PHYSICAL_PATH_SEPARATOR);
      return plugins + physicalPath;
   }

   /**
    * Get logical path.
    */
   getLogicalPath(): string[] {
      return this.logicalPath;
   }

   /**
    * Check if path has logical part.
    */
   hasLogicalPath(): boolean {
      return this.logicalPath.length > 0;
   }

   /**
    * Check if path has plugins.
    */
   hasPlugins(): boolean {
      return this.plugins.length > 0;
   }
}

/**
 * Split plugins.
 * @param path {string} Path.
 */
function splitPlugins(path: string): { plugins: string[]; fullPath: string; } {
   const plugins = path.split(REQUIRE_JS_PLUGIN_SEPARATOR);
   const fullPath = plugins.pop();
   return {
      plugins,
      fullPath
   };
}

/**
 * Parse component name.
 * @param componentName {string} Component name.
 */
export function parseComponentName(componentName: string): IPath {
   // FIXME: Check if tag node name is component name with prefix "ws:"
   const cleanPath = componentName.replace(WS_PREFIX_PATTERN, EMPTY_STRING);
   const paths = cleanPath.split(INTER_PATH_SEPARATOR);
   if (paths.length > 2) {
      throw new Error(
         `некорректное имя компонента "${cleanPath}" - ожидалось не более 1 COLON(:)-разделителя`
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
   return new Path(physicalPath, logicalPath, []);
}

/**
 * Parse function path.
 * @param functionPath {string} Function path.
 */
export function parseFunctionPath(functionPath: string): IPath {
   const { plugins, fullPath } = splitPlugins(functionPath);
   const paths = fullPath.split(INTER_PATH_SEPARATOR);
   if (paths.length > 2) {
      throw new Error(
         `некорректный путь к функции "${fullPath}" - ожидалось не более 1 COLON(:)-разделителя`
      );
   }
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
   if (plugins.length !== 0) {
      throw new Error(
         `некорректный путь к функции "${fullPath}" - использовать плагины RequireJS запрещено`
      );
   }
   return new Path(physicalPath, logicalPath, plugins);
}

/**
 * Parse template path.
 * @param templatePath {string} Template path.
 */
export function parseTemplatePath(templatePath: string): IPath {
   const { plugins, fullPath } = splitPlugins(templatePath);
   const paths = fullPath.split(INTER_PATH_SEPARATOR);
   if (paths.length > 2) {
      throw new Error(
         `некорректный путь к функции "${fullPath}" - ожидалось не более 1 COLON(:)-разделителя`
      );
   }
   // TODO: validate paths
   const physicalPathString = paths.shift();
   const logicalPathString = paths.length > 0 ? paths.shift() : EMPTY_STRING;
   const prefix = findSpecialUIModulePrefix(physicalPathString);
   const physicalPathOffset = prefix !== EMPTY_STRING ? prefix.length + 1 : 0;
   const physicalPath = physicalPathString
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
   const logicalPath = logicalPathString !== EMPTY_STRING
      ? logicalPathString.split(LOGICAL_PATH_SEPARATOR)
      : [ ];
   return new Path(physicalPath, logicalPath, plugins);
}

/**
 * Fast check if path represents physical path.
 * @param path {string} Path.
 * @returns {boolean} Returns true if path contains physical path separator.
 */
export function isPhysicalPath(path: string): boolean {
   return path.indexOf(PHYSICAL_PATH_SEPARATOR) > -1;
}

/**
 * Fast check if path represents logical path.
 * @param path {string} Path.
 * @returns {boolean} Returns true if path contains logical path separator.
 */
export function isLogicalPath(path: string): boolean {
   return path.indexOf(LOGICAL_PATH_SEPARATOR) > -1 && path.indexOf(PHYSICAL_PATH_SEPARATOR) === -1;
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
 * Check if name is valid option name.
 * @param name {string} Option name.
 */
export function isOption(name: string): boolean {
   if (!WS_PREFIX_PATTERN.test(name)) {
      return false;
   }
   // FIXME: Check if tag node name is component name with prefix "ws:"
   const cleanName = name.replace(WS_PREFIX_PATTERN, EMPTY_STRING);
   return !(isLogicalPath(cleanName) && isCapitalized(cleanName) && !CYRILLIC_PATTERN.test(name));
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
   // FIXME: Check if tag node name is component name with prefix "ws:"
   const cleanName = name.replace(WS_PREFIX_PATTERN, EMPTY_STRING);
   return isLogicalPath(cleanName) && isCapitalized(cleanName) && !CYRILLIC_PATTERN.test(name);
}
