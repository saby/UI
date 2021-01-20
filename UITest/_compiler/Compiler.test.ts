import { Compiler } from 'Compiler/Compiler';
import { assert } from 'chai';

describe('Compiler/Compiler', () => {
   let compiler;
   beforeEach(() => {
      compiler = new Compiler();
   });
   it('Stable', (done) => {
      const html = '<div></div>';
      let options = {
         fileName: 'Compiler/Compiler/Template.wml'
      };
      compiler.compile(html, options)
         .then(function(artifact) {
            try {
               assert.isTrue(artifact.stable);
               assert.strictEqual(artifact.nodeName, 'wml!Compiler/Compiler/Template');
               assert.strictEqual(typeof artifact.text, 'string');
               done();
            } catch (error) {
               done(error);
            }
         })
         .catch(function(artifact) {
            done(artifact.errors.pop());
         });
   });
   it('Broken', (done) => {
      const html = '<div>';
      let options = {
         fileName: 'Compiler/Compiler/Template.wml',
         fromBuilderTmpl: true
      };
      compiler.compile(html, options)
         .then(function() {
            done(new Error('Must be broken'));
            done();
         })
         .catch(function(artifact) {
            try {
               assert.isFalse(artifact.stable);
               assert.strictEqual(artifact.nodeName, 'wml!Compiler/Compiler/Template');
               assert.strictEqual(artifact.errors[0].message, 'Template Compiler: Обнаружен незакрытый тег "div". Строка: 1, столбец: 5');
               done();
            } catch (error) {
               done(error);
            }
         });
   });
   it('Wml plugin detection', (done) => {
      const html = '<div></div>';
      let options = {
         fileName: 'Compiler/Compiler/Template.wml'
      };
      compiler.compile(html, options)
         .then(function(artifact) {
            try {
               assert.strictEqual(artifact.text.indexOf("define('wml!Compiler/Compiler/Template'"), 0);
               assert.strictEqual(artifact.nodeName, 'wml!Compiler/Compiler/Template');
               done();
            } catch (error) {
               done(error);
            }
         })
         .catch(function(artifact) {
            done(artifact.errors.pop());
         });
   });
   it('Tmpl plugin detection', (done) => {
      const html = '<div></div>';
      let options = {
         fileName: 'Compiler/Compiler/Template.tmpl'
      };
      compiler.compile(html, options)
         .then(function(artifact) {
            try {
               assert.strictEqual(artifact.text.indexOf("define('tmpl!Compiler/Compiler/Template'"), 0);
               assert.strictEqual(artifact.nodeName, 'tmpl!Compiler/Compiler/Template');
               done();
            } catch (error) {
               done(error);
            }
         })
         .catch(function(artifact) {
            done(artifact.errors.pop());
         });
   });
   it('From builder (true)', (done) => {
      const html = '<Control.Test />';
      let options = {
         fileName: 'Compiler/Compiler/Template.wml',
         fromBuilderTmpl: true
      };
      compiler.compile(html, options)
         .then(function(artifact) {
            try {
               assert.isTrue(artifact.stable);
               done();
            } catch (error) {
               done(error);
            }
         })
         .catch(function(artifact) {
            done(artifact.errors.pop());
         });
   });
   it('Create dictionary', (done) => {
      const html = '<div>Hello</div>';
      let options = {
         fileName: 'Compiler/Compiler/Template.wml',
         createResultDictionary: true
      };
      compiler.compile(html, options)
         .then(function(artifact) {
            try {
               assert.isTrue(artifact.hasOwnProperty('localizedDictionary'));
               assert.strictEqual(artifact.localizedDictionary[0].key, 'Hello');
               assert.strictEqual(artifact.localizedDictionary[0].context, '');
               assert.strictEqual(artifact.localizedDictionary[0].module, 'Compiler/Compiler/Template');
               done();
            } catch (error) {
               done(error);
            }
         })
         .catch(function(artifact) {
            done(artifact.errors.pop());
         });
   });
});
