import { DepsCollector } from 'UI/Base';
import { controller } from 'I18n/i18n';
import { assert } from 'chai';
import * as sinon from 'sinon';

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
   'ModuleWithLocalization/test': ['i18n!ModuleWithLocalization']
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
   it('css-bundle hook js simple', () => {
      const deps = dc.collectDependencies(['css!aaa/bbb']);
      assert.deepStrictEqual(deps.js, ['bdl/aaa.package']);
      assert.deepStrictEqual(deps.css.simpleCss, ['bdl/aaa.package']);
   });
   it('css-bundle hook js themed', () => {
      const deps = dc.collectDependencies(['css!theme?aaat/bbbt']);
      assert.deepStrictEqual(deps.js, ['bdl/aaat.package']);
      assert.deepStrictEqual(deps.css.themedCss, ['bdl/aaat.package']);
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
                  }
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
            'ModuleWithLocalization/lang/ru/ru.json',
            'ModuleWithLocalization/test'
         ]);
         assert.strictEqual(deps.css.simpleCss.length, 0);
      });
   })

   it('missing optional dep', () => {
      const deps = dc.collectDependencies(['optional!nosuchdep', 'tmpl!ppp/ppp']);
      assert.deepStrictEqual(deps.js, ['bdl/tmplpckd.package']);
      assert.deepStrictEqual(deps.tmpl, []);
   });
});
