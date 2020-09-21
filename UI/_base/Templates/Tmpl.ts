import { logError } from "./Common";
import { TClosure } from 'UI/Executor';
import { _FocusAttrs } from 'UI/Focus';

function createLostFunction(err, ext) {
   logError(ext + '!', err);
   var wrapper = function () {
      return '<div>' + err.message + '</div>';
   };
   // @ts-ignore
   wrapper.stable = true;
   // @ts-ignore
   wrapper.includedFunctions = {};
   return wrapper;
}
function setToJsonForFunction(func, moduleName, path = undefined) {
   func.toJSON = function() {
      var serialized = {
         $serialized$: 'func',
         module: moduleName
      };
      if (path) {
         // @ts-ignore
         serialized.path = path;
      }
      return serialized;
   };
}
function resolverControls(path) {
   return 'tmpl!' + path;
}
function createTemplate(name, html, tmpl, conf, load) {
   try {
      tmpl.template(html, resolverControls, conf).handle(function (traversed) {
         try {
            var templateFunction = tmpl.func(traversed, conf);
            Object.keys(templateFunction.includedFunctions).forEach(function(elem) {
               setToJsonForFunction(templateFunction.includedFunctions[elem], 'tmpl!' + name, 'includedFunctions.' + elem);
            });
            // Чтобы отличать функции старого шаблонизатора от нового
            templateFunction.stable = true;
            var closured = function () {
               return templateFunction.apply(this, tmpl.addArgument(TClosure, arguments));
            };
            Object.defineProperty(closured, 'name', { 'value': templateFunction.name, configurable: true });
            // @ts-ignore
            closured.stable = true;
            // @ts-ignore
            closured.includedFunctions = templateFunction.includedFunctions;
            setToJsonForFunction(closured, 'tmpl!' + name);

            // @ts-ignore
            closured.reactiveProps = traversed.reactiveProps;
            // @ts-ignore
            closured.originalFunction = templateFunction;
            // @ts-ignore
            closured.__beforeMount = _FocusAttrs.prepareAttrsForFocus;

            load(closured);
            load = undefined;
         } catch (err) {
            err.message = 'Error while traversing template "' + name + '": ' + err.message;
            load(createLostFunction(err, 'tmpl'));
            load = undefined;
         }
      }, function (err) {
         err.message = 'Error while creating template "' + name + '": ' + err.message;
         load(createLostFunction(err,' tmpl'));
         load = undefined;
      });
   } catch (err) {
      err.message = 'Error while parsing template "' + name + '": ' + err.message;
      load(createLostFunction(err, 'tmpl'));
      load = undefined;
   }
}
export { createTemplate }
