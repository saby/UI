/* global require, define, describe, it, assert */
define([
   'UICommon/Executor'
], function(CommonExecutor) {
   'use strict';
   var Attr = CommonExecutor.Attr;
   describe('Save class/style attribute', () => {
      it('empty', function (){
         var attr1 = {'attr:foo': 'foo'};
         var attr2 = {'attr:bar': 'bar'};
         assert.isUndefined(Attr.processMergeAttributes(attr1, attr2, false)['attr:class']);
      });

      it('empty 2', function (){
         var attr1 = {'attr:foo': 'foo'};
         var attr2 = {'attr:bar': 'bar'};
         assert.isUndefined(Attr.processMergeAttributes(attr1, attr2, false)['attr:style']);
      });

      it('empty 3', function (){
         var attr1 = {'attr:foo': 'foo'};
         var attr2 = {'attr:bar': 'bar'};
         assert.isUndefined(Attr.processMergeAttributes(attr1, attr2, false).class);
      });

      it('empty 4', function (){
         var attr1 = {'attr:foo': 'foo'};
         var attr2 = {'attr:bar': 'bar'};
         assert.isUndefined(Attr.processMergeAttributes(attr1, attr2, false).style);
      });

      it('only attr:class', function (){
         var attr1 = {'attr:class': 'foo'};
         var attr2 = {};
         assert.equal("foo", Attr.processMergeAttributes(attr1, attr2, false)['attr:class']);
      });

      it('only attr:class 2', function (){
         var attr1 = {};
         var attr2 = {'attr:class': 'foo'};
         assert.equal("foo", Attr.processMergeAttributes(attr1, attr2, false)['attr:class']);
      });

      it('only native class', function (){
         var attr1 = {'class': 'foo'};
         var attr2 = {};
         assert.equal("foo", Attr.processMergeAttributes(attr1, attr2, false).class);
      });

      it('only native class 2', function (){
         var attr1 = {};
         var attr2 = {'class': 'foo'};
         assert.equal("foo", Attr.processMergeAttributes(attr1, attr2, false).class);
      });

      it('only attr:style', function (){
         var attr1 = {'attr:style': 'foo'};
         var attr2 = {};
         assert.equal("foo", Attr.processMergeAttributes(attr1, attr2, false)['attr:style']);
      });

      it('only attr:style 2', function (){
         var attr1 = {};
         var attr2 = {'attr:style': 'foo'};
         assert.equal("foo", Attr.processMergeAttributes(attr1, attr2, false)['attr:style']);
      });

      it('only native style', function (){
         var attr1 = {'style': 'foo'};
         var attr2 = {};
         assert.equal("foo", Attr.processMergeAttributes(attr1, attr2, false).style);
      });

      it('only native style 2', function (){
         var attr1 = {};
         var attr2 = {'style': 'foo'};
         assert.equal("foo", Attr.processMergeAttributes(attr1, attr2, false).style);
      });

      it('save native class', function (){
         var attr1 = {'attr:class': 'foo'};
         var attr2 = {'class': 'bar'};
         assert.equal("foo", Attr.processMergeAttributes(attr1, attr2, false)['attr:class']);
      });

      it('save attr:class', function (){
         var attr1 = {'class': 'bar'};
         var attr2 = {'attr:class': 'foo'};
         assert.equal("foo", Attr.processMergeAttributes(attr1, attr2, false)['attr:class']);
      });

      it('save native style', function (){
         var attr1 = {'attr:style': 'foo'};
         var attr2 = {'style': 'bar'};
         assert.equal("foo", Attr.processMergeAttributes(attr1, attr2, false)['attr:style']);
      });

      it('save style', function (){
         var attr1 = {'style': 'bar'};
         var attr2 = {'attr:style': 'foo'};
         assert.equal("foo", Attr.processMergeAttributes(attr1, attr2, false)['attr:style']);
      });

      it('native class and other', function (){
         var attr1 = {'class': 'bar'};
         var attr2 = {'attr:foo': 'foo'};
         assert.equal(undefined, Attr.processMergeAttributes(attr1, attr2, false)['attr:class']);
      });

      it('attr:class and other', function (){
         var attr1 = {'attr:class': 'bar'};
         var attr2 = {'attr:foo': 'foo'};
         assert.equal("bar", Attr.processMergeAttributes(attr1, attr2, false)['attr:class']);
      });

      it('other and native class', function (){
         var attr1 = {'attr:foo': 'foo'};
         var attr2 = {'class': 'bar'};
         assert.equal(undefined, Attr.processMergeAttributes(attr1, attr2, false)['attr:class']);
      });

      it('other and attr:class', function (){
         var attr1 = {'attr:foo': 'foo'};
         var attr2 = {'attr:class': 'bar'};
         assert.equal("bar", Attr.processMergeAttributes(attr1, attr2, false)['attr:class']);
      });

      it('native style and other', function (){
         var attr1 = {'style': 'bar'};
         var attr2 = {'attr:foo': 'foo'};
         assert.equal(undefined, Attr.processMergeAttributes(attr1, attr2, false)['attr:style']);
      });

      it('attr:style and other', function (){
         var attr1 = {'attr:style': 'bar'};
         var attr2 = {'attr:foo': 'foo'};
         assert.equal("bar", Attr.processMergeAttributes(attr1, attr2, false)['attr:style']);
      });

      it('other and native style', function (){
         var attr1 = {'attr:foo': 'foo'};
         var attr2 = {'style': 'bar'};
         assert.equal(undefined, Attr.processMergeAttributes(attr1, attr2, false)['attr:style']);
      });

      it('other and attr:style', function (){
         var attr1 = {'attr:foo': 'foo'};
         var attr2 = {'attr:style': 'bar'};
         assert.equal("bar", Attr.processMergeAttributes(attr1, attr2, false)['attr:style']);
      });

      it('should merge styles from one tag', function() {
         var attr2 = {
            'style': 'foo',
            'attr:style': 'bar'
         };
         assert.equal('bar', Attr.processMergeAttributes({}, attr2)['attr:style']);
         assert.equal('foo', Attr.processMergeAttributes({}, attr2, true).style);
      });

      it('should merge class from one tag', function() {
         var attr2 = {
            'class': 'foo',
            'attr:class': 'bar'
         };
         assert.equal('bar', Attr.processMergeAttributes({}, attr2)['attr:class']);
         assert.equal('foo', Attr.processMergeAttributes({}, attr2, true).class);
      });

      it('should merge styles', function() {
         var attr1 = {
            'style': 'foo1'
         };
         var attr2 = {
            'attr:style': 'bar',
            'style': 'foo'
         };

         assert.equal('bar', Attr.processMergeAttributes(attr1, attr2)['attr:style']);
         assert.equal('foo; foo1', Attr.processMergeAttributes(attr1, attr2, true).style);
      });

      it('should merge class', function () {
         var attr1 = {
            'class': 'foo1'
         };
         var attr2 = {
            'attr:class': 'bar',
            'class': 'foo'
         };

         assert.equal('bar', Attr.processMergeAttributes(attr1, attr2)['attr:class']);
         assert.equal('foo foo1', Attr.processMergeAttributes(attr1, attr2, true).class);
      });

      it('should take parent attribute with prefix and own attribute without prefix', function() {
         var attr1 = {
            bar: 'bar',
            'attr:foo1': 'foo1'
         };
         var attr2 = {
            style: 'foo',
            foo: 'foo'
         };

         assert.deepEqual({
            'attr:foo1': 'foo1',
            'style': 'foo',
            'foo': 'foo',
            'bar': 'bar'
         }, Attr.processMergeAttributes(attr1, attr2));
      });
   });
});
