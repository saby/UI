/**
 * @description Represents methods for generating code for events.
 * @author Крылов М.А.
 */

import { EventExpressionVisitor } from './Nodes';
import {EventNode} from "./EventNode";
import {EventChain} from "./EventChain";
import {IAttributeValue} from "./IAttributeValue";

import * as FSC from 'Compiler/modules/data/utils/functionStringCreator';

/**
 * Паттерн обработчика события для имени атрибута.
 */
const EVENT_NAME_PATTERN = /^(on:[A-z0-9])\w*$/;

/**
 * Создать узел обработчика события по атрибуту.
 * @param value {IAttributeValue} Значение атрибута.
 * @param attributeName {string} Имя атрибута.
 * @param data {any} Данные @todo Выяснить, какие это данные.
 * @param isControl {boolean} Флаг, указан ли этот обработчик на контроле.
 * @param fileName {string} Имя файла шаблона.
 * @param childrenStorage {string[]} Набор имен детей (свойство _children контрола).
 */
export function processEventAttribute(
   value: IAttributeValue,
   attributeName: string,
   data: any,
   isControl: boolean,
   fileName: string,
   childrenStorage: string[]
): EventChain {
   const eventVisitor = new EventExpressionVisitor();
   const eventContext = {
      data,
      fileName,
      attributeName,
      isControl,
      isExprConcat: false,
      configObject: undefined,
      escape: false,
      sanitize: false,
      caller: undefined,
      getterContext: 'this',
      forbidComputedMembers: true,
      childrenStorage,
      checkChildren: true
   };
   const artifact = eventVisitor.visit(value.data[0].name, eventContext);
   const handler = FSC.wrapAroundExec('function() { return ' + artifact.fn + '; }');
   const eventArguments = FSC.wrapAroundExec(`[${artifact.args.join(',')}]`);
   const chain = EventChain.prepareEventChain();
   chain.push(new EventNode({
         args: eventArguments,
         value: artifact.handlerName,
         viewController: FSC.wrapAroundExec('viewController'),
         handler: handler,
         isControl: isControl,
         context: FSC.wrapAroundExec('(function(){ return ' + artifact.context + '; })')
      }));
   return chain;
}

/**
 * Проверить по имени, является ли данный атрибут обработчиком события.
 * @param attributeName {string} Имя атрибута.
 */
export function isEvent(attributeName: string): boolean {
   return EVENT_NAME_PATTERN.test(attributeName);
}

/**
 * Получить имя события из имени атрибута.
 * @param attributeName {string} Имя атрибута.
 */
export function getEventName(attributeName: string): string {
   return attributeName.slice(3).toLowerCase();
}
