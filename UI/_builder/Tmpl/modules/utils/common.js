define('UI/_builder/Tmpl/modules/utils/common', ['Env/Env'], function utilsLoader(Env) {
   /**
    * @author Крылов М.А.
    */

   function removeAllSpaces(string) {
      return string.replace(/\s/g, "");
   }
   function addArgument(value, args) {
      var argArr = Array.prototype.slice.call(args);
      if (argArr[0] === undefined) {
         argArr[0] = undefined;
      }
      if (argArr[1] === undefined) {
         argArr[1] = undefined;
      }
      if (argArr[2] === undefined) {
         argArr[2] = undefined;
      }

      // опция isVdom. если true - будет строить vdom.
      // если ПП, то в любом случае false
      argArr[3] = argArr[3] && !Env.constants.isServerSide;

      argArr.push(value);
      return argArr;
   }
   function capitalize(string) {
      return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
   }
   function clone(src) {
      function mixin(dest, source, copyFunc) {
         var name, s, empty = {};
         for (name in source) {
            s = source[name];
            if (!(name in dest) || (dest[name] !== s && (!(name in empty) || empty[name] !== s))) {
               dest[name] = copyFunc ? copyFunc(s) : s;
            }
         }
         return dest;
      }

      if (!src || typeof src !== "object" || Object.prototype.toString.call(src) === "[object Function]") {
         return src;
      }
      if (src.nodeType && "cloneNode" in src) {
         return src.cloneNode(true);
      }
      if (src instanceof Date) {
         return new Date(src.getTime());
      }
      if (src instanceof RegExp) {
         return new RegExp(src);
      }
      var r, i, l;
      if (src instanceof Array) {
         r = [];
         for (i = 0, l = src.length; i < l; ++i) {
            if (i in src) {
               r.push(clone(src[i]));
            }
         }
      } else {
         r = src.constructor ? new src.constructor() : {};
      }
      return mixin(r, src, clone);
   }
   function isLibraryModuleString(str) {
      // library module string example: SomeStorage.Library:Module
      var name = str.indexOf('ws:') === 0 ? str.replace('ws:', '') : str;
      return name.match(/:([a-zA-z]+)/) && name.indexOf('<') === -1 && name.indexOf(' ') === -1;
   }
   function splitModule(string) {
      var
         fullName = string.indexOf('ws:') === 0 ? string.replace('ws:', '') : string,
         librarySplit = fullName.split(':', 2),
         libraryName = librarySplit[0],
         moduleName = librarySplit[1] && librarySplit[1].replace(/\//g, '.'),
         modulePath = moduleName.split('.');

      return {
         library: libraryName,
         module: modulePath,
         fullName: libraryName + ':' + moduleName
      };
   }
   function eachObject(object, modifier) {
      var value;
      for (value in object) {
         if (object.hasOwnProperty(value)) {
            object[value] = modifier(object[value], value);
         }
      }
      return object;
   }
   function bindingArrayHolder(bindings, value) {
      if (!bindings) {
         bindings = [];
      }
      bindings.push(value);
      return bindings;
   }

   var tagsToReplace = {
      '<': '&lt;',
      '>': '&gt;',
      "'": '&apos;',
      "\"": '&quot;',
      '{{': '&lcub;&lcub;',
      '}}': '&rcub;&rcub;'
   };
   var ampRegExp = /&([^#])/g;
   var otherEscapeRegExp = /({{)|(}})|([<>'"])/g;

   function escape(entity) {
      if (entity && typeof entity === 'string') {
         entity = entity.replace(ampRegExp, function escapeReplace(tag, suffix) {
            return '&amp;' + suffix;
         });

         return entity.replace(otherEscapeRegExp, function escapeReplace(tag) {
            return tagsToReplace[tag] || tag;
         });
      }
      return entity;
   }

   // умеет конвертировать не только ansii символы, но и unicode
   function fixedFromCharCode(codePt) {
      //Код может быть в 16тиричной форме
      if (codePt && codePt.indexOf){
         if (codePt.indexOf('x') === 0){
            var trueCode = codePt.split('x')[1];
            codePt = parseInt(trueCode, 16);
         }
      }
      if (codePt > 0xFFFF) {
         codePt -= 0x10000;
         return String.fromCharCode(0xD800 + (codePt >> 10), 0xDC00 + (codePt & 0x3FF));
      } else {
         return String.fromCharCode(codePt);
      }
   }

   var unicodeRegExp = /&#(\w*);?/g;

   function unescapeASCII(str) {
      if (typeof str !== 'string') {
         return str;
      }
      return str.replace(unicodeRegExp, function(match, entity) {
         return fixedFromCharCode(entity);
      });
   };

   var unescapeRegExp = /&(nbsp|amp|quot|apos|lt|gt);/g;
   var unescapeDict = {
      "nbsp": String.fromCharCode(160),
      "amp": "&",
      "quot": "\"",
      "apos": "'",
      "lt": "<",
      "gt": ">"
   };

   function unescape(str) {
      if (!str || typeof str !== 'string') {
         return str;
      }
      return unescapeASCII(str).replace(unescapeRegExp, function(match, entity) {
         return unescapeDict[entity];
      });
   }

   function isEmpty(obj) {
      for (var prop in obj) {
         if (obj.hasOwnProperty(prop))
            return false;
      }
      return true;
   }
   function plainMergeAttrs(inner, attrs) {
      var copyInner,
         prop;
      if (typeof inner !== 'object' && typeof inner !== 'function') {
         inner = {};
      }
      if (!attrs) {
         attrs = {};
      }

      copyInner = inner;

      for (prop in attrs) {
         if (attrs.hasOwnProperty(prop)) {
            copyInner[prop] = attrs[prop];
         }
      }

      return copyInner;
   }
   function hasResolver(name, resolvers) {
      for (var resolver in resolvers) {
         if (resolvers.hasOwnProperty(resolver)) {
            return name.indexOf(resolver) === 0 ? resolver : undefined;
         }
      }
   }
   function isTemplateString(str) {
      return str.indexOf('wml!') === 0 || str.indexOf('tmpl!') === 0 || str.indexOf('html!') === 0 || str.indexOf('optional!tmpl!') === 0;
   }
   function isSlashedControl(str) {
      return str.split('/').length > 1 && !isTemplateString(str) && str.indexOf('<') === -1 && str.indexOf(' ') === -1;
   }
   function isOptionsExpression(expr) {
      return expr && expr.name && expr.name.string === '_options';
   }
   function checkProp(object, prop) {
      return object && object[prop] !== undefined;
   }

   return {
      removeAllSpaces: removeAllSpaces,
      addArgument: addArgument,
      capitalize: capitalize,
      clone: clone,
      isLibraryModuleString: isLibraryModuleString,
      splitModule: splitModule,
      eachObject: eachObject,
      bindingArrayHolder: bindingArrayHolder,
      escape: escape,
      unescapeASCII: unescapeASCII,
      unescape: unescape,
      isEmpty: isEmpty,
      plainMergeAttrs: plainMergeAttrs,
      hasResolver: hasResolver,
      isSlashedControl: isSlashedControl,
      isOptionsExpression: isOptionsExpression,
      checkProp: checkProp
   };
});
