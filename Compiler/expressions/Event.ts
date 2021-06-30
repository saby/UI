/**
 * @description Represents methods for generating code for events.
 * @author Крылов М.А.
 */

import { EventExpressionVisitor } from 'Compiler/codegen/Expression';
import * as FSC from 'Compiler/modules/data/utils/functionStringCreator';
import { VariableNode } from 'Compiler/expressions/Statement';

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

   /**
    * Подготовить цепочку обработчиков: создать массив или вернуть имеющийся.
    * @param originChain {EventChain} Исходная цепочка обработчиков для конкретного события либо undefined.
    */
   static prepareEventChain: (originChain?: EventChain) => EventChain;
}

EventChain.prepareEventChain = function prepareEventChain(originChain?: EventChain): EventChain {
   if (!originChain) {
      return new EventChain();
   }
   return originChain;
};

interface IEventProcess {
   chain: EventChain;
   eventMeta?: IEventMeta;
}
interface IEventMeta {
   viewController: string;
   isControl: boolean;
   context: string;
}

interface IEventNodeCfg {
   args?: string;
   value: string;
   context?: string;
   handler?: string;
}

/**
 * Данный класс представляет узел обработчика события.
 */
export class EventNode {
   /**
    * Аргументы, переданные функции-обработчику события.
    */
   args: string;
   /**
    * Имя функции-обработчика события.
    */
   value: string;

   viewController: string;
   data: string;
   handler: string;
   isControl: boolean;
   context: string;

   bindValue: string;

   /**
    * Инициализировать новый узел.
    * @param cfg {IEventNodeCfg}
    */
   constructor(cfg: IEventNodeCfg) {
      this.args = cfg.args;
      this.value = cfg.value;
      this.context = cfg.context;
   }
}

/**
 * Создать узел обработчика события по атрибуту.
 * @param value {IAttributeValue} Значение атрибута.
 * @param attributeName {string} Имя атрибута.
 * @param data {any} Данные @todo Выяснить, какие это данные.
 * @param isControl {boolean} Флаг, указан ли этот обработчик на контроле.
 * @param fileName {string} Имя файла шаблона.
 * @param childrenStorage {string[]} Набор имен детей (свойство _children контрола).
 * @param calculateMeta {boolean} Определяет нужно ли вычислить метаданные для событий
 */
export function processEventAttribute(
   value: IAttributeValue,
   attributeName: string,
   data: any,
   isControl: boolean,
   fileName: string,
   childrenStorage: string[],
   calculateMeta: boolean
): IEventProcess {
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
      checkChildren: true,
      safeCheckVariable: null
   };
   const artifact = eventVisitor.visit(value.data[0].name, eventContext);
   const eventArguments = FSC.wrapAroundExec(`[${artifact.args.join(',')}]`);
   const chain = EventChain.prepareEventChain();
   const defaultContext = 'this';
   const eventNode: IEventNodeCfg = {value: artifact.handlerName};
   if (Object.keys(artifact.args).length) {
      eventNode.args = eventArguments;
   }
   if (artifact.context !== defaultContext) {
      eventNode.context = FSC.wrapAroundExec('(function(){ return ' + artifact.context + '; })');
      eventNode.handler = FSC.wrapAroundExec('function() { return ' + artifact.fn + '; }');
   }
   chain.push(new EventNode(eventNode));
   if (calculateMeta) {
      const eventMeta = {
         viewController: FSC.wrapAroundExec('viewController'),
         isControl,
         context: FSC.wrapAroundExec('(function(){ return ' + defaultContext + '; })'),
         handler: FSC.wrapAroundExec('function(handlerName){ return thelpers.getter(this, [handlerName]); }')
      };
      return {chain, eventMeta};
   }
   return {chain};
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
