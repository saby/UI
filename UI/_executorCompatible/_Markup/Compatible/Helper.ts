/// <amd-module name="UI/_executorCompatible/_Markup/Compatible/Helper" />
/* tslint:disable */

// @ts-ignore
import * as ParserUtilities from 'Core/markup/ParserUtilities';
// @ts-ignore
import * as randomId from 'Core/helpers/Number/randomId';
// @ts-ignore
import * as coreInitializer from 'Core/core-extend-initializer';
import { Logger } from 'UI/Utils';
import {
   _ForExecutorCompatible,
   Compatible,
   GeneratorFn,
   IBuilderScope,
   IGeneratorAttrs,
   IGeneratorInternalProperties,
   IControlProperties,
   INodeAttribute,
   TObject,
   TOptions,
   TScope
} from 'UI/Executor';
// @ts-ignore
import * as ContextBinder from 'Core/ContextBinder';
// @ts-ignore
import * as Context from 'Core/Context';
// @ts-ignore
import * as confStorage from 'Core/helpers/Hcontrol/configStorage';
import {
   IOptionsCompatibleFixed,
   IControlDataCompatible,
   IOptionsCompatibleBase,
   IContextCompatible,
   IMarkupForCompatible,
   IInternalCompatible,
   IDefaultInstanceData,
   IOptionsCompatible,
   IControlClass,
   IBindingCompatible,
   IInstanceCompatible,
   IInstanceExtendetCompatible,
   TContext,
   TInstance,
   TContextConstructor,
   TResultingFunction,
} from './ICompatibleType';

const Common = _ForExecutorCompatible.Common;
const Attr = _ForExecutorCompatible.Attr;
const Class = _ForExecutorCompatible.Class;

/**
 * @author Тэн В.А.
 */

/**
 * Фикс tabIndex в случае вставки wasaby-контрола в CompoundControl
 * @param scope
 * @param decOptions
 * @param _options
 * @return {IOptionsCompatibleFixed}
 */
export function tabIndexFixCompatible(scope: IBuilderScope,
                               decOptions: INodeAttribute,
                               _options: IOptionsCompatibleFixed): IOptionsCompatibleFixed {
   // if new control is inside of a CompoundControl it has to have the 'tabindex' option
   // to be revived correctly
   if (scope.internal && scope.internal.hasOldParent && typeof _options['tabindex'] === 'undefined') {
      if (typeof decOptions['attr:tabindex'] !== 'undefined') {
         _options['tabindex'] = decOptions['attr:tabindex'];
      } else {
         _options['tabindex'] = decOptions['tabindex'];
      }
   }

   if (!window || !_options.element || _options.element.length === 0) {
      if (!scope.internal || !scope.internal.logicParent) {
         _options.element = generateNodeCompatible(decOptions);
      } else {
         _options.__$fixDecOptions = decOptions;
      }
   }
   return _options;
}

/**
 * Генерируем минимальный вариант ноды
 * @param decOptions
 * @return {INode}
 */
function generateNodeCompatible(decOptions) {
   return new ParserUtilities.Node({
      nodeType: 1,
      nodeName: "component",
      startTag: "<component>",
      closeTag: "</component>",
      attributes: decOptions,
      sequence: undefined,
      childNodes: [],
      parentNode: undefined
   });
};

/**
 * Применяем биндинги
 * @param scope
 * @param _options
 * @param cnstr
 * @return {IBindingCompatible}
 */
export function setBindingCompatible(scope: IBuilderScope ,
                                     _options: IOptionsCompatible,
                                     cnstr: Function): IBindingCompatible {
   // применяю биндинги
   _options = bindOptionsCompatible(_options.linkedContext, _options, cnstr);
   scope.internal = scope.internal || <IGeneratorInternalProperties> {};

   scope.internal.iWantBeWS3 = true;

   return {_options: _options, scope: scope};
}

/**
 * Для новых контролов всегда предлагаем строить от контекста, т.к.
 * сейчас переопределены только те контролы, которые по дефолту строятся от контекста
 * Определяем тут, чтобы не расширять набор свойств новых контролов
 * @param context
 * @param _options
 * @param cnstr
 * @return {TOptions}
 */
function bindOptionsCompatible(context, _options, cnstr, defaultInstanceData?) {
   let binder, defaultOptions = defaultInstanceData && defaultInstanceData._options || {},
      buildMarkupWithContext = Common.isNewControl(cnstr) || 'buildMarkupWithContext' in _options ? _options.buildMarkupWithContext : defaultOptions.buildMarkupWithContext;

   if (context && context instanceof Context && buildMarkupWithContext !== false) {
      binder = ContextBinder.initBinderForControlConfig(_options);
      _options = binder.getConstructorOptions(context, cnstr, _options);
   } else if (_options.context && _options.context instanceof Context && buildMarkupWithContext !== false) {
      binder = ContextBinder.initBinderForControlConfig(_options);
      _options = binder.getConstructorOptions(_options.context, cnstr, _options);
   }
   return _options;
}

/**
 * После создания легкого инстанса необходимо синхронизовать биндинги если есть контекст
 * чтобы при inst.render() верстка построилась от правильных опций
 * @param scope
 * @param _options
 * @param cnstr
 * @return {IInstanceCompatible}
 */
export function mergeCompatible(scope: IBuilderScope,
                                _options: IOptionsCompatible,
                                cnstr: Function): IInstanceCompatible {
   // Мержим служебные и пользовательские опции для BaseCompatible
   return Compatible.createInstanceCompatible(cnstr, _options, scope.internal);
}

/**
 * Сохраняем контекст
 * @param _options
 * @param inst
 * @return {void}
 */
export function saveContextCompatible(_options: IOptionsCompatible,
                                      inst: TInstance): void {
   const ctx = _options.context || _options.linkedContext;
   if (ctx && ctx instanceof Context) {
      let binder = ContextBinder.initBinderForControlConfig(_options);
      binder.bindControl(inst, ctx, 'syncControl');
   }
}

/**
 * Для серверной верстки. Нам нужно, чтобы у корневого компонента был атрибут data-component
 * а у всех вложенных нет.
 * Таким образом, мы не сможем пересоздать контролы из верстки. Верстка теперь ничего не знает о том, какого типа
 * внутри нее компонент. Но корневой data-component нужен для совместимости
 * @param decOptions
 * @param scope
 * @return {TObject}
 */
export function dataComponentFixCompatible(decOptions: INodeAttribute,
                                           scope: IBuilderScope): INodeAttribute {
   let decAttrs = <INodeAttribute> {};
   if (!Attr.checkAttr(decOptions) && !decOptions.__wasOldControl) {
      for (let i in decOptions) {
         if ((i === 'data-component' ||
            i === 'config' ||
            i === 'hasMarkup') &&
            scope.internal && scope.internal.logicParent && scope.internal.logicParent._template) {
            continue;
         }
         decAttrs['attr:' + i] = decOptions[i];
      }
      decOptions = decAttrs;

      /**
       * Это свойство нужно, чтобы не "срезать" data-component у HOC
       * шаблонизатор принудительно запихзивает атрибуты name и sbisname
       * в контролы. Этого делать нельзя. name - это опция.
       * Поэтому мы фильтруем все "не attr:" при создании контрола
       * Если дошли до этой точки - значит мы уже прошлись по атрибутам и там остались только хорошие
       */
      Object.defineProperty(decOptions, '__itsFixedAttrs', {
         value: true,
         enumerable: false,
         configurable: false
      });
   } else {
      for (let i in decOptions) {
         if ((i === 'data-component' ||
            i === 'config' ||
            i === 'hasMarkup') &&
            (!scope.internal || !scope.internal.logicParent || !scope.internal.logicParent._template || scope.internal.hasOldParent)) {
            decOptions['attr:' + i] = decOptions[i];
         }
      }
   }
   // todo нужно обосновать зачем это тут, либо удалить. почему этого нет в Generator.ts?
   //  если просто так это удалить, будет падать сравнение html.tmpl в тестах из-за конфигов
   //  вынесено в хелпер для генератора совместимости. падало скорее всего из-за асинхронности
   //  когда делали сравнение синхронных веток, конфиг не очищался.
   //  https://online.sbis.ru/opendoc.html?guid=b2bc8007-fe7e-4038-b33a-f554e47d1753
   if (decOptions && decOptions['attr:component'] && decOptions['attr:component'].indexOf('Controls/Application') > -1) {
      delete decOptions['config'];
      delete decOptions['attr:config'];
   }

   return decOptions;
}

/**
 * Чтобы новые контролы (в частности, Controls/Decorator/Markup)
 * в старом окружении не терял атрибуты из шаблона.
 * @param inst
 * @param decOptions
 * @param scope
 * @param _options
 * @return {void}
 */
export function fixCompatible(inst: IInstanceExtendetCompatible,
                              decOptions: INodeAttribute,
                              scope: IBuilderScope,
                              _options: IOptionsCompatible): void {
   // По задаче https://online.sbis.ru/opendoc.html?guid=d7ec8126-a368-4afc-ba10-881fccd54b0e
   mergeDecOptionsCompatible(inst._decOptions, decOptions);
   if (Common.isCompat() || !scope.internal || !scope.internal.logicParent || confStorage.hasKey(_options.__$config)) {
      saveConfigCompatible(_options.__$config, inst);
      inst.__destory_origin = inst.destroy;
      inst.destroy = function(fromDirtyChecking) {
         let configObj = {};
         configObj[this._options.__$config] = undefined;
         confStorage.merge(configObj);
         this.__destory_origin.apply(this, arguments);
      };
   }
}

/**
 * Объединяем опции, если это необходимо
 * @param target
 * @param source
 * @return {void}
 */
function mergeDecOptionsCompatible(target: {}, source: INodeAttribute): void {
   if (!target || !source) {
      return;
   }
   for (let key in source) {
      if (!source.hasOwnProperty(key)) {
         continue;
      }
      if (target.hasOwnProperty(key)) {
         // Если такая опция уже есть, то игнорируем, за исключением случая с классом. Их склеиваем.
         if (key === 'class' || key === 'attr:class') {
            target[key] = (source[key] || '') + ' ' + (target[key] || '');
         }
      } else {
         target[key] = source[key];
      }
   }
}

/**
 * Сохраним инстанс в configStorage
 * @param configId
 * @param inst
 * @return {void}
 */
export function saveConfigCompatible(configId: string,
                                     inst: IInstanceExtendetCompatible): void {
   if (typeof window !== "undefined") {
      let configObj = {};
      configObj[configId] = inst;
      confStorage.merge(configObj);
   }
}

/**
 * Получаем результирующую функцию
 * @param cnstr
 * @return {Function}
 */
export function resultingFnAction(cnstr: Function): Function {
   return cnstr && cnstr.prototype && getTemplate(cnstr);
}

/**
 * Получаем щаблон (ws3 или wasaby контрол)
 * @param cnstr
 * @return {Function}
 */
function getTemplate(cnstr: Function): TResultingFunction {
   return cnstr.prototype._dotTplFn || cnstr.prototype._template;
}

/**
 * Проверяем, что имя шаблон является строкой
 * @param name
 * @return {boolean}
 */
export function notOptionalControlCompatible(name: GeneratorFn): boolean {
   return !(Common.isString(name) && Common.isOptionalString(Common.splitWs(name)));
}

/**
 * Проверяем, необходимо ли мержить tabIndex атрибут
 * @param decOptions
 * @param options
 * @return {boolean}
 */
export function fixTabindexUsingAttributeCompatible(decOptions: INodeAttribute,
                                                    options: IControlDataCompatible): boolean {
   let tabNeedMerge = true;

   if (options.tabindex !== undefined) {
      tabNeedMerge = false;
   }
   if (decOptions['attr:tabindex'] !== undefined) {
      options.tabindex = decOptions['attr:tabindex'];
   }
   if (decOptions['tabindex'] !== undefined) {
      options.tabindex = decOptions['tabindex'];
   }
   if (options.__$config) {
      if (confStorage.hasKey(options.__$config)) {
         if (decOptions['attr:tabindex'] !== undefined) {
            confStorage.getValue(options.__$config).tabindex = decOptions['attr:tabindex'];
         }
         if (decOptions['tabindex'] !== undefined) {
            confStorage.getValue(options.__$config).tabindex = decOptions['tabindex'];
         }
      }
   }
   return tabNeedMerge;
}

/**
 * Если применены биндинги, заполним пустые значения
 * @param controlData
 * @return {void}
 */
export function fillNonExistentValues(controlData: IControlDataCompatible): void {
   let bindings = controlData.bindings;
   bindings && bindings.forEach(function(binding) {
      let res = controlData;
      if (binding.bindNonExistent) {
         const path = binding.propName.split('/');
         if (path.length) {
            path.forEach(function(step) {
               if (res.hasOwnProperty(step)) {
                  res = res[step];
               } else {
                  Logger.error(`fillNonExistentValues() - nonexistent value "${binding.propName}" can\'t fill`, res);
               }
            });
            binding.nonExistentValue = res;
         } else {
            Logger.error(`fillNonExistentValues() - nonexistent value "${binding.propName}" can\'t fill`, res);
         }
      }
   });
}

/**
 * Генерируем случайное ID cfg-
 * @return {string}
 */
export function generateIdWithParent(): string {
   return randomId('cfg-');
}

/**
 * Проверка на то, что это функция сгенерирована с помощью dot,
 * а не tmpl и в таком случае вёрстки может и не быть
 * Для контроллеров всегда будет true
 * @param controlData
 * @param external
 * @return {string}
 */
export function hasMarkupConfig(controlData: IControlDataCompatible, external: boolean): string {
   if (external) {
      if (controlData && ((controlData.bindings && controlData.bindings.length) || controlData['hasMarkup'] === 'false')) {
         return 'false';
      }
   }
   return 'true';
}

/**
 * Подготавливаем маркап для совметимого контрола
 * @param cnstr
 * @param scope
 * @param context
 * @param decOptions
 * @return {IMarkupForCompatible}
 */
export function prepareMarkupForClassCompatible(cnstr: Function,
                                                scope: IBuilderScope,
                                                context: IContextCompatible,
                                                decOptions: INodeAttribute): IMarkupForCompatible {
   let resultingFn = getTemplate(cnstr),
      _options;

   if (Common.isNewControl(cnstr) || resultingFn.stable) {
      scope = saveParsedOptionsCompatible(scope, cnstr, Common.isNewControl(cnstr));
   }
   let defaultInstanceData;

   if (!scope.internal || !scope.internal.logicParent || !scope.internal.logicParent._template || !Common.isNewControl(cnstr)) {
      defaultInstanceData = coreInitializer.call(cnstr);
      // применяем на опции биндинги
      _options = bindOptionsCompatible(context, scope.user, cnstr, defaultInstanceData);
      // @ts-ignore
      _options.element = window ? $('[config="' + decOptions['config'] + '"]') : [];
      setContextCompatible(_options, context);
   } else {
      _options = scope.user;
      _options.element = [];
   }
   return {resultingFn: resultingFn, _options: _options, scope: scope, defaultInstanceData: defaultInstanceData};
}

/**
 * Операции над опции в configStorage для совметимого контрола
 * @param cnstr
 * @param scope
 * @param newCtr
 * @return {IBuilderScope}
 */
function saveParsedOptionsCompatible(scope: IBuilderScope,
                                     cnstr: Function,
                                     newCtr: boolean): IBuilderScope{
   const id = scope.user.__$config;

   /**
    * Вернем сохранение конфигураций в configStorage
    * если у нас есть for и в этом цикле вставляются кнопки
    * в контентную область какого-то контрола, то их конфигурацию не восттановить,
    * т.к. for был не в легком инстансе.
    */
   let savedCfg = confStorage.getData()[id];

   // В configStorage храним только прикладные опции
   if (!savedCfg) {
      let configStorage = {};
      configStorage[id] = scope.user;
      /**
       * Перестаем заполнять configStorage для vdom контролов
       * на сервере, все данные они подготавливают себе сами,
       * когда контрол лежит в vdom контроле.
       * Если что-то лежит в старом контроле - конфиг вернуть нужно!
       */
      confStorage.merge(configStorage);
   } else {
      scope.user = savedCfg;
   }

   return scope;
}

function setContextCompatible(_options, context) {
   if (context) {
      _options.linkedContext = context;
   } else if (_options.parent && _options.parent.getLinkedContext) {
      _options.linkedContext = _options.parent.getLinkedContext();
   }
}

/**
 * Фикс опций, например если нет опции и нет parent
 * @param _options
 * @param internal
 * @param defaultInstanceData
 * @return {boolean}
 */
export function fixEnabledOptionCompatible(_options: IOptionsCompatibleBase,
                                           internal: IInternalCompatible,
                                           defaultInstanceData: IDefaultInstanceData): boolean {
   /*Фиксим опции только если у нас опция не задана и нет parent,
    если есть parent, контрол родится и сам посмотрит на него и
    задизейблит себя в конструкторе*/
   if (_options.allowChangeEnable === false || _options.allowChangeEnable === "false") {
      return false;
   }
   // если опция по умолчанию defaultInstanceData = false, то тоже не изменяем
   if (defaultInstanceData && defaultInstanceData._options) {
      if (defaultInstanceData._options.allowChangeEnable === false || defaultInstanceData._options.allowChangeEnable === 'false') {
         return false;
      }
   }
   if (internal && _options.enabled === undefined && !internal.parent) {
      _options.enabled = internal.parentEnabled;
      return true;
   }
}

/**
 * Создаем ws3-контрол
 * @param scope
 * @param cnstr
 * @param resultingFn
 * @param decOptions
 * @param controlData
 * @returns {string}
 */
export function buildForOldControl(scope: IControlDataCompatible,
                                   cnstr: Function,
                                   resultingFn: TResultingFunction,
                                   decOptions: INodeAttribute,
                                   controlData: IOptionsCompatibleBase): string {
   var
      modOptions = cnstr.prototype._modifyOptions,
      _options;

   fixTabindexUsingAttributeCompatible(decOptions, scope.user);

   if (decOptions['attr:class'] !== undefined) {
      // compatibility with old controls and _modifyOptions
      decOptions['class'] = decOptions['attr:class'];
   }
   if (scope.user.__enabledOnlyToTpl !== undefined && scope.user.allowChangeEnable !== false) {
      scope.user.enabled = scope.user.__enabledOnlyToTpl;
   }
   scope.internal.isOldControl = true;
   _options = modOptions.call(cnstr.prototype, scope.user, controlData, decOptions);

   if (window && scope.internal.parent && scope.internal.parent._template && _options.element.length > 0) {//Нужны ли инстансы
      Compatible.createInstanceCompatible(cnstr, _options, scope.internal).instance;
      return '';
   } else {
      decOptions = resolveDecOptionsClassMerge(decOptions, _options, controlData);
      let ctx;
      if (_options.context && _options.context instanceof Context) {
         ctx = _options.context;
      } else if (_options.linkedContext && _options.linkedContext instanceof Context) {
         ctx = _options.linkedContext;
      }
      Object.defineProperty(_options, '__wasOldControl', {
         value: true,
         enumerable: false,
         configurable: false
      });
      for (let i in decOptions) {
         if (i.indexOf("attr:") !== 0) {
            decOptions["attr:" + i] = decOptions[i];
            delete decOptions[i];
         }
      }
      let result = resultingFn.call(scope.internal.parent, _options, {
         attributes: decOptions,
         internal: scope.internal
      }, ctx);

      if (scope.user.__enabledOnlyToTpl !== undefined && scope.user.allowChangeEnable !== false) {
         delete scope.user.enabled;
      }
      return result;

   }
}

/**
 * Создаем очень старый контрол
 * @param cnstr
 * @param scope
 * @param context
 * @param varStorage
 * @param decOptions
 * @returns {string}
 */
export function buildForSuperOldControls(scope: IControlDataCompatible,
                                         cnstr: Function,
                                         context: IContextCompatible,
                                         varStorage: TObject,
                                         decOptions: INodeAttribute): string {
   //нужно ли создавать инстансы(xhtml)
   if (scope.internal && scope.internal.parent && scope.internal.parent._template && window && scope.user.element.length > 0) {
      let _options;
      _options = bindOptionsCompatible(context, scope.user, cnstr);
      Compatible.createInstanceCompatible(cnstr, _options, scope.internal);
      return '';
   } else {
      // преобразуем родительские опции в форму для старых контролов
      let parentOptions = {
         enabled: scope.internal.parentEnabled,
         visible: scope.internal.parentVisible
      };
      decOptions['hasMarkup'] = 'true';
      return ParserUtilities.buildMarkupForClass(cnstr, scope.user, context, varStorage, parentOptions, undefined, decOptions);
   }
}

/**
 * Решаем какие опции мержим
 * @param decOptions
 * @param options
 * @param controlData
 * @returns {TOptions}
 */
function resolveDecOptionsClassMerge(decOptions: INodeAttribute,
                                     options: TOptions,
                                     controlData: IOptionsCompatibleBase): INodeAttribute {
   var
      classStr = (decOptions['attr:class'] ? decOptions['attr:class'] + ' ' : '') +
         (decOptions['class'] ? decOptions['class'] + ' ' : '') +
         (options['className'] ? options['className'] + ' ' : '') +
         (options['cssClassName'] ? options['cssClassName'] + ' ' : '') +
         (controlData && controlData['class'] ? controlData['class'] : ''),
      classMergeFunctions = {
         'visible': mergeVisible,
         'enabled': mergeEnabled
      };
   classStr = Class.removeClassDuplicates(classStr);
   decOptions.class = classStr.trim();

   for (let key in classMergeFunctions) {
      if (classMergeFunctions.hasOwnProperty(key)) {
         decOptions.class = classMergeFunctions[key](decOptions.class, options[key]);
      }
   }

   decOptions.class = decOptions.class.trim();
   if (!decOptions.class) {
      delete decOptions.class;
   }
   return decOptions;
}

/**
 * Мержим класс ws-hidden
 * @param classStr
 * @param visible
 * @returns {string}
 */
function mergeVisible(classStr: string, visible: boolean): string {
   if (visible === false) {
      classStr = classStr + ' ws-hidden';
   }
   return classStr;
}

/**
 * Мержим класс ws-enabled/ws-disabled
 * @param classStr
 * @param enabled
 * @returns {string}
 */
function mergeEnabled(classStr: string, enabled: boolean): string {
   if (enabled) {
      classStr = classStr + ' ws-enabled';
   } else {
      classStr = classStr + ' ws-disabled';
   }
   return classStr;
}

/**
 * Опция tabIndex по-умолчанию из Lib/Control, она нам только мешается,
 * -1 она для того чтобы потом при инициализации запустился алгоритм
 * получения минимального табиндекса.
 * эту опцию не задают специально, чтобы перебить опцию во внутреннем шаблоне
 * @returns {string}
 * @param scope
 */
export function tabIndexRemoveCompatible(scope: TScope): void {
   if (scope.tabindex === -1 && !scope.hasOwnProperty('_moduleName')) {
      delete scope.tabindex;
   }
}

/**
 * Если шаблон не прошел проверки в resolver(), то пытаемся привести его к строку
 * @param tpl
 * @param isTplString
 * @param resolvedScope
 * @param decorAttribs
 * @param context
 * @returns {string}
 */
export function notModuleStringCompatible(tpl: string,
                                          isTplString: boolean,
                                          resolvedScope: IControlProperties,
                                          decorAttribs: IGeneratorAttrs,
                                          context: IContextCompatible): string {
   if (!(isTplString && Common.isStringModules(tpl))) {
      /*Логический родитель может быть только у VDOM*/
      /*Пока существует возможность вставить XHTML внутрь VDOM этой оптимизации быть не может
       if (preparedScope.internal && preparedScope.internal.logicParent) {
       return tpl;
       }*/

      if (!resolvedScope.hasOwnProperty('enabled')) {
         resolvedScope.enabled = decorAttribs.internal.parentEnabled;
      }

      /**
       * dot уходит в прошлое и если он явно не подключен где-то ранее, то мы даже не будем
       * пытаться считать что в строке у нас может быть dot
       * Например, в чистом коде уже нет xhtml и там dot парсер летит просто так
       */
      // @ts-ignore
      if (typeof doT === 'undefined') {
         return ParserUtilities.buildInnerComponents('' + tpl, resolvedScope, context);
      } else {
         /**
          * Если в строке нет ничего, что похоже на dot,
          * то и не будем преобразовывать строку.
          * Например, из нее удаляются \n
          */
         try {
            // @ts-ignore
            tpl = (tpl && tpl.indexOf && tpl.indexOf('{{') > -1) ? (doT.template(tpl, undefined, undefined, true))(resolvedScope) : tpl.toString();
         } catch (e) {
            tpl = tpl.toString();
         }
         return ParserUtilities.buildInnerComponents(tpl, resolvedScope, context);
      }
   } else {
      return tpl.toString();
   }
}

/**
 * Создаем контекст в совместимости
 * @param ContextConstructor
 * @returns {Function}
 */
function createContextCompatible(ContextConstructor: TContextConstructor<Function>): Function {
   let contextModuleName = ContextConstructor.prototype._moduleName;
   switch (contextModuleName) {
      case 'OnlinePage/Context/UserInfo':
         return new ContextConstructor(window && (window as any).userInfo || {});
      case 'Controls/Container/Scroll/Context':
         return new ContextConstructor({pagingVisible: false});
      default:
         return new ContextConstructor({});
   }
}

/**
 * Решаем надо ли создавать контекст
 * @param controlClass
 * @param currentContext
 * @param control
 * @returns {TContext}
 */
export function resolveContextCompatible(controlClass: IControlClass,
                                         currentContext: TContext | void,
                                         control): TContext {
   if (typeof currentContext === 'undefined') {//Корневая нода. Не может быть контекста
      return {};
   }
   let contextTypes = controlClass.contextTypes ? controlClass.contextTypes() : {};
   let resolvedContext = {};
   if (!contextTypes) {
      Logger.error(`Context types are not defined`, control);
   } else {
      for (let key in contextTypes) {
         if (!(currentContext[key] instanceof contextTypes[key])) {
            resolvedContext[key] = createContextCompatible(contextTypes[key]);
         } else {
            resolvedContext[key] = currentContext[key];
            if (control) {
               resolvedContext[key].registerConsumer(control);
            }
         }
      }
   }
   return resolvedContext;
}
