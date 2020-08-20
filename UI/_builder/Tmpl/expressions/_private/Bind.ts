/// <amd-module name="UI/_builder/Tmpl/expressions/_private/Bind" />

/**
 * @author Крылов М.А.
 */

import {
   EventChain,
   EventNode,
   IAttributeValue,
   prepareEventChain
} from 'UI/_builder/Tmpl/expressions/_private/Event';
import { BindExpressionVisitor } from './Nodes';

import * as FSC from 'UI/_builder/Tmpl/modules/data/utils/functionStringCreator';
import * as templates from 'UI/_builder/Tmpl/codegen/templates';

/**
 * Паттерн двустороннего связывания для имени атрибута.
 */
const BIND_NAME_PATTERN = /^(bind:[A-z0-9])\w*$/;

/**
 * Проверить по имени, является ли данный атрибут двусторонним связыванием.
 * @param attributeName {string} Имя атрибута.
 */
export function isBind(attributeName: string): boolean {
   return BIND_NAME_PATTERN.test(attributeName);
}

/**
 * Получить имя обработчика события, для которого выполняется двустороннее связывание.
 *
 * Например, для атрибута "bind:value" будет возвращено "on:valueChanged".
 *
 * @param attributeName {string} Имя атрибута.
 */
export function getEventAttributeName(attributeName: string): string {
   return `on:${getFunctionName(attributeName)}`;
}

/**
 * Получить имя функции-обработчика.
 *
 * Например, для атрибута "bind:value" будет возвращено "valueChanged".
 *
 * @param attributeName {string} Имя атрибута.
 */
export function getFunctionName(attributeName: string): string {
   const sourceFieldName = getBindAttributeName(attributeName);
   return `${sourceFieldName}Changed`;
}

/**
 * Получить имя опции, для которой выполняется двустороннее связывание.
 *
 * Например, для атрибута "bind:value" будет возвращено "value".
 *
 * @param attributeName {string} Имя атрибута.
 */
export function getBindAttributeName(attributeName: string): string {
   return attributeName.slice(5);
}

export function visitBindExpressionNew(
   value: IAttributeValue,
   data: any,
   fileName: string,
   attributeName: string
): string {

   const visitor = new BindExpressionVisitor();
   const context = {
      data,
      fileName,
      attributeName,
      isControl: false,
      isExprConcat: false,
      configObject: undefined,
      escape: false,
      sanitize: false,
      caller: undefined,
      getterContext: 'data',
      forbidComputedMembers: false,
      childrenStorage: [],
      checkChildren: false
   };
   return value.data[0].name.accept(visitor, context) as string;
}

/**
 * Создать узел обработчика двусторонне связанной опции.
 * @param value {IAttributeValue} Значение атрибута.
 * @param attributeName {string} Имя атрибута.
 * @param data {any} Данные @todo Выяснить, какие это данные.
 * @param isControl {boolean} Флаг, указан ли этот обработчик на контроле.
 * @param fileName {string} Имя файла шаблона.
 * @param childrenStorage {string[]} Набор имен детей (свойство _children контрола).
 * @param eventChain {EventChain} Цепочка обработчиков для данного события либо undefined.
 */
export function processBindAttribute(
   value: IAttributeValue,
   attributeName: string,
   data: any,
   isControl: boolean,
   fileName: string,
   childrenStorage: string[],
   eventChain?: EventChain
): EventChain {

   const funcName = getFunctionName(attributeName);
   let fn = visitBindExpressionNew(value, data, fileName, attributeName);
   fn =  FSC.wrapAroundExec(templates.generateBind(funcName, fn, isControl));
   const chain = prepareEventChain(eventChain);
   chain.unshift(new EventNode('event', FSC.wrapAroundExec('[]'), funcName, fn));
   return chain;
}
