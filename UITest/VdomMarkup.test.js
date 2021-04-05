/* global define, describe, it, assert */
define([
   'UI/Vdom',
   'UI/Executor'
], (
   Vdom,
   Executor
) => {
   'use strict';

   var VdomMarkup = Vdom.VdomMarkup;

   describe('UI/_vdom/Synchronizer/resources/VdomMarkup', () => {
      describe('getMarkupDiff', () => {
         const createTemplateNodeMock = (key, children) => ({
            key: key,
            children: children,
            type: 'TemplateNode'
         });
         it('Template node with template children, goin is true', () => {
            const oldTemplateNode = createTemplateNodeMock('1', []);
            const newTemplateNode = createTemplateNodeMock('1', []);
            for (let i = 0; i < 10; ++i) {
               oldTemplateNode.children.push(createTemplateNodeMock('1_' + i, []));
            }
            for (let i = 5; i < 15; ++i) {
               newTemplateNode.children.push(createTemplateNodeMock('1_' + i));
            }
            const diff = VdomMarkup.getMarkupDiff(oldTemplateNode, newTemplateNode, true, true);
            assert.equal(diff.createTemplates.length, 5);
            assert.equal(diff.updateTemplates.length, 5);
            assert.equal(diff.destroyTemplates.length, 5);
            assert.equal(diff.updateTemplates[0].oldNode.key, '1_5');
            assert.equal(diff.destroyTemplates[0].key, '1_0');
            assert.equal(diff.createTemplates[0].key, '1_10');
            assert.equal(diff.updateTemplates[0].oldNode.key, diff.updateTemplates[0].newNode.key);
         });
      });
   });
   describe('UI/_executor/_Markup/Generator', () => {
      describe('chain Promise function', () => {
         let generator, out;
         beforeEach(function() {
            generator = Executor.createGenerator(true);
            out = '[def-0]';
         });
         it('Promise return "string"', (done) => {
            let promise = new Promise((resolve) => {
               resolve();
            }).then(() => {
               return 'string';
            });
            let defCollection = {id: [out], def: [promise]};
            generator.chain(out, defCollection).then((result) => {
               try {
                  assert.equal(result, 'string');
                  done();
               } catch (error) {
                  done(error);
               }
            });
         });

         it('Promise return "object"', (done) => {
            let promise = new Promise((resolve) => {
               resolve();
            }).then(() => {
               return {value: 'string'};
            });
            let defCollection = {id: [out], def: [promise]};
            generator.chain(out, defCollection).then((result) => {
               try {
                  assert.equal(result, {});
                  done();
               } catch (error) {
                  done(error);
               }
            });
         });

         it('Promise without return', (done) => {
            let promise = new Promise((resolve) => {
               resolve();
            });
            let defCollection = {id: [out], def: [promise]};
            generator.chain(out, defCollection).then((result) => {
               try {
                  assert.equal(result, '');
                  done();
               } catch (error) {
                  done(error);
               }
            });
         });

         it('Promise without return with sting', (done) => {
            let promise = new Promise((resolve) => {
               resolve();
            });
            out = 'string' + out;
            let defCollection = {id: [out], def: [promise]};
            generator.chain(out, defCollection).then((result) => {
               try {
                  assert.equal(result, 'string');
                  done();
               } catch (error) {
                  done(error);
               }
            });
         });
      });
   });
});
