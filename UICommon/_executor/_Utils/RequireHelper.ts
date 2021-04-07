/// <amd-module name="UICore/_executor/_Utils/RequireHelper" />
/* tslint:disable */

/**
 * @author Тэн В.А.
 */

const myRequireHash = {};

// require.defined returns current module if you call it with '.'
function checkModuleName(name) {
   return name.indexOf('<') === -1 && name.indexOf('>') === -1 && name.indexOf('/') > -1 && name !== '.';
}

export function defined(name) {
   let res = false;

   if (typeof name !== 'string') {
      return false;
   }

   if (myRequireHash[name]) {
      return true;
   } else if (checkModuleName(name)) {
      // @ts-ignore
      res = require.defined(name);
      if (res === null || res === undefined || !res) {
         return false;
      }
      // @ts-ignore
      let mod = require(name);
      //It's possible that module is defined but not ready yet because it waits for its own dependencies.
      //If we start to build templates until this process ends we'd receive not exactly module body here.
      //We can get undefined or an empty object instead.
      // @ts-ignore
      if (mod === undefined ||(mod && typeof mod === 'object' && Object.getPrototypeOf(mod) === Object.prototype && Object.keys(mod).length === 0)) {
         return false;
      }
      // поддержка ts модулей
      // @ts-ignore
      mod = mod && mod.default || mod;

      myRequireHash[name] = mod;

   }
   return res;
}

function _require(name: string, ignoreDefault: boolean = false) {
   if (!myRequireHash[name]) {
      // @ts-ignore
      myRequireHash[name] = require(name);
      if (!ignoreDefault) {
         // поддержка ts модулей
         myRequireHash[name] = myRequireHash[name] && myRequireHash[name].default || myRequireHash[name];
      }
   }
   return myRequireHash[name];
}

export function extendedRequire(name: string, modulePath: Array<string>) {
   if (!modulePath) {
      return _require(name);
   }
   let mod = require(name);
   // есть ситуация когда экспортируется default и еще один импортированный класс
   // https://online.sbis.ru/opendoc.html?guid=024120a4-0a34-4c2e-85b9-23fae126110
   let isExtendExport = false;
   modulePath.forEach(function (className) {
      if (className !== 'default' && typeof mod[className] === 'function') {
         isExtendExport = true;
      }
   });
   if (isExtendExport) {
      myRequireHash[name] = mod;
   }
   return myRequireHash[name];
}

export { _require as require };
