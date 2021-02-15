import { createSource as creteSourceObj } from 'Compiler/html/Source';
import createErrorHandler from '../NullLogger';
import { Tokenizer } from 'Compiler/html/Tokenizer';
import { ContentModel } from 'Compiler/html/ContentModel';
import { assert } from 'chai';

const FILE_NAME = 'Compiler/html/Tokenizer/TestTemplate.wml';

const TOKENIZER_OPTIONS = {
   errorHandler: createErrorHandler(),
   allowComments: false,
   allowCDATA: false,
   xml: false
};

function assertAttributes(standard, actual) {
   const keys = Object.keys(standard);
   assert.strictEqual(keys.length, Object.keys(actual).length);
   for (let i = 0; i < keys.length; ++i) {
      const name = keys[i];
      assert.strictEqual(standard[name], actual[name].value);
   }
}

function createSource(text) {
   return creteSourceObj(text, FILE_NAME);
}

let stack;

const handler = {
   onOpenTag: function(name, attr, selfClosing) {
      assert.isTrue(stack.length > 0);
      let node = stack.shift();
      assert.strictEqual(node.type, 'OpenTag');
      assert.strictEqual(node.name, name);
      assertAttributes(node.attr || {}, attr || {});
      assert.strictEqual(node.selfClosing, selfClosing);
   },
   onCloseTag: function(name) {
      assert.isTrue(stack.length > 0);
      let node = stack.shift();
      assert.strictEqual(node.type, 'CloseTag');
      assert.strictEqual(node.name, name);
   },
   onText: function(data) {
      assert.isTrue(stack.length > 0);
      let node = stack.shift();
      assert.strictEqual(node.type, 'Text');
      assert.strictEqual(node.data, data);
   },
   onComment: function(data) {
      assert.isTrue(stack.length > 0);
      let node = stack.shift();
      assert.strictEqual(node.type, 'Comment');
      assert.strictEqual(node.data, data);
   },
   onCDATA: function(data) {
      assert.isTrue(stack.length > 0);
      let node = stack.shift();
      assert.strictEqual(node.type, 'CDATA');
      assert.strictEqual(node.data, data);
   },
   onDoctype: function(data) {
      assert.isTrue(stack.length > 0);
      let node = stack.shift();
      assert.strictEqual(node.type, 'Doctype');
      assert.strictEqual(node.data, data);
   },
   onInstruction: function(data) {
      assert.isTrue(stack.length > 0);
      let node = stack.shift();
      assert.strictEqual(node.type, 'Instruction');
      assert.strictEqual(node.data, data);
   },
   onEOF: function() {
      assert.isTrue(stack.length > 0);
      let node = stack.shift();
      assert.strictEqual(node.type, 'EOF');
   }
};

describe('Compiler/html/Tokenizer', () => {
   describe('Data content model', () => {
      it('Open tag, selfClosing=false', () => {
         let reader = createSource('<tag>');
         stack = [{
            type: 'OpenTag',
            name: 'tag',
            selfClosing: false
         }, {
            type: 'EOF'
         }];
         let tokenizer = new Tokenizer(handler, TOKENIZER_OPTIONS);
         tokenizer.tokenize(reader);
      });
      it('Open tag, selfClosing=true', () => {
         let reader = createSource('<tag />');
         stack = [{
            type: 'OpenTag',
            name: 'tag',
            selfClosing: true
         }, {
            type: 'EOF'
         }];
         let tokenizer = new Tokenizer(handler, TOKENIZER_OPTIONS);
         tokenizer.tokenize(reader);
      });
      it('Attributes', () => {
         let reader = createSource('<tag a=1 b=\'2\' c="3" d>');
         stack = [{
            type: 'OpenTag',
            name: 'tag',
            attr: {
               a: '1',
               b: '2',
               c: '3',
               d: null
            },
            selfClosing: false
         }, {
            type: 'EOF'
         }];
         let tokenizer = new Tokenizer(handler, TOKENIZER_OPTIONS);
         tokenizer.tokenize(reader);
      });
      it('Tags pair', () => {
         let reader = createSource('<tag></tag>');
         stack = [{
            type: 'OpenTag',
            name: 'tag',
            selfClosing: false
         }, {
            type: 'CloseTag',
            name: 'tag'
         }, {
            type: 'EOF'
         }];
         let tokenizer = new Tokenizer(handler, TOKENIZER_OPTIONS);
         tokenizer.tokenize(reader);
      });
      it('Comment, allowComments=false', () => {
         let reader = createSource('<!-- abc -->');
         stack = [{
            type: 'EOF'
         }];
         let tokenizer = new Tokenizer(handler, TOKENIZER_OPTIONS);
         tokenizer.tokenize(reader);
      });
      it('Comment, allowComments=true', () => {
         let reader = createSource('<!-- abc -->');
         stack = [{
            type: 'Comment',
            data: ' abc '
         }, {
            type: 'EOF'
         }];
         let tokenizer = new Tokenizer(handler, { ...TOKENIZER_OPTIONS, allowComments: true });
         tokenizer.tokenize(reader);
      });
      it('Text', () => {
         let reader = createSource('1 < 2');
         stack = [{
            type: 'Text',
            data: '1 '
         }, {
            type: 'Text',
            data: '< 2'
         }, {
            type: 'EOF'
         }];
         let tokenizer = new Tokenizer(handler, TOKENIZER_OPTIONS);
         tokenizer.tokenize(reader);
      });
      it('CDATA, allowCDATA=false', () => {
         let reader = createSource('<![CDATA[a]]>');
         stack = [{
            type: 'EOF'
         }];
         let tokenizer = new Tokenizer(handler, TOKENIZER_OPTIONS);
         tokenizer.tokenize(reader);
      });
      it('CDATA, allowCDATA=true', () => {
         let reader = createSource('<![CDATA[ a ]] ]]>');
         stack = [{
            type: 'CDATA',
            data: ' a ]] '
         }, {
            type: 'EOF'
         }];
         let tokenizer = new Tokenizer(handler, { ...TOKENIZER_OPTIONS, allowCDATA: true });
         tokenizer.tokenize(reader);
      });
      it('Bogus comment', () => {
         let reader = createSource('<!- -->');
         stack = [{
            type: 'Comment',
            data: ' --'
         }, {
            type: 'EOF'
         }];
         let tokenizer = new Tokenizer(handler, { ...TOKENIZER_OPTIONS, allowComments: true });
         tokenizer.tokenize(reader);
      });
      it('Doctype', () => {
         let reader = createSource('<!DOCTYPE html>');
         stack = [{
            type: 'Doctype',
            data: 'html'
         }, {
            type: 'EOF'
         }];
         let tokenizer = new Tokenizer(handler, TOKENIZER_OPTIONS);
         tokenizer.tokenize(reader);
      });
      it('Instruction, xml=false', () => {
         let reader = createSource('<?xml version="1.0" encoding="utf-8"?>');
         stack = [{
            type: 'EOF'
         }];
         let tokenizer = new Tokenizer(handler, TOKENIZER_OPTIONS);
         tokenizer.tokenize(reader);
      });
      it('Instruction, xml=true', () => {
         let reader = createSource('<?xml version="1.0" encoding="utf-8"?>');
         stack = [{
            type: 'Instruction',
            data: '?xml version="1.0" encoding="utf-8"?'
         }, {
            type: 'EOF'
         }];
         let tokenizer = new Tokenizer(handler, { ...TOKENIZER_OPTIONS, xml: true });
         tokenizer.tokenize(reader);
      });
      it('Instruction', () => {
         let reader = createSource('<?instruction?>');
         stack = [{
            type: 'EOF'
         }];
         let tokenizer = new Tokenizer(handler, TOKENIZER_OPTIONS);
         tokenizer.tokenize(reader);
      });
   });
   it('Escapable content model', () => {
      // For elements: <textarea>, <title>
      let reader = createSource('< 1\n2\n3 ></textarea>');
      stack = [{
         type: 'Text',
         data: '< 1\n2\n3 >'
      }, {
         type: 'CloseTag',
         name: 'textarea'
      }, {
         type: 'EOF'
      }];
      let tokenizer = new Tokenizer(handler, TOKENIZER_OPTIONS);
      tokenizer.setContentModel(ContentModel.ESCAPABLE_RAW_TEXT, 'textarea');
      tokenizer.tokenize(reader);
   });
   it('Escapable content model 2', () => {
      // For elements: <textarea>, <title>
      let reader = createSource('</ </textarea>');
      stack = [{
         type: 'Text',
         data: '</ '
      }, {
         type: 'CloseTag',
         name: 'textarea'
      }, {
         type: 'EOF'
      }];
      let tokenizer = new Tokenizer(handler, TOKENIZER_OPTIONS);
      tokenizer.setContentModel(ContentModel.ESCAPABLE_RAW_TEXT, 'textarea');
      tokenizer.tokenize(reader);
   });
   it('Raw text content model', () => {
      // For elements: <script>
      let reader = createSource('for(var i=0;i<0;){++i;}</script>');
      stack = [{
         type: 'Text',
         data: 'for(var i=0;i'
      }, {
         type: 'Text',
         data: '<0;){++i;}'
      }, {
         type: 'CloseTag',
         name: 'script'
      }, {
         type: 'EOF'
      }];
      let tokenizer = new Tokenizer(handler, TOKENIZER_OPTIONS);
      tokenizer.setContentModel(ContentModel.RAW_TEXT, 'script');
      tokenizer.tokenize(reader);
   });
});
