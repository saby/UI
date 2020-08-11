/// <amd-module name="UI/_executor/_Utils/Compatible" />
/* tslint:disable */

// @ts-ignore
import * as shallowClone from 'Core/helpers/Function/shallowClone';
// @ts-ignore
import * as needToBeCompatible from 'Core/helpers/Hcontrol/needToBeCompatible';
// @ts-ignore
import { IoC, constants } from 'Env/Env';
// @ts-ignore
import { Logger }  from 'UI/Utils';

import { resolveOptions, getDefaultOptions } from './OptionsResolver';
import RawMarkupNode from '../_Expressions/RawMarkupNode';

/**
 * Создает объект с объединенными (прикладными и служебными опциями)
 * @param {Object} userOptions Прикладные опции
 * @param {Object} internalOptions Служебные опции
 * @returns {Object} Объединенные опции
 */
export function createCombinedOptions(userOptions, internalOptions) {
   var i, res = shallowClone(userOptions);
   for (i in internalOptions) {
      // не включаем переменные dirty-checking'а в объединенные опции
      if (internalOptions.hasOwnProperty(i) && i.toString().indexOf('__dirtyCheckingVars_') === -1) {
         res[i] = internalOptions[i];
      }
   }
   return res;
}

/**
 * Объединяет прикладные и служебные опции компонента, если это необходимо.
 * (Например для compound-контрола)
 * @param module Модуль контрола
 * @param userOptions Прикладные опции
 * @param internalOptions Служебные опции
 * @returns {*} Правильные опции компонента
 */
export function combineOptionsIfCompatible(module, userOptions, internalOptions) {
   var res;

   if (module.$constructor) {
      res = createCombinedOptions(userOptions, internalOptions);
   } else if (internalOptions && internalOptions.logicParent) {
      //Если нет $constructor и есть логический родитель, значит vdom внутри vdom
      res = userOptions;
      res._logicParent = internalOptions.logicParent;
      res._isSeparatedOptions = true;
   } else {
      // Добавляем флаг о том, что опции были разделены (необходимо для правильной
      // инициализации внутри BaseCompatible
      res = createCombinedOptions(userOptions, { _isSeparatedOptions: true });
   }

   return res;
}

/**
 * Создает инстанс компонента, учитывая возможную необходимость объединения опций (compatible, compound)
 * @param cnstr Конструктор компонента
 * @param {Object} userOptions Прикладные опции
 * @param {Object} internalOptions Служебные опции
 */
export function createInstanceCompatible(cnstr, userOptions, internalOptions) {
   internalOptions = internalOptions || {};

   var
      actualOptions = combineOptionsIfCompatible(cnstr.prototype, userOptions, internalOptions),
      inst,
      restoreOptions,
      coreControl,
      parentName = internalOptions.logicParent && internalOptions.logicParent._moduleName;

   var defaultOpts = getDefaultOptions(cnstr);
   resolveOptions(cnstr, defaultOpts, actualOptions, parentName);

   try {
      inst = new cnstr(actualOptions);
   } catch (error) {
      // @ts-ignore
      coreControl = require('Core/Control');
      inst = new coreControl();
      Logger.lifeError('constructor', cnstr.prototype, error);
   }
   if (needToBeCompatible(internalOptions.parent) || internalOptions.iWantBeWS3) {
      // @ts-ignore
      const makeInstanceCompatible = require('Core/helpers/Hcontrol/makeInstanceCompatible');
      makeInstanceCompatible(inst);
   }

   /*Здесь родитель может быть CompoundControl*/
   if (internalOptions.logicParent && internalOptions.logicParent._children && userOptions.name) {
      internalOptions.logicParent._children[userOptions.name] = inst;

   }
   // Возвращаем опции назад, т.к. нужно еще с ними взаимодействовать
   if (inst.isCompatibleLayout && !inst.isCompatibleLayout() && inst.iWantVDOM !== false) {
      restoreOptions = inst._options;
      if (inst._savedOptions) {
         inst._options = inst._savedOptions;
      } else {
         inst._options = actualOptions;
      }
   } else {
      //Если вдруг опции не установлены - надо туда установить объект, чтобы в логах было что-то человекопонятное
      if (!inst._options) {
         inst._options = actualOptions;
      }
   }

   if (constants.compat) {
      inst._setInternalOptions(internalOptions);
   }

   // Убираем опции, т.к. они должны отсутствовать _beforeUpdate
   if (inst.isCompatibleLayout && !inst.isCompatibleLayout() && inst.iWantVDOM !== false) {
      inst._savedOptions = inst._options;
      inst._options = restoreOptions;
   } else if (inst._dotTplFn || inst.iWantVDOM === false) {
      actualOptions = inst._options;
   }
   return {
      instance: inst,
      resolvedOptions: actualOptions,
      defaultOptions: defaultOpts
   };
}

/**
 * Создает виртуальную ноду для compound контрола
 * @param controlClass Класс compound-контрола
 * @param controlCnstr Конструктор compound-контрола
 * @param childrenNodes Массив вложеных в контрол virtual-нод
 * @param userOptions Прикладные опции
 * @param internalOptions Служебные опции
 * @param key Ключ
 * @param parentNode Родительская нода
 * @param virtualNode
 * @param markupGenerator Генератор верстки компонента
 * @returns {Object} Возвращает виртуальную ноду
 */
export function createCompoundControlNode(controlClass, controlCnstr, childrenNodes, userOptions, internalOptions, key, parentNode, virtualNode, markupGenerator) {
   var
      _deps = {},
      moduleName = controlClass.prototype && controlClass.prototype._moduleName,
      markup;

   // Compound-контрол для работы с vdom держит у себя информацию о своей vdom-ноде
   userOptions.__vdomOptions = { controlNode: virtualNode };

   _deps[moduleName] = controlClass; // добавляем компонент в объект зависимостей и строим верстку компонента
   markup = markupGenerator.createWsControl('ws:' + moduleName, userOptions,
      {
         internal: virtualNode.controlInternalProperties, // служебные опции контрола
         attributes: virtualNode.controlAttributes,
         events: virtualNode.controlEvents,
         key: virtualNode.key,
         context: virtualNode.context,
         inheritOptions: virtualNode.inheritOptions
      }, undefined, _deps);


   if (!markup) {
      markup = "<span>Markup for component " + moduleName + " was not generated</span>";
   }
   if (!constants.compat) {
      Logger.templateError('Building component - CompoundControl detected.', moduleName);
   }

   if (typeof window !== 'undefined') {
      const parentControl = parentNode && parentNode.control;
      const parentName = parentControl && parentControl._moduleName;
      const currentIsOld = controlClass.prototype && controlClass.prototype._dotTplFn;
      const parentIsNew = parentControl && parentControl._template;
      // нужно использовать слой совместимости во избежание возможных ошибок
      if (currentIsOld && parentIsNew && parentName !== 'Core/CompoundContainer') {
         Logger.warn('В контроле ' + parentNode.control._moduleName +
            ' используется ws3-контрол ' + moduleName + ' без слоя совместимости ' +
            'Core/CompoundContainer! https://wi.sbis.ru/doc/platform/developmentapl/ws3/compound-wasaby/', moduleName);
      }
   }

   // markup contains raw html string because of compatibility. VDOM will insert it as is.
   var markupNode = new RawMarkupNode(markup, virtualNode.controlAttributes, moduleName, virtualNode.key);

   return {
      control: controlClass,
      controlClass: controlCnstr,
      options: createCombinedOptions(userOptions, internalOptions),
      id: undefined,
      parent: parentNode,
      key: key,
      element: undefined,
      markup: markupNode,
      fullMarkup: markupNode,
      childrenNodes: childrenNodes,
      compound: true
   };
}
