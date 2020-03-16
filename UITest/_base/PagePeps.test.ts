import { getModulesThemes, IModules } from 'UI/_base/PageDeps';
// import { assert } from 'chai';
// import 'mocha';
import { IDeps } from 'UI/_base/DepsCollector';

describe('UI/_base/PageDeps', () => {
   describe('getModuleDeps', () => {

      it('Коллекция тем только для подключенных модулей', () => {
         const modules: IModules = {
            'Controls': {
               'newThemes': {
                  'Controls/Application/Application': ['default'],
                  'Controls/Application/ApplicationWrapper': ['default'],
                  'Controls/filter': ['default', 'saby'],
               }
            },
            "Location": {
               "newThemes": {
                  "Location/AddressForm/AddressForm": ["default", "saby"],
                  "Location/AddressLink/AddressLink": ["default", "saby"],
               }
            }
         };
         const js: IDeps = ['Controls/Application/Application', 'Controls/filter', 'Location/AddressLink/AddressLink'];
         assert.sameMembers(getModulesThemes(modules, js), js);
      });
   });
});