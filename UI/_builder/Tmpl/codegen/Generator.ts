/// <amd-module name="UI/_builder/Tmpl/codegen/Generator" />

/**
 * @author Крылов М.А.
 */

import { getConfig } from './TClosure';

const VAR_MODULE_NAME = 'markupGenerator';

export function genEscape(data: string): string {
   return `${VAR_MODULE_NAME}.escape(${data})`;
}

export function genCreateText(data: string = "''", keyExpression?: string): string {
   if (keyExpression === undefined) {
      return `${VAR_MODULE_NAME}.createText(${data})`;
   }
   return `${VAR_MODULE_NAME}.createText(${data}, ${keyExpression})`;
}

export function genCreateDirective(data: string): string {
   return `${VAR_MODULE_NAME}.createDirective(${data})`;
}

export function genCreateComment(data: string = ''): string {
   return `${VAR_MODULE_NAME}.createComment(${data})`;
}

export function genCreateTag(name: string, data: string, children: string, attributes: string): string {
   return `${VAR_MODULE_NAME}.createTag(${name}, ${data}, [${children}], ${attributes}, defCollection, viewController)`;
}

export function genGetScope(expression: string): string {
   return `${VAR_MODULE_NAME}.getScope(${expression})`;
}

/**
 * Для создания вызовов от конструкций:
 * <ws:partial template="{{ templateFunction }}" />
 * <ws:partial template="{{ 'wml!path/to/template/file' }}" />
 * <ws:partial template="{{ 'Module/Control' }}" />
 * TODO: разгрузить данный вид генерации кода:
 *  <ws:partial template="{{ 'wml!path/to/template/file' }}" /> --> genCreateControlTemplate
 *  <ws:partial template="{{ 'Module/Control' }}" /> --> genCreateControl
 * @param name
 * @param data
 * @param attributes
 * @param templateCfg
 */
export function genCreateControlResolver(
   name: string,
   data: string,
   attributes: string,
   templateCfg: string
): string {
   // Каждый partial должен создавать свой контекст ключей,
   // поэтому добавляем part_%i текущий ключ
   return `${VAR_MODULE_NAME}.prepareResolver(${name}, ${data}, ${attributes}, ${templateCfg}`
      + ', (isVdom?context + "part_" + (templateCount++) : context), depsLocal'
      + `, includedTemplates, ${getConfig()}, {}, defCollection)`;
}

/**
 * Для создания вызовов от конструкций:
 * <Module:Control />
 * @param name
 * @param data
 * @param attributes
 * @param templateCfg
 */
export function genCreateControlModule(
   name: string,
   data: string,
   attributes: string,
   templateCfg: string
): string {
   return `${VAR_MODULE_NAME}.prepareResolver(${name}, ${data}, ${attributes}, ${templateCfg}`
      + ', (isVdom?context + "part_" + (templateCount++) : context), depsLocal'
      + `, includedTemplates, ${getConfig()}, {}, defCollection)`;
}

/**
 * Для создания вызовов от конструкций:
 * <Module.Control />
 * <ws:partial template="Module/Control" />
 * @param name
 * @param data
 * @param attributes
 * @param templateCfg
 */
export function genCreateControl(
   name: string,
   data: string,
   attributes: string,
   templateCfg: string
): string {
   return `${VAR_MODULE_NAME}.prepareWsControl(${name}, ${data}, ${attributes}, ${templateCfg}`
      + `, context, depsLocal)`;
}

/**
 * Для создания вызовов от конструкций:
 * <ws:partial template="wml!path-to-template-file" />
 * @param name
 * @param data
 * @param attributes
 * @param templateCfg
 */
export function genCreateControlTemplate(
   name: string,
   data: string,
   attributes: string,
   templateCfg: string
): string {
   return `${VAR_MODULE_NAME}.prepareTemplate(${name}, ${data}, ${attributes}, ${templateCfg}`
      + `, context, depsLocal, ${getConfig()})`;
}
