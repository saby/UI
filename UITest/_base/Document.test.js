/* global describe, it, assert */
define(['UI/Base', 'Application/Env'], function (UI, AppEnv) {
   describe('UITest/_base/Document', function () {

      it('instance creation', function () {
         assert.instanceOf(new UI.Document(), UI.Document);
      });

      describe('UITest/_base/Document Application Store', function () {

         beforeEach(() => {
            new UI.Document();
         });

         it('UI.Document creates headDataStore', function () {
            assert.instanceOf(AppEnv.getStore('headDataStore'), AppEnv.ObjectStore);
         });

         it('headDataStore contains headData', function () {
            assert.instanceOf(AppEnv.getStore('headDataStore').get('headData'), UI.HeadData);
         });

         afterEach(() => {
            AppEnv.setStore('headDataStore', null);
         });
      });
   });
});
