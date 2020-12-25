/// <amd-module name="UI/_builder/Tmpl/codegen/TClosure" />

/**
 * @author Крылов М.А.
 */

const VAR_MODULE_NAME = 'thelpers';

export function genSanitize(data: string): string {
   return `${VAR_MODULE_NAME}.Sanitize.apply(undefined, [${data}])`;
}

export function genCreateDataArray(array: string, fileName: string, isWasabyTemplate: boolean): string {
   return `${VAR_MODULE_NAME}.createDataArray(${array}, ${fileName}, ${!!isWasabyTemplate})`;
}

export function genWrapUndef(expression: string): string {
   return `${VAR_MODULE_NAME}.wrapUndef(${expression})`;
}

export function genGetTypeFunc(arg1: string, arg2: string): string {
   return `${VAR_MODULE_NAME}.getTypeFunc(${arg1}, ${arg2})`;
}

export function genUniteScope(inner: string, outer: string): string {
   return `${VAR_MODULE_NAME}.uniteScope(${inner}, ${outer})`;
}

export function getPlainMergeFunction(): string {
   return `${VAR_MODULE_NAME}.plainMerge`;
}

export function getConfig(): string {
   return `${VAR_MODULE_NAME}.config`;
}

export function genGetter(data: string, path: string[]): string {
   return `${VAR_MODULE_NAME}.getter(${data}, [${path.join()}], viewController)`;
}

export function genSetter(data: string, path: string[]): string {
   return `${VAR_MODULE_NAME}.setter(${data}, [${path.join()}], viewController, value)`;
}

export function genDecorate(name: string, args: string[]): string {
   return `${VAR_MODULE_NAME}.getDecorators()[${name}].apply(undefined, [${args.join()}])`;
}

export function genFilterOptions(arg: string): string {
   return `${VAR_MODULE_NAME}.filterOptions(${arg})`;
}

export function genProcessMergeAttributes(inner: string, outer: string): string {
   return `${VAR_MODULE_NAME}.processMergeAttributes(${inner}, ${outer})`;
}

export function genPlainMergeAttr(inner: string, outer: string): string {
   return `${VAR_MODULE_NAME}.plainMergeAttr(${inner}, ${outer})`;
}

export function genPlainMergeContext(inner: string, outer: string): string {
   return `${VAR_MODULE_NAME}.plainMergeContext(${inner}, ${outer})`;
}

export function genPlainMerge(inner: string, outer: string, cloneFirst?: string): string {
   return `${VAR_MODULE_NAME}.plainMerge(${inner}, ${outer}, ${cloneFirst})`;
}
