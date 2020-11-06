/// <amd-module name="UI/_builder/Tmpl/codegen/jstpl" />

/**
 * @author Крылов М.А.
 */

export const BODY = `if (typeof forceCompatible === 'undefined') {
    forceCompatible = false;
}
var markupGenerator = thelpers.createGenerator(isVdom, forceCompatible, generatorConfig);
/*#DELETE IT START#*/
if (typeof includedTemplates === "undefined") {
   eval("var includedTemplates = undefined;");
   includedTemplates = (this && this.includedTemplates) ? this.includedTemplates : {};
}
/*#DELETE IT END#*/
try {
   /*#PROCESSED_EXPRESSIONS#*/
   var out = markupGenerator.joinElements([ /*#MARKUP_GENERATION#*/ ], key, defCollection);
   if (defCollection && defCollection.def) {
      out = markupGenerator.chain(out, defCollection, this);
      defCollection = undefined;
   }
} catch (e) {
   thelpers.templateError("/*#FILE_NAME#*/", e, data);
}
return out || markupGenerator.createText("");
`;

export const DEFINE = `define('/*#MODULE_EXTENSION#*/!/*#MODULE_NAME#*/', /*#DEPENDENCIES#*/, function(Executor, rk) {
   function debug() {
      debugger;
   }
   var thelpers = Executor.TClosure;
   var deps = Array.prototype.slice.call(arguments);
   var depsLocal = { };
   var includedTemplates = { };
   var scopeForTemplate, attrsForTemplate;

   /*#DELETE IT START#*/
   var tclosure=deps[0].TClosure;
   var rk=deps[1];
   var _deps = { };
   /*#DELETE IT END#*/

   /*#LOCAL_DEPENDENCIES#*/
   /*#PRIVATE_TEMPLATES#*/
   /*#INCLUDED_TEMPLATES#*/

   var templateFunction = /*#TEMPLATE#*/;
   templateFunction.stable = true;
   templateFunction.reactiveProps = /*#REACTIVE_PROPERTIES#*/;
   templateFunction.isWasabyTemplate = /*#IS_WASABY_TEMPLATE#*/;

   /*#DELETE IT START#*/
   templateFunction.toJSON = function() {
      return {
         $serialized$: 'func',
         module: '/*#MODULE_EXTENSION#*/!/*#MODULE_NAME#*/'
      };
   };
   /*#DELETE IT END#*/

   return templateFunction;
});
`;

export const FOR = `(function customForTemplate() {
   var out = [];
   data.viewController = viewController || null;
   (function customForTemplateScope() {
      var templateCount = 0,
         contextInput = key + '_' + (forCounter++),
         itCount = 0;
      for ( /*#INIT#*/ ; /*#TEST#*/ ; /*#UPDATE#*/ ) {
         key = contextInput + "_for_" + itCount + "_";
         itCount++;
         /*#PROCESSED_EXPRESSIONS#*/
         var processed = [ /*#PROCESSED#*/ ];
         out = out.concat(processed);
      }
   }).call(data);
   return out;
})(),
`;

export const FOREACH = `(function forTemplate() {
   var iterator = undefined;
   for (var i = 0; i < thelpers.iterators.length && !iterator; i++) {
      if (thelpers.iterators[i].is( /*#SCOPE_ARRAY#*/ )) {
         iterator = thelpers.iterators[i].iterator;
      }
   }
   var out = [];
   data.viewController = viewController || null;
   (function forTemplateScope() {
      var data = thelpers.createScope(this);
      if (iterator) {
         var templateCount = 0,
            contextInput = key + '_' + (forCounter++),
            itCount = 0;
         iterator( /*#SCOPE_ARRAY#*/ , function forIteratorCallback(entity, key) {
            var originData = data;
            data = Object.create(data);
            thelpers.presetScope(entity, data, key, /*#ITERATOR_SCOPE#*/ );
            key = contextInput + "_for_" + itCount + "_";
            itCount++;
            /*#PROCESSED_EXPRESSIONS#*/
            var processed = [ /*#PROCESSED#*/ ];
            out = out.concat(processed);
            data = originData;
         }.bind(data));
      } else {
         out = markupGenerator.createText("");
      }
   }).call(data);
   return out;
})(),
`;

export const FUNCTION_TEMPLATE = `/*#DELETE IT START#*/
if (typeof context === "undefined") {
   var context = arguments[2];
}
if (typeof thelpers === "undefined") {
   eval("var thelpers = null;");
   thelpers = (function () {
      return this || (0, eval)('this')
   })().requirejs("UI/Executor").TClosure;
}
/*#LOCALIZATION_INIT#*/
if (sets && sets.isSetts) {
   var contextObj = sets.fullContext || {};
}
/*#DELETE IT END#*/

var templateCount = 0;
var forCounter = 0;
var currentPropertyName = "/*#PROPERTY_NAME#*/";
data = thelpers.isolateScope(Object.create(this), data, currentPropertyName);
var key = thelpers.validateNodeKey(attr && attr.key);
var defCollection = {
   id: [],
   def: undefined
};
var viewController = thelpers.calcParent(this, typeof currentPropertyName === 'undefined' ? undefined : currentPropertyName, data);

/*#TEMPLATE_BODY#*/
`;

export const HEAD = `/*#DELETE IT START#*/
function debug() {
   debugger;
}
var scopeForTemplate, attrsForTemplate;
var thelpers = typeof tclosure === 'undefined' || !tclosure ? arguments[arguments.length - 1] : tclosure;
if (typeof thelpers === "undefined" || !thelpers._isTClosure) {
   eval("var thelpers = null;");
   thelpers = (function () {
      return this || (0, eval)('this')
   })().requirejs("UI/Executor").TClosure;
}
var depsLocal = typeof _deps === 'undefined' ? undefined : _deps;
if (typeof includedTemplates === "undefined") {
   eval("var includedTemplates = undefined;");
   includedTemplates = (this && this.includedTemplates) ? this.includedTemplates : {};
}
/*#LOCALIZATION_INIT#*/
/*#DELETE IT END#*/
var forCounter = 0;
var templateCount = 0;
var key = thelpers.validateNodeKey(attr && attr.key);
var defCollection = {
   id: [],
   def: undefined
};
var viewController = thelpers.calcParent(this, typeof currentPropertyName === 'undefined' ? undefined : currentPropertyName, data);
`;

export const INCLUDED_TEMPLATE = `{
   func: (function () {
      var scope = Object.create(data);
      scope.viewController = viewController || null;
      var bindFn = /*#TEMPLATE#*/.bind(scope);

      /*#DELETE IT START#*/
      bindFn.toJSON = function () {
         return "TEMPLATEFUNCTOJSON=" + /*#TEMPLATE_JSON#*/.toString();
      };
      /*#DELETE IT END#*/
      bindFn.isWasabyTemplate = /*#IS_WASABY_TEMPLATE#*/;

      return bindFn;
   })(),
   internal: /*#INTERNAL#*/,
   isWasabyTemplate: /*#IS_WASABY_TEMPLATE#*/
}
`;

export const LOCALIZATION = `var rk = typeof rk !== 'undefined' ? rk : (function () {
   return this || (0, eval)('this')
})().requirejs("i18n!/*#LOCALIZATION_MODULE#*/");
`;

export const OBJECT_TEMPLATE = `(new(function () {
   var scope = Object.create(data);
   scope.viewController = viewController || null;
   var func = ( /*#TEMPLATE#*/ );
   this.func = thelpers.makeFunctionSerializable(func, scope);
   /*#INTERNAL#*/;
   this.func.isWasabyTemplate = /*#IS_WASABY_TEMPLATE#*/;
})).func
`;

export const PARTIAL_TEMPLATE = `(function f2(data, attr) {
  var key = thelpers.validateNodeKey(attr && attr.key);
  var defCollection = {
    id: [],
    def: undefined
  };
  /*#BODY#*/
})
`;

export const PRIVATE_TEMPLATE = `{
  var key = thelpers.validateNodeKey(attr && attr.key);
  var forCounter = 0;
  var templateCount = 0;
  var defCollection = {
    id: [],
    def: undefined
  };
  var viewController = thelpers.calcParent(this, typeof currentPropertyName === "undefined" ? undefined : currentPropertyName, data);
  /*#BODY#*/
}
`;

export const PRIVATE_TEMPLATE_HEADER = `(function () {
  includedTemplates["/*#NAME#*/"] = (function (data, attr, context, isVdom) {
    /*#BODY#*/
  }.bind({
    includedTemplates: includedTemplates
  }));
})(),
`;

export const STRING_TEMPLATE = `/*#DELETE IT START#*/
if (typeof context === "undefined") {
   var context = arguments[2];
}
if (typeof thelpers === "undefined") {
   eval("var thelpers = null;");
   thelpers = (function () {
      return this || (0, eval)('this')
   })().requirejs("UI/Executor").TClosure;
}
/*#LOCALIZATION_INIT#*/
/*#DELETE IT END#*/

var templateCount = 0;
var forCounter = 0;
var currentPropertyName = "/*#PROPERTY_NAME#*/";

/*#TEMPLATE_BODY#*/
`;
