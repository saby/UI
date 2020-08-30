import { Parser } from 'UI/_builder/Tmpl/expressions/_private/Parser';
import ErrorHandler from 'UI/_builder/Tmpl/utils/ErrorHandler';
import { parse } from 'UI/_builder/Tmpl/html/Parser';
import getWasabyTagDescription from 'UI/_builder/Tmpl/core/Tags';
import * as Nodes from 'UI/_builder/Tmpl/html/Nodes';
import * as Text from 'UI/_builder/Tmpl/core/Text';
import * as Ast from 'UI/_builder/Tmpl/core/Ast';
import { assert } from 'chai';

// TODO: UI/_builder/Tmpl/* -> Compiler/*

const parseConfig = {
   xml: true,
   allowComments: true,
   allowCDATA: true,
   compatibleTreeStructure: true,
   rudeWhiteSpaceCleaning: true,
   normalizeLineFeed: true,
   cleanWhiteSpaces: true,
   needPreprocess: true,
   tagDescriptor: getWasabyTagDescription,
   errorHandler: new ErrorHandler()
};

const FILE_NAME = 'Compiler/core/Text/TestTemplate.wml';

function createTextProcessorConfig() {
   const expressionParser = new Parser();
   const errorHandler = new ErrorHandler();
   return {
      expressionParser,
      errorHandler
   };
}

function createTextProcessorOptions(allowedContent: Text.TextContentFlags) {
   return {
      fileName: FILE_NAME,
      allowedContent,
      strictMode: false
   }
}

function processText(data: string, allowedContent: Text.TextContentFlags = Text.TextContentFlags.FULL_TEXT) {
   const html = parse(data, FILE_NAME, parseConfig);
   assert.strictEqual(html.length, 1);
   assert.isTrue(html[0] instanceof Nodes.Text);
   const text = <Nodes.Text>html[0];
   const textProcessorConfig = createTextProcessorConfig();
   const processor = Text.createTextProcessor(textProcessorConfig);
   const textProcessorOptions = createTextProcessorOptions(allowedContent);
   return processor.process(
      text.data,
      textProcessorOptions,
      text.position
   );
}

describe('Compiler/core/Text', () => {
   it('TextDataNode', () => {
      const collection = processText('Simple text');
      assert.strictEqual(collection.length, 1);
      assert.instanceOf(collection[0], Ast.TextDataNode);
      const textDataNode = <Ast.TextDataNode>collection[0];
      assert.strictEqual(textDataNode.__$ws_content, 'Simple text');
   });
   it('TranslationNode (text and context)', () => {
      const collection = processText('{[ Context @@ Text ]}');
      assert.strictEqual(collection.length, 1);
      assert.instanceOf(collection[0], Ast.TranslationNode);
      const translationNode = <Ast.TranslationNode>collection[0];
      assert.strictEqual(translationNode.__$ws_context, 'Context');
      assert.strictEqual(translationNode.__$ws_text, 'Text');
   });
   it('TranslationNode (text only)', () => {
      const collection = processText('{[ Text ]}');
      assert.strictEqual(collection.length, 1);
      assert.instanceOf(collection[0], Ast.TranslationNode);
      const translationNode = <Ast.TranslationNode>collection[0];
      assert.strictEqual(translationNode.__$ws_context, '');
      assert.strictEqual(translationNode.__$ws_text, 'Text');
   });
   it('ExpressionNode', () => {
      const collection = processText('{{ identifier }}');
      assert.strictEqual(collection.length, 1);
      assert.instanceOf(collection[0], Ast.ExpressionNode);
      const expressionNode = <Ast.ExpressionNode>collection[0];
      assert.isTrue(!!expressionNode.__$ws_program);
   });
   it('Mixed content', () => {
      const collection = processText('{[ Hello ]}, {{ userName }}');
      assert.strictEqual(collection.length, 3);
      assert.instanceOf(collection[0], Ast.TranslationNode);
      assert.instanceOf(collection[1], Ast.TextDataNode);
      assert.instanceOf(collection[2], Ast.ExpressionNode);
   });
   describe('.allowedContent', () => {
      it('TextContentFlags.TEXT', () => {
         const collection = processText('{[ Hello ]}, {{ userName }}', Text.TextContentFlags.TEXT);
         assert.strictEqual(collection.length, 1);
         assert.instanceOf(collection[0], Ast.TextDataNode);
      });
      it('TextContentFlags.EXPRESSION', () => {
         const collection = processText('{[ Hello ]}, {{ userName }}', Text.TextContentFlags.EXPRESSION);
         assert.strictEqual(collection.length, 1);
         assert.instanceOf(collection[0], Ast.ExpressionNode);
      });
      it('TextContentFlags.TRANSLATION', () => {
         const collection = processText('{[ Hello ]}, {{ userName }}', Text.TextContentFlags.TRANSLATION);
         assert.strictEqual(collection.length, 1);
         assert.instanceOf(collection[0], Ast.TranslationNode);
      });
      it('TextContentFlags.TEXT_AND_TRANSLATION', () => {
         const collection = processText('{[ Hello ]}, {{ userName }}', Text.TextContentFlags.TEXT_AND_TRANSLATION);
         assert.strictEqual(collection.length, 2);
         assert.instanceOf(collection[0], Ast.TranslationNode);
         assert.instanceOf(collection[1], Ast.TextDataNode);
      });
      it('TextContentFlags.TEXT_AND_EXPRESSION', () => {
         const collection = processText('{[ Hello ]}, {{ userName }}', Text.TextContentFlags.TEXT_AND_EXPRESSION);
         assert.strictEqual(collection.length, 2);
         assert.instanceOf(collection[0], Ast.TextDataNode);
         assert.instanceOf(collection[1], Ast.ExpressionNode);
      });
   });
});
