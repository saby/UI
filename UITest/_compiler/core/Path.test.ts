import * as Path from 'UI/_builder/Tmpl/core/Path';
import { assert } from 'chai';

// TODO: UI/_builder/Tmpl/* -> Compiler/*

describe('Compiler/core/Path', () => {
   describe('parseComponentName() Simple', () => {
      const COMPONENT_NAME = 'UIModule.Component';
      it('getFullPath()', () => {
         const path = Path.parseComponentName(COMPONENT_NAME);
         assert.strictEqual(path.getFullPath(), 'UIModule/Component');
      });
      it('getFullPath() with special UI module name', () => {
         const path = Path.parseComponentName('SBIS3.CONTROLS.Component');
         assert.strictEqual(path.getFullPath(), 'SBIS3.CONTROLS/Component');
      });
      it('getFullPhysicalPath()', () => {
         const path = Path.parseComponentName(COMPONENT_NAME);
         assert.strictEqual(path.getFullPhysicalPath(), 'UIModule/Component');
      });
      it('getLogicalPath()', () => {
         const path = Path.parseComponentName(COMPONENT_NAME);
         assert.deepEqual(path.getLogicalPath(), []);
      });
      it('hasLogicalPath()', () => {
         const path = Path.parseComponentName(COMPONENT_NAME);
         assert.isFalse(path.hasLogicalPath());
      });
      it('hasPlugins()', () => {
         const path = Path.parseComponentName(COMPONENT_NAME);
         assert.isFalse(path.hasPlugins());
      });
   });
   describe('parseComponentName() Module', () => {
      const COMPONENT_NAME = 'UIModule.Module:Component';
      it('getFullPath()', () => {
         const path = Path.parseComponentName(COMPONENT_NAME);
         assert.strictEqual(path.getFullPath(), 'UIModule/Module:Component');
      });
      it('getFullPath() with special UI module name', () => {
         const path = Path.parseComponentName('SBIS3.CONTROLS.Module:Component');
         assert.strictEqual(path.getFullPath(), 'SBIS3.CONTROLS/Module:Component');
      });
      it('getFullPhysicalPath()', () => {
         const path = Path.parseComponentName(COMPONENT_NAME);
         assert.strictEqual(path.getFullPhysicalPath(), 'UIModule/Module');
      });
      it('getLogicalPath()', () => {
         const path = Path.parseComponentName(COMPONENT_NAME);
         assert.deepEqual(path.getLogicalPath(), ['Component']);
      });
      it('hasLogicalPath()', () => {
         const path = Path.parseComponentName(COMPONENT_NAME);
         assert.isTrue(path.hasLogicalPath());
      });
      it('hasPlugins()', () => {
         const path = Path.parseComponentName(COMPONENT_NAME);
         assert.isFalse(path.hasPlugins());
      });
   });
   describe('parseFunctionPath()', () => {
      const FUNCTION_PATH = 'UIModule/Module:object.handler';
      it('getFullPath()', () => {
         const path = Path.parseFunctionPath(FUNCTION_PATH);
         assert.strictEqual(path.getFullPath(), FUNCTION_PATH);
      });
      it('getFullPath() with special UI module name', () => {
         const path = Path.parseTemplatePath('SBIS3.CONTROLS/Module:object.handler');
         assert.strictEqual(path.getFullPath(), 'SBIS3.CONTROLS/Module:object.handler');
      });
      it('getFullPhysicalPath()', () => {
         const path = Path.parseFunctionPath(FUNCTION_PATH);
         assert.strictEqual(path.getFullPhysicalPath(), 'UIModule/Module');
      });
      it('getLogicalPath()', () => {
         const path = Path.parseFunctionPath(FUNCTION_PATH);
         assert.deepEqual(path.getLogicalPath(), ['object', 'handler']);
      });
      it('hasLogicalPath()', () => {
         const path = Path.parseFunctionPath(FUNCTION_PATH);
         assert.isTrue(path.hasLogicalPath());
      });
      it('hasPlugins()', () => {
         const path = Path.parseFunctionPath(FUNCTION_PATH);
         assert.isFalse(path.hasPlugins());
      });
   });
   describe('parseTemplatePath() Plugin', () => {
      const TEMPLATE_PATH = 'wml!UIModule/Directory/Template';
      it('getFullPath()', () => {
         const path = Path.parseTemplatePath(TEMPLATE_PATH);
         assert.strictEqual(path.getFullPath(), TEMPLATE_PATH);
      });
      it('getFullPhysicalPath()', () => {
         const path = Path.parseTemplatePath(TEMPLATE_PATH);
         assert.strictEqual(path.getFullPhysicalPath(), TEMPLATE_PATH);
      });
      it('getLogicalPath()', () => {
         const path = Path.parseTemplatePath(TEMPLATE_PATH);
         assert.deepEqual(path.getLogicalPath(), []);
      });
      it('hasLogicalPath()', () => {
         const path = Path.parseTemplatePath(TEMPLATE_PATH);
         assert.isFalse(path.hasLogicalPath());
      });
      it('hasPlugins()', () => {
         const path = Path.parseTemplatePath(TEMPLATE_PATH);
         assert.isTrue(path.hasPlugins());
      });
   });
   describe('parseTemplatePath() Simple', () => {
      const TEMPLATE_AS_SIMPLE_PATH = 'UIModule/Module/Template';
      it('getFullPath()', () => {
         const path = Path.parseComponentName(TEMPLATE_AS_SIMPLE_PATH);
         assert.strictEqual(path.getFullPath(), TEMPLATE_AS_SIMPLE_PATH);
      });
      it('getFullPath() with special UI module name', () => {
         const path = Path.parseComponentName('SBIS3.CONTROLS/Module/Template');
         assert.strictEqual(path.getFullPath(), 'SBIS3.CONTROLS/Module/Template');
      });
      it('getFullPhysicalPath()', () => {
         const path = Path.parseComponentName(TEMPLATE_AS_SIMPLE_PATH);
         assert.strictEqual(path.getFullPhysicalPath(), TEMPLATE_AS_SIMPLE_PATH);
      });
      it('getLogicalPath()', () => {
         const path = Path.parseComponentName(TEMPLATE_AS_SIMPLE_PATH);
         assert.deepEqual(path.getLogicalPath(), []);
      });
      it('hasLogicalPath()', () => {
         const path = Path.parseComponentName(TEMPLATE_AS_SIMPLE_PATH);
         assert.isFalse(path.hasLogicalPath());
      });
      it('hasPlugins()', () => {
         const path = Path.parseComponentName(TEMPLATE_AS_SIMPLE_PATH);
         assert.isFalse(path.hasPlugins());
      });
   });
   describe('parseTemplatePath() Module', () => {
      const TEMPLATE_AS_COMPONENT_PATH = 'UIModule/Module:Component';
      it('getFullPath()', () => {
         const path = Path.parseTemplatePath(TEMPLATE_AS_COMPONENT_PATH);
         assert.strictEqual(path.getFullPath(), 'UIModule/Module:Component');
      });
      it('getFullPath() with special UI module name', () => {
         const path = Path.parseTemplatePath('SBIS3.CONTROLS/Module:Component');
         assert.strictEqual(path.getFullPath(), 'SBIS3.CONTROLS/Module:Component');
      });
      it('getFullPhysicalPath()', () => {
         const path = Path.parseTemplatePath(TEMPLATE_AS_COMPONENT_PATH);
         assert.strictEqual(path.getFullPhysicalPath(), 'UIModule/Module');
      });
      it('getLogicalPath()', () => {
         const path = Path.parseTemplatePath(TEMPLATE_AS_COMPONENT_PATH);
         assert.deepEqual(path.getLogicalPath(), ['Component']);
      });
      it('hasLogicalPath()', () => {
         const path = Path.parseTemplatePath(TEMPLATE_AS_COMPONENT_PATH);
         assert.isTrue(path.hasLogicalPath());
      });
      it('hasPlugins()', () => {
         const path = Path.parseTemplatePath(TEMPLATE_AS_COMPONENT_PATH);
         assert.isFalse(path.hasPlugins());
      });
   });
});
