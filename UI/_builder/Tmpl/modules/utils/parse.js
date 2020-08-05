define('View/Builder/Tmpl/modules/utils/parse', [
   'View/Builder/Tmpl/modules/data/utils/functionStringCreator',
   'View/Builder/Tmpl/modules/utils/common',
   'View/Builder/Tmpl/expressions/_private/Process',
   'View/Builder/Tmpl/expressions/_private/Bind',
   'View/Builder/Tmpl/expressions/_private/Event',
   'View/Builder/Tmpl/codegen/TClosure',
   'UI/Utils'
], function straightFromFileLoader(
   FSC,
   utils,
   Process,
   bindExpressions,
   eventExpressions,
   TClosure,
   UIUtils
) {
   'use strict';

   /**
    * @author Крылов М.А.
    */

   var Logger = UIUtils.Logger;

   function isAttr(string) {
      return string.startsWith('attr:');
   }
   function checkRestrictedAttributes(isRestricted, restrictedAttributes, curAttribute) {
      if (isRestricted && isRestricted.partial) {
         restrictedAttributes.push('template');
      }
      return isRestricted
         ? (restrictedAttributes.indexOf(curAttribute) === -1)
         : true;
   }

   function processDataSequence(attributesData, data, isControl, configObject, attributeName, isAttribute) {
      var string = '';
      var attrData = attributesData && attributesData.data;
      var i;
      if (!attrData) {
         /**
          * Если в теге нет атрибута data,
          * значит это уже преобразованная строка
          */
         return attributesData;
      }
      if (attrData.length) {
         if (attrData.length === 1) {
            Process.processExpressions(
               attrData[0], data, this.fileName, isControl, configObject, attributeName, isAttribute
            );
            return attrData[0].value;
         }
         for (i = 0; i < attrData.length; i++) {
            Process.processExpressions(
               attrData[i], data, this.fileName, isControl, configObject, attributeName, isAttribute
            );
            string += attrData[i].value;
         }
         return string;
      }
      return Process.processExpressions(
         attrData, data, this.fileName, isControl, configObject, attributeName, isAttribute
      );
   }

   /**
    * Парсим атрибуты для понимания прокидываемых данных в partial
    * @param attributes
    * @param data
    * @param propertyName
    * @param restricted
    * @returns {{}}
    */
   function parseAttributesForData(attributes, data, propertyName, restricted) {
      var attr;
      var obj = { };
      var root = 'scope';
      var attribs = 'attributes';
      var attrData;
      var attrName;
      var resolved = { };
      var tmpObj = { };
      var attrs = attributes.attribs;
      var restrictedAttributes = [
         root, attribs, 'class', 'data-access', '_wstemplatename'
      ];

      if (attributes.rootConfig) {
         attributes.rootConfig.esc = false;
      }
      if (attrs !== undefined) {
         if (attrs[root] && attrs[root].data) {
            attrData = attrs[root].data;
            obj = Process.processExpressions(
               attrData[0], data, this.calculators, this.fileName
            );
            if (typeof obj === 'string') {
               if (utils.isOptionsExpression(attrData[0])) {
                  obj = TClosure.genFilterOptions(obj);
               }
               resolved.createdscope = obj;
               resolved.obj = { };
               obj = { };
            }
         }
         for (attr in attrs) {
            if (
               attrs.hasOwnProperty(attr) &&
               checkRestrictedAttributes(restricted, restrictedAttributes, attr) && attrs[attr]
            ) {
               attrName = propertyName ? propertyName + '/' + attr : attr;
               tmpObj[attr] = processDataSequence.call(this,
                  attrs[attr],
                  data,
                  attributes.isControl,
                  attributes.rootConfig || tmpObj,
                  attrName);
            }
         }
         if (resolved.createdscope) {
            if (utils.isEmpty(tmpObj)) {
               resolved.obj = obj;
            } else {
               resolved.obj = utils.plainMergeAttrs(tmpObj, obj);
            }
            return resolved;
         }
      }
      return utils.plainMergeAttrs(tmpObj, obj);
   }

   /**
    * Разбирает выражения Expression служебной информации, заменяя их на
    * вычисленный результат
    * @param {Object} internal Объект служебной информации
    * @param {Object} data
    * @param propertyName
    * @param isControl
    * @param rootConfig
    * @returns {*}
    */
   function parseInternalForData(internal, data, propertyName, isControl, rootConfig) {
      for (var attr in internal) {
         if (internal.hasOwnProperty(attr)) {
            var attrName = propertyName ? propertyName + '/' + attr : attr;
            internal[attr] = processDataSequence.call(this,
               internal[attr],
               data,
               isControl,
               rootConfig || internal,
               attrName);
         }
      }

      return internal;
   }

   function parseAttributesForDecoration(attribs, data, decor, isControl, tag) {
      var attrs;
      var mayBeToMerge = { };
      var needMerge = true;
      var result = {
         attributes: {},
         events: {},
         key: FSC.wrapAroundExec('key+"' + tag.key + '"'),
         inheritOptions: FSC.wrapAroundExec('attr?attr.inheritOptions:{}'),
         internal: FSC.wrapAroundExec('attr?attr.internal:{}'),
         context: FSC.wrapAroundExec('attr?attr.context:{}')
      };
      if (attribs) {
         if (utils.checkProp(attribs, 'attributes')) {
            attrs = processDataSequence.call(this, attribs.attributes, data, undefined, { composite: true });

            // delete attribs['attributes'];
         }
         for (var attr in attribs) {
            if (bindExpressions.isBind(attr)) {
               var cleanAttributeName = bindExpressions.getBindAttributeName(attr);
               try {
                  // Processing bind expression ("bind:...")
                  var eventAttributeName = bindExpressions.getEventAttributeName(attr);
                  var eventChain = result.events[eventAttributeName.toLowerCase()];
                  result.events[eventAttributeName.toLowerCase()] = bindExpressions.processBindAttribute(
                     attribs[attr], attr, data, isControl, this.fileName, this.childrenStorage, eventChain
                  );
               } catch (error) {
                  Logger.templateError(
                     'На теге "' + tag.originName + '" значение атрибута "' + attr + '" некорректно "' +
                     attribs[attr].data[0].name.string + '": ' + error.message +
                     '. Данный атрибут будет обработан как опция. ' +
                     'Строка ' + (tag.attributes[attr].position.line + 1) + ', ' +
                     'столбец ' + (tag.attributes[attr].position.column + 1),
                     this.fileName
                  );
               } finally {
                  // Create attribute object
                  attribs[cleanAttributeName] = attribs[attr];
                  delete attribs[attr];
               }
            } else if (eventExpressions.isEvent(attr)) {
               try {
                  var eventObject = eventExpressions.processEventAttribute(
                     attribs[attr], attr, data, isControl, this.fileName, this.childrenStorage
                  );
                  var eventName = attr.toLowerCase();
                  if (result.events[eventName] === undefined) {
                     result.events[eventName] = eventObject;
                  } else {
                     // If event with the same name already present, add object to the array
                     result.events[eventName].push(eventObject[0]);
                  }
               } catch (error) {
                  Logger.templateError(
                     'На теге "' + tag.originName + '" значение атрибута "' + attr + '" некорректно "' +
                     attribs[attr].data[0].name.string + '": ' + error.message +
                     '. Игнорирую данное выражение. ' +
                     'Строка ' + (tag.attributes[attr].position.line + 1) + ', ' +
                     'столбец ' + (tag.attributes[attr].position.column + 1),
                     this.fileName
                  );
               } finally {
                  delete attribs[attr];
               }
            } else if (isAttr(attr)) {
               needMerge = false;
               result.attributes[attr] = processDataSequence.call(this,
                  attribs[attr],
                  data,
                  isControl,
                  attribs,
                  attr,
                  true);
               delete attribs[attr];
            } else if (attr === 'class' || attr === 'tabindex' || attr === 'data-access') {
               mayBeToMerge['attr:' + attr] = processDataSequence.call(this,
                  attribs[attr],
                  data,
                  isControl,
                  attribs,
                  attr,
                  true);
            }
         }

         if (needMerge) {
            for (var one in mayBeToMerge) {
               if (mayBeToMerge.hasOwnProperty(one)) {
                  result.attributes[one] = mayBeToMerge[one];
                  delete attribs[one.split('attr:')[1]];
               }
            }
         }
         if (typeof attrs === 'string') {
            result.attributes = FSC.wrapAroundExec(
               TClosure.genProcessMergeAttributes(
                  attrs,
                  FSC.getStr(result.attributes)
               ),
               true
            );
         }
         result.events = FSC.wrapAroundExec('typeof window === "undefined"?{}:' + FSC.getStr(result.events));
         return result;
      }
      return undefined;
   }

   /**
    * Для проверки существования директивы и её модульной функции,
    *  которую можно применять в модулях, например <div if="{{true}}">...</div>
    * @param  {Object} name
    * @return {Function}
    */
   function attributeParserMatcherByName(name) {
      return (name !== undefined)
         ? this._attributeModules[name].module
         : false;
   }

   return {
      parseAttributesForData: parseAttributesForData,
      parseInternalForData: parseInternalForData,
      parseAttributesForDecoration: parseAttributesForDecoration,
      attributeParserMatcherByName: attributeParserMatcherByName
   };
});
