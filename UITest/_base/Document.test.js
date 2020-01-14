/* global describe, it, assert */
define(['UI/Base', 'Application/Env'], function (UI, AppEnv) {
   describe('UITest/_base/Document', function () {

      it('instance creation', function () {
         assert.instanceOf(new UI.Document(), UI.Document);
      });

      describe('UITest/_base/Document AppEnv Store', function () {
         it('AppEnv contains HeadData Store', function () {
            new UI.Document();
            assert.instanceOf(AppEnv.getStore('headData'), UI.HeadData);
            AppEnv.setStore('headData', null);
         });
      });
   });
});
