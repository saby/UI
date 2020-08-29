/// <amd-module name="UI/_builder/Tmpl/core/Names" />

/**
 * @author Крылов М.А.
 */

const EMPTY_STRING = '';
const WS_PREFIX_PATTERN = /^ws:/i;

export function isComponentOptionName(name: string): boolean {
   return WS_PREFIX_PATTERN.test(name);
}

export function getComponentOptionName(name: string): string {
   return name.replace(WS_PREFIX_PATTERN, EMPTY_STRING);
}

export function isComponentName(name: string): boolean {
   return /(\w+[\.:])+\w+/gi.test(name);
}

export function validateTemplateName(name: string): string {
   if (!name.match(/^[a-zA-Z_]\w*$/g)) {
      throw new Error(`Некорректное имя шаблона "${name}"`);
   }
   return name;
}
