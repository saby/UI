define('Compiler/modules/utils/loader', [
   'require',
   'Core/Deferred',
   'Compiler/utils/ErrorHandler',
   'Compiler/modules/utils/common',
   'Compiler/modules/utils/names',
], function straightFromFileLoader(require, Deferred, ErrorHandlerLib, common, names) {
   'use strict';

   /**
    * @author Крылов М.А.
    */

   var errorHandler = ErrorHandlerLib.createErrorHandler(true);

   /**
    * Создать служебный узел для контрола.
    * @param moduleName Имя модуля контрола.
    * @param cnstr То же самое имя модуля контрола или undefined.
    * @param optional Метка опциональной зависимости.
    * @returns { object } Служебный узел для контрола.
    */
   function createControlNode(moduleName, cnstr, optional) {
      return {
         type: 'control',
         key: undefined,
         fn: moduleName,
         constructor: cnstr,
         optional: optional
      };
   }

   /**
    * Создать служебный узел для шаблона.
    * @param moduleName Имя модуля шаблона.
    * @param optional Метка опциональной зависимости.
    * @returns { object } Служебный узел для шаблона.
    */
   function createTemplateNode(moduleName, optional) {
      return {
         type: 'template',
         key: undefined,
         fn: moduleName,
         optional: optional
      };
   }

   /**
    * Создать служебный узел для модуля.
    * @param libraryPath Имя библиотеки.
    * @param fullName Полное именование контрола.
    * @returns { object } Служебный узел для модуля.
    */
   function createModuleNode(libraryPath, fullName) {
      return {
         type: 'module',
         key: undefined,
         library: libraryPath.library,
         module: libraryPath.module,
         constructor: fullName
      };
   }

   /**
    * Выполнить запрос опциональной сущности.
    * @param moduleName Имя запрашиваемого модуля.
    * @param fromBuilderTmpl Метка, что сборка производится из билдера.
    * @param configResolvers Хранилище резолверов из конфига.
    */
   function findRequireCallback(moduleName, fromBuilderTmpl, configResolvers) {
      if (names.isControlString(moduleName.split('optional!')[1])) {
         return requireWsControlFile(moduleName, fromBuilderTmpl);
      }
      return requireTemplateFile(moduleName, fromBuilderTmpl, configResolvers);
   }

   /**
    * Запросить шаблон.
    * @param moduleName Имя запрашиваемого модуля.
    * @param fromBuilderTmpl Метка, что сборка производится из билдера.
    * @param configResolvers Хранилище резолверов из конфига.
    */
   function requireTemplateFile(moduleName, fromBuilderTmpl, configResolvers) {
      var templateFn, deferred = new Deferred(),
         resolver = common.hasResolver(moduleName, configResolvers);
      if (resolver) {
         deferred.callback(createTemplateNode(moduleName));
      } else if (fromBuilderTmpl) {
         deferred.callback(createTemplateNode(moduleName));
      } else if (require.defined(moduleName)) {
         templateFn = require(moduleName);
         deferred.callback(createTemplateNode(moduleName, templateFn === null));
      } else {
         require([moduleName], function(requiredModule) {
            if (requiredModule || requiredModule === null) {
               deferred.callback(createTemplateNode(moduleName, requiredModule === null));
            } else {
               deferred.errback(new Error('Не удалось загрузить файл "' + moduleName + '"'));
            }
         }, function(error) {
            deferred.errback(error);
         });
      }
      return deferred;
   }

   /**
    * Запросить AMD файл.
    * @param moduleName Имя запрашиваемого модуля.
    * @param fromBuilderTmpl Метка, что сборка производится из билдера.
    */
   function requireAmdFile(moduleName, fromBuilderTmpl) {
      var deferred = new Deferred();
      if (fromBuilderTmpl) {
         deferred.callback(createControlNode(moduleName));
      } else {
         require([moduleName], function(requiredModule) {
            if (requiredModule) {
               deferred.callback(createControlNode(moduleName));
            } else {
               deferred.errback(new Error('Не удалось загрузить файл "' + moduleName + '"'));
            }
         }, function(error) {
            deferred.errback(error);
         });
      }
      return deferred;
   }

   /**
    * Запросить контрол.
    * @param moduleName Имя запрашиваемого модуля.
    * @param fromBuilderTmpl Метка, что сборка производится из билдера.
    */
   function requireWsControlFile(moduleName, fromBuilderTmpl) {
      var deferred = new Deferred(), control;
      if (fromBuilderTmpl) {
         deferred.callback(createControlNode(moduleName, moduleName));
      } else if (require.defined(moduleName)) {
         control = require(moduleName);
         deferred.callback(createControlNode(moduleName, moduleName, control === null));
      } else {
         require([moduleName], function(requiredModule) {
            if (requiredModule || requiredModule === null) {
               deferred.callback(createControlNode(moduleName, moduleName, requiredModule === null));
            } else {
               deferred.errback(new Error('Не удалось загрузить файл "' + moduleName + '"'));
            }
         }, function(error) {
            deferred.errback(error);
         });
      }
      return deferred;
   }

   /**
    * Запросить модуль.
    * @param fullName Полное имя контрола.
    * @param libraryPath Путь к библиотеке, в которой лежит контрол.
    * @param fromBuilderTmpl Метка, что сборка производится из билдера.
    */
   function requireWsModule(fullName, libraryPath, fromBuilderTmpl) {
      var deferred = new Deferred();
      if (fromBuilderTmpl || require.defined(libraryPath.library)) {
         deferred.callback(createModuleNode(libraryPath, fullName));
      } else {
         require([libraryPath.library], function(requiredModule) {
            if (requiredModule || requiredModule === null) {
               deferred.callback(createModuleNode(libraryPath, fullName));
            } else {
               deferred.errback(new Error('Не удалось загрузить файл "' + libraryPath.library + '"'));
            }
         }, function(error) {
            deferred.errback(error);
         });
      }
      return deferred;
   }

   /**
    * Запросить файл контрола, шаблона или модуля по его url.
    * @param url Данные о запрашиваемом файле.
    * @param fromBuilderTmpl Метка, что сборка производится из билдера.
    * @param resolver Резолвер модулей.
    * @param configResolvers Хранилище резолверов из конфига.
    */
   function requireFile(url, fromBuilderTmpl, resolver, configResolvers) {
      if (url.type === 'ws-control') {
         return requireWsControlFile(url.value, fromBuilderTmpl);
      }
      if (url.type === 'optional') {
         return findRequireCallback(url.value, fromBuilderTmpl, configResolvers);
      }
      if (url.type === 'template') {
         return requireTemplateFile(url.value, fromBuilderTmpl, configResolvers);
      }
      if (url.type === 'ws-module') {
         return requireWsModule(url.value, url.libPath, fromBuilderTmpl);
      }
      return requireAmdFile(resolver(url.value), fromBuilderTmpl);
   }

   /**
    * Запросить сущность.
    * @param url Данные о запрашиваемой сущности.
    */
   function straightFromFileAMD(url) {
      var deferred = new Deferred();

      // FIXME: избавиться от .call(this, ...) по шаблонизатору
      var fromBuilderTmpl = this.fromBuilderTmpl;
      var resolver = this.resolver.bind(this);
      var configResolvers = this.config && this.config.resolvers;
      var fileName = this.fileName;

      requireFile(url, fromBuilderTmpl, resolver, configResolvers).addCallbacks(
         function(node) {
            deferred.callback([node]);
         }, function(error) {
            deferred.errback(error);
            errorHandler.error(
               error.message,
               {
                  fileName: fileName
               }
            );
         }
      );
      return deferred;
   }

   return straightFromFileAMD;
});
