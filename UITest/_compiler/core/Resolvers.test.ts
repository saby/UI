import * as Resolvers from 'UI/_builder/Tmpl/core/Resolvers';
import { assert } from 'chai';

// TODO: UI/_builder/Tmpl/* -> Compiler/*

describe('Compiler/core/Resolvers', () => {
   describe('.parseComponentPath()', () => {
      it('Component path', () => {
         const name = 'UIModule.Component';
         const path = Resolvers.parseComponentPath(name);
         assert.isFalse(!!(path.plugins ^ Resolvers.RequireJSPlugins.NONE));
         assert.deepEqual(path.physicalPath, ['UIModule', 'Component']);
         assert.deepEqual(path.logicalPath, []);
      });
      it('Component path (with special UI-module name)', () => {
         const name = 'SBIS3.CONTROLS.Component';
         const path = Resolvers.parseComponentPath(name);
         assert.isFalse(!!(path.plugins ^ Resolvers.RequireJSPlugins.NONE));
         assert.deepEqual(path.physicalPath, ['SBIS3.CONTROLS', 'Component']);
         assert.deepEqual(path.logicalPath, []);
      });
      it('Component module path', () => {
         const name = 'UIModule.Library:Component';
         const path = Resolvers.parseComponentPath(name);
         assert.isFalse(!!(path.plugins ^ Resolvers.RequireJSPlugins.NONE));
         assert.deepEqual(path.physicalPath, ['UIModule', 'Library']);
         assert.deepEqual(path.logicalPath, ['Component']);
      });
      it('Component module path (with special UI-module name)', () => {
         const name = 'SBIS3.CONTROLS.Library:Component';
         const path = Resolvers.parseComponentPath(name);
         assert.isFalse(!!(path.plugins ^ Resolvers.RequireJSPlugins.NONE));
         assert.deepEqual(path.physicalPath, ['SBIS3.CONTROLS', 'Library']);
         assert.deepEqual(path.logicalPath, ['Component']);
      });
   });
   describe('.parseTemplatePath()', () => {
      it('no plugins', () => {
         const physicalPath = 'UIModule/Directory/Template';
         const path = Resolvers.parseTemplatePath(physicalPath);
         assert.isFalse(!!(path.plugins ^ Resolvers.RequireJSPlugins.NONE));
         assert.deepEqual(path.physicalPath, ['UIModule', 'Directory', 'Template']);
         assert.deepEqual(path.logicalPath, []);
      });
      it('wml!', () => {
         const physicalPath = 'wml!UIModule/Directory/Template';
         const path = Resolvers.parseTemplatePath(physicalPath);
         assert.isTrue(!!(path.plugins & Resolvers.RequireJSPlugins.WML));
         assert.isFalse(!!(path.plugins ^ Resolvers.RequireJSPlugins.WML));
         assert.deepEqual(path.physicalPath, ['UIModule', 'Directory', 'Template']);
         assert.deepEqual(path.logicalPath, []);
      });
      it('tmpl! (with special UI-module name)', () => {
         const physicalPath = 'tmpl!UIModule/Directory/Template';
         const path = Resolvers.parseTemplatePath(physicalPath);
         assert.isTrue(!!(path.plugins & Resolvers.RequireJSPlugins.TMPL));
         assert.isFalse(!!(path.plugins ^ Resolvers.RequireJSPlugins.TMPL));
         assert.deepEqual(path.physicalPath, ['UIModule', 'Directory', 'Template']);
         assert.deepEqual(path.logicalPath, []);
      });
      it('optional!tmpl!', () => {
         const physicalPath = 'optional!tmpl!SBIS3.CONTROLS/Directory/Template';
         const path = Resolvers.parseTemplatePath(physicalPath);
         const plugins = Resolvers.RequireJSPlugins.TMPL | Resolvers.RequireJSPlugins.OPTIONAL;
         assert.isTrue(!!(path.plugins & plugins));
         assert.isFalse(!!(path.plugins ^ plugins));
         assert.deepEqual(path.physicalPath, ['SBIS3.CONTROLS', 'Directory', 'Template']);
         assert.deepEqual(path.logicalPath, []);
      });
   });
   describe('helpers', () => {
      it('isOption() -> true', () => {
         assert.isTrue(Resolvers.isOption('ws:option'));
      });
      it('isOption() -> false', () => {
         assert.isFalse(Resolvers.isOption('option'));
      });
      it('resolveOption() #1', () => {
         assert.strictEqual(Resolvers.resolveOption('ws:option'), 'option');
      });
      it('resolveOption() #2', () => {
         assert.strictEqual(Resolvers.resolveOption('option'), 'option');
      });
      it('isComponentName() # 1', () => {
         assert.isTrue(Resolvers.isComponent('Controls.buttons:Button'));
      });
      it('isComponentName() # 2', () => {
         assert.isTrue(Resolvers.isComponent('Contro1-s.b_77ons:Bu77on'));
      });
      it('isComponentName() # 3', () => {
         assert.isTrue(Resolvers.isComponent('Controls.buttons.Button'));
      });
      it('isComponentName() # 4', () => {
         assert.isTrue(Resolvers.isComponent('Controls.Button'));
      });
      it('isComponentName() # 5', () => {
         assert.isFalse(Resolvers.isComponent('Control'));
      });
   });
});
