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

/**
 * -> createControl "wsControl"
 */
export function genCreateControlNew(
   name: string,
   method: string,
   attributes: string,
   events: string,
   options: string,
   config: string
) {
   // createControlNew(name, method, attributes, events, options, config)
   return `${VAR_MODULE_NAME}.createControlNew(`
      + `"${name}",`
      + `/*${name}*/ ${method},`
      + `/*attributes*/ ${attributes},`
      + `/*events*/ ${events},`
      + `/*options*/ ${options},`
      + `/*config*/ ${config}`
      + `)`;
}

/**
 * -> createControl "template"
 */
export function genCreateTemplateNew(
   name: string,
   method: string,
   attributes: string,
   events: string,
   options: string,
   config: string
) {
   // createTemplateNew(name, method, attributes, events, options, config)
   return `${VAR_MODULE_NAME}.createTemplateNew(`
      + `"${name}",`
      + `/*${name}*/ ${method},`
      + `/*attributes*/ ${attributes},`
      + `/*events*/ ${events},`
      + `/*options*/ ${options},`
      + `/*config*/ ${config}`
      + `)`;
}

/**
 * -> createControl "resolver"
 */
export function genResolveControlNew(
   name: string,
   path: string,
   method: string,
   attributes: string,
   events: string,
   options: string,
   config: string
) {
   // resolveControlNew(name, path, method, attributes, events, options, config)
   return `${VAR_MODULE_NAME}.resolveControlNew(`
      + `"${name}",`
      + `${path},`
      + `/*${name}*/ ${method},`
      + `/*attributes*/ ${attributes},`
      + `/*events*/ ${events},`
      + `/*options*/ ${options},`
      + `/*config*/ ${config}`
      + `)`;
}

/**
 * -> createControl "resolver"
 */
export function genResolveTemplateNew(
   name: string,
   method: string,
   attributes: string,
   events: string,
   options: string,
   config: string
) {
   // resolveTemplateNew(name, method, attributes, events, options, config)
   return `${VAR_MODULE_NAME}.resolveTemplateNew(`
      + `${name},`
      + `/*${name}*/ ${method},`
      + `/*attributes*/ ${attributes},`
      + `/*events*/ ${events},`
      + `/*options*/ ${options},`
      + `/*config*/ ${config}`
      + `)`;
}

/**
 * -> create inline template
 */
export function genCreateInlineTemplate(
   name: string,
   method: string,
   attributes: string,
   events: string,
   options: string,
   config: string
) {
   // resolveTemplateNew(name, method, attributes, events, options, config)
   return `${VAR_MODULE_NAME}.createInlineTemplate(`
      + `'${name}',`
      + `/*${name}*/ ${method},`
      + `/*attributes*/ ${attributes},`
      + `/*events*/ ${events},`
      + `/*options*/ ${options},`
      + `/*config*/ ${config}`
      + `)`;
}
