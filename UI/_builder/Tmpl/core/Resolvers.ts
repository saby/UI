/// <amd-module name="UI/_builder/Tmpl/core/Resolvers" />

/**
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
 * @todo
 */
export interface IPath {

   /**
    * @todo
    */
   getFullPath(): string;

   /**
    * @todo
    */
   getFullPhysicalPath(): string;

   /**
    * @todo
    */
   getLogicalPath(): string[];

   /**
    * @todo
    */
   hasLogicalPath(): boolean;

   /**
    * @todo
    */
   hasPlugins(): boolean;
}


/**
 * @todo
 */
class Path implements IPath {

   /**
    * @todo
    */
   private readonly physicalPath: string[];

   /**
    * @todo
    */
   private readonly logicalPath: string[];

   /**
    * @todo
    */
   private readonly plugins: string[];

   /**
    * @todo
    * @param physicalPath {string[]} @todo
    * @param logicalPath {string[]} @todo
    * @param plugins {string[]} @todo
    */
   constructor(physicalPath: string[], logicalPath: string[], plugins: string[]) {
      this.physicalPath = physicalPath;
      this.logicalPath = logicalPath;
      this.plugins = plugins;
   }

   /**
    * @todo
    */
   getFullPath(): string {
      const fullPhysicalPath = this.getFullPhysicalPath();
      const logicalPath = this.logicalPath.length > 0
         ? INTER_PATH_SEPARATOR + this.logicalPath.join(LOGICAL_PATH_SEPARATOR)
         : EMPTY_STRING;
      return fullPhysicalPath + logicalPath;
   }

   /**
    * @todo
    */
   getFullPhysicalPath(): string {
      const plugins = this.plugins.length > 0
         ? this.plugins.join(REQUIRE_JS_PLUGIN_SEPARATOR) + REQUIRE_JS_PLUGIN_SEPARATOR
         : EMPTY_STRING;
      const physicalPath = this.physicalPath.join(PHYSICAL_PATH_SEPARATOR);
      return plugins + physicalPath;
   }

   /**
    * @todo
    */
   getLogicalPath(): string[] {
      return this.logicalPath;
   }

   /**
    * @todo
    */
   hasLogicalPath(): boolean {
      return this.logicalPath.length > 0;
   }

   /**
    * @todo
    */
   hasPlugins(): boolean {
      return this.plugins.length > 0;
   }
}

/**
 * @todo
 * @param path {string} @todo
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
 * @todo
 * @param componentName {string} @todo
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
 * @todo
 * @param functionPath {string} @todo
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
   if (logicalPath.length === 0) {
      throw new Error(
         `некорректный путь к функции "${fullPath}" - отсутствует логический путь к функции, по которому функция должна быть разрешена внутри указанного модуля`
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
 * @todo
 * @param templatePath {string} @todo
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
   return !(isLogicalPath(cleanName) && isCapitalized(cleanName));
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
   return isLogicalPath(cleanName) && isCapitalized(cleanName);
}
