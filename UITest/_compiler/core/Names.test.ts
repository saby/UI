import * as Names from 'UI/_builder/Tmpl/core/Names';
import { assert } from 'chai';

// TODO: UI/_builder/Tmpl/* -> Compiler/*

describe('Compiler/core/Names', () => {
   it('isAttribute() -> true', () => {
      assert.isTrue(Names.isAttribute('attr:class'));
   });
   it('isAttribute() -> false', () => {
      assert.isFalse(Names.isAttribute('ws:attr:class'));
   });
   it('getAttributeName() #1', () => {
      assert.strictEqual(Names.getAttributeName('attr:class'), 'class');
   });
   it('getAttributeName() #2', () => {
      assert.strictEqual(Names.getAttributeName('class'), 'class');
   });

   it('isBind() -> true', () => {
      assert.isTrue(Names.isBind('bind:value'));
   });
   it('isBind() -> false', () => {
      assert.isFalse(Names.isBind('ws:bind:value'));
   });
   it('getBindName() #1', () => {
      assert.strictEqual(Names.getBindName('bind:value'), 'value');
   });
   it('getBindName() #2', () => {
      assert.strictEqual(Names.getBindName('value'), 'value');
   });

   it('isEvent() -> true', () => {
      assert.isTrue(Names.isEvent('on:click'));
   });
   it('isEvent() -> false', () => {
      assert.isFalse(Names.isEvent('ws:on:click'));
   });
   it('getEventName() #1', () => {
      assert.strictEqual(Names.getEventName('on:click'), 'click');
   });
   it('getEventName() #2', () => {
      assert.strictEqual(Names.getEventName('click'), 'click');
   });

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
