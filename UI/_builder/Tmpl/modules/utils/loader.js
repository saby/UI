define('UI/_builder/Tmpl/modules/utils/loader', [
   'require',
   'UI/_builder/Tmpl/utils/ErrorHandler',
   'UI/_builder/Tmpl/modules/utils/common',
   'UI/_builder/Tmpl/modules/utils/names',
], function straightFromFileLoader(require, ErrorHandlerLib, common, names) {
   'use strict';

   /**
    * @author Крылов М.А.
    */

   var errorHandler = new ErrorHandlerLib.default();

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
      return new Promise(function(resolve, reject) {
         var templateFn;
         var resolver = common.hasResolver(moduleName, configResolvers);
         if (resolver) {
            resolve(createTemplateNode(moduleName));
         } else if (fromBuilderTmpl) {
            resolve(createTemplateNode(moduleName));
         } else if (require.defined(moduleName)) {
            templateFn = require(moduleName);
            resolve(createTemplateNode(moduleName, templateFn === null));
         } else {
            require([moduleName], function(requiredModule) {
               if (requiredModule || requiredModule === null) {
                  resolve(createTemplateNode(moduleName, requiredModule === null));
               } else {
                  reject(new Error('Не удалось загрузить файл "' + moduleName + '"'));
               }
            }, function(error) {
               reject(error);
            });
         }
      });
   }

   /**
    * Запросить AMD файл.
    * @param moduleName Имя запрашиваемого модуля.
    * @param fromBuilderTmpl Метка, что сборка производится из билдера.
    */
   function requireAmdFile(moduleName, fromBuilderTmpl) {
      return new Promise(function(resolve, reject) {
         if (fromBuilderTmpl) {
            resolve(createControlNode(moduleName));
         } else {
            require([moduleName], function(requiredModule) {
               if (requiredModule) {
                  resolve(createControlNode(moduleName));
               } else {
                  reject(new Error('Не удалось загрузить файл "' + moduleName + '"'));
               }
            }, function(error) {
               reject(error);
            });
         }
      });
   }

   /**
    * Запросить контрол.
    * @param moduleName Имя запрашиваемого модуля.
    * @param fromBuilderTmpl Метка, что сборка производится из билдера.
    */
   function requireWsControlFile(moduleName, fromBuilderTmpl) {
      return new Promise(function(resolve, reject) {
         var control;
         if (fromBuilderTmpl) {
            resolve(createControlNode(moduleName, moduleName));
         } else if (require.defined(moduleName)) {
            control = require(moduleName);
            resolve(createControlNode(moduleName, moduleName, control === null));
         } else {
            require([moduleName], function(requiredModule) {
               if (requiredModule || requiredModule === null) {
                  resolve(createControlNode(moduleName, moduleName, requiredModule === null));
               } else {
                  reject(new Error('Не удалось загрузить файл "' + moduleName + '"'));
               }
            }, function(error) {
               reject(error);
            });
         }
      });
   }

   /**
    * Запросить модуль.
    * @param fullName Полное имя контрола.
    * @param libraryPath Путь к библиотеке, в которой лежит контрол.
    * @param fromBuilderTmpl Метка, что сборка производится из билдера.
    */
   function requireWsModule(fullName, libraryPath, fromBuilderTmpl) {
      return new Promise(function(resolve, reject) {
         if (fromBuilderTmpl || require.defined(libraryPath.library)) {
            resolve(createModuleNode(libraryPath, fullName));
         } else {
            require([libraryPath.library], function(requiredModule) {
               if (requiredModule || requiredModule === null) {
                  resolve(createModuleNode(libraryPath, fullName));
               } else {
                  reject(new Error('Не удалось загрузить файл "' + libraryPath.library + '"'));
               }
            }, function(error) {
               reject(error);
            });
         }
      });
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

      // FIXME: избавиться от .call(this, ...) по шаблонизатору
      var fromBuilderTmpl = this.fromBuilderTmpl;
      var resolver = this.resolver.bind(this);
      var configResolvers = this.config && this.config.resolvers;
      var fileName = this.fileName;

      return requireFile(url, fromBuilderTmpl, resolver, configResolvers)
         .then(function(node) {
            return [node];
         })
         .catch(function(error) {
            errorHandler.error(
               error.message,
               {
                  fileName: fileName
               }
            );
            throw error;
         });
   }

   return straightFromFileAMD;
});
