define([
   'UI/Base'
], function(Base) {
   let DepsCollector = Base.DepsCollector;
   var modDeps = {
      "aaa/aaa": [],
      "css!aaa/bbb": [],
      "css!aaat/bbbt": [],
      "tmpl!aaa/ccc": [],
      "css!aaa/ddd": [],
      "css!aaat/dddt": [],
      "ccc/aaa": ["ccc/ccc", "css"],
      "ccc/ccc": ["ddd/aaa"],
      "js/tmplDep": ["tmpl!tmplDep"],
      "css": [],
      "ccc/bbb": [],
      "xxx/aaa": [],
      "tmpl!xxx/aaa": [],
      "moduleWithLang/test": ["moduleWithLang2/test2"]
   };
   var modInfo = {
      "css!aaa/ddd": {path: "resources/aaa/ddd.min.css"},
      "xxx/aaa": {path: "resources/xxx/aaa.min.js"},
      "tmpl!xxx/aaa": {path: "resources/xxx/aaa.min.tmpl"}
   };
   var bundlesRoute = {
      "aaa/aaa": "resources/bdl/aaa.package.min.js",
      "css!aaa/bbb": "resources/bdl/aaa.package.min.css",
      "css!aaat/bbbt": "resources/bdl/aaat.package.min.css",
      "tmpl!aaa/ccc": "resources/bdl/bbb.package.min.js",
      "vvv/aaa": "resources/bdl/ccc.package.min.js",
      "vvv/bbb": "resources/bdl/ccc.package.min.js",
      "ccc/aaa": "resources/bdl/ddd.package.min.js",
      "ccc/ccc": "resources/bdl/eee.package.min.js",
      "js/tmplDep": "resources/jstmplbdl/tmpldep.package.min.js",
      "css": "resources/bdl/ggg.package.min.js",
      "ddd/aaa": "resources/bdl/hhh.package.min.js",
      "xxx/aaa": "resources/bdl/jjj.package.min.js",
      "tmpl!ppp/ppp": "resources/bdl/tmplpckd.package.min.js"
   }
   var dc = new DepsCollector(modDeps, modInfo, bundlesRoute);
   describe('DepsCollector', function() {
      it('single in bundle', function() {
         var deps = dc.collectDependencies(["aaa/aaa"]);
         assert.deepStrictEqual(deps.js, ["bdl/aaa.package"]);
      });
      it('several in bundle', function() {
         var deps = dc.collectDependencies(["vvv/aaa", "vvv/bbb"]);
         assert.deepStrictEqual(deps.js, ["bdl/ccc.package"]);
      });
      it('css-bundle hook js simple', function() {
         var deps = dc.collectDependencies(["css!aaa/bbb"]);
         assert.deepStrictEqual(deps.js, ["bdl/aaa.package"]);
         assert.deepStrictEqual(deps.css.simpleCss, ["bdl/aaa.package"]);
      });
      it('css-bundle hook js themed', function() {
         var deps = dc.collectDependencies(["css!theme?aaat/bbbt"]);
         assert.deepStrictEqual(deps.js, ["bdl/aaat.package"]);
         assert.deepStrictEqual(deps.css.themedCss, ["bdl/aaat.package"]);
      });
      it('single css not hooks js simple', function() {
         var deps = dc.collectDependencies(["css!aaa/ddd"]);
         assert.deepStrictEqual(deps.css.simpleCss, ["aaa/ddd"]);
         assert.deepStrictEqual(deps.js, []);
      });
      it('single css not hooks js themed', function() {
         var deps = dc.collectDependencies(["css!theme?aaa/ddd"]);
         assert.deepStrictEqual(deps.css.themedCss, ["aaa/ddd"]);
         assert.deepStrictEqual(deps.js, []);
      });
      it('recursive', function() {
         var deps = dc.collectDependencies(["ccc/aaa"]);
         assert.deepStrictEqual(deps.js, ["bdl/ddd.package",
            "bdl/eee.package",
            "bdl/hhh.package",
            "bdl/ggg.package"]);
      });
      it('optional pre-load', function() {
         var deps = dc.collectDependencies(["optional!xxx/aaa"]);
         assert.deepStrictEqual(deps.js, ["bdl/jjj.package"]);
      });
      it('optional no pre-load', function() {
         var deps = dc.collectDependencies(["optional!ccc/bbb"]);
         assert.deepStrictEqual(deps.js, []);
      });
      it('ext tmpl', function() {
         var deps = dc.collectDependencies(["tmpl!xxx/aaa"]);
         assert.deepStrictEqual(deps.tmpl, ["xxx/aaa"]);
      });
      it('tmpl packed in parent js', function() {
         var deps = dc.collectDependencies(["js/tmplDep"]);
         assert.deepStrictEqual(deps.js, ["jstmplbdl/tmpldep.package"]);
         assert.deepStrictEqual(deps.tmpl, []);
      });
      it('custom extension in bundlesRoute', function() {
         var deps = dc.collectDependencies(["tmpl!ppp/ppp"]);
         assert.deepStrictEqual(deps.js, ["bdl/tmplpckd.package"]);
         assert.deepStrictEqual(deps.tmpl, []);
      });
      it('Localization enabled', function() {
         var depsCollectorWithLocalization = new DepsCollector(modDeps, modInfo, bundlesRoute);
         depsCollectorWithLocalization.getLang = function() {
            return 'ru-RU';
         };
         depsCollectorWithLocalization.getAvailableDictList = function() {
            return {
               'moduleWithLang/lang/ru-RU/ru-RU.json': true,
               'moduleWithLang2/lang/ru-RU/ru-RU.json': true
            };
         };
         depsCollectorWithLocalization.getModules = function() {
            return {
               'moduleWithLang': {dict: ['ru-RU.json', 'ru-RU.css']},
               'moduleWithLang2': {dict: ['ru-RU.css', 'ru-RU.json']}
            };
         };
         var deps = depsCollectorWithLocalization.collectDependencies(["moduleWithLang/test"]);
         assert.deepStrictEqual(deps.js, ["moduleWithLang/lang/ru-RU/ru-RU.json",
            "moduleWithLang2/lang/ru-RU/ru-RU.json",
            "moduleWithLang/test",
            "moduleWithLang2/test2"]);
         assert.deepStrictEqual(deps.css.simpleCss, ["moduleWithLang/lang/ru-RU/ru-RU", "moduleWithLang2/lang/ru-RU/ru-RU"]);
      });
      it('New localization enabled', function() {
         var depsCollectorWithLocalization = new DepsCollector(modDeps, modInfo, bundlesRoute);
         depsCollectorWithLocalization.getLang = function() {
            return 'en-US';
         };
         depsCollectorWithLocalization.getAvailableDictList = function() {
            return {
               'moduleWithLang2/lang/en/en.json': true,
               'moduleWithLang2/lang/en-US/en-US.json': true
            };
         };
         depsCollectorWithLocalization.getModules = function() {
            return {
               'moduleWithLang2': {dict: ['en.json', 'en.css', 'en-US.json', 'en-US.css']}
            };
         };
         var deps = depsCollectorWithLocalization.collectDependencies(["moduleWithLang2/test"]);
         assert.deepStrictEqual(deps.js, ["moduleWithLang2/lang/en-US/en-US.json", "moduleWithLang2/lang/en/en.json", "moduleWithLang2/test"]);
         assert.deepStrictEqual(deps.css.simpleCss, ["moduleWithLang2/lang/en-US/en-US", "moduleWithLang2/lang/en/en"]);
      });
      it('missing optional dep', function() {
         var deps = dc.collectDependencies(["optional!nosuchdep", "tmpl!ppp/ppp"]);
         assert.deepStrictEqual(deps.js, ["bdl/tmplpckd.package"]);
         assert.deepStrictEqual(deps.tmpl, []);
      });
   });
});
