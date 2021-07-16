/**
 * @description Represents code generation methods for TClosure module.
 * @author Крылов М.А.
 */

/**
 * TClosure variable name in output source code.
 */
const VAR_MODULE_NAME = 'thelpers';

/**
 * Generate sanitize wrapper.
 * @param data {string} Data.
 */
export function genSanitize(data: string): string {
   return `${VAR_MODULE_NAME}.Sanitize.apply(undefined, [${data}])`;
}

/**
 * Generate content templates array wrapper.
 * @param array {string} Content templates array.
 * @param isWasabyTemplate {string} Wml template flag.
 */
export function genCreateDataArray(array: string, isWasabyTemplate: boolean): string {
   return `${VAR_MODULE_NAME}.createDataArray(${array}, filename, ${!!isWasabyTemplate})`;
}

/**
 * Generate content templates array wrapper for React.
 * @param array {string} Content templates array.
 * @param isWasabyTemplate {string} Wml template flag.
 */
export function genCreateDataArrayReact(array: string, isWasabyTemplate: boolean): string {
   return `${VAR_MODULE_NAME}.createDataArrayReact(${array}, filename, ${!!isWasabyTemplate})`;
}

/**
 * Generate undef wrapper.
 * @param expression {string} Expression data.
 */
export function genWrapUndef(expression: string): string {
   return `${VAR_MODULE_NAME}.wrapUndef(${expression})`;
}

/**
 * Generate ws:function wrapper.
 * @param expression {string} Expression.
 * @param data {string} Data.
 */
export function genGetTypeFunc(expression: string, data: string): string {
   return `${VAR_MODULE_NAME}.getTypeFunc(${expression}, ${data})`;
}

/**
 * Generate unite scopes.
 * @param inner {string} Inner scope.
 * @param outer {string} Outer scope.
 */
export function genUniteScope(inner: string, outer: string): string {
   return `${VAR_MODULE_NAME}.uniteScope(${inner}, ${outer})`;
}

/**
 * Get plain merge function.
 */
export function getPlainMergeFunction(): string {
   return `${VAR_MODULE_NAME}.plainMerge`;
}

/**
 * Get config.
 */
export function getConfig(): string {
   return `${VAR_MODULE_NAME}.config`;
}

/**
 * Generate getter.
 * @param data {string} Data object.
 * @param path {string[]} Expression path.
 */
export function genGetter(data: string, path: string[]): string {
   return `${VAR_MODULE_NAME}.getter(${data}, [${path.join()}])`;
}

/**
 * Generate setter.
 * @param data {string} Data object.
 * @param path {string[]} Expression path.
 */
export function genSetter(data: string, path: string[]): string {
   return `${VAR_MODULE_NAME}.setter(${data}, [${path.join()}], value)`;
}

/**
 * Generate decorator.
 * @param name {string} Decorator name.
 * @param args {string[]} Decorator arguments.
 */
export function genDecorate(name: string, args: string[]): string {
   return `${VAR_MODULE_NAME}.getDecorators()[${name}].apply(undefined, [${args.join()}])`;
}

/**
 * Generate filter options.
 * @param options {string} Options.
 */
export function genFilterOptions(options: string): string {
   return `${VAR_MODULE_NAME}.filterOptions(${options})`;
}

/**
 * Generate merge attributes.
 * @param inner {string} Inner attributes.
 * @param outer {string} Outer attributes.
 */
export function genProcessMergeAttributes(inner: string, outer: string): string {
   return `${VAR_MODULE_NAME}.processMergeAttributes(${inner}, ${outer})`;
}

/**
 * Generate merge attributes.
 * @param inner {string} Inner attributes.
 * @param outer {string} Outer attributes.
 */
export function genPlainMergeAttr(inner: string, outer: string): string {
   return `${VAR_MODULE_NAME}.plainMergeAttr(${inner}, ${outer})`;
}

/**
 * Generate merge context.
 * @param inner {string} Inner context.
 * @param outer {string} Outer context.
 */
export function genPlainMergeContext(inner: string, outer: string): string {
   return `${VAR_MODULE_NAME}.plainMergeContext(${inner}, ${outer})`;
}

/**
 * Generate plain merge.
 * @param inner {string} Inner object.
 * @param outer {string} Outer object.
 * @param cloneFirst {string} Special merge flag.
 */
export function genPlainMerge(inner: string, outer: string, cloneFirst?: string): string {
   return `${VAR_MODULE_NAME}.plainMerge(${inner}, ${outer}, ${cloneFirst})`;
}

/**
 * Generate create forward ref for template functions.
 * @param callback {string} String representation of callback template function.
 */
export function genCreateForwardRef(callback: string): string {
   return `${VAR_MODULE_NAME}.createForwardRef(${callback})`;
}
