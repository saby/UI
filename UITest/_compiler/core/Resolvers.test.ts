import * as Resolvers from 'UI/_builder/Tmpl/core/Resolvers';
import { assert } from 'chai';

// TODO: UI/_builder/Tmpl/* -> Compiler/*

describe('Compiler/core/Resolvers', () => {
   describe('getPhysicalPathDescription()', () => {
      it('no plugins', () => {
         const physicalPath = 'UIModule/Directory/File';
         const description = Resolvers.getPhysicalPathDescription(physicalPath);
         assert.strictEqual(description.physicalPath, physicalPath);
         assert.isFalse(!!(description.plugins ^ Resolvers.RequireJSPlugins.NONE));
      });
      it('tmpl!', () => {
         const physicalPath = 'UIModule/Directory/File';
         const path = `tmpl!${physicalPath}`;
         const description = Resolvers.getPhysicalPathDescription(path);
         assert.strictEqual(description.physicalPath, physicalPath);
         assert.isTrue(!!(description.plugins & Resolvers.RequireJSPlugins.TMPL));
         assert.isFalse(!!(description.plugins ^ Resolvers.RequireJSPlugins.TMPL));
      });
      it('optional!tmpl!', () => {
         const physicalPath = 'UIModule/Directory/File';
         const path = `optional!tmpl!${physicalPath}`;
         const description = Resolvers.getPhysicalPathDescription(path);
         assert.strictEqual(description.physicalPath, physicalPath);
         const plugins = Resolvers.RequireJSPlugins.TMPL | Resolvers.RequireJSPlugins.OPTIONAL;
         assert.isTrue(!!(description.plugins & plugins));
         assert.isFalse(!!(description.plugins ^ plugins));
      });
   });
});

// TODO: in development...
// describe('Compiler/core/Resolvers', () => {
//    it('isComponentOptionName() -> true', () => {
//       assert.isTrue(Resolvers.isComponentOptionName('ws:option'));
//    });
//    it('isComponentOptionName() -> false', () => {
//       assert.isFalse(Resolvers.isComponentOptionName('option'));
//    });
//    it('getComponentOptionName() #1', () => {
//       assert.strictEqual(Resolvers.getComponentOptionName('ws:option'), 'option');
//    });
//    it('getComponentOptionName() #2', () => {
//       assert.strictEqual(Resolvers.getComponentOptionName('option'), 'option');
//    });
//
//    it('isComponentName() # 1', () => {
//       assert.isTrue(Resolvers.isComponentName('Controls.buttons:Button'));
//    });
//
//    it('isComponentName() # 2', () => {
//       assert.isTrue(Resolvers.isComponentName('Contro1-s.b_77ons:Bu77on'));
//    });
//
//    it('isComponentName() # 3', () => {
//       assert.isTrue(Resolvers.isComponentName('Controls.buttons.Button'));
//    });
//
//    it('isComponentName() # 4', () => {
//       assert.isTrue(Resolvers.isComponentName('Controls.Button'));
//    });
//
//    it('isComponentName() # 5', () => {
//       assert.isFalse(Resolvers.isComponentName('Control'));
//    });
// });
