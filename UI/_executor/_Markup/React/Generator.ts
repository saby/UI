import * as React from 'react';
import { Logger } from 'UI/Utils';
import * as Common from '../../_Utils/Common';
import * as RequireHelper from '../../_Utils/RequireHelper';
import { onElementMount, onElementUnmount } from '../../_Utils/ChildrenManager';
import { convertAttributes, WasabyAttributes } from './Attributes';
import { WasabyContextManager } from 'UI/_react/WasabyContext/WasabyContextManager';
import { Control } from 'UI/_react/Control/WasabyOverReact';
import {
   IControlOptions,
   TemplateFunction
} from 'UI/_react/Control/interfaces';
import { IWasabyContextValue } from 'UI/_react/WasabyContext/WasabyContext';
import {
   GeneratorObject,
   GeneratorTemplateOrigin, IControl, IGeneratorNameObject
} from '../IGeneratorType';
import * as Helper from '../Helper';
// import * as ConfigResolver from '../../_Utils/ConfigResolver';
import {TGeneratorNode} from '../Vdom/IVdomType';
import * as Scope from '../../_Expressions/Scope';

/*
FIXME: как я понимаю, в этом объекте могут быть HTMl-атрибуты+какие-то наши поля.
Из наших полей пока используется только internal, и даже от него вроде можно избавиться.
Надо разобраться и заменить на нормальный тип.
 */
interface IGeneratorAttrs {
   internal?: {
      parent: Control;
   };
}

interface IControlConfig {
   depsLocal: Deps;
   viewController: Control;
}

interface IDefaultExport {
   __esModule: boolean;
   default: Control;
}

/**
 * Либо сам шаблон/конструктор контрола, либо строка, по которой его можно получить.
 */
type TemplateOrigin =
   | string
   | IDefaultExport
   | TemplateFunction
   | typeof Control;

/**
 * Объект с зависимостями контрола/шаблона.
 */
type Deps = Record<string, TemplateFunction | IDefaultExport>;

function checkResult(res: GeneratorObject | Promise<unknown> | Error,
   type: string,
   name: string): GeneratorObject | Promise<unknown> | Error {
   if (res !== undefined) {
      return res;
   }
   /**
    * Если у нас есть имя и тип, значит мы выполнили код выше
    * Функции шаблонизации возвращают undefined, когда работают на клиенте
    * с уже построенной версткой
    * А вот если нам не передали каких-то данных сюда, то мы ничего не строили,
    * а значит это ошибка и нужно обругаться.
    */
   if ((typeof name !== 'undefined') && type) {
      return null;
   }
   if (typeof name === 'undefined') {
      Logger.error('Попытка использовать компонент/шаблон, ' +
         'но вместо компонента в шаблоне в опцию template был передан undefined! ' +
         'Если верстка строится неправильно, нужно поставить точку останова и исследовать стек вызовов. ' +
         'По стеку будет понятно, в каком шаблоне и в какую опцию передается undefined');
      return null;
   }
   throw new Error('MarkupGenerator: createControl type not resolved');
}

export class GeneratorReact {
   /**
    * В старых генераторах в этой функции была общая логика, как я понимаю.
    * Сейчас общей логики нет, поэтому функция по сути не нужна.
    * Судя по типам, все методы, которые могли вызваться из этой функции - публичные,
    * т.е. либо та логика дублировалась где-то ещё, либо типы были описаны неправильно.
    * @param type Тип элемента, определяет каким методом генератор будет его строить.
    * @param origin Либо сам шаблон/конструктор контрола, либо строка, по которой его можно получить.
    * @param attributes
    * @param _
    * @param options Опции контрола/шаблона.
    * @param config
    */
   createControlNew(
      type: 'wsControl' | 'template',
      origin: TemplateOrigin,
      attributes: object,
      _: unknown,
      options: IControlOptions,
      config: IControlConfig
   ): React.ReactElement {
      // тип контрола - компонент с шаблоном
      if (type === 'wsControl') {
         return this.createWsControl(
            origin,
            options,
            undefined,
            undefined,
            config.depsLocal
         );
      }
      // тип контрола - шаблон
      if (type === 'template') {
         /*
         FIXME: судя по нашей кодогенерации, createTemplate - это приватный метод, потому что она его не выдаёт.
         Если это действительно так, то можно передавать родителя явным образом, а не через такие костыли.
         Но т.к. раньше parent прокидывался именно так, то мне страшно это менять.
          */
         (attributes as IGeneratorAttrs).internal = {
            parent: config.viewController
         };

         return this.createTemplate(
            origin,
            options,
            attributes,
            undefined,
            config.depsLocal
         );
      }

      // когда тип вычисляемый, запускаем функцию вычисления типа и там обрабатываем тип
      if (type === 'resolver') {
         const res = this.resolver(origin as any, options, attributes, '', config.depsLocal, {}, Helper.config);
         return checkResult.call(this, res, type, name);
      }
   }

   /*
   FIXME: не понимаю зачем нужен этот метод, по сути он ничего не делает.
   Вроде шаблонизатор не может сгенерировать вызов этого метода с чем-то отличным от строки.
    */
   createText(text: string): string {
      if (typeof text !== 'string') {
         /*
         FIXME: я считаю, что эта функция всегда зовётся со строкой и проверка бесполезна.
         Но т.к. она тут была, то удалять её немножко страшно, вдруг там реально были не вызовы не со строками.
         Ведь для реакта null и undefined это валидные ноды, но странно, если для них звался бы createText.
          */
         Logger.error(
            'Тут должна была прийти строка, нужно подняться по стеку и понять откуда здесь что-то другое'
         );
         return '';
      }
      return text;
   }

   /**
    * Получает конструктор контрола по его названию и создаёт его с переданными опциями.
    * @param origin Либо сам шаблон/конструктор контрола, либо строка, по которой его можно получить.
    * @param scope Опции контрола.
    * @param _
    * @param __
    * @param deps Объект с зависимостями контрола, в нём должно быть поле, соответствующее name.
    */
   createWsControl(
      origin: TemplateOrigin,
      scope: IControlOptions,
      _: unknown,
      __: unknown,
      deps: Deps
   ): React.ComponentElement<
      IControlOptions,
      Control<IControlOptions, object>
   > {
      const controlClass = resolveTpl(origin, deps) as typeof Control;

      return React.createElement(controlClass, scope);
   }

   /**
    * Получает шаблон по его названию и строит его.
    * @param origin Либо сам шаблон/конструктор контрола, либо строка, по которой его можно получить.
    * @param scope Опции шаблона.
    * @param attributes
    * @param _
    * @param deps Объект с зависимостями шаблона, в нём должно быть поле, соответствующее name.
    */
   createTemplate(
      origin: TemplateOrigin,
      scope: IControlOptions,
      attributes: IGeneratorAttrs,
      _: unknown,
      deps: Deps
   ): React.FunctionComponentElement<
      Partial<IWasabyContextValue> & { children?: React.ReactNode }
   > {
      const resultingFn = resolveTpl(origin, deps) as TemplateFunction;

      const parent: Control<IControlOptions> = attributes?.internal.parent;
      /*
      Контролы берут наследуемые опции из контекста.
      Шаблоны так не могут, потому что они не полноценные реактовские компоненты.
      Поэтому берём значения либо из опций, либо из родителя.
       */
      if (typeof scope.readOnly === 'undefined') {
         scope.readOnly = parent.props?.readOnly ?? parent.context?.readOnly;
      }
      if (typeof scope.theme === 'undefined') {
         scope.theme = parent.props?.theme ?? parent.context?.theme;
      }

      return React.createElement(
         WasabyContextManager,
         {
            readOnly: scope.readOnly,
            theme: scope.theme
         },
         /*
         FIXME: как я понимаю, шаблоны всегда возвращают массив, даже если там один элемент.
         В таких случаях нужно просто отдать реакту сам элемент.
         Если там несколько элементов, то вроде как нужно оборачивать во фрагмент.
         В файле не одно место с таким комментом, нужно править все
          */
         ...resultingFn.call(parent, scope, attributes, undefined, true)
      );
   }

   prepareDataForCreate(tplOrigin: any, scope: any, attrs: any, deps: any, includedTemplates?: any): any {
      let logicParent;
      let parent;

      // При использовании ts-модуля, где нужный класс экспортируется дефолтно, внутри js-модуля
      // сюда приходит объект tplOrigin, где __esModule есть true, а в default лежит нужная нам
      // функция построения верстки
      // Для того, чтобы верстка строилась, необходимо вытащить функцию из default
      const tpl = typeof tplOrigin === 'object' && tplOrigin.__esModule && tplOrigin.default ?
         tplOrigin.default :
         tplOrigin;

      const controlClass = resolveTpl.call(this, tpl, deps, includedTemplates);
      const controlProperties = Scope.calculateScope(scope, Common.plainMerge) || {};

      if (!attrs.attributes) {
         attrs.attributes = {};
      }
      if (controlClass === '_$inline_template') {
         // в случае ws:template отдаем текущие свойства
         return controlProperties;
      }

      logicParent = (attrs.internal && attrs.internal.logicParent) ? attrs.internal.logicParent : null;
      parent = (attrs.internal && attrs.internal.parent) ? attrs.internal.parent : null;

      return {
         logicParent,
         parent,
         attrs: attrs.attributes,
         controlProperties,
         internal: attrs.internal,
         controlClass,
         compound: !(controlClass && controlClass.isWasaby)
      };
   }

   resolver(
      tpl: GeneratorTemplateOrigin,
      preparedScope: any,
      decorAttribs: any,
      context: string,
      _deps?: any,
      includedTemplates?: any,
      config?: any
   ): React.FunctionComponentElement<
      Partial<IWasabyContextValue> & { children?: React.ReactNode }
      > {
      const data = this.prepareDataForCreate(tpl, preparedScope, decorAttribs, _deps, includedTemplates);
      const resolvedScope = data.controlProperties;
      const isTplString = typeof tpl === 'string';
      let fn;

      if (isTplString) {
         fn = Common.depsTemplateResolver(tpl, includedTemplates, _deps, config);
      } else {
         fn = data.controlClass;
      }

      if (!fn) {
         if (typeof tpl === 'function') {
            fn = tpl;
            // @ts-ignore
         } else if (tpl && typeof tpl.func === 'function') {
            fn = tpl;
         } else if (Common.isArray(tpl)) {
            fn = tpl;
         }
      }

      if (Common.isControlClass(fn)) {
         return this.createWsControl(fn, resolvedScope, decorAttribs, context, _deps) as TGeneratorNode;
      }

      if (Common.isTemplateClass(fn)) {
         return this.createTemplate(fn, resolvedScope, decorAttribs, context, _deps);
      }

      const parent = data.parent;
      if (typeof fn === 'function') {
         if (Common.isAnonymousFn(fn)) {
            anonymousFnError(fn, parent);
            return null;
         }
         return parent ?
            fn.call(parent, resolvedScope, decorAttribs, context, true, undefined, undefined) :
            fn(resolvedScope, decorAttribs, context, true);
      }
      if (fn && typeof fn.func === 'function') {
         if (Common.isAnonymousFn(fn.func)) {
            anonymousFnError(fn.func, parent);
            return null;
         }
         return parent ?
            fn.func.call(parent, resolvedScope, decorAttribs, context, true, undefined, undefined) :
            fn.func(resolvedScope, decorAttribs, context, true);
      }
      if (Common.isArray(fn)) {
         return this.resolveTemplateArray(parent, fn, resolvedScope, decorAttribs, context);
      }
      if (typeof tpl === 'undefined') {
         const typeTpl = typeof tpl;
         Logger.error(`${typeTpl} component error - Попытка использовать компонент/шаблон, ` +
            `но вместо компонента в шаблоне был передан ${typeTpl}! ` +
            'Если верстка строится неправильно, нужно поставить точку останова и исследовать стек вызовов. ' +
            `По стеку будет понятно, в каком шаблоне и в какую опцию передается ${typeTpl}`, parent);
         return null;
      }
      if (fn === false) {
         Logger.error(`Контрол ${tpl} отсутствует в зависимостях и не может быть построен."`, parent);
         return null;
      }
      // create text node, if template is some text
      if (typeof tpl !== 'string') {
         let errorText = 'Ошибка в шаблоне! ';
         if (tpl.hasOwnProperty('library')) {
            errorText += `Контрол не найден в библиотеке.
                Библиотека: ${(tpl as IGeneratorNameObject).library}.
                Контрол: ${(tpl as IGeneratorNameObject).module}`;
         } else {
            errorText += `Неверное значение в ws:partial. Шаблон: ${tpl} имеет тип ${typeof tpl}`;
         }
         Logger.error(errorText, parent);
      }
      return null;
   }

   resolveTemplateArray(parent: any, templateArray: any, resolvedScope: any, decorAttribs: any, context: any): any {
      let result = [];
      templateArray.forEach((template: any): any => {
         const resolvedTemplate = this.resolveTemplate(template, parent, resolvedScope, decorAttribs, context);
         if (Array.isArray(resolvedTemplate)) {
            result = result.concat(resolvedTemplate);
         } else if (resolvedTemplate) {
            result.push(resolvedTemplate);
         }
      });
      return result;
   }

   resolveTemplate(template: any, parent: any, resolvedScope: any, decorAttribs: any, context: any): any {
      let resolvedTemplate = null;
      if (typeof template === 'function') {
         resolvedTemplate = this.resolveTemplateFunction(parent, template, resolvedScope, decorAttribs, context);
      } else if (typeof template.func === 'function') {
         resolvedTemplate = this.resolveTemplateFunction(parent, template.func, resolvedScope, decorAttribs, context);
      } else {
         resolvedTemplate = template;
      }
      if (Array.isArray(resolvedTemplate)) {
         if (resolvedTemplate.length === 1) {
            return resolvedTemplate[0];
         }
         if (resolvedTemplate.length === 0) {
            // return null so that resolveTemplateArray does not add
            // this to the result array, since it is empty
            return null;
         }
      }
      return resolvedTemplate;
   }

   resolveTemplateFunction(parent: any, template: any, resolvedScope: any, decorAttribs: any, context: any): any {
      if (parent) {
         if (Common.isAnonymousFn(template)) {
            anonymousFnError(template, parent);
            return null;
         }
         return template.call(parent, resolvedScope, decorAttribs, context, true, undefined, undefined);
      }
      if (Common.isAnonymousFn(template)) {
         anonymousFnError(template, parent);
         return null;
      }
      return template(resolvedScope, decorAttribs, context, true, undefined, undefined);
   }

   /*
   FIXME: Изначально в joinElements было return ArrayUtils.flatten(elements, true).
   Он зовётся из каждого шаблона, так что нельзя просто взять и удалить.
   Вроде он нужен для тех случаев, когда partial вернёт вложенный массив. Я пытался возвращать
   несколько корневых нод из partial, возвращался просто массив из двух элементов.
   Так что пока этот метод ничего не делает.
    */
   joinElements(elements: React.ElementType[]): React.ElementType[] {
      if (Array.isArray(elements)) {
         return elements;
      } else {
         throw new Error('joinElements: elements is not array');
      }
   }

   /**
    * Строит DOM-элемент.
    * @param tagName Название DOM-элемента.
    * @param attrs Атрибуты DOM-элемента.
    * @param children Дети DOM-элемента.
    * @param _
    * @param __
    * @param control Инстанс контрола-родителя, используется для заполнения _children.
    */
   createTag<T extends HTMLElement, P extends React.HTMLAttributes<T>>(
      tagName: keyof React.ReactHTML,
      attrs: {
         attributes: P &
            WasabyAttributes & {
               name?: string;
            };
      },
      children: React.ReactNode[] | undefined,
      _: unknown,
      __: unknown,
      control?: Control
   ): React.DetailedReactHTMLElement<P, T> {
      let ref;
      const name = attrs.attributes.name;
      if (control && name) {
         ref = (node: HTMLElement): void => {
            if (node) {
               control._children[name] = node;
               onElementMount(control._children[name]);
            } else {
               onElementUnmount(control._children, name);
            }
         };
      }

      const convertedAttributes = convertAttributes(attrs.attributes);

      const newProps = {
         ...convertedAttributes,
         ref
      };

      if (children) {
         /*
         FIXME: как я понимаю, шаблоны всегда возвращают массив, даже если там один элемент.
         В таких случаях нужно просто отдать реакту сам элемент.
         Если там несколько элементов, то вроде как нужно оборачивать во фрагмент.
         В файле не одно место с таким комментом, нужно править все
          */
         return React.createElement<P, T>(tagName, newProps, ...children);
      } else {
         /*
         FIXME: сценарии, где ничего не возвращается, может и есть, но лучше их поддерживать отдельно,
         с демкой такого сценария. Ошибку роняю, чтобы такие места сразу всплыли.
          */
         throw new Error('Шаблон ничего не вернул');
      }
   }

   // FIXME: бесполезный метод, но он зовётся из шаблонов
   escape<T>(value: T): T {
      return value;
   }
}

/**
 * Либо сужает тип obj до IDefaultExport, либо однозначно говорит, что это другой тип.
 * @param obj
 */
function isDefaultExport(obj: unknown): obj is IDefaultExport {
   if (typeof obj === 'object') {
      return obj.hasOwnProperty('__esModule') && obj.hasOwnProperty('default');
   }
   return false;
}

/**
 * Если в tplOrigin шаблон/конструктор контрола, то сразу возвращает его.
 * Иначе извлекает шаблон/конструктор контрола из зависимостей и возвращает его.
 * @param tplOrigin Либо сам шаблон/конструктор контрола, либо строка, по которой его можно получить.
 * @param deps Объект с зависимостями контрола/шаблона, в нём должно быть поле, соответствующее tplOrigin.
 */
function resolveTpl(
   tplOrigin: TemplateOrigin,
   deps: Deps
): typeof Control | TemplateFunction {
   const tpl = isDefaultExport(tplOrigin) ? tplOrigin.default : tplOrigin;

   // конструкция типа <ws:partial template="{{ _myTemplate }}" />, где _myTemplate - функция (она может быть контролом)
   if (typeof tpl === 'function') {
      return tpl;
   }
   // контрол или partial, у которого в template лежит строка
   if (typeof tpl === 'string') {
      // ws: подставляется ещё на этапе шаблонизации, не знаю зачем
      const newName = (Common.splitWs(tpl) as string) || tpl;
      const valueFromDeps = deps && deps[newName];
      let controlClass;

      if (isDefaultExport(valueFromDeps)) {
         controlClass = valueFromDeps.default;
      } else {
         controlClass = valueFromDeps;
      }

      if (!controlClass) {
         if (RequireHelper.defined(tpl)) {
            controlClass = RequireHelper.require(tpl);
         } else {
            throw new Error('Не смогли определить тип шаблона: ' + tpl);
         }
      }

      return controlClass;
   }
}

function anonymousFnError(fn: Function, parent: IControl): void {
   Logger.error(`Ошибка построения разметки. Была передана функция, которая не является шаблонной.
               Функция: ${fn.toString()}`, parent);
}
