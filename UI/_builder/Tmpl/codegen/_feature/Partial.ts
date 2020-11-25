/// <amd-module name="UI/_builder/Tmpl/codegen/_feature/Partial" />

/**
 * @author Крылов М.А.
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
