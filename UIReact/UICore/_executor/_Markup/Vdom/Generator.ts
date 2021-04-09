import * as React from 'react';
import { Logger } from 'UICommon/Utils';
import {
   CommonUtils as Common,
   RequireHelper,
   onElementMount,
   onElementUnmount,
   IGenerator,
   Attr,
   ConfigResolver,
   Scope,
   plainMerge,
   Helper,
   IGeneratorNameObject
} from 'UICommon/Executor';
import { convertAttributes, WasabyAttributes } from './Attributes';
import { WasabyContextManager } from 'UICore/Contexts';
import { IWasabyEvent, IWasabyEventSystem } from 'UICommon/Events';
import { setEventHook } from 'UICore/Events';

import { Control, TemplateFunction } from 'UICore/Base';
import { IControlOptions } from 'UICommon/interfaces';
import {IGeneratorAttrs, TemplateOrigin, IControlConfig, TemplateResult, AttrToDecorate} from './interfaces';

export class GeneratorVdom implements IGenerator {
   prepareDataForCreate(tplOrigin: TemplateOrigin,
      scope: IControlOptions,
      attrs: IGeneratorAttrs,
      deps: Common.Deps<typeof Control, TemplateFunction>,
      includedTemplates?: Common.IncludedTemplates<TemplateFunction>): IControlOptions {
      if (tplOrigin === '_$inline_template') {
         // в случае ws:template отдаем текущие свойства
         return scope;
      }
      return undefined;
   }

   /**
    * В старых генераторах в этой функции была общая логика, как я понимаю.
    * Сейчас общей логики нет, поэтому функция по сути не нужна.
    * Судя по типам, все методы, которые могли вызваться из этой функции - публичные,
    * т.е. либо та логика дублировалась где-то ещё, либо типы были описаны неправильно.
    * @param type Тип элемента, определяет каким методом генератор будет его строить.
    * @param origin Либо сам шаблон/конструктор контрола, либо строка, по которой его можно получить.
    * @param attributes Опции, заданные через attr:<имя_опции>.
    * @param events
    * @param options Опции контрола/шаблона.
    * @param config
    */
   createControlNew(
      type: 'wsControl' | 'template',
      origin: TemplateOrigin,
      attributes: Attr.IAttributes,
      events: { [key: string]: IWasabyEvent[]; },
      options: IControlOptions,
      config: IControlConfig
   ): React.ReactElement | React.ReactElement[] | string {
      const templateAttributes: IGeneratorAttrs = {
         attributes: config.compositeAttributes === null
            ? attributes
            : Helper.processMergeAttributes(config.compositeAttributes, attributes),
         /*
         FIXME: https://online.sbis.ru/opendoc.html?guid=f354360c-5899-4f74-bf54-a06e526621eb
         судя по нашей кодогенерации, createTemplate - это приватный метод, потому что она его не выдаёт.
         Если это действительно так, то можно передавать родителя явным образом, а не через такие костыли.
         Но т.к. раньше parent прокидывался именно так, то мне страшно это менять.
         */
         internal: {
            parent: config.viewController
         }
      };

      // вместо опций может прилететь функция, выполнение которой отдаст опции, calculateScope вычисляет такие опции
      const resolvedOptions = Scope.calculateScope(options, plainMerge);
      // если контрол создается внутри контентной опции, нужно пробросить в опции еще те, что доступны в контентной
      // опции.
      const resolvedOptionsExtended = ConfigResolver.addContentOptionScope(resolvedOptions, config);
      /*
      У шаблонов имя раньше бралось только из атрибута.
      У контролов оно бралось только из опций.
      Вряд ли есть места, где люди завязались на это поведение.
      Поэтому чтобы не костылять с проверками, просто поддержу и опции, и атрибуты для всего.
       */
      const name = attributes.name as string ?? options.name;

      const newOptions = {
         ...resolvedOptionsExtended,
         ...{events},
         ...{eventSystem: config.data?._options?.eventSystem},
         ref: createChildrenRef(config.viewController, name)
      };

      return this.resolver(origin, newOptions, templateAttributes, undefined,
         config.depsLocal, config.includedTemplates);
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
      origin: string | typeof Control,
      scope: IControlOptions,
      _: unknown,
      __: unknown,
      deps: Common.Deps<typeof Control, TemplateFunction>
   ): React.ComponentElement<
      IControlOptions,
      Control<IControlOptions, object>
   > {
      const controlClassExtended: TemplateOrigin = resolveTpl(origin, {}, deps);
      const controlClass = Common.fixDefaultExport(controlClassExtended) as typeof Control;

      // todo временное решение только для поддержки юнит-тестов
      // https://online.sbis.ru/opendoc.html?guid=a886b7c1-fda3-4594-b00d-b48f1185aaf8
      if (Common.isCompound(controlClass)) {
         const generatorCompatibleStr = 'View/_executorCompatible/_Markup/Compatible/GeneratorCompatible';
         const GeneratorCompatible = requirejs(generatorCompatibleStr).GeneratorCompatible;
         const generatorCompatible = new GeneratorCompatible();
         const markup = generatorCompatible.createWsControl.apply(generatorCompatible, arguments);
         const res = React.createElement('remove', {
            dangerouslySetInnerHTML: {
               __html: markup
            }
         });
         //@ts-ignore
         return res;
      }
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
      origin: string | TemplateFunction,
      scope: IControlOptions,
      attributes: IGeneratorAttrs,
      _: unknown,
      deps: Common.Deps<typeof Control, TemplateFunction>
   ): TemplateResult {
      const resultingFn: TemplateFunction = resolveTpl(origin, {}, deps) as TemplateFunction;
      const parent: Control<IControlOptions> = attributes?.internal?.parent;
      /*
      Контролы берут наследуемые опции из контекста.
      Шаблоны так не могут, потому что они не полноценные реактовские компоненты.
      Поэтому берём значения либо из опций, либо из родителя.
       */
      if (typeof scope.readOnly === 'undefined') {
         scope.readOnly = parent?.props?.readOnly ?? parent?.context?.readOnly;
      }
      if (typeof scope.theme === 'undefined') {
         scope.theme = parent?.props?.theme ?? parent?.context?.theme;
      }

      return React.createElement(
         WasabyContextManager,
         {
            readOnly: scope.readOnly,
            theme: scope.theme
         },
         resolveTemplateFunction(parent, resultingFn, scope, attributes)
      );
   }

   resolver(
      tplOrigin: TemplateOrigin,
      preparedScope: IControlOptions,
      decorAttribs: IGeneratorAttrs,
      _: string,
      deps?: Common.Deps<typeof Control, TemplateFunction>,
      includedTemplates?: Common.IncludedTemplates<TemplateFunction>
   ): React.ReactElement | React.ReactElement[] | string {
      const parent = decorAttribs.internal.parent;

      const tplExtended: TemplateOrigin = resolveTpl(tplOrigin, includedTemplates, deps);
      const tpl = Common.fixDefaultExport(tplExtended);

      // typeof Control
      if (Common.isControlClass<typeof Control>(tpl)) {
         return this.createWsControl(tpl, preparedScope, decorAttribs, undefined, deps);
      }
      // TemplateFunction - wml шаблон
      if (Common.isTemplateClass<TemplateFunction>(tpl)) {
         return this.createTemplate(tpl, preparedScope, decorAttribs, undefined, deps);
      }
      // inline template, xhtml, tmpl шаблон (closured), content option
      if (typeof tpl === 'function') {
         return resolveTemplateFunction(parent, tpl, preparedScope, decorAttribs);
      }
      // Common.ITemplateArray - массив шаблонов, может например прилететь,
      // если в контентной опции несколько корневых нод
      if (Common.isTemplateArray<TemplateFunction>(tpl)) {
         return resolveTemplateArray(parent, tpl, preparedScope, decorAttribs);
      }

      // не смогли зарезолвить - нужно вывести ошибку
      logResolverError(tplOrigin, parent);
      return '' + tplOrigin;
   }

   /*
   FIXME: Изначально в joinElements было return ArrayUtils.flatten(elements, true).
   Он зовётся из каждого шаблона, так что нельзя просто взять и удалить.
   Вроде он нужен для тех случаев, когда partial вернёт вложенный массив. Я пытался возвращать
   несколько корневых нод из partial, возвращался просто массив из двух элементов.
   Так что пока этот метод ничего не делает.
    */
   joinElements(elements: React.ReactNode): React.ReactNode {
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
         events: {
            [key: string]: IWasabyEvent[]
         }
      },
      children: React.ReactNode[],
      attrToDecorate: AttrToDecorate,
      __: unknown,
      control?: Control
   ): React.DetailedReactHTMLElement<P, T> {
      const eventsObject = {
         //@ts-ignore _options объявлен пустым объектом по-умолчанию
         events: {...attrs.events, ...control._options.events},
         //@ts-ignore _options объявлен пустым объектом по-умолчанию
         eventSystem: control._options.eventSystem
      };
      if (!attrToDecorate) {
         attrToDecorate = {};
      }
      const mergedAttrs = Attr.mergeAttrs(attrToDecorate.attributes, attrs.attributes);
      Object.keys(mergedAttrs).forEach((attrName) => {
         if (!mergedAttrs[attrName]) {
            delete mergedAttrs[attrName];
         }
      });
      const name = mergedAttrs.name;
      const ref = createChildrenRef(
         control,
         name,
         createEventRef(tagName, eventsObject)
      );

      const convertedAttributes = convertAttributes(mergedAttrs);
      const extractedEvents = control ?
         {...control._options['events'], ...attrs.events} :
         {...attrs.events};

      const newProps = {
         ...convertedAttributes,
         ...extractedEvents,
         ref
      };

      return React.createElement<P, T>(tagName, newProps, children.length ? children : undefined);
   }

   // FIXME: бесполезный метод, но он зовётся из шаблонов
   escape<T>(value: T): T {
      return value;
   }
}

function createEventRef<T extends HTMLElement>(
   tagName: string,
   eventsObject: {
      events?: {
         [key: string]: IWasabyEvent[]
      };
      eventSystem?: IWasabyEventSystem;
   },
   prevRef?: React.RefCallback<T>
): React.RefCallback<T> {
   return (node) => {
      prevRef?.(node);
      if (node && Object.keys(eventsObject.events).length > 0) {
         setEventHook(tagName, eventsObject, node);
      }
   };
}

function createChildrenRef<T extends Control | Element>(
   parent: Control,
   name: string,
   prevRef?: React.RefCallback<T>
): React.RefCallback<T> | void {
   // _children protected по апи, но здесь нужен доступ чтобы инициализировать.
   /* tslint:disable:no-string-literal */
   const oldRef = (node) => {
      prevRef?.(node);
   };
   if (parent && name) {
      return (node) => {
         oldRef(node);
         if (node) {
            parent['_children'][name] = node;
            onElementMount(parent['_children'][name]);
         } else {
            onElementUnmount(parent['_children'], name);
         }
      };
   }
   return oldRef;
   /* tslint:enable:no-string-literal */
}

function getLibraryTpl(tpl: IGeneratorNameObject,
                       deps: Common.Deps<typeof Control, TemplateFunction>
): typeof Control | Common.ITemplateArray<TemplateFunction> {
   let controlClass;
   if (deps && deps[tpl.library]) {
      controlClass = Common.extractLibraryModule(deps[tpl.library], tpl.module);
   } else if (RequireHelper.defined(tpl.library)) {
      controlClass = Common.extractLibraryModule(RequireHelper.extendedRequire(tpl.library, tpl.module), tpl.module);
   }
   return controlClass;
}
function resolveTpl(tpl: TemplateOrigin,
                    includedTemplates: Common.IncludedTemplates<TemplateFunction>,
                    deps: Common.Deps<typeof Control, TemplateFunction>
): typeof Control | TemplateFunction | Common.IDefaultExport<typeof Control> |
   Function | Common.ITemplateArray<TemplateFunction> {
   if (typeof tpl === 'string') {
      if (Common.isLibraryModuleString(tpl)) {
         // if this is a module string, it probably is from a dynamic partial template
         // (ws:partial template="{{someString}}"). Split library name and module name
         // here and process it in the next `if tpl.library && tpl.module`
         const tplObject = Common.splitModule(tpl);
         return getLibraryTpl(tplObject, deps);
      }
      return Common.depsTemplateResolver(tpl, includedTemplates, deps);
   }
   if (Common.isLibraryModule(tpl)) {
      return getLibraryTpl(tpl, deps);
   }
   return tpl;
}

function resolveTemplateArray(
    parent: Control<IControlOptions>,
    templateArray: Common.ITemplateArray<TemplateFunction>,
    resolvedScope: IControlOptions,
    decorAttribs: IGeneratorAttrs): TemplateResult[] {
   let result = [];
   templateArray.forEach((template: Function) => {
      const resolvedTemplate = resolveTemplate(template, parent, resolvedScope, decorAttribs);
      if (Array.isArray(resolvedTemplate)) {
         result = result.concat(resolvedTemplate);
      } else if (resolvedTemplate) {
         result.push(resolvedTemplate);
      }
   });
   return result;
}

function resolveTemplate(template: Function,
    parent: Control<IControlOptions>,
    resolvedScope: IControlOptions,
    decorAttribs: IGeneratorAttrs): TemplateResult {
   let resolvedTemplate;
   if (typeof template === 'function') {
      resolvedTemplate = resolveTemplateFunction(parent, template, resolvedScope, decorAttribs);
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

function resolveTemplateFunction(parent: Control<IControlOptions>,
    template: Function,
    resolvedScope: IControlOptions,
    decorAttribs: IGeneratorAttrs): TemplateResult {
   if (Common.isAnonymousFn(template)) {
      anonymousFnError(template, parent);
      return null;
   }
   return template.call(parent, resolvedScope, decorAttribs, undefined, true, undefined, undefined) as TemplateResult;
}

function logResolverError(tpl: TemplateOrigin, parent: Control<IControlOptions>): void {
   if (typeof tpl !== 'string') {
      let errorText = 'Ошибка в шаблоне! ';
      if (Common.isLibraryModule(tpl)) {
         errorText += `Контрол не найден в библиотеке.
                Библиотека: ${(tpl as IGeneratorNameObject).library}.
                Контрол: ${(tpl as IGeneratorNameObject).module}`;
      } else {
         errorText += `Неверное значение в ws:partial. Шаблон: ${tpl} имеет тип ${typeof tpl}`;
      }
      Logger.error(errorText, parent);
   }
   if (typeof tpl === 'string' && tpl.split('!')[0] === 'wml'){
      // если у нас тут осталась строка то проверим не путь ли это до шаблона
      // если это так, значит мы не смогли построить контрол, т.к. указан не существующий шаблон
      Logger.error('Ошибка при построение контрола. Проверьте существует ли шаблон ' + tpl, parent);
   }
}

function anonymousFnError(fn: Function, parent: Control<IControlOptions>): void {
   Logger.error(`Ошибка построения разметки. Была передана функция, которая не является шаблонной.
               Функция: ${fn.toString()}`, parent);
}
