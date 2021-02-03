/**
 * @deprecated
 * @description Represents mustache expression processing.
 * @author Крылов М.А.
 * @file Compiler/expressions/Statement.ts
 *
 * @todo реализовать восстановление разбора при ошибке, например, разбор
 *   выражения {{ { a: { b: 1 }} }} завершится ошибкой, поскольку будет
 *    взят первая пара }} - нужно продолжить попытку.
 */

import { Parser } from './Parser';
import { ProgramNode } from './Nodes';

/**
 * Regular expression for finding variables/expression inside of AST
 */
const VARIABLES_PATTERN = /\{\{ ?([\s\S]*?) ?\}\}/g;
const LOCALIZATION_PATTERN = /\{\[ ?([\s\S]*?) ?\]\}/g;

/**
 * Safe replacing
 */
const SAFE_REPLACE_CASE_PATTERN = /\r|\n|\t|\/\*[\s\S]*?\*\//g;

/**
 * Safe whitespaces replacing
 */
const SAFE_WHITESPACE_REMOVE_PATTERN = / +(?= )/g;

/**
 * Safe placeholder
 */
const EMPTY_STRING = '';

const PARSER = new Parser();

export class BaseNode {
   type: string;
   value: string;

   constructor(type: string, value: string) {
      this.type = type;
      this.value = value;
   }
}

export class VariableNode extends BaseNode {
   name: ProgramNode;
   localized: boolean;
   // FIXME: wtf
   noEscape: boolean;

   isEvent: boolean;
   isBind: boolean;

   constructor(name: ProgramNode, localized: boolean, value: string) {
      super('var', value);
      this.name = name;
      this.localized = localized;
      this.noEscape = false;

      this.isEvent = false;
      this.isBind = false;
   }
}

export class TextNode extends BaseNode {
   constructor(value: string) {
      super('text', value);
   }
}

export class LocalizationNode extends BaseNode {
   name: string;
   localized: boolean;

   constructor(name: string) {
      super('var', undefined);
      this.name = name;
      this.localized = true;
   }
}

/**
 * @deprecated
 * @param name
 * @param value
 * @param localized
 * @returns {{name: *, localized: *, type: string, value: *}}
 */
export function createDataVar(name: ProgramNode, value: string = '', localized: boolean = false): VariableNode {
   return new VariableNode(name, localized, value);
}

/**
 * TODO: remove
 * @param property
 * @returns {{name: *, localized: *, type: string, value: *}}
 */
export function processProperty(property: string): VariableNode {
   return new VariableNode(PARSER.parse(property), false, EMPTY_STRING);
}

/**
 * TODO: refactor
 * @param data
 * @returns {*|boolean}
 */
export function isStaticString(data: string): boolean {
   return !!(data && data.indexOf('{{') === -1);
}

export const enum RawNodeType {
   Text,
   Variable,
   Locale
}

export class RawNode {
   type: RawNodeType;
   value: string;

   constructor(type: RawNodeType, value: string) {
      this.type = type;
      this.value = value;
   }
}

/**
 * Создать текст
 * @param value Текст
 * @returns {{type: number, value: *}} Объект с полем type = 0, и value = значение текста
 * @private
 */
function createRawDataText(value: string): RawNode {
   return new RawNode(RawNodeType.Text, value);
}

/**
 * Создать переменную
 * @param value Текст Mustache выражения
 * @returns {{type: number, value: *}} Объект с полем type = 1, и value = значение Mustache выражения
 * @private
 */
function createRawDataVar(value: string): RawNode {
   return new RawNode(RawNodeType.Variable, value);
}

/**
 * Создать локализацию
 * @param value Текст локализации
 * @returns {{type: number, value: *}} Объект с полем type = 0, и value = значение текста локализации
 * @private
 */
function createRawDataLocale(value: string): RawNode {
   return new RawNode(RawNodeType.Locale, value);
}

/**
 * Выполнить разметку набора данных.
 * Здесь с помощью регулярного выражения ищем некоторый текст, попадающий под шаблон.
 * Найденный участок кода будет обернут в результат вызова targetWrapper функции, а все,
 * что оказалось между найденными выражениями оборачивается с помощью defaultWrapper.
 * @param strings Массив объектов с текстом, переменными, локализациями.
 * @param regex Регулярное выражение для поиска новых сущностей.
 * @param targetWrapper Функция создания определенной сущности.
 * @param defaultWrapper Функция создания неопределенной сущности.
 * @returns {[]} Размеченный набор сущностей.
 * @private
 */
function markDataByRegex(strings: any, regex: any, targetWrapper: any, defaultWrapper: any): any {
   let item;
   let value;
   let stringData;
   let last;
   const data = [];
   for (let idx = 0; idx < strings.length; ++idx) {
      // FIXME: Алгоритм построен на поэтапном уточнении текстовых сущностей
      //  поэтому здесь нужно работать только с объектами, где strings[idx].type = 0
      //  но пока не будет хорошей документации и прикладной код не будет содержать ошибок,
      //  поддержим прежнюю работу
      stringData = strings[idx].value;

      // С флагом global у регулярного выражения нужно сбрасывать индекс
      regex.lastIndex = 0;
      last = 0;
      // eslint-disable-next-line no-cond-assign
      while ((item = regex.exec(stringData))) {
         if (last < item.index) {
            value = stringData.slice(last, item.index);
            data.push(defaultWrapper(value));
         }
         data.push(targetWrapper(item[1]));
         last = item.index + item[0].length;
      }

      // В случае, если ни одна сущность не была уточнена, то просто положить ее такой же
      if (last === 0) {
         data.push(strings[idx]);
      } else if (last < stringData.length) {
         value = stringData.slice(last);
         data.push(defaultWrapper(value));
      }
   }
   return data;
}

/**
 * Обработать массив размеченных данных (текст, переменная, локализация).
 * Для Mustache выражений выполняется разбор.
 * @param data Массив объектов { type: 0|1|2, value }
 * @returns {[]|*} Массив (если в исходном выражении содержится не только текст), либо объект,
 * представляющий текстовую ноду, если в исходном выражении оказался только текст
 * или Mustache выражения оказались пустыми (например, "text {{ }} text" -> "text text")
 * @private
 */
function processMarkedStatements(data: any): any {
   const array = [];
   let i;
   let hasTextOnly = true;
   for (i = 0; i < data.length; i++) {
      // Не обрабатывать здесь пустые строки
      // TODO: Выводить ошибку, если
      //  1. Указана пустая конструкция Mustache-выражения
      //  2. Указана пустая конструкция локализации
      if (data[i].value !== EMPTY_STRING) {
         switch (data[i].type) {
            case RawNodeType.Variable:
               if (data[i].value.trim() !== EMPTY_STRING) {
                  array.push(new VariableNode(PARSER.parse(data[i].value), false, EMPTY_STRING));
                  hasTextOnly = false;
               }
               break;
            case RawNodeType.Locale:
               array.push(new LocalizationNode(data[i].value));
               hasTextOnly = false;
               break;
            default:
               array.push(new TextNode(data[i].value));
               break;
         }
      }
   }
   if (hasTextOnly) {
      // В случае, если данные содержат только текст, то нужно склеить все тексты и вернуть одну текстовую ноду
      const repairedText = data.map((item: any): any => item.value).join(EMPTY_STRING);
      return new TextNode(repairedText);
   }
   return array;
}

/**
 * Preparing data-like string for structured tree
 * @return {Object} strObjectData
 */
export function replaceMatch(strObjectData: { data: any }): { data: any } {
   // С флагом global у регулярного выражения нужно сбрасывать индекс
   SAFE_REPLACE_CASE_PATTERN.lastIndex = 0;
   SAFE_WHITESPACE_REMOVE_PATTERN.lastIndex = 0;

   // Чистим входной текст:
   // 1. Replace unnecessary constructions such as comments and etc
   // 2. Replace multiple whitespaces in the middle of string
   const originText = strObjectData.data
      .replace(SAFE_REPLACE_CASE_PATTERN, ' ')
      .replace(SAFE_WHITESPACE_REMOVE_PATTERN, EMPTY_STRING);

   // Подготовительный этап. Всё есть текст
   const processedText = [createRawDataText(originText)];

   // Первый шаг. В тексте находим переменные {{ }}
   const processedVars = markDataByRegex(
      processedText,
      VARIABLES_PATTERN,
      createRawDataVar,
      createRawDataText
   );

   // Второй шаг. В тексте и переменных находим локализацию {[ ]}
   // FIXME: Вообще мы не должны трогать тут переменные, но так как ранее мы это делали, будем делать и сейчас,
   //  чтобы не ломать сборки. После того, как мы актуализируем страницу документации по локализации контролов
   //  и шаблонов и доведем это до масс, то это поведение можно прекратить, работая на каждом этапе только
   //  с текстом
   const processedLocs = markDataByRegex(
      processedVars,
      LOCALIZATION_PATTERN,
      createRawDataLocale,
      createRawDataText
   );

   // Заключительный этап. Формируем результат из размеченных данных
   strObjectData.data = processMarkedStatements(processedLocs);
   return strObjectData;
}
