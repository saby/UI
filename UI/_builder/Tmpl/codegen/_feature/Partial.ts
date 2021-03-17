/// <amd-module name="UI/_builder/Tmpl/codegen/_feature/Partial" />

/**
 * @description Common code generation methods.
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/codegen/_feature/Partial.ts
 */

/**
 * Generate template config.
 * @param internal {string} Internal collection.
 * @param isRootTag {boolean} Root tag flag.
 */
export function createTemplateConfig(internal: string, isRootTag: boolean): string {
   return `{
      "isRootTag": ${!!isRootTag},
      "data": data,
      "ctx": this,
      "pName": typeof currentPropertyName !== "undefined" ? currentPropertyName : undefined,
      "viewController": viewController,
      ${ internal ? `"internal": isVdom ? ${internal} : {}, ` : '' }
   }`;
}

/**
 * Generate component config.
 * @param compositeAttributes {string} [deprecated] composite attributes
 * @param scope {string} Scope object
 * @param context {string} Current context
 * @param internal {string} Internal collection
 * @param isRootTag {string} Root tag flag
 * @param key {string} Node key
 * @param mergeType {string} Context and attributes merge type
 */
export function createConfigNew(
   compositeAttributes: string,
   scope: string,
   context: string,
   internal: string,
   isRootTag: boolean,
   key: string,
   mergeType: string
): string {
   return `{`
      + `attr: attr,`
      + `data: data,`
      + `ctx: this,`
      + `isVdom: isVdom,`
      + `defCollection: defCollection,`
      + `depsLocal: typeof depsLocal !== 'undefined' ? depsLocal : {},`
      + `includedTemplates: includedTemplates,`
      + `pName: typeof currentPropertyName !== 'undefined' ? currentPropertyName : undefined,`
      + `viewController: viewController,`
      + `context: ${context},`
      + `compositeAttributes: ${compositeAttributes},`
      + `scope: ${scope},`
      + `key: key + "${key}",`
      + `isRootTag: ${isRootTag},`
      + (internal ? `internal: isVdom ? ${internal} : {},` : '')
      + `mergeType: "${mergeType}"`
      + `}`;
}
