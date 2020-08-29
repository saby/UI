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

function parseAttributes(attributes: string, hasAttributesOnly: boolean) {
   const text = `<div ${attributes}></div>`;
   const html = parse(text, FILE_NAME, parseConfig);
   assert.strictEqual(html.length, 1);
   assert.isTrue(html[0] instanceof Nodes.Tag);
   const tag = <Nodes.Tag>html[0];
   return tag.attributes;
}

function processAttributes(textAttributes: string, hasAttributesOnly: boolean) {
   const attributes = parseAttributes(textAttributes, hasAttributesOnly);
   const options = createAttributeProcessorOptions(hasAttributesOnly);
   const config = createAttributeProcessorConfig();
   const processor = Attributes.createAttributeProcessor(config);
   return processor.process(attributes, options);
}

function filterAttributes(textAttributes: string, expected: string[], hasAttributesOnly: boolean) {
   const attributes = parseAttributes(textAttributes, hasAttributesOnly);
   const options = createAttributeProcessorOptions(hasAttributesOnly);
   const config = createAttributeProcessorConfig();
   const processor = Attributes.createAttributeProcessor(config);
   return processor.filter(attributes, expected, options);
}

function validateValueAttributes(textAttributes: string, name: string, hasAttributesOnly: boolean) {
   const attributes = parseAttributes(textAttributes, hasAttributesOnly);
   const options = createAttributeProcessorOptions(hasAttributesOnly);
   const config = createAttributeProcessorConfig();
   const processor = Attributes.createAttributeProcessor(config);
   return processor.validateValue(attributes, name, options);
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
   describe('process @ AttributeProcessor', () => {
      describe('.hasAttributesOnly = true', () => {
         it('Attribute (without prefix)', () => {
            const attributes = processAttributes('attribute="value"', true);
            assert.strictEqual(Object.keys(attributes.attributes).length, 1);
            assert.strictEqual(Object.keys(attributes.options).length, 0);
            assert.strictEqual(Object.keys(attributes.events).length, 0);
            assert.isTrue(attributes.attributes.hasOwnProperty('attr:attribute'));
         });
         it('Attribute (with prefix)', () => {
            const attributes = processAttributes('attr:attribute="value"', true);
            assert.strictEqual(Object.keys(attributes.attributes).length, 1);
            assert.strictEqual(Object.keys(attributes.options).length, 0);
            assert.strictEqual(Object.keys(attributes.events).length, 0);
            assert.isTrue(attributes.attributes.hasOwnProperty('attr:attribute'));
         });
         it('Bind', () => {
            const attributes = processAttributes('bind:attribute="value"', true);
            assert.strictEqual(Object.keys(attributes.attributes).length, 0);
            assert.strictEqual(Object.keys(attributes.options).length, 0);
            assert.strictEqual(Object.keys(attributes.events).length, 1);
            assert.isTrue(attributes.events.hasOwnProperty('bind:attribute'));
         });
         it('Event handler', () => {
            const attributes = processAttributes('on:event="handler()"', true);
            assert.strictEqual(Object.keys(attributes.attributes).length, 0);
            assert.strictEqual(Object.keys(attributes.options).length, 0);
            assert.strictEqual(Object.keys(attributes.events).length, 1);
            assert.isTrue(attributes.events.hasOwnProperty('on:event'));
         });
      });
      describe('.hasAttributesOnly = false', () => {
         it('Option', () => {
            const attributes = processAttributes('attribute="value"', false);
            assert.strictEqual(Object.keys(attributes.attributes).length, 0);
            assert.strictEqual(Object.keys(attributes.options).length, 1);
            assert.strictEqual(Object.keys(attributes.events).length, 0);
            assert.isTrue(attributes.options.hasOwnProperty('attribute'));
         });
         it('Attribute', () => {
            const attributes = processAttributes('attr:attribute="value"', false);
            assert.strictEqual(Object.keys(attributes.attributes).length, 1);
            assert.strictEqual(Object.keys(attributes.options).length, 0);
            assert.strictEqual(Object.keys(attributes.events).length, 0);
            assert.isTrue(attributes.attributes.hasOwnProperty('attr:attribute'));
         });
      });
   });
   describe('filter @ AttributeProcessor', () => {
      it('Has the same start', () => {
         const attributes = filterAttributes('attribute="value"', ['attributeKey'], false);
         assert.strictEqual(Object.keys(attributes).length, 0);
      });
      it('Filter', () => {
         const attributes = filterAttributes('a=1 b=2 c=3 d=4 elephant=5', ['a', 'c', 'f', 'apple', 'e'], false);
         assert.strictEqual(Object.keys(attributes).length, 2);
         assert.isTrue(attributes.hasOwnProperty('a'));
         assert.isTrue(attributes.hasOwnProperty('c'));
      });
   });
   describe('validateValue @ AttributeProcessor', () => {
      it('Receive value', (done) => {
         try {
            const value = validateValueAttributes('attribute="value"', 'attribute', false);
            assert.strictEqual(value, 'value');
            done();
         } catch (error) {
            done(error);
         }
      });
      it('No attribute', (done) => {
         try {
            validateValueAttributes('attribute="value"', 'key', false);
            done(new Error('Must be failed'));
         } catch (error) {
            done();
         }
      });
   });
});
