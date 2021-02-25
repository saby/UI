define('UI/_reactivity/ReactiveObserver', ['UI/DevtoolsHook', 'Types/shim', 'Env/Env'], function(DevtoolsHook, TypesShim, Env) {
   /**
    * @author Шипин А.А.
    */
   var Map = TypesShim.Map;

   var arrayMethods = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];

   /**
    * get descriptor of property
    * @param {Object} _obj object having propery
    * @param {String} prop name of property
    * @returns {*} descriptor
    */
   function getDescriptor(_obj, prop) {
      var res = null;
      var obj = _obj;
      while (obj) {
         res = Object.getOwnPropertyDescriptor(obj, prop);
         obj = Object.getPrototypeOf(obj);

         // нашли дескриптор
         if (res) {
            break;
         }
      }
      return res;
   }

   // var goUpByControlTree = null;
   function needToBeReactive(inst, val) {
      if (!val._$reactived) {
         return true;
      }
      return false;

      // var boundInst = val._$reactived;
      // goUpByControlTree = goUpByControlTree || require('UI/NodeCollector').goUpByControlTree;
      // return goUpByControlTree(boundInst._container).indexOf(inst) !== -1;
   }

   /**
    * set observer of property which is versioned object
    * @param {Control} inst Instance of control which will be updated
    * @param {string} prop property name of versioned object which will be reactive
    * @param {object} val versioned object which will be reactive
    */
   function observeVersion(inst, prop, val) {
      if (val && typeof val === 'object' && typeof val._version === 'number') {
         // need to define property only one time for upper control (inst that will be closured and used to call _forceUpdate)
         if (needToBeReactive(inst, val)) {
            releaseVersion(val._$reactived, prop);

            var version = val._version;
            Object.defineProperty(val, '_version', {
               enumerable: true,
               configurable: true,
               get: function reactiveGetter() {
                  return version;
               },
               set: function reactiveSetter(value) {
                  if (version !== value) {
                     if (inst._reactiveStart) {
                        if (inst._destroyed !== true) {
                           if (!pauseReactiveMap.has(inst)) {
                              inst._forceUpdate();
                              DevtoolsHook.saveChangedProps(inst, prop);
                           }
                        }
                     }
                     version = value;
                  }
               }
            });
            val._$reactived = inst;
         }
      }
   }

   /**
    * set observer of property which is array
    * @param {Control} inst Instance of control which will be updated
    * @param {string} prop property name of array which will be reactive
    * @param {array} val array which will be reactive
    */
   function observeArray(inst, prop, val) {
      if (val && Array.isArray(val)) {
         // need to define property only one time for upper control (inst that will be closured and used to call _forceUpdate)
         if (needToBeReactive(inst, val)) {
            releaseArray(val._$reactived, prop);

            arrayMethods.forEach(function(methodName) {
               var method = val[methodName];
               var mutator = function mutator() {
                  var res = method.apply(this, arguments);
                  if (inst._reactiveStart) {
                     if (inst._destroyed !== true) {
                        if (!pauseReactiveMap.has(inst)) {
                           this._arrayVersion++;
                           inst._forceUpdate();
                           DevtoolsHook.saveChangedProps(inst, prop);
                        }
                     }
                  }
                  return res;
               };
               Object.defineProperty(val, methodName, {
                  value: mutator,
                  enumerable: false,
                  writable: true,
                  configurable: true
               });
            });
            Object.defineProperties(val, {
               '_arrayVersion': {
                  value: 0,
                  enumerable: false,
                  writable: true,
                  configurable: true
               },
               'getArrayVersion': {
                  value: function () {
                     return val._arrayVersion;
                  },
                  enumerable: false,
                  writable: false,
                  configurable: true
               },
               '_$reactived': {
                  value: inst,
                  enumerable: false,
                  writable: true,
                  configurable: true
               }
            });
         }
      }
   }

   /**
    * set observer of properties of control
    * @param {UI/Base:Control} inst Instance of control which will be updated
    */
   function observeProperties(inst) {
      var templateFunction = inst._template;
      Object.defineProperty(inst, '_template', {
         enumerable: true,
         configurable: true,
         get: function() {
            return templateFunction;
         },
         set: function(newTemplateFunction) {
            if (newTemplateFunction !== templateFunction && newTemplateFunction && newTemplateFunction.reactiveProps) {
               templateFunction = newTemplateFunction;
               releaseProperties(inst);
               observeProperties(inst);
               if (inst._reactiveStart && inst._destroyed !== true && !pauseReactiveMap.has(this)) {
                  inst._forceUpdate();
                  DevtoolsHook.saveChangedProps(inst, '_template');
               }
            }
         }
      });
      var reactiveProps = inst._template && inst._template.reactiveProps;

      if (reactiveProps && inst._getChildContext) {
         // изменение полей контекста тоже влияет на верстку и надо звать _forceUpdate
         reactiveProps = reactiveProps.concat(Object.keys(inst._getChildContext()));
      }

      if (reactiveProps) {
         reactiveProps.forEach(function(prop) {
            var desc = getDescriptor(inst, prop);

            if (!inst.reactiveValues) {
               inst.reactiveValues = {};
            }

            releaseProperty(inst, prop);
            inst.reactiveValues[prop] = inst[prop];

            Object.defineProperty(inst, prop, {
               enumerable: true,
               configurable: true,
               get: function reactiveGetter() {
                  if (desc && desc.get) {
                     return desc.get.apply(this, arguments);
                  }
                  return this.reactiveValues[prop];
               },
               set: function reactiveSetter(value) {
                  if (desc && desc.set) {
                     desc.set.apply(this, arguments);
                  }

                  if (!this.hasOwnProperty('reactiveValues')) {
                     this.reactiveValues = Object.create(this.reactiveValues);
                  }
                  // todo нужно использовать сравнение, которое учитывает все тонкости https://online.sbis.ru/opendoc.html?guid=103c810b-5cf9-4d7d-bdd5-9becd2293312
                  if (this.reactiveValues[prop] !== value && !(Number.isNaN(this.reactiveValues[prop]) && Number.isNaN(value))) {
                     if (inst._reactiveStart) {
                        if (inst._destroyed !== true) {
                           if (!(prop === '_destroyed' && value === true)) {
                              // this потому что пауза определяется не на инстансе, а на Object.create(inst),
                              // это для того чтобы не звать forceUpdate во время инициализации объекта, используемого в контексте выполнения ws:for.
                              // установка в него index и element не должны вызывать forceUpdate
                              if (!pauseReactiveMap.has(this)) {
                                 if (prop !== '__lastGetterPath') {
                                    inst._forceUpdate();
                                    DevtoolsHook.saveChangedProps(inst, prop);
                                    checkForbiddenReactive(inst, prop);
                                 }
                              }
                           }
                        }
                     }

                     releaseProperty(this, prop, true);
                     this.reactiveValues[prop] = value;

                     // возможно эта проверка - костыль. не зову методы если объект уже привязан к какому-то контролу и присваивание идет из служебных мест
                     // добавляется по ошибке, в которой как раз это происходит, перебивается привязка контрола когда не следует
                     if (!pauseReactiveMap.has(inst) || !value || !value._$reactived) {
                        observeVersion(inst, prop, value);
                        observeArray(inst, prop, value);
                     }
                  }
               }
            });

            var value = inst.reactiveValues[prop];
            observeVersion(inst, prop, value);
            observeArray(inst, prop, value);
         });
      }
   }

   var pauseReactiveMap = new Map();
   function pauseReactive(instance, action) {
      if (!pauseReactiveMap.has(instance)) {
         pauseReactiveMap.set(instance, 0);
      }
      pauseReactiveMap.set(instance, pauseReactiveMap.get(instance) + 1);
      try {
         action();
      } finally {
         pauseReactiveMap.set(instance, pauseReactiveMap.get(instance) - 1);
         if (pauseReactiveMap.get(instance) === 0) {
            pauseReactiveMap.delete(instance);
         }
      }
   }

   function releaseVersion(instance, prop) {
      var value = instance && instance.reactiveValues[prop];
      if (value && value._$reactived === instance) {
         var version = value._version;
         if (typeof version !== 'undefined') {
            value._$reactived = null;
            Object.defineProperty(value, '_version', {
               value: version,
               enumerable: true,
               configurable: true,
               writable: true
            });
         }
      }
   }
   function releaseArray(instance, prop) {
      var value = instance && instance.reactiveValues[prop];
      if (value && value._$reactived === instance) {
         if (Array.isArray(value)) {
            value._$reactived = null;
            for (var i = 0; i < arrayMethods.length; i++) {
               Object.defineProperty(value, arrayMethods[i], {
                  value: Array.prototype[arrayMethods[i]],
                  configurable: true,
                  writable: true,
                  enumerable: false
               });
            }
         }
      }
   }
   function releaseValue(instance, prop, fromReactiveSetter) {
      if (fromReactiveSetter) {
         return;
      }
      if (instance.reactiveValues.hasOwnProperty(prop)) {
         var value = instance.reactiveValues[prop];
         Object.defineProperty(instance, prop, {
            value: value,
            configurable: true,
            writable: true,
            enumerable: true
         });
      }
   }
   function releaseProperty(instance, prop, fromReactiveSetter) {
      releaseVersion(instance, prop);
      releaseArray(instance, prop);
      releaseValue(instance, prop, fromReactiveSetter);
      delete instance.reactiveValues[prop];
   }
   /**
    * Свойства могут содержать сложные объекты (массивы, объекты, модели). Становясь реактивными,
    * они помечаются специальным образом, чтобы реактивность на свойство была настроена только для самого
    * внешнего контрола. Когда контрол дестроится, нужно снять пометки с таких объектов,
    * чтобы они могли быть зарегистрированы при перерисовке для другого контрола.
    * Необходимо вызывать метод, когда экземпляр дестроится и когда присваивается новый шаблон.
    * @param instance
    */
   function releaseProperties(instance) {
      var reactiveValues = instance.reactiveValues;
      if (reactiveValues) {
         var reactiveKeys = Object.keys(reactiveValues);
         for (var i = 0; i < reactiveKeys.length; ++i) {
            releaseProperty(instance, reactiveKeys[i]);
         }
      }
   }

   var forbidReactiveMap = new Map();
   function forbidReactive(instance, action) {
      if (!instance) {
         action();
         return;
      }
      if (!forbidReactiveMap.has(instance)) {
         forbidReactiveMap.set(instance, 0);
      }
      forbidReactiveMap.set(instance, forbidReactiveMap.get(instance) + 1);
      try {
         action();
      } finally {
         forbidReactiveMap.set(instance, forbidReactiveMap.get(instance) - 1);
         if (forbidReactiveMap.get(instance) === 0) {
            forbidReactiveMap.delete(instance);
         }
      }
   }
   // TODO: Пока что нужен стек в чистом виде (но небольшой, иначе будут полотна),
   //  чтобы видеть, какие происходили вычисления внутри. После разбора полетов убрать
   var MAX_STACK_LENGTH = 15;
   function checkForbiddenReactive(instance, property) {
      if (forbidReactiveMap.has(instance)) {
         var error = new Error();
         var text = 'Произведена попытка изменения состояния контрола "' + instance._moduleName +
            '" при вычислении верстки. Изменяется свойство "' + property + '"' +
            '\n' + error.stack.split('\n').slice(3, MAX_STACK_LENGTH).join('\n');
         Env.IoC.resolve('ILogger').warn(text);
      }
   }

   return {
      observeProperties: observeProperties,
      releaseProperties: releaseProperties,
      pauseReactive: pauseReactive,
      forbidReactive: forbidReactive
   };
});
