define('UICore/_state/Serializer', [
   'require',
   'UI/Utils',
   'Env/Env',
   'UICore/_state/TemplateDeserialization',
   'WasabyLoader/Library'
], function(
   require,
   Utils,
   Env,
   deserializeTemplate,
   Library
) {
   /**
    * @author Санников К.
    */

   var typesDi;

   function getTypesDi() {
      if (!typesDi && require.defined('Types/di')) {
         typesDi = require('Types/di');
      }
      return typesDi;
   }

   function getModuleFromLoader(name, loader, di) {
      var module;

      // Try to use Types/di because it's way too much faster
      if (di && di.isInstantiable && di.isInstantiable(name) === false) {
         module = di.resolve(name);

         // Check if that is a constructor
         if (module && !module.prototype) {
            module = undefined;
         }
      }

      // Use RequireJS if not registered in Types/di
      if (!module) {
         var parts = Library.parse(name);

         module = loader(parts.name);
         if (!module) {
            throw new Error('The module "' + parts.name + '" is not loaded yet. Please make sure it\'s included into application dependencies.');
         }
         if (module.__esModule && module.default) {
            module = module.default;
         }

         parts.path.forEach(function(element, index) {
            if (!(element in module)) {
               throw new Error(
                  'The module "' + parts.name + '" doesn\'t export element "' + element +
                  '" which suppose to be found within path "'+ parts.path.join('.') + '" at position ' + index + '.'
               );
            }
            module = module[element];
         });
      }

      if (!module.prototype) {
         throw new Error('The module "' + name + '" is not a class constructor.');
      }
      if (typeof module.fromJSON !== 'function' && typeof module.prototype.fromJSON !== 'function') {
         throw new Error('The class "' + name + '" doesn\'t have fromJSON() method.');
      }

      return module;
   }

   var Serializer = function(storage, isServerSide) {
      this.loader = require;
      this._functionStorage = [];
      this._instanceStorage = {};
      this._linksStorage = {};
      this._depsStorage = {};
      this._unresolvedLinks = [];
      this._unresolvedInstances = [];
      this._unresolvedInstancesId = [];
      this._isServerSide = isServerSide;
      if (storage) {
         if (typeof storage === 'object') {
            this._instanceStorage = storage;
         } else {
            throw new Error('Storage must be a object');
         }
      }
      this.serialize = Serializer.serializeWith(this);
      this.serializeStrict = Serializer.serializeWith(this, true);
      this.deserialize = Serializer.deserializeWith(this);
   };

   /**
    * @member {Function} Загрузчик модулей с API RequireJS
    * @public
    */
   Serializer.prototype.loader = null;

   /**
    * @member {Object} Загрузчик модулей с API Types/di
    * @public
    */
   Object.defineProperty(Serializer.prototype, 'di', {
      get: function() {
         return this._di || getTypesDi();
      },
      set: function(value) {
         this._di = value;
      }
   });

   /**
    * @member {Array.<Function>} Хранилище функций
    */
   Serializer.prototype._functionStorage = null;

   /**
    * @member {Object.<Number, Object>} Хранилище инстансов
    */
   Serializer.prototype._instanceStorage = null;

   /**
    * @member {Object.<Number, Object>} Хранилище ссылок на повторяющиеся инстансы (уже сериализованные)
    */
   Serializer.prototype._linksStorage = null;

   /**
    * @member {Object.<Number, Object>} Хранилище ссылок на произвольные модули
    */
   Serializer.prototype._depsStorage = null;

   /**
    * @member {Array.<Object>} Хранилище неразрешенных ссылок на инстансы
    */
   Serializer.prototype._unresolvedLinks = null;

   /**
    * @member {Array.<Object>} Хранилище сериализованных инстансов
    */
   Serializer.prototype._unresolvedInstances = null;

   /**
    * @member {Array.<Number>} Хранилище идентификаторов сериализованных инстансов
    */
   Serializer.prototype._unresolvedInstancesId = null;

   /**
    * @member {Object.<String, RegExp>} Сигнатуры результатов сериализации через метод toJSON для стандартных JS-объектов
    */
   Serializer.prototype._patterns = {
      'Date': /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:[0-9\.]+Z$/,
      'Function': /^TEMPLATEFUNCTOJSON=functio\S\s*\w+/
   };

   /**
    * Сериалайзер - обеспечивает возможность сериализовать и десериализовать специальные типы
    * @class
    * @name UICore/_state/Serializer
    * @public
    * @author Санников К.
    */

   //FIXME: загшушки для совместимости со старым API
   Serializer.prototype.setDetectContainers = function() {};
   Serializer.prototype.isDetectContainers = function() {};

   /**
    * Replacer для использования в JSON.stringify(value[, replacer]).
    * @param {String} name Название сериализуемого свойства
    * @param {*} value Значение сериализуемого свойства
    * @returns {*}
    * @function
    * @name UICore/_state/Serializer#serialize
    */
   Serializer.prototype.serialize = function(name, value) {};

   /**
    *
    * @param self
    * @param {Boolean} [throwable=false] выбрасывать исключения при ошибках сериализации
    * @returns {Function}
    * @function
    * @name UICore/_state/Serializer#serializeWith
    */
   Serializer.serializeWith = function(self, throwable) {
      return function (name, value) {
         var
            isObject = value && typeof value === 'object',
            plainObject = isObject && Utils.ObjectUtils.isPlainObject(value);

         if (isObject && !Array.isArray(value) && !plainObject) {
            if (self._isServerSide) {
               return;
            }

            var key = Utils.NumberUtils.randomId();
            self._instanceStorage[key] = value;
            return {
               $serialized$: 'inst',
               id: key
            };
         } else if (typeof value === 'function') {
            if (self._isServerSide) {
               //Не нужна только ошибка. Но и сериализовать не надо
               //Ранее убирали ошибки сериализации функций, поскольку есть преценденты, когда избавиться от этого невозможно
               //Наприер, ListView передает хелперы в шаблон, а там создается контрол со Scope={{...}}
               //Не нужно сериализолвать функции, но и не нужно писать ошибку
               return;
            }
            self._functionStorage.push(value);
            var result = {
               $serialized$: 'func',
               id: self._functionStorage.length - 1
            };
            if (!value._moduleName && !!throwable) {
               throw new Error('Невозможно сериализовать функцию ' + value.toString());
            }
            if (!value._moduleName) {
               return result;
            }
            if (value._moduleName.indexOf(':') > -1) {
               var splitName = value._moduleName.split(':');
               result.module = splitName[0];
               result.path = splitName[1];
            } else {
               result.module = value._moduleName;
            }
            return result;
         } else if (value === Infinity) {
            return {
               $serialized$: '+inf'
            };
         } else if (value === -Infinity) {
            return {
               $serialized$: '-inf'
            };
         }
         else if (value === undefined) {
            return {
               $serialized$: 'undef'
            };
         }
         else if (typeof value === 'number' && isNaN(value)) {
            return {
               $serialized$: 'NaN'
            };
         }
         else if (!isNaN(Number(name)) && Number(name) >= 0 && value === undefined) {
            // В массивах позволяем передавать undefined
            return {
               $serialized$: 'undef'
            };
         }
         else {
            if (isObject) {
               if (value['$serialized$'] === 'func') {
                  self._depsStorage[value.module] = true;
               }
            }
            return self._serializeLink(value);
         }
      };
   };

   /**
    * Reviver для использования в JSON.parse(text[, reviver]).
    * @param {String} name Название десериализуемого свойства
    * @param {*} value Значение десериализуемого свойства
    * @returns {*}
    * @function
    * @name UICore/_state/Serializer#deserialize
    */
   Serializer.prototype.deserialize = function(name, value) {};

   /**
    *
    * @param self
    * @returns {Function}
    * @function
    * @name UICore/_state/Serializer#deserializeWith
    */
   Serializer.deserializeWith = function(self) {
      return function (name, value) {
         var result = value;
         var isObject = value instanceof Object;

         if (isObject && value.hasOwnProperty('$serialized$')) {
            switch (value.$serialized$) {
               case 'func':
                  if (typeof value.id === 'number' && self._functionStorage[value.id]) {
                     result = self._functionStorage[value.id];
                  } else if (!value.module) {
                     result = function() {
                        Env.IoC.resolve('ILogger').warn('UICore/State:Serializer',
                           'Попытка вызвать на клиенте функцию (название "' + name + '"), которая была сериализована на сервере и которая ' +
                           'не является частью какого-либо модуля. То есть к этой функции нет прямого доступа на клиенте. ' +
                           'Подробнее тут https://wi.sbis.ru/doc/platform/developmentapl/interface-development/pattern-and-practice/serialization/');
                     };
                     Env.IoC.resolve('ILogger').warn('UICore/State:Serializer',
                        'Попытка десереализовать на клиенте функцию (название "' + name + '"), которая была сериализована на сервере и которая ' +
                        'не является частью какого-либо модуля. То есть к этой функции нет прямого доступа на клиенте. ' +
                        'Подробнее тут https://wi.sbis.ru/doc/platform/developmentapl/interface-development/pattern-and-practice/serialization/');
                  } else {
                     var
                        declaration = value.module + (value.path ? ':' + value.path : ''),
                        module, paths, p;
                     try {
                        // Сперва попробуем загрузить модуль.
                        // requirejs.defined здес НЕ помогает (Сюрприз!)
                        // Контрольный пример: define('x', function(){}); requirejs.defined('x') -> false
                        module = self.loader(value.module);
                     } catch (e) {
                        // Если модуля нет - результатом будет исходная декларация модуля
                        // result установится в ветке else, которая ниже - метка (*).
                        Env.IoC.resolve('ILogger').warn('UICore/State:Serializer',
                            'Попытка десериализовать на клиенте модуль (название "' + declaration + '"), ' +
                            'который предварительно не загружен.');
                     }

                     if (module) {
                        // Если модуль загрузили
                        try {
                           // Ищем внутренности
                           result = module;
                           if (value.path) {
                              paths = value.path.split('.');
                              while ((p = paths.shift())) {
                                 // try/catch нам тут нужен если указали кривой путь
                                 result = result[p];
                              }
                           }
                        }
                        catch (e) {
                           throw new Error('Parsing function declaration "' + declaration + '" failed. Original message: ' + e.message);
                        }

                        if (typeof result !== 'function') {
                           throw new Error('Can`t transform "' + declaration + '" declaration to function');
                        } else {
                           result.wsHandlerPath = declaration;
                        }
                     } else {
                        // (*) На сервере на node.js второй вызов requirejs от незагруженного модуля даёт не исключение, а undefined
                        // Если модуля нет - результатом будет исходная декларация модуля.
                        // Стало быть, в первый раз попадём в catch, а второй раз - сюда
                        result = declaration;
                     }
                  }
                  break;
               case 'inst':
                  self._unresolvedInstances.push({
                     scope: this,
                     name: name,
                     value: value
                  });
                  self._unresolvedInstancesId.push(value.id);
                  break;
               case 'link':
                  self._unresolvedLinks.push({
                     scope: this,
                     name: name,
                     value: value
                  });
                  break;
               case '+inf':
                  result = Infinity;
                  break;
               case '-inf':
                  result = -Infinity;
                  break;
               case 'undef':
                  result = undefined;
                  break;
               case 'NaN':
                  result = NaN;
                  break;
               default:
                  throw new Error('Unknown serialized type "' + value.$serialized$ + '" detected');
            }
         }

         if (typeof result === 'string') {
            for (var key in self._patterns) {
               if (self._patterns.hasOwnProperty(key) &&
                  self._patterns[key].test(result)
               ) {
                  switch (key) {
                     case 'Date':
                        var dateValue = new Date(result);
                        if (dateValue.toString() === 'Invalid Date' && Env.detection.isIE) {
                           dateValue = Date.fromSQL(result);
                        }
                        return dateValue;
                     case 'Function':
                        return deserializeTemplate(result);
                  }
               }
            }
         }

         // Resolve links and instances at root
         // NB: if state contains an object with single empty key it looks like a root and we have to deal with this
         // situation and should resolve links and instances several times
         if (name === '' && isObject && Object.keys(this).length === 1) {
            // If root is a special signature it resolves through _resolveInstances() and needs to be assigned later if
            // necessary
            self._resolveLinks();
            self._resolveInstances();

            // In this case result hasn't been assigned and should be resolved from this
            if (result === value) {
               result = this[name];
            }
         }

         return result;
      };
   };

   /**
    * Установка функции toJSON, с помощью которой функция сможет сериализоваться
    * @param {Function} func функция, которой ставится toJSON
    * @param {String} moduleName название модуля, которому принадлежит функция. Записывается с преффиксом js!, html!, ...
    * @param {String} [path] Путь до функции в модуле. Путь может быть не определен, например для html!
    * @function
    * @name UICore/_state/Serializer#setToJsonForFunction
    */
   Serializer.setToJsonForFunction = function(func, moduleName, path) {
      func.toJSON = function() {
         var serialized = {
            $serialized$: 'func',
            module: moduleName
         };
         if (path) {
            serialized.path = path;
         }
         return serialized;
      };
   };

   /**
    * Функция, которая превращает строку вида 'SBIS3.EDO.MyPackage:handler' в функцию
    * @param {String} declaration - декларативное описание функции
    * @returns {Function|undefined}
    * @function
    * @name UICore/_state/Serializer#getFuncFromDeclaration
    */
   Serializer.getFuncFromDeclaration = function getFuncFromDeclaration(declaration) {
      var
         paths = declaration.split(':'),
         path,
         result,
         module,
         p;

      try {
         // Сперва попробуем загрузить модуль.
         // requirejs.defined здес НЕ помогает (Сюрприз!)
         // Контрольный пример: define('x', function(){}); requirejs.defined('x') -> false
         module = require(paths[0]);
      } catch (e) {
         // Если модуля нет - результатом будет исходная декларация модуля
         // result установится в ветке else, которая ниже - метка (*).
      }

      if (module) {
         // Если модуль загрузили
         try {
            // Ищем внутренности
            result = module;
            if (paths[1]) {
               path = paths[1].split('.');
               while ((p = path.shift())) {
                  // try/catch нам тут нужен если указали кривой путь
                  result = result[p];
               }
               if (typeof result === 'function') {
                  if (!result.toJSON) {
                     Serializer.setToJsonForFunction(result, paths[0], paths[1]);
                  }
                  result.wsHandlerPath = declaration;
               }
            }
         }
         catch (e) {
            throw new Error('Parsing function declaration "' + declaration + '" failed. Original message: ' + e.message);
         }

         if (typeof result !== 'function') {
            throw new Error('Can`t transform "' + declaration + '" declaration to function');
         }
      } else {
         // (*) На сервере на node.js второй вызов requirejs от незагруженного модуля даёт не исключение, а undefined
         // Если модуля нет - результатом будет исходная декларация модуля.
         // Стало быть, в первый раз попадём в catch, а второй раз - сюда
         result = declaration;
      }

      return result;
   };

   Serializer.parseDeclaration = function(declaration) {
      return Library.parse(declaration);
   };

   /**
    * Проверяет, что значение является ссылкой на ранее сериализованный экземпляр.
    * @param {*} value Сериализованное значение
    * @returns {*}
    * @protected
    */
   Serializer.prototype._serializeLink = function(value) {
      if (
         value &&
         typeof value === 'object' &&
         value.$serialized$ === 'inst' &&
         value.hasOwnProperty('id')
      ) {
         var id = value.id;
         if (this._linksStorage.hasOwnProperty(id)) {
            return {
               $serialized$: 'link',
               id: id
            };
         } else {
            this._linksStorage[id] = value;
         }
      }

      return value;
   };

   /**
    * Заменяет сериализованные ссылки на сериализованные экземпляры
    * @protected
    */
   Serializer.prototype._resolveLinks = function() {
      for (var i = 0; i < this._unresolvedLinks.length; i++) {
         var link = this._unresolvedLinks[i];
         if (link.linkResolved) {
            continue;
         }

         var index = this._unresolvedInstancesId.indexOf(link.value.id);

         if (index === -1) {
            throw new Error('Can\'t resolve link for property "' + link.name + '" with instance id "' + link.value.id + '".');
         }
         var instance = this._unresolvedInstances[index];
         link.scope[link.name] = link.value = instance.value;
         link.linkResolved = true;

         // It not necessary to resolve instance if it's already resolved
         if (!instance.instanceResolved) {
            this._unresolvedInstances.splice(1 + index, 0, link);
            this._unresolvedInstancesId.splice(1 + index, 0, link.value.id);
         }
      }
   };

   /**
    * Заменяет сериализованные экземпляры на десериализованные
    * @protected
    */
   Serializer.prototype._resolveInstances = function() {
      for (var i = 0; i < this._unresolvedInstances.length; i++) {
         var instance = this._unresolvedInstances[i];
         if (instance.instanceResolved) {
            continue;
         }

         var value = null;
         if (this._instanceStorage[instance.value.id]) {
            value = this._instanceStorage[instance.value.id];
         } else if (instance.value.module) {
            try {
               var module = getModuleFromLoader(instance.value.module, this.loader, this.di);
               value = module.fromJSON
                  ? module.fromJSON(instance.value)
                  : module.prototype.fromJSON.call(module, instance.value);
            } catch (e) {
               Env.IoC.resolve('ILogger').error('UICore/State:Serializer', e.stack || e);
               value = null;
            }
            this._instanceStorage[instance.value.id] = value;
         }

         instance.scope[instance.name] = instance.value = value;
         instance.instanceResolved = true;
      }
   };

   Serializer.componentOptsReArray = [
      {
         toFind: /\\/g, // экранируем слеш первым
         toReplace: '\\\\'
      },
      {
         toFind: /<\/(script)/gi,
         toReplace: '<\\/$1'
      },
      {
         toFind: /<!--/g,
         toReplace: '<\\!--'
      },
      {
         toFind: /'/g,
         toReplace: '\\u0027'
      },
      {
         toFind: /\u2028/g,
         toReplace: '\\u000a'
      },
      {
         toFind: /\u2029/g,
         toReplace: '\\u000a'
      },
      {
         toFind: /\n/g,
         toReplace: '\\u000a'
      },
      {
         toFind: /\r/g,
         toReplace: '\\u000d'
      },
      {
         toFind: /[^\\]\\u000a/g,
         toReplace: '\\\\u000a'
      }
   ];

   return Serializer;
});
