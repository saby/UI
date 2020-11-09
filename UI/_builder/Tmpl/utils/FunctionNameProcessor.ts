/// <amd-module name="UI/_builder/Tmpl/utils/FunctionNameProcessor" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/utils/FunctionNameProcessor.ts
 */

export interface IProcessor {
   getFuncName(propertyName: string, fileName: string, wsTemplateName: string | { data: { type: string; value: string; } }): string;
   setFunctionName(func: Function, wsTemplateName: string | { data: { type: string; value: string; } }, fileName: string, propertyName: string): string;
}

const EMPTY_STRING = '';

class FunctionNameProcessor implements IProcessor {
   private readonly functionNames: { [name: string]: number; };

   constructor() {
      this.functionNames = { };
   }

   getFuncNameByFile(fileName: string): string {
      return fileName && fileName.replace && fileName

         // Remove require substitution
         .replace(/^(wml|tmpl|html)!/g, EMPTY_STRING)

         // Remove file extension
         .replace(/\.(wml|tmpl|html)$/gi, EMPTY_STRING)

         // Replace path separator and spaces with underscore
         .replace(/[.\-:/\s]/gi, '_')

         // Remove leading digits at the start
         .replace(/^\d+/gi, EMPTY_STRING)

         // Remove any invalid characters
         .replace(/[^\d\w_]/gi, EMPTY_STRING);
   }

   getFuncNameByTemplate(wsTemplateName: string | { data: { type: string; value: string; } }): string {
      if (typeof wsTemplateName === 'string') {
         return this.getFuncNameByFile(wsTemplateName);
      }
      if (typeof wsTemplateName === 'object' && wsTemplateName.data.type === 'text') {
         return this.getFuncNameByFile(wsTemplateName.data.value);
      }
      return undefined;
   }

   getFuncName(propertyName: string, fileName: string, wsTemplateName: string | { data: { type: string; value: string; } }): string {
      var fnByTmpl = this.getFuncNameByTemplate(wsTemplateName);
      var fnByFile = this.getFuncNameByFile(fileName);
      var functionName = fnByTmpl || fnByFile || propertyName || 'Unknown';

      // Запомнить вычисленное имя функции и определить ее идентификатор в случае повторения имени
      if (this.functionNames) {
         if (functionName in this.functionNames) {
            var idx = this.functionNames[functionName].toString();
            this.functionNames[functionName]++;
            functionName += '_' + idx;
         } else {
            this.functionNames[functionName] = 2;
         }
      }
      return functionName;
   }

   setFunctionName(func: Function, wsTemplateName: string | { data: { type: string; value: string; } }, fileName: string, propertyName: string): string {
      // Не определять новое имя для функции, если оно уже существует
      // В IE Отсутствует Function.prototype.name, поэтому здесь необходимо проверять, чтобы name был опеределен
      if (typeof func === 'function' && func.name !== 'anonymous' && func.name !== undefined) {
         return func.name;
      }
      var functionName = this.getFuncName(propertyName, fileName, wsTemplateName);

      // В случае, если пришла функция, то нужно определить ее имя
      if (typeof func === 'function') {
         Object.defineProperty(func, 'name', {
            'value': functionName,
            configurable: true
         });
         return func.name;
      }
      return functionName;
   }
}

export default function createFunctionNameProcessor() {
   return new FunctionNameProcessor();
}
