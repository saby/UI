/// <amd-module name="UI/_builder/utils/Source" />

/**
 * @description Модуль-обертка над входным исходным текстом шаблона.
 * @author Крылов М.А.
 */

/**
 * Represents interface for source file.
 */
export interface ISource {
   /**
    * Source text.
    */
   readonly text: string;
   /**
    * Source file name.
    */
   readonly fileName: string;
}

/**
 * Validate value type is string.
 * @param value {*} Some value.
 * @param message {string} Value description.
 */
function validateString(value: any, message: string): void {
   const type = typeof(value);
   if (type !== 'string') {
      throw new Error(`Ожидалась, что значение ${message} имеет тип "string", но получено значение типа "${type}"`);
   }
}

/**
 * Represents raw input data.
 */
export class Source implements ISource {
   /**
    * Source text.
    */
   readonly text: string;
   /**
    * Source file name.
    */
   readonly fileName: string;

   /**
    * Initialize new instance.
    * @param text Source text.
    * @param fileName Source file name.
    */
   constructor(text: string, fileName: string) {
      validateString(text, 'текста шаблона');
      validateString(text, 'пути к файлу');
      this.text = text;
      this.fileName = fileName;
   }
}
