/// <amd-module name="UI/_builder/Tmpl/core/Names" />

/**
 * @author Крылов М.А.
 */

const EMPTY_STRING = '';
const ATTR_PREFIX_PATTERN = /^attr:/i;
const BIND_PREFIX_PATTERN = /^bind:/i;
const EVENT_PREFIX_PATTERN = /^on:/i;
const WS_PREFIX_PATTERN = /^ws:/i;

const WASABY_ATTRIBUTES = [
   'ws-delegates-tabfocus',
   'ws-creates-context',
   'ws-tab-cycling',
   'ws-autofocus',
   'ws-no-focus',
   'tabindex'
];

export function isAttribute(name: string, check: boolean = false): boolean {
   return ATTR_PREFIX_PATTERN.test(name) || checkAttributesOnly(name, check);
}

function checkAttributesOnly(name: string, check: boolean): boolean {
   return check && WASABY_ATTRIBUTES.indexOf(name) > -1;
}

export function getAttributeName(name: string): string {
   return name.replace(ATTR_PREFIX_PATTERN, EMPTY_STRING);
}

export function isBind(name: string): boolean {
   return BIND_PREFIX_PATTERN.test(name);
}

export function getBindName(name: string): string {
   return name.replace(BIND_PREFIX_PATTERN, EMPTY_STRING);
}

export function isEvent(name: string): boolean {
   return EVENT_PREFIX_PATTERN.test(name);
}

export function getEventName(name: string): string {
   return name.replace(EVENT_PREFIX_PATTERN, EMPTY_STRING);
}

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
