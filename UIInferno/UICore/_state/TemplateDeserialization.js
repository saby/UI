define('UICore/_state/TemplateDeserialization', ['UICore/_state/FunctionHeaderTemplate'], function(FunctionHeaderTemplate) {
   /**
    * @author Санников К.
    */
   var objectFunctionHeaderTemplate;

   /**
    * Проверить, найденное имя переменной корректное или нет.
    * @param name
    * @returns {boolean}
    */
   function isValidIdentifierName(name) {
      return /^\w+$/.test(name);
   }

   /**
    * Получить шаблон заголовка совместимости.
    * @returns {string} Шаблон заголовка совместимости.
    */
   function getObjectFunctionHeaderTemplate() {
      if (objectFunctionHeaderTemplate === undefined) {
         objectFunctionHeaderTemplate = FunctionHeaderTemplate.default;
         objectFunctionHeaderTemplate = objectFunctionHeaderTemplate ? objectFunctionHeaderTemplate.replace(/\r/g, '') : '';
      }
      return objectFunctionHeaderTemplate;
   }

   /**
    * Разобрать строковое представление функции на аргументы и тело.
    * @param template Строковое представление функции.
    */
   function splitStringFunction(template) {
      var argsStart = template.indexOf('(') + 1;
      var argsEnd = template.indexOf(')', argsStart);
      var stringArgs = template.slice(argsStart, argsEnd);
      var args = stringArgs.split(',');
      var bodyStart = template.indexOf('{') + 1;
      var dodyEnd = template.lastIndexOf('}');
      var body = template.slice(bodyStart, dodyEnd);
      return {
         args: args,
         stringArgs: stringArgs,
         body: body
      };
   }

   /**
    * Создать объект-хранилище всех переменных, участвующих в обработке.
    * @param args Набор параметров функции шаблона.
    */
   function createIdentifiers(args) {
      return {
         data: args[0],
         attr: args[1],
         context: args[2],
         isVdom: args[3],
         sets: args[4],
         thelpers: undefined,
         depsLocal: undefined,
         viewController: undefined
      };
   }

   /**
    * Подставить переменные из параметров функции шаблона.
    * @param compatibilityHeader Заголовок совместимости.
    * @param identifiers Объект-хранилище всех переменных, участвующих в обработке.
    * @returns {string} Модифицированный заголовок совместимости, в случае успеха обработки.
    */
   function processArguments(compatibilityHeader, identifiers) {
      // Выполним замену по параметрам функции: data, attr, context, isVdom, sets
      // В шаблоне реально используются только data и attr.
      return compatibilityHeader
         .replace(/data/g, identifiers.data)
         .replace(/attr/g, identifiers.attr);
   }

   /**
    * Подставить переменную на место thelpers.
    * @param compatibilityHeader Заголовок совместимости.
    * @param identifiers Объект-хранилище всех переменных, участвующих в обработке.
    * @param body Тело исходной функции шаблона.
    * @returns {string} Модифицированный заголовок совместимости, в случае успеха обработки.
    */
   function processTHelpersVar(compatibilityHeader, identifiers, body) {
      // Паттерн: thelpers.templateError("/*#FILE_NAME#*/", e, data);
      // Берем самый последний паттерн, тк имеем место быть вложенным шаблонам.
      var thelpersMatch = body.match(/\w+\.templateError\(/g);
      if (thelpersMatch) {
         var thelpers = thelpersMatch.pop().split('.').shift();
         if (isValidIdentifierName(thelpers)) {
            identifiers.thelpers = thelpers;
            return compatibilityHeader.replace(/thelpers/g, thelpers);
         }
      }
      return compatibilityHeader;
   }

   /**
    * Подставить переменную на место viewController.
    * @param compatibilityHeader Заголовок совместимости.
    * @param identifiers Объект-хранилище всех переменных, участвующих в обработке.
    * @param body Тело исходной функции шаблона.
    * @returns {string} Модифицированный заголовок совместимости, в случае успеха обработки.
    */
   function processViewControllerVar(compatibilityHeader, identifiers, body) {
      var viewController;

      // Паттерн: , "viewController": viewController,
      // Берем самый последний паттерн, тк имеем место быть вложенным шаблонам.
      var viewControllerMatch = body.match(/,\s*['"]?viewController['"]?\s*:\s*\w+\s*,/g);
      if (viewControllerMatch) {
         viewController = viewControllerMatch.pop().split(':').pop().replace(',', '').trim();
         if (isValidIdentifierName(viewController)) {
            identifiers.viewController = viewController;
            return compatibilityHeader.replace(/viewController/g, viewController);
         }
      }

      // Паттерн: ], attr, defCollection, viewController)
      // Берем самый последний паттерн, тк имеем место быть вложенным шаблонам.
      var viewControllerRegex = new RegExp(']\\s*,\\s*' +
         identifiers.attr +
         '\\s*,\\s*\\w+\\s*,\\s*\\w+\\s*\\)', 'g');
      viewControllerMatch = body.match(viewControllerRegex);
      if (viewControllerMatch) {
         viewController = viewControllerMatch.pop().split(',').pop().replace(')', '');
         if (isValidIdentifierName(viewController)) {
            identifiers.viewController = viewController;
            return compatibilityHeader.replace(/viewController/g, viewController);
         }
      }
      return compatibilityHeader;
   }

   /**
    * Подставить переменную на место depsLocal.
    * @param compatibilityHeader Заголовок совместимости.
    * @param identifiers Объект-хранилище всех переменных, участвующих в обработке.
    * @param body Тело исходной функции шаблона.
    * @returns {string} Модифицированный заголовок совместимости, в случае успеха обработки.
    */
   function processDepsLocal(compatibilityHeader, identifiers, body) {
      // Паттерн: , context, depsLocal, includedTemplates, thelpers.config)
      // Берем самый последний паттерн, тк имеем место быть вложенным шаблонам.
      var depsLocal;
      // eslint-disable-next-line no-useless-escape
      var depsLocalRegex = new RegExp(',\\s*' +
         identifiers.context + '\\s*,\\s*\\w+\\s*,\\s*\\w+\\s*,\\s*' +
         identifiers.thelpers + '\\.config\\s*\\)', 'g');
      var depsLocalMatch = body.match(depsLocalRegex);
      if (depsLocalMatch) {
         depsLocal = depsLocalMatch.pop().split(',')[2].trim();
         if (isValidIdentifierName(depsLocal)) {
            identifiers.depsLocal = depsLocal;
            return compatibilityHeader.replace(/depsLocal/g, depsLocal);
         }
      }

      // Второй паттерн: , depsLocal, includedTemplates, thelpers.config,
      // Берем самый последний паттерн, тк имеем место быть вложенным шаблонам.
      depsLocalRegex = new RegExp(',\\s*\\w+\\s*,\\s*\\w+\\s*,\\s*' +
         identifiers.thelpers + '\\.config\\s*,', 'g');
      depsLocalMatch = body.match(depsLocalRegex);
      if (depsLocalMatch) {
         depsLocal = depsLocalMatch.pop().split(',')[1].trim();
         if (isValidIdentifierName(depsLocal)) {
            identifiers.depsLocal = depsLocal;
            return compatibilityHeader.replace(/depsLocal/g, depsLocal);
         }
      }
      return compatibilityHeader;
   }

   /**
    * Восстановить функцию шаблона с заголовком совместимости.
    * @param compatibilityHeader Заголовок совместимости.
    * @param func Разобранная исходная функция.
    * @returns {function|undefined} Функция шаблона в случае успеха, либо undefined.
    */
   function tryCreateFunction(compatibilityHeader, func) {
      try {
         // Если функцию построить не получится, значит это не функция и нужно вернуть строку как было
         // eslint-disable-next-line no-new-func
         var repairedFunction = new Function(func.stringArgs, compatibilityHeader + func.body);

         // Если эта функция - контентная опция внутри заголовка таблицы (например)
         // то там она вызывается от window и уже над Window делаем Object.create в шаблоне
         // на итог - FF ругается, что кто-то трогает объект, который как бы Window,
         // но не Window
         var wrappedFunction = (function(realFunction) {
            return function wrappedRepairedFunction() {
               if (this === window) {
                  return realFunction.apply(undefined, arguments);
               }
               return realFunction.apply(this, arguments);
            };
         })(repairedFunction);

         // Пометим функцию, как ту, что пришла с сервера
         wrappedFunction.fromSerializer = true;
         return wrappedFunction;
      } catch (e) {
         return undefined;
      }
   }

   /**
    * Десериализовать функцию шаблона.
    * @param template Сериализованная функция шаблона.
    * @returns {function|string} Восстановленная функция шаблона, либо исходная строка.
    */
   function deserializeTemplate(template) {
      // Когда с сервера пришла функция отрежем от ее описания первый кусок и
      // создадим функцию из содержимого.
      // Это режим совместимости без легких инстансов
      var func = splitStringFunction(template);

      // Будем хранить в объекте имена всех переменных, с которыми работаем,
      // потому что они востребованны при поиске других переменных.
      var identifiers = createIdentifiers(func.args);

      // FIXME: Вот тут мы влезаем во внутрянку кодогенерации,
      //  шаблон ObjectFunctionHeaderTemplate (ныне head).
      var compatibilityHeader = getObjectFunctionHeaderTemplate();

      // Теперь нужно выполнить замену тех переменных, которые объявлены в заголовке,
      // но используются уже в теле пришедшей функции, которая может быть минифицированной.
      // Это переменные: thelpers, depsLocal, viewController.
      // Может быть такое, что мы не сможем найти соответствующей замены переменной, тогда это значит,
      // что в процессе генерации функции в шаблон не была включена такая инструкция,
      // которая использует такую переменную и ее следует проигнорировать.
      // Идея восстановления такая: мы не знаем точно, какое имя имеет нужная переменная теперь,
      // после минификации, но мы знаем паттерны, где используются известные нам переменные
      // (из параметров функции) рядом с неизвестными (те переменные, которые нам нужны).
      compatibilityHeader = processArguments(compatibilityHeader, identifiers);
      compatibilityHeader = processTHelpersVar(compatibilityHeader, identifiers, func.body);
      compatibilityHeader = processViewControllerVar(compatibilityHeader, identifiers, func.body);
      compatibilityHeader = processDepsLocal(compatibilityHeader, identifiers, func.body);

      var result = tryCreateFunction(compatibilityHeader, func);
      if (result) {
         return result;
      }
      return template;
   }

   return deserializeTemplate;
});
