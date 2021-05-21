define('ReactUnitTest/MarkupSpecification/template-engine', [
   'UI/Builder',
   'UI/Executor',
   'UI/Focus'
], function(Builder, Executor, UIFocus) {
   'use strict';

   var Tmpl = Builder.Tmpl;
   var ViewConfig = Builder.Config;

   /**
    * Имя шаблона по умолчанию для тестирования анонимных шаблонов.
    */
   const DEFAULT_TMPL_NAME = 'AnonymousTemplate';

   /**
    * Хранилище имен шаблонов со счетчиком для обеспечения уникальности имени файла в тестировании.
    */
   let TMPL_NAME_STORAGE = { };
   TMPL_NAME_STORAGE[DEFAULT_TMPL_NAME] = 0;

   /**
    * Получить имя шаблона. Для независимой обработки шаблонов необходимо задать уникальное имя.
    * Основная причина: в шаблонизаторе есть использование глобальных переменных, которое может
    * исказить сборку шаблона. А в тестах мы собираем анонимные шаблоны.
    * @param fileName Пришедшее на тестирование, исходное имя шаблона.
    * @returns {string} Уникальное имя шаблона.
    */
   function getTemplateName(fileName) {
      if (!fileName) {
         return `${DEFAULT_TMPL_NAME}N${++TMPL_NAME_STORAGE[DEFAULT_TMPL_NAME]}`;
      }
      if (TMPL_NAME_STORAGE.hasOwnProperty(fileName)) {
         TMPL_NAME_STORAGE[fileName] = 0;
         return `${fileName}N${++TMPL_NAME_STORAGE[fileName]}`;
      }
      return fileName;
   }

   /**
    * Получить конфигурацию сборки шаблона
    * @param fileName Имя файла шаблона.
    * @param userConfig Пришедшая на тестирование, исходная конфигурация сборки.
    */
   function getBuildConfig(fileName, userConfig) {
      const uniqueFileName = getTemplateName(fileName);
      let validated = userConfig || { };
      return Object.assign({
         config: ViewConfig,
         fileName: uniqueFileName,
         componentsProperties: { },
         fromBuilderTmpl: false,
         createResultDictionary: false
      }, validated);
   }

   /**
    * Получить конфигурацию запуска шаблона.
    * @param userConfig Пришедная на тестирование, исходная конфигурация запуска шаблона.
    */
   function getExecutionConfig(userConfig) {
      return {
         scope: userConfig.self || undefined,
         data: userConfig.data || {},
         attr: userConfig.attr || {},
         isVdom: !!userConfig.isVdom,
         sets: userConfig.sets || Executor.TClosure,
         forceCompatible: undefined,
         generatorConfig: {
            prepareAttrsForPartial: function prepareAttrsForPartial(attributes) {
               return UIFocus._FocusAttrs.prepareAttrsForFocus(attributes.attributes);
            }
         }
      };
   }

   /**
    * Выполнить шаблон с соответствующей конфигурацией.
    * @param template Функция шаблона.
    * @param executionConfig Конфигурация.
    * @returns {Promise} Promise как результат выполнения.
    */
   function executeTemplate(template, executionConfig) {
      return template.call(
         executionConfig.scope,
         executionConfig.data,
         executionConfig.attr,
         executionConfig.context,
         executionConfig.isVdom,
         executionConfig.sets,
         executionConfig.forceCompatible,
         executionConfig.generatorConfig
      );
   }

   /**
    * Получить модуль локализации.
    * Файлу Module/Abc/template.wml соответствует модуль i18n!Module.
    * @param fileName Имя файла или путь к файлу.
    * @returns {string} Модуль локализации для require.
    */
   function getLocalizationModule(fileName) {
      return 'i18n!' + fileName.split('.').shift().split('/').shift();
   }

   /**
    * Получить массив зависимостей локализации.
    * @param fileName Имя файла или путь к файлу.
    * @returns {string[]} Массив зависимостей локализации.
    */
   function getLocalizationDependencies(fileName) {
      // FIXME: в шаблонизатор вшито fileName: 'userTemplate'.
      //  Нужно избавиться от этого в шаблонизаторе, потом убрать отсюда.
      return [
         getLocalizationModule(fileName),
         'i18n!userTemplate'
      ];
   }

   /**
    * Необходимый резолвер для шаблонизатора.
    * FIXME: убрать после отделения совместимости.
    * @param path Путь к сущности внутри шаблона.
    * @returns {string} Разрешенная зависимость для сущности.
    */
   function resolverControls(path) {
      return 'tmpl!' + path;
   }

   /**
    * Сейчас вид выхода функции template зависит от флага createResultDictionary.
    * Если флаг поднят, то возвратится объект, иначе массив.
    * Приведем выход к одному виду. После исправления в ядре - удалить эту функцию.
    * FIXME: удалить после выделения четкого API шаблонизатора.
    * @param traversed Результат разбора шаблона.
    * @param dependencies Набор зависимостей шаблона.
    * @param buildConfig Объект конфигурации шаблонизатора.
    * @returns Исправленный результат разбора шаблона.
    */
   function fixAstResult(traversed, dependencies, buildConfig) {
      if (Array.isArray(traversed)) {
         return {
            ast: traversed,
            dependencies: dependencies,
            words: [],
            fileName: buildConfig.fileName,
            reactiveProperties: traversed.reactiveProps,
            buildConfig: buildConfig
         };
      }
      return {
         ast: traversed.astResult,
         dependencies: dependencies,
         words: traversed.words,
         fileName: buildConfig.fileName,
         reactiveProperties: traversed.astResult.reactiveProps,
         buildConfig: buildConfig
      };
   }

   /**
    * Исполнение функции шаблона может вернуть Promise, строку или дерево.
    * Разрешим эту ситуацию, возвращая только строку или дерево.
    * @param markup Результат исполнения функции шаблона.
    * @returns {Promise} Promise, который возвращает строку или дерево.
    */
   function resolveMarkupPromise(markup) {
      return new Promise(function(resolve, reject) {
         if (markup && markup.addCallbacks) {
            markup.addCallbacks(function(resolvedMarkup) {
               resolve(resolvedMarkup);
            }, function(error) {
               reject(error);
            });
         } else {
            resolve(markup);
         }
      });
   }

   function buildAST(html, buildConfig) {
      return new Promise(function(resolve, reject) {
         try {
            // Парсим шаблон и строим ast-дерево и набор зависимостей (этап анализа)
            const tmpl = Tmpl.template(html, resolverControls, buildConfig);
            tmpl.handle(function(traversedRaw) {
               let traversed = fixAstResult(traversedRaw, tmpl.dependencies, buildConfig);
               resolve(traversed);
            }, function(error) {
               reject(error);
            });
         } catch (error) {
            reject(error);
         }
      });
   }

   function buildMarkup(html, buildConfig, executionConfig) {
      return new Promise(function(resolve, reject) {
         require(getLocalizationDependencies(buildConfig.fileName), function() {
            buildAST(html, buildConfig)
               .then(function(traversed) {
                  try {
                     let template = Tmpl.func(traversed.ast, buildConfig);
                     let rawMarkup = executeTemplate(template, executionConfig);
                     let result = {
                        rawMarkup: rawMarkup,
                        template: template,
                        dependencies: traversed.dependencies,
                        executionConfig: executionConfig
                     };
                     resolveMarkupPromise(rawMarkup)
                        .then(function(resolvedMarkup) {
                           result.markup = resolvedMarkup;
                           result.tree = resolvedMarkup;
                           resolve(result);
                        });
                  } catch (error) {
                     reject(error);
                  }
               })
               .catch(function(error) {
                  reject(error);
               });
         });
      });
   }

   function getAST(html, userBuildConfig, fileName) {
      const buildConfig = getBuildConfig(fileName, userBuildConfig);
      return buildAST(html, buildConfig);
   }

   function getMarkup(html, userBuildConfig, userExecutionConfig, fileName) {
      const buildConfig = getBuildConfig(fileName, userBuildConfig);
      const executionConfig = getExecutionConfig(userExecutionConfig);
      return buildMarkup(html, buildConfig, executionConfig);
   }

   return {
      getAST: getAST,
      getMarkup: getMarkup
   };
});
