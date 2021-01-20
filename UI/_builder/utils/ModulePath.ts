/// <amd-module name="UI/_builder/utils/ModulePath" />

/**
 * @description Represents classes and methods to work with module path.
 * @author Крылов М.А.
 */

/**
 * Template file extensions pattern.
 */
const P_EXTENSION: RegExp = /\.(wml|tmpl|xhtml)$/i;

/**
 * Empty string constant.
 */
const EMPTY_STRING: string = '';

/**
 * Solidus character constant.
 */
const SOLIDUS: string = '/';

/**
 * Known interface module substitutions for outdated and deprecated modules.
 */
const SUBSTITUTIONS = [
   ['WS.Core/lib', 'Lib'],
   ['WS.Core/lib/Ext', 'Ext'],
   ['WS.Core/core', 'Core'],
   ['WS.Core/transport', 'Transport'],
   ['WS.Core/css', 'WS/css'],
   ['WS.Deprecated', 'Deprecated']
];

/**
 * Get template plugin name by template file extension.
 * @param extension {string} Template file extension.
 */
function getPluginNameByExtension(extension: string): string {
   switch (extension) {
      case 'wml':
      case 'tmpl':
         return extension;
      case 'xhtml':
         return 'html';
      default:
         throw new Error(`Не удалось вычислить плагин для шаблона по его расширению. Получено расширение шаблона "${extension}". Ожидалось одно из следующих расширений: wml, tmpl, xhtml`);
   }
}

/**
 * Represents methods to work with a file name as a module name.
 */
export class ModulePath {
   /**
    * Module path.
    */
   readonly module: string;
   /**
    * File extension.
    */
   readonly extension: string;

   /**
    * Initialize new instance.
    * @param path Relative path to file.
    */
   constructor(path: string) {
      if (!P_EXTENSION.test(path)) {
         throw new Error('Некоррекно задан путь к шаблону: ожидался путь от интерфейсного модуля до самого файла с его расширением');
      }
      this.module = ModulePath.replaceWsModule(path.replace(P_EXTENSION, EMPTY_STRING));
      this.extension = P_EXTENSION.exec(path)[1];
   }

   /**
    * Get name of interface module.
    * In case of 'Controls/Pending' method returns 'Controls'.
    * @returns Interface module name.
    */
   getInterfaceModule(): string {
      return this.module.split(SOLIDUS).shift();
   }

   /**
    * Replace interface module using known substitutions.
    * In case of 'WS.Core/core/Abstract' method returns 'Core/Abstract'.
    * @param path Relative path to some module without its extension.
    * @returns Correct module name.
    */
   static replaceWsModule(path: string): string {
      for (let index = 0; index < SUBSTITUTIONS.length; ++index) {
         const pair = SUBSTITUTIONS[index];
         if (path.startsWith(pair[0])) {
            return path.replace(pair[0], pair[1]);
         }
      }
      return path;
   }

   /**
    * Create module name for require.
    * @param modulePath Module path.
    */
   static createNodeName(modulePath: ModulePath): string {
      return `${getPluginNameByExtension(modulePath.extension)}!${modulePath.module}`;
   }
}
