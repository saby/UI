/// <amd-module name="UI/_builder/Tmpl/expressions/_private/Event" />

/**
 * @author Крылов М.А.
 */

import { VariableNode } from './Statement';
import { EventExpressionVisitor } from './Nodes';

import * as FSC from 'UI/_builder/Tmpl/modules/data/utils/functionStringCreator';
import * as templates from 'UI/_builder/Tmpl/codegen/templates';

/**
 * Паттерн обработчика события для имени атрибута.
 */
const EVENT_NAME_PATTERN = /^(on:[A-z0-9])\w*$/;

/**
 * Класс цепочки обработчиков. Содержит коллекцию узлов EventNode для конкретного события.
 *
 * ВАЖНО: в начале идут bind-обработчики, а затем - события.
 */
export class EventChain extends Array<EventNode> {
   /**
    * Флаг, по которому различается EventChain от обычного массива.
    * @todo Избыточный флаг. Отрефакторить код и избавиться от него.
    */
   readonly events: boolean = true;
}

/**
 * Подготовить цепочку обработчиков: создать массив или вернуть имеющийся.
 * @param originChain {EventChain} Исходная цепочка обработчиков для конкретного события либо undefined.
 */
export function prepareEventChain(originChain?: EventChain): EventChain {
   if (!originChain) {
      return new EventChain();
   }
   return originChain;
}

/**
 * Данный класс представляет узел обработчика события.
 */
export class EventNode {
   /**
    * Имя узла - 'event'.
    * @todo Избыточный флаг. Отрефакторить код и избавиться от него.
    */
   name: string;
   /**
    * Аргументы, переданные функции-обработчику события.
    */
   args: string;
   /**
    * Имя функции-обработчика события.
    */
   value: string;
   /**
    * Сгенерированный код для обработчика события.
    */
   fn: string;

   /**
    * Инициализировать новый узел.
    * @param name {string} Имя события.
    * @param args {string} Аргументы обработчика.
    * @param value {string} Имя функции-обработчика.
    * @param fn {string} Сгенерированная функция-обработчик.
    */
   constructor(name: string, args: string, value: string, fn: string) {
      this.name = name;
      this.args = args;
      this.value = value;
      this.fn = fn;
   }
}

/**
 * Интерфейст значения атрибута.
 * @todo Отрефакторить парсеры и перенести интерфейс в определения Wasaby-узлов.
 */
export interface IAttributeValue {
   /**
    * Значение атрибута можеть быть "склейкой" разных узлов - локализация, текст, выражение.
    */
   data: VariableNode[];
   /**
    * Флаг, необходимый для различия опций контрола от атрибутов.
    * @todo Избыточный флаг. Отрефакторить код и избавиться от него.
    */
   property: boolean;
   /**
    * Тип атрибута.
    * @todo Избыточный флаг. Отрефакторить код и избавиться от него.
    */
   type: string;
}

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
   const handler = FSC.wrapAroundExec(
      templates.generateEvent(
         artifact.fn,
         artifact.context,
         isControl
      )
   );
   const eventArguments = FSC.wrapAroundExec(`[${artifact.args.join(',')}]`);
   const chain = prepareEventChain();
   chain.push(new EventNode('event', eventArguments, artifact.handlerName, handler));
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
