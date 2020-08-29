import * as Names from 'UI/_builder/Tmpl/core/Names';
import { assert } from 'chai';

// TODO: UI/_builder/Tmpl/* -> Compiler/*

describe('Compiler/core/Names', () => {
   it('isComponentOptionName() -> true', () => {
      assert.isTrue(Names.isComponentOptionName('ws:option'));
   });
   it('isComponentOptionName() -> false', () => {
      assert.isFalse(Names.isComponentOptionName('option'));
   });
   it('getComponentOptionName() #1', () => {
      assert.strictEqual(Names.getComponentOptionName('ws:option'), 'option');
   });
   it('getComponentOptionName() #2', () => {
      assert.strictEqual(Names.getComponentOptionName('option'), 'option');
   });

   it('isComponentName() # 1', () => {
      assert.isTrue(Names.isComponentName('Controls.buttons:Button'));
   });

   it('isComponentName() # 2', () => {
      assert.isTrue(Names.isComponentName('Contro1-s.b_77ons:Bu77on'));
   });

   it('isComponentName() # 3', () => {
      assert.isTrue(Names.isComponentName('Controls.buttons.Button'));
   });

   it('isComponentName() # 4', () => {
      assert.isTrue(Names.isComponentName('Controls.Button'));
   });

   it('isComponentName() # 5', () => {
      assert.isFalse(Names.isComponentName('Control'));
   });
});
