import { createSource } from 'Compiler/html/Source';
import Reader from 'Compiler/html/Reader';
import { assert } from 'chai';

const EOF = null;

const FILE_NAME = 'Compiler/html/Reader/TestTemplate.wml';

function createReader(data) {
   const source = createSource(data, FILE_NAME, true);
   return new Reader(source);
}

describe('Compiler/html/Reader', () => {
   it('.consume()', () => {
      const reader = createReader('ab');
      assert.strictEqual(reader.consume(), 'a');
      assert.strictEqual(reader.consume(), 'b');
      assert.strictEqual(reader.consume(), EOF);
   });
   it('.hasNext()', () => {
      const reader = createReader('ab');
      assert.isTrue(reader.hasNext());
      assert.strictEqual(reader.consume(), 'a');
      assert.isTrue(reader.hasNext());
      assert.strictEqual(reader.consume(), 'b');
      assert.isFalse(reader.hasNext());
      assert.strictEqual(reader.consume(), EOF);
   });
   it('.consume() preprocessed', () => {
      const reader = createReader('a\nb\n\rc\r\nd');
      assert.strictEqual(reader.consume(), 'a');
      assert.strictEqual(reader.consume(), '\n');
      assert.strictEqual(reader.consume(), 'b');
      assert.strictEqual(reader.consume(), '\n');
      assert.strictEqual(reader.consume(), 'c');
      assert.strictEqual(reader.consume(), '\n');
      assert.strictEqual(reader.consume(), '\n');
      assert.strictEqual(reader.consume(), 'd');
      assert.strictEqual(reader.consume(), EOF);
   });
   it('.reconsume() before first', () => {
      const reader = createReader('ab');
      reader.reconsume();
      assert.strictEqual(reader.consume(), 'a');
      assert.strictEqual(reader.consume(), 'b');
      assert.strictEqual(reader.consume(), EOF);
   });
   it('.reconsume()', () => {
      const reader = createReader('ab');
      assert.strictEqual(reader.consume(), 'a');
      reader.reconsume();
      assert.strictEqual(reader.consume(), 'a');
      assert.strictEqual(reader.consume(), 'b');
      assert.strictEqual(reader.consume(), EOF);
   });
   it('.reconsume() after EOF', () => {
      const reader = createReader('ab');
      assert.strictEqual(reader.consume(), 'a');
      assert.strictEqual(reader.consume(), 'b');
      assert.strictEqual(reader.consume(), EOF);
      reader.reconsume();
      assert.strictEqual(reader.consume(), EOF);
   });
   it('.getPosition().column', () => {
      const reader = createReader('ab');

      assert.strictEqual(reader.consume(), 'a');
      assert.strictEqual(reader.getPosition().column, 0);

      assert.strictEqual(reader.consume(), 'b');
      assert.strictEqual(reader.getPosition().column, 1);

      assert.strictEqual(reader.consume(), EOF);
      assert.strictEqual(reader.getPosition().column, 2);
   });
   it('.getPosition().column re-consumed', () => {
      const reader = createReader('ab');

      assert.strictEqual(reader.consume(), 'a');
      assert.strictEqual(reader.getPosition().column, 0);

      assert.strictEqual(reader.consume(), 'b');
      assert.strictEqual(reader.getPosition().column, 1);

      reader.reconsume();
      assert.strictEqual(reader.consume(), 'b');
      assert.strictEqual(reader.getPosition().column, 1);

      assert.strictEqual(reader.consume(), EOF);
      assert.strictEqual(reader.getPosition().column, 2);
   });
   it('.getPosition().column after EOF', () => {
      const reader = createReader('a');

      assert.strictEqual(reader.consume(), 'a');
      assert.strictEqual(reader.getPosition().column, 0);

      assert.strictEqual(reader.consume(), EOF);
      assert.strictEqual(reader.getPosition().column, 1);

      assert.strictEqual(reader.consume(), EOF);
      assert.strictEqual(reader.getPosition().column, 1);
   });
   it('.getPosition().line', () => {
      const reader = createReader('a\nb\nc');

      assert.strictEqual(reader.consume(), 'a');
      assert.strictEqual(reader.getPosition().line, 0);

      assert.strictEqual(reader.consume(), '\n');
      assert.strictEqual(reader.getPosition().line, 0);

      assert.strictEqual(reader.consume(), 'b');
      assert.strictEqual(reader.getPosition().line, 1);

      assert.strictEqual(reader.consume(), '\n');
      assert.strictEqual(reader.getPosition().line, 1);

      assert.strictEqual(reader.consume(), 'c');
      assert.strictEqual(reader.getPosition().line, 2);

      assert.strictEqual(reader.consume(), EOF);
      assert.strictEqual(reader.getPosition().line, 2);
   });
   it('.getPosition().line re-consumed', () => {
      const reader = createReader('a\nb');

      assert.strictEqual(reader.consume(), 'a');
      assert.strictEqual(reader.getPosition().line, 0);

      assert.strictEqual(reader.consume(), '\n');
      assert.strictEqual(reader.getPosition().line, 0);

      reader.reconsume();
      assert.strictEqual(reader.consume(), '\n');
      assert.strictEqual(reader.getPosition().line, 0);

      assert.strictEqual(reader.consume(), 'b');
      assert.strictEqual(reader.getPosition().line, 1);

      assert.strictEqual(reader.consume(), EOF);
      assert.strictEqual(reader.getPosition().line, 1);
   });
});
