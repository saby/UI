/* global describe, it, assert */
define(['UI/Base'], function(UI) {
   describe('UITest/Test', function() {
      it('new control', function() {
         var control = new UI.Control({});
         assert.equal(typeof control._template, 'function');
      });
   });
});
