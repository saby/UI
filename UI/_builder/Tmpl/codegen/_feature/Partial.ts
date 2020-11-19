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
   scope: string,
   internal: string,
   isRootTag: boolean,
   key: string,
   mergeType: string
): string {
   return `{`
      + `attr: attr,`
      + `data: data,`
      + `ctx: this,`
      + `context: context,`
      + `depsLocal: depsLocal,`
      + `includedTemplates: includedTemplates,`
      + `pName: typeof currentPropertyName !== 'undefined' ? currentPropertyName : undefined,`
      + `viewController: viewController,`
      + `key: key + "${key}",`
      + `isRootTag: ${isRootTag},`
      + `internal: isVdom && ${internal},`
      + `mergeType: "${mergeType}"`
      + `}`;
}
