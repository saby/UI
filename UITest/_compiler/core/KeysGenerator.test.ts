import { createKeysGenerator } from 'UI/_builder/Tmpl/core/KeysGenerator';
import { assert } from 'chai';

// TODO: UI/_builder/Tmpl/* -> Compiler/*

describe('Compiler/core/KeysGenerator', () => {
   describe('HierarchicalKeysGenerator', () => {
      it('init', () => {
         const generator = createKeysGenerator(true);
         assert.strictEqual(generator.generate(), '_');
      });
      it('init opened', () => {
         const generator = createKeysGenerator(true);
         generator.openChildren(); // root
         assert.strictEqual(generator.generate(), '0_');
      });
      it('first child', () => {
         const generator = createKeysGenerator(true);
         generator.openChildren(); // root
         generator.openChildren(); // child
         assert.strictEqual(generator.generate(), '0_0_');
      });
      it('first sibling', () => {
         const generator = createKeysGenerator(true);
         generator.openChildren(); // root
         generator.generate(); // 0_
         generator.openChildren(); // child 1
         generator.generate(); // 0_0_
         generator.closeChildren();
         assert.strictEqual(generator.generate(), '1_');
      });
   });
   describe('FlatKeysGenerator', () => {
      it('init', () => {
         const generator = createKeysGenerator(false);
         assert.strictEqual(generator.generate(), '0_');
      });
      it('init opened', () => {
         const generator = createKeysGenerator(false);
         generator.openChildren(); // root
         assert.strictEqual(generator.generate(), '0_');
      });
      it('first child', () => {
         const generator = createKeysGenerator(false);
         generator.openChildren(); // root
         generator.openChildren(); // child
         assert.strictEqual(generator.generate(), '0_');
      });
      it('first sibling', () => {
         const generator = createKeysGenerator(false);
         generator.openChildren(); // root
         generator.generate(); // 0_
         generator.openChildren(); // child 1
         generator.generate(); // 1_
         generator.closeChildren();
         assert.strictEqual(generator.generate(), '2_');
      });
   });
});
