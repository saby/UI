import * as Resolvers from 'Compiler/core/Resolvers';
import { assert } from 'chai';

describe('Compiler/core/Resolvers', () => {
   describe('parseComponentName() Simple', () => {
      const COMPONENT_NAME = 'UIModule.Component';
      it('getFullPath()', () => {
         const path = Resolvers.parseComponentName(COMPONENT_NAME);
         assert.strictEqual(path.getFullPath(), 'UIModule/Component');
      });
      it('getFullPath() with special UI module name', () => {
         const path = Resolvers.parseComponentName('SBIS3.CONTROLS.Component');
         assert.strictEqual(path.getFullPath(), 'SBIS3.CONTROLS/Component');
      });
      it('getFullPhysicalPath()', () => {
         const path = Resolvers.parseComponentName(COMPONENT_NAME);
         assert.strictEqual(path.getFullPhysicalPath(), 'UIModule/Component');
      });
      it('getLogicalPath()', () => {
         const path = Resolvers.parseComponentName(COMPONENT_NAME);
         assert.deepEqual(path.getLogicalPath(), []);
      });
      it('hasLogicalPath()', () => {
         const path = Resolvers.parseComponentName(COMPONENT_NAME);
         assert.isFalse(path.hasLogicalPath());
      });
      it('hasPlugins()', () => {
         const path = Resolvers.parseComponentName(COMPONENT_NAME);
         assert.isFalse(path.hasPlugins());
      });
   });
   describe('parseComponentName() Module', () => {
      const COMPONENT_NAME = 'UIModule.Module:Component';
      it('getFullPath()', () => {
         const path = Resolvers.parseComponentName(COMPONENT_NAME);
         assert.strictEqual(path.getFullPath(), 'UIModule/Module:Component');
      });
      it('getFullPath() with special UI module name', () => {
         const path = Resolvers.parseComponentName('SBIS3.CONTROLS.Module:Component');
         assert.strictEqual(path.getFullPath(), 'SBIS3.CONTROLS/Module:Component');
      });
      it('getFullPhysicalPath()', () => {
         const path = Resolvers.parseComponentName(COMPONENT_NAME);
         assert.strictEqual(path.getFullPhysicalPath(), 'UIModule/Module');
      });
      it('getLogicalPath()', () => {
         const path = Resolvers.parseComponentName(COMPONENT_NAME);
         assert.deepEqual(path.getLogicalPath(), ['Component']);
      });
      it('hasLogicalPath()', () => {
         const path = Resolvers.parseComponentName(COMPONENT_NAME);
         assert.isTrue(path.hasLogicalPath());
      });
      it('hasPlugins()', () => {
         const path = Resolvers.parseComponentName(COMPONENT_NAME);
         assert.isFalse(path.hasPlugins());
      });
   });
   describe('parseFunctionPath()', () => {
      const FUNCTION_PATH = 'UIModule/Module:object.handler';
      const FUNCTION_PATH_2 = 'UIModule/Module/handler';
      it('getFullPath()', () => {
         const path = Resolvers.parseFunctionPath(FUNCTION_PATH);
         assert.strictEqual(path.getFullPath(), FUNCTION_PATH);
      });
      it('getFullPath() 2', () => {
         const path = Resolvers.parseFunctionPath(FUNCTION_PATH_2);
         assert.strictEqual(path.getFullPath(), FUNCTION_PATH_2);
      });
      it('getFullPath() with special UI module name', () => {
         const path = Resolvers.parseTemplatePath('SBIS3.CONTROLS/Module:object.handler');
         assert.strictEqual(path.getFullPath(), 'SBIS3.CONTROLS/Module:object.handler');
      });
      it('getFullPath() with special UI module name 2', () => {
         const path = Resolvers.parseTemplatePath('SBIS3.CONTROLS/Module/handler');
         assert.strictEqual(path.getFullPath(), 'SBIS3.CONTROLS/Module/handler');
      });
      it('getFullPhysicalPath()', () => {
         const path = Resolvers.parseFunctionPath(FUNCTION_PATH);
         assert.strictEqual(path.getFullPhysicalPath(), 'UIModule/Module');
      });
      it('getFullPhysicalPath() 2', () => {
         const path = Resolvers.parseFunctionPath(FUNCTION_PATH_2);
         assert.strictEqual(path.getFullPhysicalPath(), FUNCTION_PATH_2);
      });
      it('getLogicalPath()', () => {
         const path = Resolvers.parseFunctionPath(FUNCTION_PATH);
         assert.deepEqual(path.getLogicalPath(), ['object', 'handler']);
      });
      it('hasLogicalPath()', () => {
         const path = Resolvers.parseFunctionPath(FUNCTION_PATH);
         assert.isTrue(path.hasLogicalPath());
      });
      it('hasLogicalPath()', () => {
         const path = Resolvers.parseFunctionPath(FUNCTION_PATH_2);
         assert.isFalse(path.hasLogicalPath());
      });
      it('hasPlugins()', () => {
         const path = Resolvers.parseFunctionPath(FUNCTION_PATH);
         assert.isFalse(path.hasPlugins());
      });
      it('hasPlugins() 2', () => {
         const path = Resolvers.parseFunctionPath(FUNCTION_PATH_2);
         assert.isFalse(path.hasPlugins());
      });
   });
   describe('parseTemplatePath() Plugin', () => {
      const TEMPLATE_PATH = 'wml!UIModule/Directory/Template';
      it('getFullPath()', () => {
         const path = Resolvers.parseTemplatePath(TEMPLATE_PATH);
         assert.strictEqual(path.getFullPath(), TEMPLATE_PATH);
      });
      it('getFullPhysicalPath()', () => {
         const path = Resolvers.parseTemplatePath(TEMPLATE_PATH);
         assert.strictEqual(path.getFullPhysicalPath(), TEMPLATE_PATH);
      });
      it('getLogicalPath()', () => {
         const path = Resolvers.parseTemplatePath(TEMPLATE_PATH);
         assert.deepEqual(path.getLogicalPath(), []);
      });
      it('hasLogicalPath()', () => {
         const path = Resolvers.parseTemplatePath(TEMPLATE_PATH);
         assert.isFalse(path.hasLogicalPath());
      });
      it('hasPlugins()', () => {
         const path = Resolvers.parseTemplatePath(TEMPLATE_PATH);
         assert.isTrue(path.hasPlugins());
      });
   });
   describe('parseTemplatePath() Simple', () => {
      const TEMPLATE_AS_SIMPLE_PATH = 'UIModule/Module/Template';
      it('getFullPath()', () => {
         const path = Resolvers.parseComponentName(TEMPLATE_AS_SIMPLE_PATH);
         assert.strictEqual(path.getFullPath(), TEMPLATE_AS_SIMPLE_PATH);
      });
      it('getFullPath() with special UI module name', () => {
         const path = Resolvers.parseComponentName('SBIS3.CONTROLS/Module/Template');
         assert.strictEqual(path.getFullPath(), 'SBIS3.CONTROLS/Module/Template');
      });
      it('getFullPhysicalPath()', () => {
         const path = Resolvers.parseComponentName(TEMPLATE_AS_SIMPLE_PATH);
         assert.strictEqual(path.getFullPhysicalPath(), TEMPLATE_AS_SIMPLE_PATH);
      });
      it('getLogicalPath()', () => {
         const path = Resolvers.parseComponentName(TEMPLATE_AS_SIMPLE_PATH);
         assert.deepEqual(path.getLogicalPath(), []);
      });
      it('hasLogicalPath()', () => {
         const path = Resolvers.parseComponentName(TEMPLATE_AS_SIMPLE_PATH);
         assert.isFalse(path.hasLogicalPath());
      });
      it('hasPlugins()', () => {
         const path = Resolvers.parseComponentName(TEMPLATE_AS_SIMPLE_PATH);
         assert.isFalse(path.hasPlugins());
      });
   });
   describe('parseTemplatePath() Module', () => {
      const TEMPLATE_AS_COMPONENT_PATH = 'UIModule/Module:Component';
      it('getFullPath()', () => {
         const path = Resolvers.parseTemplatePath(TEMPLATE_AS_COMPONENT_PATH);
         assert.strictEqual(path.getFullPath(), 'UIModule/Module:Component');
      });
      it('getFullPath() with special UI module name', () => {
         const path = Resolvers.parseTemplatePath('SBIS3.CONTROLS/Module:Component');
         assert.strictEqual(path.getFullPath(), 'SBIS3.CONTROLS/Module:Component');
      });
      it('getFullPhysicalPath()', () => {
         const path = Resolvers.parseTemplatePath(TEMPLATE_AS_COMPONENT_PATH);
         assert.strictEqual(path.getFullPhysicalPath(), 'UIModule/Module');
      });
      it('getLogicalPath()', () => {
         const path = Resolvers.parseTemplatePath(TEMPLATE_AS_COMPONENT_PATH);
         assert.deepEqual(path.getLogicalPath(), ['Component']);
      });
      it('hasLogicalPath()', () => {
         const path = Resolvers.parseTemplatePath(TEMPLATE_AS_COMPONENT_PATH);
         assert.isTrue(path.hasLogicalPath());
      });
      it('hasPlugins()', () => {
         const path = Resolvers.parseTemplatePath(TEMPLATE_AS_COMPONENT_PATH);
         assert.isFalse(path.hasPlugins());
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
