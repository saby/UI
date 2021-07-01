import { DepsCollector } from 'UICommon/Deps';
import { controller } from 'I18n/i18n';
import { assert } from 'chai';
import * as sinon from 'sinon';
import { getType, parseModuleName, recursiveWalker } from 'UICommon/_deps/RecursiveWalker';
import { TYPES, ICollectedDepsRaw } from 'UICommon/_deps/Interface';

const modDeps = {
   'aaa/aaa': [],
   'css!aaa/bbb': [],
   'css!aaat/bbbt': [],
   'tmpl!aaa/ccc': [],
   'css!aaa/ddd': [],
   'css!aaat/dddt': [],
   'ccc/aaa': ['ccc/ccc', 'css'],
   'ccc/ccc': ['ddd/aaa'],
   'js/tmplDep': ['tmpl!tmplDep'],
   'css': [],
   'ccc/bbb': [],
   'xxx/aaa': [],
   'tmpl!xxx/aaa': [],
   'ModuleWithLocalization/test': ['i18n!ModuleWithLocalization'],
   'ExternalModuleWithLocalization/test': ['i18n!ExternalModuleWithLocalization'],
   'Module/Name': ['External/Module', 'wml!External/Module'],
   'wml!External/Module': ['css!aaa/ddd']
};
const modInfo = {
   'css!aaa/ddd': {path: 'resources/aaa/ddd.min.css'},
   'xxx/aaa': {path: 'resources/xxx/aaa.min.js'},
   'tmpl!xxx/aaa': {path: 'resources/xxx/aaa.min.tmpl'}
};
const bundlesRoute = {
   'aaa/aaa': 'resources/bdl/aaa.package.min.js',
   'css!aaa/bbb': 'resources/bdl/aaa.package.min.css',
   'css!aaat/bbbt': 'resources/bdl/aaat.package.min.css',
   'tmpl!aaa/ccc': 'resources/bdl/bbb.package.min.js',
   'vvv/aaa': 'resources/bdl/ccc.package.min.js',
   'vvv/bbb': 'resources/bdl/ccc.package.min.js',
   'ccc/aaa': 'resources/bdl/ddd.package.min.js',
   'ccc/ccc': 'resources/bdl/eee.package.min.js',
   'js/tmplDep': 'resources/jstmplbdl/tmpldep.package.min.js',
   'css': 'resources/bdl/ggg.package.min.js',
   'ddd/aaa': 'resources/bdl/hhh.package.min.js',
   'xxx/aaa': 'resources/bdl/jjj.package.min.js',
   'tmpl!ppp/ppp': 'resources/bdl/tmplpckd.package.min.js'
}
const dc = new DepsCollector(modDeps, modInfo, bundlesRoute);

describe('DepsCollector', () => {
   it('single in bundle', () => {
      const deps = dc.collectDependencies(['aaa/aaa']);
      assert.deepStrictEqual(deps.js, ['bdl/aaa.package']);
   });
   it('several in bundle', () => {
      const deps = dc.collectDependencies(['vvv/aaa', 'vvv/bbb']);
      assert.deepStrictEqual(deps.js, ['bdl/ccc.package']);
   });
   it('single css not hooks js simple', () => {
      const deps = dc.collectDependencies(['css!aaa/ddd']);
      assert.deepStrictEqual(deps.css.simpleCss, ['aaa/ddd']);
      assert.deepStrictEqual(deps.js, []);
   });
   it('single css not hooks js themed', () => {
      const deps = dc.collectDependencies(['css!theme?aaa/ddd']);
      assert.deepStrictEqual(deps.css.themedCss, ['aaa/ddd']);
      assert.deepStrictEqual(deps.js, []);
   });
   it('recursive', () => {
      const deps = dc.collectDependencies(['ccc/aaa']);
      assert.deepStrictEqual(deps.js, ['bdl/ddd.package',
         'bdl/eee.package',
         'bdl/hhh.package',
         'bdl/ggg.package']);
   });
   it('optional pre-load', () => {
      const deps = dc.collectDependencies(['optional!xxx/aaa']);
      assert.deepStrictEqual(deps.js, ['bdl/jjj.package']);
   });
   it('optional no pre-load', () => {
      const deps = dc.collectDependencies(['optional!ccc/bbb']);
      assert.deepStrictEqual(deps.js, []);
   });
   it('ext tmpl', () => {
      const deps = dc.collectDependencies(['tmpl!xxx/aaa']);
      assert.deepStrictEqual(deps.tmpl, ['xxx/aaa']);
   });
   it('tmpl packed in parent js', () => {
      const deps = dc.collectDependencies(['js/tmplDep']);
      assert.deepStrictEqual(deps.js, ['jstmplbdl/tmpldep.package']);
      assert.deepStrictEqual(deps.tmpl, []);
   });
   it('custom extension in bundlesRoute', () => {
      const deps = dc.collectDependencies(['tmpl!ppp/ppp']);
      assert.deepStrictEqual(deps.js, ['bdl/tmplpckd.package']);
      assert.deepStrictEqual(deps.tmpl, []);
   });

   describe('localization', () => {
      let stubLocaleCurrent;
      let stubLoadingsHistory;

      before(() => {
         stubLocaleCurrent = sinon.stub(controller, 'currentLocale');
         stubLoadingsHistory = sinon.stub(controller, 'loadingsHistory');

         stubLoadingsHistory.get(() => {
            return {
               contexts: {
                  ModuleWithLocalization: {
                     'en-US': {
                        dictionary: 'ModuleWithLocalization/lang/en/en.json',
                        style: 'ModuleWithLocalization/lang/en/en'
                     },
                     'ru-RU': {
                        dictionary: 'ModuleWithLocalization/lang/ru/ru.json',
                     }
                  },
                  ExternalModuleWithLocalization: {
                     'ru-RU': {
                        dictionary: 'ExternalModuleWithLocalization/lang/ru/ru.json',
                     }
                  }
               },
               locales: {
                  'ru-RU': 'I18n/locales/ru-RU',
                  'en-US': 'I18n/locales/en-US'
               },
               contents: {
                  ExternalModuleWithLocalization: 'ExternalModuleWithLocalization/contents.json'
               }
            };
         });

      });

      after(() => {
         stubLocaleCurrent.restore();
         stubLoadingsHistory.restore();
      });

      it('should add dictionary and css', () => {
         stubLocaleCurrent.get(() => {
            return 'en-US';
         });

         const deps = dc.collectDependencies(['ModuleWithLocalization/test']);

         assert.deepStrictEqual(deps.js, [
            'I18n/locales/en-US',
            'ModuleWithLocalization/lang/en/en.json',
            'ModuleWithLocalization/test'
         ]);
         assert.deepStrictEqual(deps.css.simpleCss, ['ModuleWithLocalization/lang/en/en']);
      });

      it('should add only dictionary', () => {
         stubLocaleCurrent.get(() => {
            return 'ru-RU';
         });

         const deps = dc.collectDependencies(['ModuleWithLocalization/test']);

         assert.deepStrictEqual(deps.js, [
            'I18n/locales/ru-RU',
            'ModuleWithLocalization/lang/ru/ru.json',
            'ModuleWithLocalization/test'
         ]);
         assert.strictEqual(deps.css.simpleCss.length, 0);
      });

      it('should add contents for external module', () => {
         stubLocaleCurrent.get(() => {
            return 'ru-RU';
         });

         const deps = dc.collectDependencies(['ExternalModuleWithLocalization/test']);

         assert.isTrue(deps.js.includes('ExternalModuleWithLocalization/contents.json'));
      });
   })

   it('missing optional dep', () => {
      const deps = dc.collectDependencies(['optional!nosuchdep', 'tmpl!ppp/ppp']);
      assert.deepStrictEqual(deps.js, ['bdl/tmplpckd.package']);
      assert.deepStrictEqual(deps.tmpl, []);
   });
});

describe('getType', () => {
   it('i18n!Types/_formatter/numberWords ', () => {
      assert.deepEqual(getType('i18n!Types/_formatter/numberWords '), TYPES.i18n);
   });
   it('browser!Types/_formatter/numberWords ', () => {
      assert.deepEqual(getType('browser!Types/_formatter/numberWords '), TYPES.browser);
   });
   it('is!Types/_formatter/numberWords ', () => {
      assert.deepEqual(getType('is!Types/_formatter/numberWords '), TYPES.is);
   });
});

describe('parseModuleName', () => {
   it('i18n!Types/_formatter/numberWords ', () => {
      assert.isNotNull(parseModuleName('i18n!Types/_formatter/numberWords '));
   });
   it('browser!Types/_formatter/numberWords ', () => {
      assert.isNotNull(parseModuleName('browser!Types/_formatter/numberWords '));
   });
   it('is!Types/_formatter/numberWords ', () => {
      assert.isNotNull(parseModuleName('is!Types/_formatter/numberWords '));
   });
   it('parse lib name', () => {
      const moduleInfo = parseModuleName('Lib/Name:Module');
      assert.strictEqual(moduleInfo.moduleName, 'Lib/Name');
   });
});



describe('recursiveWalker', () => {
   it('getting "wml!" dependencies', () => {
      let allDeps: ICollectedDepsRaw = {};
      const deps = ['Module/Name'];
      recursiveWalker(allDeps, deps, modDeps, modInfo)
      assert.hasAllKeys(allDeps, ['js', 'wml', 'css']);
      assert.hasAllKeys(allDeps.css, ['css!aaa/ddd'])
   });
});
