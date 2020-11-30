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
 * @param scope
 * @param attributes
 * @param config
 */
export function genCreateControlResolver(
   name: string,
   scope: string,
   attributes: string,
   config: string
): string {
   // Каждый partial должен создавать свой контекст ключей,
   // поэтому добавляем part_%i текущий ключ
   return `${VAR_MODULE_NAME}.createControl("resolver", ${name}, ${scope}, ${attributes}, ${config}`
      + ', (isVdom?context + "part_" + (templateCount++) : context), depsLocal'
      + `, includedTemplates, ${getConfig()}, {}, defCollection)`;
}

/**
 * Для создания вызовов от конструкций:
 * <Module:Control />
 * @param name
 * @param scope
 * @param attributes
 * @param config
 */
export function genCreateControlModule(
   name: string,
   scope: string,
   attributes: string,
   config: string
): string {
   return `${VAR_MODULE_NAME}.createControl("resolver", ${name}, ${scope}, ${attributes}, ${config}`
      + ', (isVdom?context + "part_" + (templateCount++) : context), depsLocal'
      + `, includedTemplates, ${getConfig()}, {}, defCollection)`;
}

/**
 * Для создания вызовов от конструкций:
 * <Module.Control />
 * <ws:partial template="Module/Control" />
 * @param name
 * @param scope
 * @param attributes
 * @param config
 */
export function genCreateControl(
   name: string,
   scope: string,
   attributes: string,
   config: string
): string {
   return `${VAR_MODULE_NAME}.createControl("wsControl", ${name}, ${scope}, ${attributes}, ${config}`
      + `, context, depsLocal, includedTemplates, ${getConfig()})`;
}

/**
 * Для создания вызовов от конструкций:
 * <ws:partial template="wml!path-to-template-file" />
 * @param name
 * @param scope
 * @param attributes
 * @param config
 */
export function genCreateControlTemplate(
   name: string,
   scope: string,
   attributes: string,
   config: string
): string {
   return `${VAR_MODULE_NAME}.createControl("template", ${name}, ${scope}, ${attributes}, ${config}`
      + `, context, depsLocal, includedTemplates, ${getConfig()})`;
}

export function genCreateControlNew(
   type: string,
   nameDescription: string,
   method: string,
   attributes: string,
   events: string,
   options: string,
   config: string
) {
   // createControlNew(type, method, attributes, events, options, config)
   return `${VAR_MODULE_NAME}.createControlNew(`
      + `"${type}",`
      + `/*${nameDescription}*/ ${method},`
      + `/*attributes*/ ${attributes},`
      + `/*events*/ ${events},`
      + `/*options*/ ${options},`
      + `/*config*/ ${config}`
      + `)`;
}
