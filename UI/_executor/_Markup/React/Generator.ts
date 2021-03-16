import * as React from 'react';
import { Logger } from 'UI/Utils';
import * as Common from '../../_Utils/Common';
import { onElementMount, onElementUnmount } from '../../_Utils/ChildrenManager';
import { convertAttributes, WasabyAttributes } from './Attributes';
import { WasabyContextManager } from 'UI/_react/WasabyContext/WasabyContextManager';
import { Control } from 'UI/_react/Control/WasabyOverReact';
import {
   IControlOptions
} from 'UI/_react/Control/interfaces';
import { IWasabyContextValue } from 'UI/_react/WasabyContext/WasabyContext';
import {
   IControl,
   IControlConfig, IGeneratorAttrs,
   IGeneratorNameObject,
   IStringTemplateResolverIncludedTemplates
} from '../IGeneratorType';
import {TGeneratorNode} from '../Vdom/IVdomType';
import {ReactElement} from 'react';
import { TemplateFunction } from 'UI/Base';

type TemplateResult = React.FunctionComponentElement<
   Partial<IWasabyContextValue> & { children?: React.ReactNode }
>;

/**
 * Либо сам шаблон/конструктор контрола, либо строка, по которой его можно получить.
 */
type TemplateOrigin =
    | Common.IDefaultExport
    | TemplateFunction
    | typeof Control
    | IGeneratorNameObject
    | string
    | Function
    | Function[];

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
      attributes: IGeneratorAttrs,
      _: unknown,
      options: IControlOptions,
      config: IControlConfig
   ): ReactElement|ReactElement[] {
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
         (attributes).internal = {
            parent: config.viewController,
            parentEnabled: false, // ???
            hasOldParent: false, // ???
            logicParent: null // ???
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
         return this.resolver(origin, options, attributes, '', config.depsLocal,
             config.includedTemplates);
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
      deps: Common.Deps
   ): React.ComponentElement<
      IControlOptions,
      Control<IControlOptions, object>
   > {
      const controlClass = Common.depsTemplateResolver(origin as string, {}, deps) as unknown as typeof Control;
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
      deps: Common.Deps
   ): TemplateResult {
      const resultingFn = Common.depsTemplateResolver(origin as string, {}, deps) as TemplateFunction;
      const parent: IControl = attributes?.internal?.parent;
      /*
      Контролы берут наследуемые опции из контекста.
      Шаблоны так не могут, потому что они не полноценные реактовские компоненты.
      Поэтому берём значения либо из опций, либо из родителя.
       */
      if (typeof scope.readOnly === 'undefined') {
         // @ts-ignore в api контрола context другой, но в контроле рекорда есть свое поле context
         scope.readOnly = parent.props?.readOnly ?? parent.context?.readOnly;
      }
      if (typeof scope.theme === 'undefined') {
         // @ts-ignore в api контрола context другой, но в контроле рекорда есть свое поле context
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

   resolver(
      tplOrigin: TemplateOrigin,
      preparedScope: IControlOptions,
      decorAttribs: IGeneratorAttrs,
      context: string,
      _deps?: Common.Deps,
      includedTemplates?: IStringTemplateResolverIncludedTemplates
   ): ReactElement|ReactElement[] {
      const parent = decorAttribs?.internal?.parent;
      let tpl: TemplateOrigin;

      if (typeof tplOrigin === 'string') {
         tpl = Common.depsTemplateResolver(tplOrigin, includedTemplates, _deps) as TemplateOrigin;
      } else {
         tpl = Common.fixDefaultExport(tplOrigin);
      }

      // typeof Control
      if (Common.isControlClass(tpl)) {
         return this.createWsControl(tpl, preparedScope, decorAttribs, context, _deps) as TGeneratorNode;
      }
      // TemplateFunction - wml шаблон
      if (Common.isTemplateClass(tpl)) {
         return this.createTemplate(tpl, preparedScope, decorAttribs, context, _deps);
      }
      // inline template, xhtml, tmpl шаблон (closured), content option
      if (typeof tpl === 'function') {
         return this.resolveTemplateFunction(parent, tpl as Function, preparedScope, decorAttribs, context);
      }
      // Function[]
      if (Common.isArray(tpl)) {
         return this.resolveTemplateArray(parent, tpl as Function[], preparedScope, decorAttribs, context);
      }

      // не смогли зарезолвить - нужно вывести ошибку
      logResolverError(tpl, parent);
      return null;
   }

   resolveTemplateArray(
      parent: IControl,
      templateArray: Function[],
      resolvedScope: IControlOptions,
      decorAttribs: IGeneratorAttrs,
      context: string): TemplateResult[] {
      let result = [];
      templateArray.forEach((template: Function) => {
         const resolvedTemplate = this.resolveTemplate(template, parent, resolvedScope, decorAttribs, context);
         if (Array.isArray(resolvedTemplate)) {
            result = result.concat(resolvedTemplate);
         } else if (resolvedTemplate) {
            result.push(resolvedTemplate);
         }
      });
      return result;
   }

   resolveTemplate(template: Function,
                   parent: IControl,
                   resolvedScope: IControlOptions,
                   decorAttribs: IGeneratorAttrs,
                   context: string): TemplateResult {
      let resolvedTemplate;
      if (typeof template === 'function') {
         resolvedTemplate = this.resolveTemplateFunction(parent, template, resolvedScope, decorAttribs, context);
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

   resolveTemplateFunction(parent: IControl,
      template: Function,
      resolvedScope: IControlOptions,
      decorAttribs: IGeneratorAttrs,
      context: string): TemplateResult {
      if (Common.isAnonymousFn(template)) {
         anonymousFnError(template, parent);
         return null;
      }
      if (parent) {
         return template.call(parent, resolvedScope, decorAttribs, context, true, undefined, undefined);
      }
      return template(resolvedScope, decorAttribs, context, true, undefined, undefined) as TemplateResult;
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

function logResolverError(tpl: TemplateOrigin, parent: IControl): void {
   Logger.error(`Неверное значение свойства template в ws:partial.
   Нужно поставить точку останова и исследовать передаваемое в ws:partial значение.
   По стеку будет понятно, в каком шаблоне и в какую опцию передается неправильное значение.`, parent);

   // Попробуем более точно определить причину ошибки
   if (typeof tpl !== 'string') {
      let errorText = 'Ошибка в шаблоне! ';
      if (tpl.hasOwnProperty('library')) {
         errorText += `Контрол не найден в библиотеке.
                Библиотека: ${(tpl as IGeneratorNameObject).library}.
                Контрол: ${(tpl as IGeneratorNameObject).module}`;
      } else {
         errorText += `Значение имеет тип ${typeof tpl}.`;
      }
      Logger.error(errorText, parent);
   }
}

function anonymousFnError(fn: Function, parent: IControl): void {
   Logger.error(`Ошибка построения разметки. Была передана функция, которая не является шаблонной.
               Функция: ${fn.toString()}`, parent);
}
