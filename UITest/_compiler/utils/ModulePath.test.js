/* global describe, it, assert */
define(['Compiler/utils/ModulePath'], function(ModulePathLib) {
   'use strict';
   const ModulePath = ModulePathLib.ModulePath;

   describe('Compiler/utils/ModulePath', function() {
      it('create wml', function() {
         const modulePath = new ModulePath('Control/button/template.wml');
         assert.strictEqual(modulePath.module, 'Control/button/template');
         assert.strictEqual(modulePath.extension, 'wml');
      });
      it('create tmpl', function() {
         const modulePath = new ModulePath('Control/button/template.tmpl');
         assert.strictEqual(modulePath.module, 'Control/button/template');
         assert.strictEqual(modulePath.extension, 'tmpl');
      });
      it('create xhtml', function() {
         const modulePath = new ModulePath('Control/button/template.xhtml');
         assert.strictEqual(modulePath.module, 'Control/button/template');
         assert.strictEqual(modulePath.extension, 'xhtml');
      });
      it('create incorrect', function() {
         try {
            // eslint-disable-next-line no-new
            new ModulePath('Control/button/template.css');
         } catch (error) {
            assert.strictEqual(error.message, 'Некоррекно задан путь к шаблону: ожидался путь от интерфейсного модуля до самого файла с его расширением');
         }
      });
      it('.getInterfaceModule()', function() {
         const modulePath = new ModulePath('Control/button/template.wml');
         assert.strictEqual(modulePath.getInterfaceModule(), 'Control');
      });
   });
});
