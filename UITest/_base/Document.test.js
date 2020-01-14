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

         it('AppEnv contains HeadData Store', function () {
            assert.instanceOf(AppEnv.getStore('headData'), UI.HeadData);
         });

         afterEach(() => {
            AppEnv.setStore('headDataStore', null);
         });
      });
   });
});
