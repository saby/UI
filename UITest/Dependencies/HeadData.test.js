define([
   'UI/Base',
   'Core/Deferred'
], function(Base, Deferred) {
   describe('HeadData', function() {
      let HeadData = Base.HeadData;
      var hd;
      var dc;
      beforeEach(function() {
         dc = {
            collectDependencies: function(deps) {
               this.collected = true;
               this.deps = deps;
               return {
                  js: ['collectedDeps'],
                  tmpl: [],
                  wml: [],
                  css: {themedCss: [], simpleCss: []},
                  cssToDefine: []
               };
            }
         };
         hd = new HeadData();
         hd.getSerializedData = function() {
            return {
               additionalDeps: { serializedStateDep: true },
               serialized: ['receivedStates']
            }
         };
      });
      it('DefRender aready fired', function() {
         hd.isDebug = false;
         hd.getDepsCollector = function() {
            return dc;
         };
         var defRender = new Deferred();
         defRender.addCallback(function() {
            hd.defRender = defRender;
            var waiterDef = new Deferred();
            hd.collectDeps(waiterDef);
            waiterDef.addCallback(function(res) {
               assert.equal(res, null);
            });
            waiterDef.callback();
         });
         defRender.callback();
      });
      it('Debug true', function() {
         hd.isDebug = true;
         var tcInitialized = false
         hd.getDepsCollector = function() {
            return dc;
         };
         hd.initThemesController = function() {
            tcInitialized = true;
         };
         var defRender = new Deferred();
         hd.defRender = defRender;
         var waiterDef = new Deferred();
         hd.collectDeps(waiterDef);
         waiterDef.callback();
         defRender.addCallback(function(res) {
            assert.equal(tcInitialized, false);
            assert.equal(res.additionalDeps[0], "serializedStateDep");
            assert.equal(res.receivedStateArr[0], "receivedStates");
            assert.equal(res.js.length, 0);
         });
      });
      it('Deps collected', function() {
         hd.isDebug = false;
         var tcInitialized = false
         hd.getDepsCollector = function() {
            return dc;
         };
         hd.initThemesController = function() {
            tcInitialized = true;
         };
         var defRender = new Deferred();
         hd.defRender = defRender;
         var waiterDef = new Deferred();
         hd.collectDeps(waiterDef);
         waiterDef.callback();
         defRender.addCallback(function(res) {
            assert.equal(tcInitialized, true);
            assert.equal(res.additionalDeps[0], "serializedStateDep");
            assert.equal(res.receivedStateArr[0], "receivedStates");
            assert.equal(res.js[0], "collectedDeps");
         });
      });
   });
});
