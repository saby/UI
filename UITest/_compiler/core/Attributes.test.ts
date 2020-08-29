import { Parser } from 'UI/_builder/Tmpl/expressions/_private/Parser';
import ErrorHandler from 'UI/_builder/Tmpl/utils/ErrorHandler';
import { parse } from 'UI/_builder/Tmpl/html/Parser';
import getWasabyTagDescription from 'UI/_builder/Tmpl/core/Tags';
import * as Nodes from 'UI/_builder/Tmpl/html/Nodes';
import * as Attributes from 'UI/_builder/Tmpl/core/Attributes';
import { createTextProcessor } from 'UI/_builder/Tmpl/core/Text';
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

const FILE_NAME = 'Compiler/core/Attributes/TestTemplate.wml';

function createAttributeProcessorConfig() {
   const expressionParser = new Parser();
   const errorHandler = new ErrorHandler();
   const textProcessor = createTextProcessor({
      expressionParser,
      errorHandler
   });
   return {
      expressionParser,
      errorHandler,
      textProcessor
   };
}

function createAttributeProcessorOptions(hasAttributesOnly: boolean) {
   return {
      fileName: FILE_NAME,
      hasAttributesOnly
   };
}

function processAttributes(attributes: string, hasAttributesOnly: boolean) {
   const text = `<div ${attributes}></div>`;
   const config = createAttributeProcessorConfig();
   const options = createAttributeProcessorOptions(hasAttributesOnly);
   const processor = Attributes.createAttributeProcessor(config);
   const html = parse(text, FILE_NAME, parseConfig);
   assert.strictEqual(html.length, 1);
   assert.isTrue(html[0] instanceof Nodes.Tag);
   const tag = <Nodes.Tag>html[0];
   return processor.process(tag.attributes, options);
}

describe('Compiler/core/Attributes', () => {
   describe('Helpers', () => {
      it('isAttribute() -> true', () => {
         assert.isTrue(Attributes.isAttribute('attr:class'));
      });
      it('isAttribute() -> false', () => {
         assert.isFalse(Attributes.isAttribute('ws:attr:class'));
      });
      it('getAttributeName() #1', () => {
         assert.strictEqual(Attributes.getAttributeName('attr:class'), 'class');
      });
      it('getAttributeName() #2', () => {
         assert.strictEqual(Attributes.getAttributeName('class'), 'class');
      });

      it('isBind() -> true', () => {
         assert.isTrue(Attributes.isBind('bind:value'));
      });
      it('isBind() -> false', () => {
         assert.isFalse(Attributes.isBind('ws:bind:value'));
      });
      it('getBindName() #1', () => {
         assert.strictEqual(Attributes.getBindName('bind:value'), 'value');
      });
      it('getBindName() #2', () => {
         assert.strictEqual(Attributes.getBindName('value'), 'value');
      });

      it('isEvent() -> true', () => {
         assert.isTrue(Attributes.isEvent('on:click'));
      });
      it('isEvent() -> false', () => {
         assert.isFalse(Attributes.isEvent('ws:on:click'));
      });
      it('getEventName() #1', () => {
         assert.strictEqual(Attributes.getEventName('on:click'), 'click');
      });
      it('getEventName() #2', () => {
         assert.strictEqual(Attributes.getEventName('click'), 'click');
      });
   });
   it('test', () => {
      // TODO: In development...
      processAttributes('attr=value', true);
   });
});
