import * as ReactDOMServer from 'react-dom/server';
import * as React from 'react';
import { Control } from 'UICore/Base';
import { IControlOptions } from 'UICommon/Base';
import { TemplateOrigin, IControlConfig, TemplateFunction } from './interfaces';
import {IGeneratorAttrs, TemplateResult} from '../Vdom/interfaces';
import {Logger} from 'UICommon/Utils';
import {
   CommonUtils as Common,
   RequireHelper,
   ConfigResolver,
   Scope,
   plainMerge,
   Helper,
   IGeneratorNameObject,
   ITplFunction, IAttributes, VoidTags as voidElements
} from 'UICommon/Executor';
import {Attr} from 'UICommon/Executor';
import {IWasabyEvent} from 'UICommon/_events/IEvents';



/**
 * @author Тэн В.А.
 */
export class GeneratorText {
   generatorBase: Generator;

   createDirective(text) {
      return '<' + text + '>';
   };

   escape(value) {
      return Common.escape(value);
   };

   createWsControl(
       origin: string | typeof Control,
       scope: IControlOptions,
       _: unknown,
       __: unknown,
       deps: any
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
      return ReactDOMServer.renderToString(React.createElement(controlClass, scope));
   }

   createControlNew(
       type: 'wsControl' | 'template',
       origin: TemplateOrigin,
       attributes: Attr.IAttributes,
       events: Record<string, IWasabyEvent[]>,
       options: IControlOptions,
       config: IControlConfig
   ): any {
      // @ts-ignore
      if (type === 'wsControl' || type === 'resolver') {
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

         /* FIXME: для wasabyOverReact, событий нет в options,
         *   получить их можно только из data (объявляется в шаблонной функции)
         *   такое поведение очень похоже на ошибку, т.к. все события должны быть в опциях
         *   надо разобраться почему события в опции не попадают и убрать мерж опций из data
         *   https://online.sbis.ru/opendoc.html?guid=c0aa021f-bd67-4fe9-8cfa-feee417fb3a3
         */
         const newOptions = {
            ...resolvedOptionsExtended,
            ...{events}
         };

         return this.resolver(origin, newOptions, templateAttributes, undefined,
             config.depsLocal, config.includedTemplates);
      }
      throw new Error('unknown type ' + type);
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
      // content option - в определенном способе использования контентная опция может представлять собой объект
      // со свойством func, в котором и лежит функция контентной опции. Демка UITest/MarkupSpecification/resolver/Top
      if (typeof tpl.func === 'function') {
         return resolveTemplateFunction(parent, tpl.func, preparedScope, decorAttribs);
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
   joinElements(elements: React.ReactNode): React.ReactNode {
      if (Array.isArray(elements)) {
         let res = '';
         const self = this;
         elements.forEach(function joinOneElement(element) {
            if (Array.isArray(element)) {
               element = self.joinElements(element);
            }
            res += (element || '');
         });

         return res;
      } else {
         throw new Error('joinElements: elements is not array');
      }
   }
   createText(text) {
      return text;
   };
   createTag(tag, attrs, children, attrToDecorate?, defCollection?): string {
      if (!attrToDecorate) {
         attrToDecorate = {};
      }
      if (!attrs) {
         attrs = {attributes: {}};
      }

      let mergedAttrs = Attr.processMergeAttributes(
          attrToDecorate.attributes as IAttributes,
          attrs.attributes as IAttributes
      );

      Object.keys(mergedAttrs).forEach((attrName) => {
         if (attrName.indexOf('top:') === 0) {
            const newAttrName = attrName.replace('top:', '');
            mergedAttrs[newAttrName] = mergedAttrs[newAttrName] || mergedAttrs[attrName];
            delete mergedAttrs[attrName];
         }
      });

      const mergedAttrsStr = '';
      // tslint:disable-next-line:no-bitwise
      if (~voidElements.indexOf(tag)) {
         return '<' + tag + mergedAttrsStr + ' />';
      }
      return '<' + tag + mergedAttrsStr + '>' + this.joinElements(children) + '</' + tag + '>';

   }
}


function resolveTemplateArray(
    parent: Control<IControlOptions>,
    templateArray: Common.ITemplateArray<TemplateFunction | ITplFunction<TemplateFunction>>,
    resolvedScope: IControlOptions,
    decorAttribs: IGeneratorAttrs): TemplateResult[] {
   let result = [];
   templateArray.forEach((template: TemplateFunction | ITplFunction<TemplateFunction>) => {
      const resolvedTemplate = resolveTemplate(template, parent, resolvedScope, decorAttribs);
      if (Array.isArray(resolvedTemplate)) {
         result = result.concat(resolvedTemplate);
      } else if (resolvedTemplate) {
         result.push(resolvedTemplate);
      }
   });
   return result;
}

function resolveTemplate(template: TemplateFunction | ITplFunction<TemplateFunction>,
                         parent: Control<IControlOptions>,
                         resolvedScope: IControlOptions,
                         decorAttribs: IGeneratorAttrs): TemplateResult {
   let resolvedTemplate;
   if (typeof template === 'function') {
      resolvedTemplate = resolveTemplateFunction(parent, template, resolvedScope, decorAttribs);
   } else if (typeof template.func === 'function') {
      resolvedTemplate = resolveTemplateFunction(parent, template.func, resolvedScope, decorAttribs);
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

function anonymousFnError(fn: TemplateFunction, parent: Control<IControlOptions>): void {
   Logger.error(`Ошибка построения разметки. Была передана функция, которая не является шаблонной.
               Функция: ${fn.toString()}`, parent);
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

function resolveTemplateFunction(parent: Control<IControlOptions>,
                                 template: TemplateFunction,
                                 resolvedScope: IControlOptions,
                                 decorAttribs: IGeneratorAttrs): TemplateResult {
   if (Common.isAnonymousFn(template)) {
      anonymousFnError(template, parent);
      return null;
   }
   return template.call(parent, resolvedScope, decorAttribs, undefined, true, undefined, undefined) as TemplateResult;
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
