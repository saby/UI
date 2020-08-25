/// <amd-module name="UI/_builder/Tmpl/core/Names" />

/**
 * @author Крылов М.А.
 */

const ATTR_PREFIX = 'attr:';
const BIND_PREFIX = 'bind:';
const EVENT_PREFIX = 'on:';
const WS_PREFIX = 'ws:';

export function isAttribute(name: string): boolean {
   return name.startsWith(ATTR_PREFIX);
}

export function getAttributeName(name: string): string {
   return name.slice(ATTR_PREFIX.length);
}

export function isBind(name: string): boolean {
   return name.startsWith(BIND_PREFIX);
}

export function getBindName(name: string): string {
   return name.slice(BIND_PREFIX.length);
}

export function isEvent(name: string): boolean {
   return name.startsWith(EVENT_PREFIX);
}

export function getEventName(name: string): string {
   return name.slice(EVENT_PREFIX.length);
}

export function isComponentOptionName(name: string): boolean {
   return name.startsWith(WS_PREFIX);
}

export function getComponentOptionName(name: string): string {
   return name.slice(WS_PREFIX.length);
}

export function isComponentName(name: string): boolean {
   return /(\w+[\.:])+\w+/gi.test(name);
}
