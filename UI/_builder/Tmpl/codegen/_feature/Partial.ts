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
