define('UI/_builder/Tmpl', [
   'UI/_builder/Tmpl/core/bridge',
   'UI/_builder/Tmpl/utils/ErrorHandler',
   'UI/_builder/Tmpl/modules/utils/common',
   'UI/_builder/Tmpl/codegen/bridge',
   'UI/_builder/Tmpl/codegen/templates',
   'UI/_builder/utils/ModulePath',
   'UI/_builder/Tmpl/html/Parser',
   'UI/_builder/Tmpl/core/Tags',
   'UI/_builder/Tmpl/core/_deprecated/ComponentCollector'
], function(
   traversing,
   ErrorHandlerLib,
   utils,
   codegenBridge,
   templates,
   ModulePathLib,
   Parser,
   Tags,
   ComponentCollector
) {
   'use strict';

   /**
    * @description Точка входа в шаблонизатор.
    * @deprecated
    * @author Крылов М.А.
    */

   var errorHandler = ErrorHandlerLib.createErrorHandler(true);
   var ModulePath = ModulePathLib.ModulePath;
   var EMPTY_STRING = '';

   /**
    * Проверить, является ли данный файл Wasaby-шаблоном по его расширению.
    * @param fileName Полный путь файла, включая расширение.
    * @returns {boolean} True, если данный файл имеет расширение wml.
    */
   function isWml(fileName) {
      return /\.wml$/gi.test(fileName);
   }

   /**
    * Предобработать исходный текст шаблон.
    * FIXME: почему-то здесь удаляются пробелы и переходы на новую строку.
    *  Этого быть не должно здесь - мешает анализу.
    * @param html Исходный текст шаблона.
    * @param config Конфигурация сборки шаблона, содержащая fileName и isWasabyTemplate.
    * @returns {string} Предобработанный текст шаблона.
    */
   function preprocessHtml(html, config) {
      if (isWml(config.fileName) || config.isWasabyTemplate) {
         // FIXME: очень плохая и неадекватная предобработка шаблона.
         //  Обработкой \n, \t, \r, \s должен заниматься парсер, тк он владеет контекстом.
         return html
            .replace(/>[\s]*[\n\r][\s]*/ig, '>')
            .replace(/[\s]*[\n\r][\s]*</ig, '<')
            .replace(/[\n\r]</ig, '<')
            .replace(/[\n\r]</ig, '<')
            .replace(/>[\n\r]/ig, '>')
            .replace(/>[\n\r]/ig, '>');
      }
      return html;
   }

   /**
    * Выполнить анализ шаблона.
    * @param html Исходный текст шаблона.
    * @param resolver Резолвер контролов для шаблона с заданным расширением.
    * @param config Конфигурация сборки.
    * @returns {{handle: function, dependencies: string[]}} Возвращает объект с набором зависимостей и
    * функцией handle для продолжения анализа и синтеза.
    */
   function template(html, resolver, config) {
      var parsed, parsingError, currentHtml;
      var errorHandlerLocal = ErrorHandlerLib.createErrorHandler(!config.fromBuilderTmpl);

      // FIXME: удалить, когда точно будут известны клиенты шаблонизатора.
      config.fileName = config.fileName || config.filename;
      try {
         currentHtml = preprocessHtml(html, config);
         parsed = Parser.parse(currentHtml, config.fileName, {
            xml: true,
            allowComments: true,
            allowCDATA: true,
            compatibleTreeStructure: true,
            rudeWhiteSpaceCleaning: true,
            normalizeLineFeed: true,
            cleanWhiteSpaces: true,
            needPreprocess: !!config.isWasabyTemplate,
            tagDescriptor: Tags.default,
            errorHandler: errorHandlerLocal
         });
         var hasFailures = errorHandlerLocal.hasFailures();
         var lastMessage = errorHandlerLocal.popLastErrorMessage();
         errorHandlerLocal.flush();
         if (hasFailures) {
            throw new Error(lastMessage);
         }
      } catch (error) {
         parsingError = error;
      }
      return {
         dependencies: ComponentCollector.getDependencies(parsed, parsingError),
         handle: function handleTraverse(success, broke) {
            if (parsingError) {
               broke(parsingError);
            } else {
               traversing.traverse(parsed, resolver, config).addCallbacks(success, broke);
            }
         }
      };
   }

   /**
    * Получить функцию шаблона.
    * @param ast Абстрактное синтаксическое дерево.
    * @param config Конфигурация сборки.
    * @returns {function} Функция шаблона, либо функция-пустышка в случае ошибки разбора.
    */
   function func(ast, config) {
      var functionResult;

      // FIXME: удалить, когда точно будут известны клиенты шаблонизатора.
      config.fileName = config.fileName || config.filename;
      functionResult = codegenBridge.getFunction(ast, null, config, null);
      functionResult.reactiveProps = ast.reactiveProps;
      return functionResult;
   }

   /**
    * Обработчик ошибок по умолчанию. Вывести ошибку с помощью логгера.
    * @param error Объект ошибки.
    */
   function defaultErrorback(error) {
      errorHandler.critical(
         'Ошибка при парсинге шаблона: ' + error.message,
         {
            fileName: null
         }
      );
   }

   /**
    * Получить резолвер контролов для шаблона с заданным расширением.
    * @param extension Расширение текущего шаблона.
    * @returns {function(path: string): string} Резолвер контролов для шаблона с заданным расширением.
    */
   function getResolverControls(extension) {
      return function resolverControls(path) {
         return extension + '!' + path;
      };
   }

   /**
    * Выполнить сборку шаблона wml.
    * @param html Исходный текст шаблона.
    * @param config Конфигурация сборки.
    * @param successCallback Callback при успешном завершении сборки шаблона. Передает собранный текст шаблона.
    * @param failureCallback Callback при неудачном завершении сборки шаблона. Передает ошибку.
    * @param ext Расширение файла шаблона.
    */
   function getFile(html, config, successCallback, failureCallback, ext) {
      var currentExt = ext || 'tmpl';
      var currentErrback = failureCallback || defaultErrorback;
      var tmplFunc = null;
      config.isWasabyTemplate = 'wml' === currentExt;

      // FIXME: удалить, когда точно будут известны клиенты шаблонизатора.
      config.fileName = config.fileName || config.filename;

      template(html, getResolverControls(currentExt), config).handle(function(traversed) {
         try {
            codegenBridge.initWorkspaceWML(traversed.templateNames);
            tmplFunc = func(traversed, config);
            if (!tmplFunc) {
               errorHandler.critical(
                  'Шаблон не может быть построен. Не загружены зависимости.',
                  {
                     fileName: config.fileName
                  }
               );
            }
            var moduleName = ModulePath.replaceWsModule(config.fileName).replace(/\.(wml|tmpl)$/gi, EMPTY_STRING);
            var deps = getComponents(html);
            var finalFile = templates.generateDefine(moduleName, ext, tmplFunc, deps, traversed.reactiveProps);
            finalFile = templates.clearSourceFromDeprecated(finalFile);

            successCallback(finalFile);
         } catch (error) {
            currentErrback(error);
         } finally {
            codegenBridge.cleanWorkspace();
         }
      }, currentErrback);
   }

   /**
    * Получить набор компонентов для текущего шаблона.
    * @param html Исходный текст шаблона.
    * @param config Конфигурация сборки.
    * @returns {*}
    */
   function getComponents(html, config) {
      var errorHandlerLocal = ErrorHandlerLib.createErrorHandler(config && !config.fromBuilderTmpl);
      var parsed = Parser.parse(html, (config && config.fileName), {
         xml: true,
         allowComments: true,
         allowCDATA: true,
         compatibleTreeStructure: true,
         rudeWhiteSpaceCleaning: true,
         normalizeLineFeed: true,
         cleanWhiteSpaces: true,
         needPreprocess: !!(config && config.isWasabyTemplate),
         tagDescriptor: Tags.default,
         errorHandler: errorHandlerLocal
      });
      var hasFailures = errorHandlerLocal.hasFailures();
      var lastMessage = errorHandlerLocal.popLastErrorMessage();
      errorHandlerLocal.flush();
      if (hasFailures) {
         throw new Error(lastMessage);
      }
      if (config) {
         // FIXME: плохо так передавать конфиг
         traversing.config = config;

         // FIXME: удалить, когда точно будут известны клиенты шаблонизатора.
         config.fileName = config.fileName || config.filename;
      }
      return ComponentCollector.getComponents(parsed);
   }

   /**
    * Функция восстанавливающая верный порядок аргументов сериализованного шаблона (совместимость).
    * Получить набор параметров для вызова tmpl функции шаблона с аргументами wml функции шаблона.
    * @returns {unknown[]} Набор аргументов для вызова функции tmpl шаблона.
    */
   function addArgumentsConfig() {
      var args = Array.prototype.slice.call(arguments);
      return utils.addArgument(args[0], args.slice(1));
   }

   /**
    * Получить функцию шаблона (для тестирования).
    * @param html Исходный текст шаблона.
    * @param configModule Внутренняя конфигурация сборки (UI/BuilderConfig:Config).
    * @param runner Исполнитель шаблонов (TClosure, как правило).
    * @returns {function} Совместимая с wml функция шаблона.
    */
   function getFunction(html, configModule, runner) {
      var compatibleFunction = null;
      var currentConfig = {
         config: configModule,
         fileName: 'userTemplate',
         isWasabyTemplate: false
      };
      template(html, getResolverControls('tmpl'), currentConfig).handle(function(traversed) {
         var templateFunction;
         try {
            codegenBridge.initWorkspaceTMPL(traversed.templateNames);
            templateFunction = func(traversed, currentConfig);
            templateFunction.stable = true;
            compatibleFunction = function compatibleTemplate() {
               return templateFunction.apply(this, utils.addArgument(runner, arguments));
            };
            compatibleFunction.toJSON = function toJSON() {
               return html;
            };
            compatibleFunction.reactiveProps = traversed.reactiveProps;
         } catch (error) {
            defaultErrorback(error);
         } finally {
            codegenBridge.cleanWorkspace();
         }
         if (!compatibleFunction) {
            errorHandler.critical(
               'Шаблон не может быть построен. Не загружены зависимости.',
               {
                  fileName: '<userTemplate>'
               }
            );
         }
      }, defaultErrorback);
      return compatibleFunction;
   }

   /**
    * Сгенерировать шаблонную функцию в режиме jit.
    * @param ast AST-дерево
    * @param config Конфигурация
    * @returns {Function} Шаблонная функция
    */
   function outerFunc(ast, config) {
      try {
         codegenBridge.initWorkspaceTMPL(ast.templateNames);
         return func(ast, config);
      } finally {
         codegenBridge.cleanWorkspace();
      }
   }

   return {
      template: template,
      func: outerFunc,
      getFile: getFile,
      getComponents: getComponents,
      addArgument: utils.addArgument,
      addArgumentsConfig: addArgumentsConfig,
      getFunction: getFunction
   };
});
