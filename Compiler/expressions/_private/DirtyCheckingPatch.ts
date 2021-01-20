/// <amd-module name="Compiler/expressions/_private/DirtyCheckingPatch" />

/**
 * @deprecated
 * @description Annotating abstract syntax tree.
 * @author Крылов М.А.
 * @file Compiler/expressions/_private/DirtyCheckingPatch.ts
 */

import { isBind } from './Bind';
import { isEvent } from './Event';
import { LocalizationNode, processProperty, TextNode, VariableNode } from './Statement';
import { IdentifierNode, Walker } from './Nodes';
import * as dataTypesCreator from 'Compiler/modules/data/utils/dataTypesCreator';
import * as tagUtils from 'Compiler/modules/utils/tag';
import { shallowClone } from 'Compiler/utils/Helpers';

// TODO: Здесь происходит обход ast дерева. Необходимо реализовать узлы wasaby и посетителей к ним
//  https://online.sbis.ru/opendoc.html?guid=8be16d5c-9155-4b43-981e-ac6dce062323

interface IInternal {
   [name: string]: {
      // FIXME: только для интерфейсов! При клонировании теряем прототип оригинала!!!
      data: VariableNode[];
      type: 'text';
   };
}

declare type TAttributeData = VariableNode | LocalizationNode | TextNode;

interface ITextNode {
   data: TextNode | TAttributeData[];
   key: string | number | undefined;
   type: 'text';
}

interface IAttributes {
   [name: string]: ITextNode;
}

declare type TChildNode = ITextNode | IWasabyNode;

interface IWasabyNode {
   attribs: IAttributes;
   name: string;
   children: TChildNode[];
   injectedData: TChildNode[];
   type: 'tag' | 'control' | 'module' | 'template';
   isContentOption: boolean;
   forSource: unknown;
   internal: IInternal;
   isRootTag: boolean;
}

interface IStorage {
   [name: string]: boolean;
}

/**
 * Имя переменной выражения в наборе internal.
 */
const INTERNAL_NAME = '__dirtyCheckingVars_';

/**
 * Имена свойств AST-узла цикла aka for(START_FROM; CUSTOM_CONDITION; CUSTOM_ITERATOR).
 * @type {string[]} Массив строковых констант.
 */
const FOR_ATTRIBUTES = ['START_FROM', 'CUSTOM_CONDITION', 'CUSTOM_ITERATOR'];

/**
 * Имена свойств параметра forSource AST-узла цикла aka for(key, value in main).
 * @type {string[]} Массив строковых констант.
 */
const FOREACH_ATTRIBUTES = ['main', 'key', 'value'];

/**
 * Проверить, является ли текущая сущность Program-узлом, который генерируется Mustache-парсером.
 * @param node Объект выражения.
 * @returns {boolean} True, если данный узел является Program-узлом.
 */
export function isProgramNode(node: VariableNode): boolean {
   return !!(node && node.type === 'var' && node.name && node.name.type === 'Program');
}

/**
 * Собрать все переменные из дерева выражений Program Node.
 * @param expression Program Node выражение.
 * @returns {string[]} Массив имен переменных.
 */
export function collectIdentifiers(expression: VariableNode): string[] {
   const result = [];
   const callbacks = {
      Identifier: (node: IdentifierNode): void => {
         result.push(node.name);
      }
   };
   const walker = new Walker(callbacks);
   if (isProgramNode(expression)) {
      expression.name.accept(walker, {
         fileName: 'Unknown'
      });
   }
   return result;
}

/**
 * Проверить, содержит ли данное выражение хотя бы одну игнорируемую переменную.
 * @param expression Program Node выражение.
 * @param ignoredIdentifiers Хранилище игнорируемых переменных.
 * @returns {boolean} True, если выражение содержит ли данное выражение хотя бы одну игнорируемую переменную.
 */
export function hasIgnoredIdentifier(expression: VariableNode, ignoredIdentifiers: IStorage): boolean {
   let hasIgnored = false;
   const callbacks = {
      Identifier: (data: any): any => {
         if (ignoredIdentifiers.hasOwnProperty(data.name)) {
            hasIgnored = true;
         }
      }
   };
   const walker = new Walker(callbacks);
   if (isProgramNode(expression)) {
      expression.name.accept(walker, {
         fileName: 'Unknown'
      });
   }
   return hasIgnored;
}

/**
 * Собрать неигнорируемые переменные среди игнорируемых в одном выражении.
 * @param expression Program Node выражение.
 * @param ignoredIdentifiers Хранилище игнорируемых переменных.
 * @returns {[]} Массив неигнорируемых идентификаторов как Program Node выражений или пустой массив.
 */
export function collectNonIgnoredIdentifiers(expression: VariableNode, ignoredIdentifiers: IStorage): VariableNode[] {
   let hasIgnored = false;
   const identifiersAsExpressions = [];
   const callbacks = {
      Identifier: (data: any): any => {
         if (ignoredIdentifiers.hasOwnProperty(data.name)) {
            hasIgnored = true;
         } else {
            identifiersAsExpressions.push(processProperty(data.name));
         }
      }
   };
   const walker = new Walker(callbacks);
   if (isProgramNode(expression)) {
      expression.name.accept(walker, {
         fileName: 'Unknown'
      });
   }
   return hasIgnored ? identifiersAsExpressions : [];
}

/**
 * Собрать все переменные из дерева выражений Program Node,
 * выполняя дробление выражения на подвыражения.
 * Например, для выражения a.b.c будет возвращен набор [a.b, a.b.c],
 * а для выражения opt будет возвращен набор [opt].
 * @param expression Program Node выражение.
 * @returns {string[]} Массив имен переменных.
 */
export function collectDroppedExpressions(expression: VariableNode): VariableNode[] {
   const result = [];
   const callbacks = {
      Identifier: (node: any): any => {
         result.push(processProperty(node.name));
      },
      MemberExpression: (node: any): any => {
         result.push(processProperty(node.string));
      }
   };
   const walker = new Walker(callbacks);
   if (isProgramNode(expression)) {
      expression.name.accept(walker, {
         fileName: 'Unknown'
      });
   }

   // Возвращаем только последние два выражения,
   // чтобы не приводить к лишним перерисовкам, когда это не нужно
   return result.slice(-2);
}

/**
 * Вырвать неигнорируемые переменные для прокидывания вверх.
 * Сделано для того, чтобы можно было дойти до перерисовки по наборам internal.
 * FIXME: спорный момент с точки зрения оптимизации циклов.
 * Выражения собираются только если было что игнорировать по идентификаторам.
 * @param expressions Массив Program Node выражений.
 * @param ignoredIdentifiers Хранилище игнорируемых переменных.
 * @returns {[]} Массив переменных или пустой массив.
 */
export function wrestNonIgnoredIdentifiers(expressions: VariableNode[], ignoredIdentifiers: IStorage): VariableNode[] {
   let identifiersAsExpressions = [];
   for (let index = 0; index < expressions.length; ++index) {
      identifiersAsExpressions = identifiersAsExpressions.concat(
         collectNonIgnoredIdentifiers(expressions[index], ignoredIdentifiers)
      );
   }
   return identifiersAsExpressions;
}

/**
 * Проверить, содержит ли узел с выражением выражения binding-конструкции mutable или bind.
 * @param node Обработанная нода, содержащая данные.
 * @returns {boolean} True, если данный узел имеет тип Program Node и содержит mutable или bind.
 */
function hasBindings(node: VariableNode): boolean {
   return node && node.name && node.name.string && node.name.string.indexOf &&
      (node.name.string.indexOf('|mutable') > -1 || node.name.string.indexOf('|bind') > -1);
}

/**
 * Проверить, равно ли выражение атрибута выражению Program Node.
 * @param expr Program Node выражение.
 * @param attribute Значение атрибута.
 * @returns {boolean} True, если выражение равно выражению в атрибуте.
 */
function isExprEqualToAttr(expr: VariableNode, attribute: ITextNode): boolean {
   return attribute && attribute.data && attribute.data[0] === expr;
}

/**
 * Проверить, является ли узел типом данных (например, ws:Array, ws:Boolean и так далее).
 * @param ast AST-узел дерева.
 * @returns {boolean} True, если AST-узел является типом данных.
 */
function isDataAst(ast: IWasabyNode): boolean {
   return dataTypesCreator.injectedDataTypes.indexOf(tagUtils.splitWs(ast.name)) !== -1;
}

/**
 * Проверить, является ли узел шаблоном ws:partial.
 * @param ast AST-узел дерева.
 * @returns {boolean} True, если AST-узел является шаблоном ws:partial.
 */
function isPartialAst(ast: IWasabyNode): boolean {
   return ast.name === 'ws:partial';
}

/**
 * Проверить, является ли узел контролом.
 * @param ast AST-узел дерева.
 * @returns {boolean} True, если AST-узел является контролом.
 */
function isControlAst(ast: IWasabyNode): boolean {
   return !!(ast.children && ast.children[0] &&
      (ast.children[0].type === 'control' || ast.children[0].type === 'module'));
}

/**
 * Проверить, является ли узел шаблоном ws:template.
 * @param ast AST-узел дерева.
 * @returns {boolean} True, если AST-узел является шаблоном ws:template.
 */
function isTemplateAst(ast: IWasabyNode): boolean {
   return !!(ast.children && ast.children[0] && ast.children[0].type === 'template');
}

/**
 * Пометить контентные опции данного AST-узла, являющегося контролом или шаблоном.
 * Под контентной опцией понимаем опцию контрола, ws:partial или ws:Object такую, которая содержит верстку
 * (будет использована как шаблон).
 * @param ast AST-узел дерева.
 */
function markContentOptions(ast: IWasabyNode): void {
   const wasabyName = tagUtils.splitWs(ast.name);
   const children = (isPartialAst(ast) || isControlAst(ast))
      ? ast.injectedData : wasabyName === 'Object'
         ? ast.children : null;

   if (!children) {
      return;
   }
   for (let index = 0; index < children.length; ++index) {
      const child = children[index];
      const childName = tagUtils.splitWs((child as IWasabyNode).name);
      const isWasabyModule =
         isControlAst(child as IWasabyNode) ||
         isPartialAst(child as IWasabyNode) ||
         isTemplateAst(child as IWasabyNode) ||
         childName === 'for' || childName === 'if' || childName === 'else';

      (child as IWasabyNode).isContentOption = childName
         && !isDataAst(child as IWasabyNode) && !isWasabyModule && hasMarkupContent(child as IWasabyNode);
   }
}

function markRootTag(ast: TChildNode): void {
   if (ast.type === 'text') {
      // текстовые ноды не интересуют
      return;
   }
   if (ast.name !== 'ws:if' && ast.name !== 'ws:else' && ast.name !== 'ws:for') {
      ast.isRootTag = true;
   } else {
      ast.children.forEach((child: TChildNode): void => {
         // todo тут плохо потому что в child может быть и ITextNode
         markRootTag(child);
      });
   }
}

/**
 * Проверить, содержит ли данный AST-узел верстку.
 * @param ast AST-узел дерева.
 * @returns {boolean} True, если AST-узел содержит верстку.
 */
function hasMarkupContent(ast: IWasabyNode): boolean {
   if (Array.isArray(ast.children)) {
      for (let index = 0; index < ast.children.length; ++index) {
         const firstChild = ast.children[0] as IWasabyNode;
         if (firstChild) {
            const name = tagUtils.splitWs(firstChild.name);
            if ((name === 'if' || name === 'for') && Array.isArray(firstChild.children)) {
               return hasMarkupContent(firstChild);
            }
            return !name || isPartialAst(firstChild) || isControlAst(firstChild);
         }
      }
   }
   return false;
}

/**
 * Проверить, является ли AST-узел носителем конструкции цикла foreach.
 * @param ast AST-узел дерева.
 * @returns {boolean} True, если AST-узел является носителем конструкции цикла foreach.
 */
function isForeachAst(ast: IWasabyNode): boolean {
   return ast.hasOwnProperty('forSource');
}

/**
 * Проверить, является ли AST-узел носителем конструкции цикла for.
 * @param ast AST-узел дерева.
 * @returns {boolean} True, если AST-узел является носителем конструкции цикла for.
 */
function isForAst(ast: IWasabyNode): boolean {
   return FOR_ATTRIBUTES.every((name: any): any =>
      ast.attribs &&
      ast.attribs.hasOwnProperty(name) &&
      ast.attribs[name]);
}

/**
 * Проверить, присутствует ли данное выражение в одном из атрибутов.
 * FIXME: Выглядит как костыль. Разобраться, зачем эта тяжелая проверка.
 * @param expression Program Node выражение.
 * @param attributes Объект с атрибутами или ничего.
 * @returns {boolean} True, если хотя бы один атрибут содержит значение, равное данному выражению.
 */
function isExprInAttributes(expression: VariableNode, attributes: IAttributes): boolean {
   if (attributes) {
      for (const attribute in attributes) {
         if (isExprEqualToAttr(expression, attributes[attribute])) {
            return true;
         }
      }
   }
   return false;
}

/**
 * Заполнить набор служебных свойств выражениями.
 * @param attributes Набор атрибутов.
 * @param internal Набор служебных свойств.
 * @param expressions Набор вычисляемых выражений Program Node.
 */
function appendInternalExpressions(attributes: IAttributes, internal: IInternal, expressions: VariableNode[]): void {
   let dirtyCheckingIndex = 0;
   let finished = false;
   for (let index = 0; index < expressions.length; ++index) {
      const expression = expressions[index];
      if (hasBindings(expression) || isExprInAttributes(expression, attributes)) {
         // FIXME: таким образом исключается дублирование выражений. Сделать лучше
         finished = true;
      }

      if ((finished || expression.isEvent) && !expression.isBind) {
         continue;
      }

      /**
       * Переменные из контентых опций, попадают в опции контрола,
       * если expressionRaw будет лететь по ссылке один и тот же,
       * то мы получим конфликт эскейпинга.
       * То есть, если мы напишем в контенте {{ text }}
       * то он прилетит в системную опцию контрола с названием __dirtyCheckingVars_%N
       * Все что летит в опции по умолчанию не эскейпится, потому что это не надо,
       * контрол должен работать с чистыми данными, а все что написано в контентой опции должно эскейпиться.
       * Поэтому здесь добавляем чистую копию описания переменной
       */
      internal[INTERNAL_NAME + (dirtyCheckingIndex++)] = {
         data: [shallowClone(expressions[index])],
         type: 'text'
      };
   }
}

/**
 * Собрать все выражения из текстового AST-узла.
 * @param tag Текстовый AST-узел дерева.
 * @returns {[]|undefined} Массив выражений ProgramNode или undefined, если ни одного выражения не было найдено.
 */
function extractExpressions(tag: ITextNode): VariableNode[] | undefined {
   const expressions = [];
   if (tag && tag.type === 'text' && Array.isArray(tag.data)) {
      for (let index = 0; index < tag.data.length; ++index) {
         const expression = tag.data[index];
         if (isProgramNode(expression as VariableNode)) {
            expressions.push(expression);
         }
      }
      return expressions;
   }
   return undefined;
}

/**
 * Обновить хранилище имен реактивных переменных: добавить новые переменные, исключить игнорируемые переменные.
 * @param store Хранилище реактивных переменных.
 * @param identifiers Список имен переменных конкретного AST-узла.
 * @param ignoredIdentifiers Хранилище имен игнорируемых переменных.
 */
function applyIdentifiers(store: IStorage, identifiers: string[], ignoredIdentifiers: IStorage): void {
   // Добавить новые имена идентификаторов
   for (let index = 0; index < identifiers.length; ++index) {
      const identifier = identifiers[index];
      store[identifier] = true;
   }

   // Исключить игнорируемые имена идентификаторов
   for (const identifier in ignoredIdentifiers) {
      if (ignoredIdentifiers.hasOwnProperty(identifier)) {
         delete store[identifier];
      }
   }
}

/**
 * Добавить в ignoredNames все внутренние переменные цикла aka for(in).
 * @param ast AST-узел дерева.
 * @param ignoredIdentifiers Набор имен игнорируемых переменных.
 */
function addIgnoredForeachVars(ast: IWasabyNode, ignoredIdentifiers: IStorage): void {
   for (let idx = 1; idx < FOREACH_ATTRIBUTES.length; ++idx) {
      // FIXME: Вот тут лежит текстовое имя переменной. Нужно взять его.
      //  Привести к единому интерфейсу.
      const rawValue = ast.forSource[FOREACH_ATTRIBUTES[idx]];
      if (rawValue) {
         ignoredIdentifiers[rawValue] = true;
      }
   }
}

/**
 * Выполнить фильтрацию набора выражений: исключить все те выражения,
 * которые содержат хотя бы одну игнорируемую переменную.
 * @param expressions Набор выражений.
 * @param ignoredIdentifiers Хранилище имен игнорируемых переменных.
 * @returns {[]} Новый отфильтрованный набор выражений.
 */
function excludeIgnoredExpressions(expressions: VariableNode[], ignoredIdentifiers: IStorage): VariableNode[] {
   const result = [];
   for (let index = 0; index < expressions.length; ++index) {
      if (!hasIgnoredIdentifier(expressions[index], ignoredIdentifiers)) {
         result.push(expressions[index]);
      }
   }
   return result;
}

/**
 * Сформировать наборы internal выражений и реактивных переменных.
 * @param ast AST-узел дерева.
 * @param identifiersStore Хранилище имен реактивных переменных.
 * @param isRoot Метка: является ли данный AST-узел корневым.
 */
function patchInternalAndGatherReactive(
   ast: IWasabyNode,
   identifiersStore: IStorage,
   childrenStorage: string[],
   isRoot?: boolean
): VariableNode[] {
   const ignoredIdentifiers = { };
   let expressions = [];
   let identifiers = [];

   // Проверить наличие AST дерева.
   // TODO: А почему его может не быть? Зачем идти сюда с пустым деревом? Нужно отвалиться обругавшись раньше!
   // Если нет детей, значит пришел текст, скрипт, стиль или что-то еще, на что смотреть не нужно.
   if (!ast || !ast.children) {
      return expressions;
   }

   const isControl = isControlAst(ast);
   const isContentOption = ast.isContentOption;
   const isTemplate = isTemplateAst(ast);
   const isPartial = isPartialAst(ast);
   const isForeach = isForeachAst(ast);
   const isFor = isForAst(ast);
   const isElement = !(isControl || ast.name.startsWith('ws:'));

   // Отметить контентные опции флагом
   markContentOptions(ast);

   if (isControl || isElement || isPartial) {
      // Собираем имена дочерних контролов
      if (ast.attribs && ast.attribs.name && ast.attribs.name.type === 'text') {
         childrenStorage.push((ast.attribs.name.data as TextNode).value);
      }
   }

   // Дополнительные переменные, необходимые для прокидывания. Влияют на перерисовки и набор internal.
   const additionalIdentifiers = [];

   // Пополняем наборы игнорирумых и неигнорируемых идентификаторов
   if (isForeach) {
      addIgnoredForeachVars(ast, ignoredIdentifiers);
      identifiers = identifiers.concat(
         collectIdentifiers(new VariableNode(ast.forSource[FOREACH_ATTRIBUTES[0]], false, ''))
      );
      expressions.push(new VariableNode(ast.forSource[FOREACH_ATTRIBUTES[0]], false, undefined));
   } else if (isFor) {
      // <ws:for data="init; test; update">
      for (let index = 0; index < FOR_ATTRIBUTES.length; ++index) {
         const forIdentifiers = collectIdentifiers(ast.attribs[FOR_ATTRIBUTES[index]].data[0] as VariableNode);
         for (let index2 = 0; index2 < forIdentifiers.length; ++index2) {
            const forIdentifier = forIdentifiers[index2];
            if (additionalIdentifiers.indexOf(forIdentifier) === -1) {
               ignoredIdentifiers[forIdentifier] = true;
               additionalIdentifiers.push(forIdentifier);
            }
         }
      }
   } else if (isContentOption) {
      ignoredIdentifiers[tagUtils.splitWs(ast.name)] = true;
   }

   // Для начала обработаем детей текущего AST-узла
   for (let index = 0; index < ast.children.length; ++index) {
      const child = ast.children[index];
      if (child.type === 'tag') {
         // Для всех нетекстовых узлов делаем патч
         expressions = expressions.concat(patchInternalAndGatherReactive(child, identifiersStore, childrenStorage));
      } else {
         // Для текстового узла выполняем только сбор выражений
         const childExpressions = extractExpressions(child as ITextNode);
         if (childExpressions) {
            for (let i = 0; i < childExpressions.length; ++i) {
               const temp = collectIdentifiers(childExpressions[i]);
               if (temp.length > 0) {
                  identifiers = identifiers.concat(temp);
                  expressions.push(childExpressions[i]);
               }
            }
         }
      }
   }

   // mark roots if content option has special tag (e.g. ws:content)
   if (isContentOption) {
      ast.children.forEach((child: TChildNode): void => {
         markRootTag(child);
      });
   }
   // mark roots of template content
   if (ast.name === 'ws:template') {
      ast.children.forEach((child: TChildNode): void => {
         markRootTag(child);
      });
   }

   // Обработаем внедренные данные служебных узлов
   if (isControl || isTemplate || isContentOption || isPartial || isRoot) {
      if (ast.injectedData) {
         for (let index = 0; index < ast.injectedData.length; ++index) {
            const child = ast.injectedData[index];
            let childExpressions;
            if (child.type === 'tag') {
               // mark roots if content option has no special tag (e.g. ws:content)
               markRootTag(child as IWasabyNode);

               childExpressions = patchInternalAndGatherReactive(child, identifiersStore, childrenStorage);
            } else {
               childExpressions = extractExpressions(child as ITextNode);
               if (childExpressions) {
                  for (let j = 0; j < childExpressions.length; ++j) {
                     const temp2 = collectIdentifiers(childExpressions[j]);
                     if (temp2.length > 0) {
                        identifiers = identifiers.concat(temp2);
                     }
                  }
               }
            }
            if (!childExpressions) {
               throw new Error('Опция контрола, директив ws:template или ws:partial с именем "' + ast.name + '" содержит некорректные данные');
            }
            expressions = expressions.concat(childExpressions);
         }
      }
      if (!ast.attribs && (isControl || isTemplate)) {
         ast.attribs = { };
      }
      if (!ast.internal) {
         ast.internal = { };
      }
   }

   // Обработаем атрибуты AST-узла, которые могут содержать опции, атрибуты, обработчики событий, бинды
   let isEventExpression;
   let isBindExpression;
   if (ast.attribs) {
      // TODO: убедиться, что hasOwnProperty для attributeName ничего не сломает и исправить этот цикл
      // tslint:disable-next-line:forin
      for (const attributeName in ast.attribs) {
         isEventExpression = isEvent(attributeName);
         isBindExpression = isBind(attributeName);
         let attributeExpressions = extractExpressions(ast.attribs[attributeName]);
         if (attributeExpressions) {
            if (isEventExpression) {
               // Выставим флаг, чтобы не включать выражения в internal
               attributeExpressions.forEach((newVar: any): void => {
                  newVar.isEvent = true;
               });
            } else if (isBindExpression) {
               // Выставим флаг, чтобы принудительно включать выражения в internal
               attributeExpressions = attributeExpressions
                  .map((expression: any): any => collectDroppedExpressions(expression))
                  .reduce((acc: any, val: any): any => acc.concat(val), []);
               attributeExpressions.forEach((newVar: any): void => {
                  newVar.isBind = true;
               });
            }
            for (let index = 0; index < attributeExpressions.length; ++index) {
               identifiers = identifiers.concat(collectIdentifiers(attributeExpressions[index]));
            }
            expressions = expressions.concat(attributeExpressions);
         }
      }
   }

   // Запишем набор internal для текущего AST-узла
   if (ast.internal) {
      appendInternalExpressions(ast.attribs, ast.internal, expressions);
   }

   // FIXME: при игнорировании можем убрать выражение с переменной, тем самым потеряя цепочку перерисовок, -
   //  сейчас узлы циклов не являются носителями internal, а до контентной опции из цикла ничего не долетит.
   //  Не можем оставить выражение целиком - оставляем переменную, чтобы перерисовка дошла до нужного компонента.
   //  Оставим вопрос до проекта по оптимизации перерисовок, в котором решим вопрос об internal и тому, что
   //  туда будет входить, а также перерисовки при циклах.
   if (isForeach || isFor || isContentOption) {
      expressions = expressions.concat(wrestNonIgnoredIdentifiers(expressions, ignoredIdentifiers));
   }

   // Исключим все выражения, которые содержат игнорируемые переменные
   expressions = excludeIgnoredExpressions(expressions, ignoredIdentifiers);

   // Добавим дополнительные переменные, которые также должны быть учтены в наборе internal
   if (isFor) {
      for (let index = 0; index < additionalIdentifiers.length; ++index) {
         expressions.push(processProperty(additionalIdentifiers[index]));
      }
   }

   // Обновим хранилище реактивных переменных
   applyIdentifiers(identifiersStore, identifiers, ignoredIdentifiers);

   return expressions;
}

/**
 * Собрать из AST-дерева все реактивные переменные.
 * @param ast Корневой AST-узел дерева.
 */
export function gatherReactive(ast: IWasabyNode): string[] {
   const childrenStorage = [ ];
   const identifiersStore = { };
   const rootInternal = patchInternalAndGatherReactive(ast, identifiersStore, childrenStorage, true);
   ast.internal = { };
   // @ts-ignore
   ast.childrenStorage = childrenStorage;
   appendInternalExpressions({ }, ast.internal, rootInternal);
   return Object.keys(identifiersStore);
}
