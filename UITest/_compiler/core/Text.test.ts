import { Parser } from 'UI/_builder/Tmpl/expressions/_private/Parser';
import ErrorHandler from 'UI/_builder/Tmpl/utils/ErrorHandler';
import { parse } from 'UI/_builder/Tmpl/html/Parser';
import getWasabyTagDescription from 'UI/_builder/Tmpl/core/Tags';
import * as Nodes from 'UI/_builder/Tmpl/html/Nodes';
import * as Text from 'UI/_builder/Tmpl/core/Text';
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
      allowedContent
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
   it('test', () => {
      // TODO: In development...
      processText('{[]}');
   });
});
