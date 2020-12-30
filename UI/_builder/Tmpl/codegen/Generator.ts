/// <amd-module name="UI/_builder/Tmpl/codegen/Generator" />

/**
 * @description Represents code generation methods for markup generator.
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/codegen/Generator.ts
 */

import { getConfig } from './TClosure';

/**
 * Markup generator variable name in output source code.
 */
const VAR_MODULE_NAME = 'markupGenerator';

/**
 * Generate escape call.
 * @param data {string} Data.
 */
export function genEscape(data: string): string {
   return `${VAR_MODULE_NAME}.escape(${data})`;
}

/**
 * Generate create text node.
 * @param data {string} Data.
 * @param keyExpression {string} Node key.
 */
export function genCreateText(data: string = "''", keyExpression?: string): string {
   if (keyExpression === undefined) {
      return `${VAR_MODULE_NAME}.createText(${data})`;
   }
   return `${VAR_MODULE_NAME}.createText(${data}, ${keyExpression})`;
}

/**
 * Generate create directive.
 * @param data {string} Data.
 */
export function genCreateDirective(data: string): string {
   return `${VAR_MODULE_NAME}.createDirective(${data})`;
}

/**
 * Generate create comment.
 * @param data {string} Data.
 */
export function genCreateComment(data: string = ''): string {
   return `${VAR_MODULE_NAME}.createComment(${data})`;
}

/**
 * Generate create tag.
 * @param name {string} Tag name.
 * @param data {string} Complex attributes object.
 * @param children {string} Children collection.
 * @param attributes {string} Complex attributes object.
 */
export function genCreateTag(name: string, data: string, children: string, attributes: string): string {
   return `${VAR_MODULE_NAME}.createTag(${name}, ${data}, [${children}], ${attributes}, defCollection, viewController)`;
}

/**
 * Generate get scope object.
 * @param expression {string} Scope expression.
 */
export function genGetScope(expression: string): string {
   return `${VAR_MODULE_NAME}.getScope(${expression})`;
}

/**
 * Generate prepare data for create.
 * @param tpl {string} Template.
 * @param scope {string} Scope object.
 * @param attributes {string} Current attributes.
 * @param deps {string} Dependencies collection.
 */
export function genPrepareDataForCreate(tpl: string, scope: string, attributes: string, deps: string): string {
   return `${VAR_MODULE_NAME}.prepareDataForCreate(${tpl}, ${scope}, ${attributes}, ${deps})`;
}

/**
 * Для создания вызовов от конструкций:
 *    <ws:partial template="{{ templateFunction }}" />
 *    <ws:partial template="{{ 'wml!path/to/template/file' }}" />
 *    <ws:partial template="{{ 'Module/Control' }}" />
 *    TODO: разгрузить данный вид генерации кода:
 *       <ws:partial template="{{ 'wml!path/to/template/file' }}" /> --> genCreateControlTemplate
 *       <ws:partial template="{{ 'Module/Control' }}" /> --> genCreateControl
 * @deprecated
 * @param name {string} Template name or expression.
 * @param scope {string} Scope object.
 * @param attributes {string} Attributes object.
 * @param config {string} Config object.
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
 *    <Module:Control />
 * @deprecated
 * @param name {string} Component name or expression.
 * @param scope {string} Scope object.
 * @param attributes {string} Attributes object.
 * @param config {string} Config object.
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
 *    <Module.Control />
 *    <ws:partial template="Module/Control" />
 * @deprecated
 * @param name {string} Component or template name or expression.
 * @param scope {string} Scope object.
 * @param attributes {string} Attributes object.
 * @param config {string} Config object.
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
 *    <ws:partial template="wml!path-to-template-file" />
 * @deprecated
 * @param name {string} Template name or expression.
 * @param scope {string} Scope object.
 * @param attributes {string} Attributes object.
 * @param config {string} Config object.
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
 * Generate create control
 * @param type {string} Component type
 * @param nameDescription {string} Component description
 * @param method {string} Component constructor or template
 * @param attributes {string} Attributes collection
 * @param events {string} Events collection
 * @param options {string} Options collection
 * @param config {string} Config
 *
 */
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
