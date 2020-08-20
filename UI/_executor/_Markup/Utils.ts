/// <amd-module name="UI/_executor/_Markup/Utils" />
/* tslint:disable */

import * as Attr from '../_Expressions/Attr';
import * as Decorate from '../_Expressions/Decorate';
import { _FocusAttrs } from 'UI/Focus';
import {
   GeneratorEmptyObject, GeneratorError, GeneratorFn,
   GeneratorStringArray,
   IBaseAttrs, IGeneratorConfig,
   IGeneratorDefCollection, IStringTemplateResolverIncludedTemplates,
   TAttributes,
   TObject
} from './IGeneratorType';
import * as Common from '../_Utils/Common';
import voidElements from '../_Utils/VoidTags';
// @ts-ignore
import { Number } from 'UI/Utils';
import { INodeAttribute } from './IGeneratorType';
import {IAttributes} from '../_Expressions/Attr';

/**
 * @author Тэн В.А.
 */

interface IControlData {
   name?: unknown;
}

// joinAttrs = Attr.joinAttrs;

/**
 * Понимаем асинхронная ветка или нет
 * @param entity
 * @returns {unknown}
 */
export function isInstOfPromise(entity: Promise<any>): unknown {
   return entity && entity.then;
}

/**
 * Создаем строку с тегом для повторного выполнения
 * _beforeMount на клиенте и обработки ошибок
 * @param inst
 * @param createTag
 * @returns {string}
 */
export function asyncRenderErrorTag(inst: TObject, createTag?: Function): string {
   let decoratorObject = {};
   let options;
   if (inst && inst._options) {
      options = inst._options;
      decoratorObject = Decorate.createRootDecoratorObject(
         options.__$config,
         true,
         options['data-component'],
         {}
      );
   }
   const createTagFn = createTag ? createTag : createTagDefault;
   return createTagFn('div', { attributes: decoratorObject }, []);
}

/**
 *
 * @param markup
 * @returns {string}
 */
export function invisibleNodeCompat(markup: string): string {
   return markup && markup.indexOf && markup.indexOf('<invisible-node') === 0 ?
      markup.replace(/invisible-node/g, 'div') : markup;
}

/**
 *
 * @param tag
 * @param attrs Собственные атрибуты
 * @param children
 * @param attrToDecorate
 * @param defCollection
 * @param control
 * @returns {string}
 */
export function createTagDefault(tag: string,
                                 attrs: IBaseAttrs | {attributes: unknown},
                                 children: GeneratorStringArray,
                                 attrToDecorate?: TAttributes,
                                 defCollection?: IGeneratorDefCollection,
                                 control?: GeneratorEmptyObject): string {
   if (!attrToDecorate) {
      attrToDecorate = {};
   }
   if (!attrs) {
      attrs = {attributes: {}};
   }

   let mergedAttrs = Attr.processMergeAttributes(
       attrToDecorate.attributes as IAttributes,
       attrs.attributes as IAttributes,
       true
   );

   _FocusAttrs.prepareTabindex(mergedAttrs);
   // remove focus attributes from object
   if (Common.isCompat()) {
      // ! не вырезаем фокусные атрибуты, для совместимости. чтобы старые компоненты могли работать в новом окружении
      // textMarkupGenerator.cutFocusAttributes(mergedAttrs);
   } else {
      cutFocusAttributes(mergedAttrs);
   }
   const mergedAttrsStr = mergedAttrs
      ? decorateAttrs(mergedAttrs, {})
      : '';
   // tslint:disable-next-line:no-bitwise
   if (~voidElements.indexOf(tag)) {
      return '<' + tag + mergedAttrsStr + ' />';
   }
   return '<' + tag + mergedAttrsStr + '>' + joinElements(children, undefined, defCollection) + '</' + tag + '>';
}

/**
 *
 * @param attr1
 * @param attr2
 * @returns {string}
 */
export function decorateAttrs(attr1: TAttributes, attr2: TAttributes): string {
   function wrapUndef(value: string): string {
      if (value === undefined || value === null) {
         return '';
      } else {
         return value;
      }
   }

   const attrToStr = (attrs: Array<string>): string => {
      let str = '';
      for (const attr in attrs) {
         if (attrs.hasOwnProperty(attr)) {
            str += (wrapUndef(attrs[attr]) !== '' ? ' ' + (attr + '="' + attrs[attr] + '"') : '');
         }
      }
      return str;
   };
   return attrToStr(Attr.joinAttrs(attr1, attr2));
}

const focusAttrs = [
   'ws-creates-context',
   'ws-delegates-tabfocus',
   'ws-tab-cycling',
   'ws-no-focus',
   'attr:ws-creates-context',
   'attr:ws-delegates-tabfocus',
   'attr:ws-tab-cycling',
   'attr:ws-no-focus'
];

/**
 * Скрывает атрибуты необходимые для работы системы фокусов
 * @param attributes
 * @param fn
 * @param node
 * @return {object}
 */
export function cutFocusAttributes(attributes: TAttributes, fn?: Function, node?: HTMLElement): void {
   focusAttrs.forEach((focusAttr: string): void => {
      if (attributes.hasOwnProperty(focusAttr)) {
         fn && fn(focusAttr, attributes[focusAttr]);
         delete attributes[focusAttr];
         if (node) {
            node.removeAttribute(focusAttr);
         }
      }
   });
}

/**
 * Рекуриснове объединение элементов, если пришел массив из partial
 * @param elements
 * @param key
 * @param defCollection
 * @return {Array<object | string> | string | Error}
 */
export function joinElements(elements: Array<unknown>,
                             key?: string,
                             defCollection?: IGeneratorDefCollection): GeneratorStringArray | GeneratorError {
   if (Array.isArray(elements)) {
      let res = '';
      elements.forEach(function joinOneElement(element) {
         let id;
         if (Array.isArray(element)) {
            element = joinElements(element, undefined, defCollection);
         }
         if (element && isInstOfPromise(element)) {
            id = Number.randomId('def-');
            if (!defCollection.def) {
               defCollection.def = [];
            }
            defCollection.def.push(element);
            element = '[' + id + ']';
            defCollection.id.push(element);
         }
         res += (element || '');
      });

      return res;
   } else {
      throw new Error('joinElements: elements is not array');
   }
}

export function resolveControlName<TOptions extends IControlData>(controlData: TOptions,
                                                                  attributes: TAttributes | INodeAttribute): TAttributes | INodeAttribute {
   const attr = attributes || {};
   if (controlData && controlData.name) {
      attr.name = controlData.name;
   } else {
      if (attributes && attributes.name) {
         controlData.name = attributes.name;
      }
   }
   return attr;
}

/**
 * Если существует другой разрешатель имен в config.js. Мы его найдем и используем для подключения.
 * @param tpl
 * @param includedTemplates
 * @param _deps
 * @param config
 * @returns {*}
 */
export function stringTemplateResolver(tpl: string,
                                       includedTemplates: IStringTemplateResolverIncludedTemplates,
                                       _deps: GeneratorEmptyObject,
                                       config: IGeneratorConfig): GeneratorFn {
   const resolver = config && config.resolvers ? Common.findResolverInConfig(tpl, config.resolvers) : undefined;
   if (resolver) {
      return resolver(tpl);
   } else {
      return Common.depsTemplateResolver(tpl, includedTemplates, _deps, config);
   }
}
