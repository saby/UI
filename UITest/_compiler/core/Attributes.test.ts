import { Parser } from 'Compiler/expressions/Parser';
import createErrorHandler from '../NullLogger';
import { parse } from 'Compiler/html/Parser';
import getWasabyTagDescription from 'Compiler/core/Tags';
import * as Nodes from 'Compiler/html/Nodes';
import * as Attributes from 'Compiler/core/Attributes';
import { createTextProcessor } from 'Compiler/core/Text';
import * as Ast from 'Compiler/core/Ast';
import Scope from 'Compiler/core/Scope';
import createValidator from 'Compiler/expressions/Validator';
import { assert } from 'chai';

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
   errorHandler: createErrorHandler()
};

const FILE_NAME = 'Compiler/core/Attributes/TestTemplate.wml';

function createAttributeProcessorConfig() {
   const expressionParser = new Parser();
   const errorHandler = createErrorHandler();
   const expressionValidator = createValidator(errorHandler);
   const textProcessor = createTextProcessor({
      expressionParser,
      expressionValidator,
      generateTranslations: true
   });
   return {
      expressionParser,
      errorHandler,
      textProcessor,
      expressionValidator
   };
}

function createAttributeProcessorOptions(hasAttributesOnly: boolean) {
   return {
      fileName: FILE_NAME,
      hasAttributesOnly,
      parentTagName: 'tag-name',
      translationsRegistrar: new Scope()
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
         it('Empty attribute value', () => {
            const attributes = processAttributes('attribute=""', true);
            assert.strictEqual(Object.keys(attributes.attributes).length, 1);
            assert.strictEqual(Object.keys(attributes.options).length, 0);
            assert.isTrue(attributes.attributes.hasOwnProperty('attr:attribute'));
            assert.strictEqual(attributes.attributes['attr:attribute'].__$ws_value.length, 1);
            assert.strictEqual(Object.keys(attributes.events).length, 0);

            assert.instanceOf(attributes.attributes['attr:attribute'], Ast.AttributeNode);
            const attributeNode = <Ast.AttributeNode>attributes.attributes['attr:attribute'];
            assert.strictEqual(attributeNode.__$ws_name, 'attribute');
            assert.strictEqual(attributeNode.__$ws_value.length, 1);
         });
         it('Attribute (without prefix)', () => {
            const attributes = processAttributes('attribute="value"', true);
            assert.strictEqual(Object.keys(attributes.attributes).length, 1);
            assert.strictEqual(Object.keys(attributes.options).length, 0);
            assert.isTrue(attributes.attributes.hasOwnProperty('attr:attribute'));
            assert.strictEqual(Object.keys(attributes.events).length, 0);

            assert.instanceOf(attributes.attributes['attr:attribute'], Ast.AttributeNode);
            const attributeNode = <Ast.AttributeNode>attributes.attributes['attr:attribute'];
            assert.strictEqual(attributeNode.__$ws_name, 'attribute');
            assert.strictEqual(attributeNode.__$ws_value.length, 1);
         });
         it('Attribute boolean (without prefix)', () => {
            const attributes = processAttributes('allowfullscreen', true);
            assert.strictEqual(Object.keys(attributes.attributes).length, 1);
            assert.strictEqual(Object.keys(attributes.options).length, 0);
            assert.strictEqual(Object.keys(attributes.events).length, 0);
            assert.isTrue(attributes.attributes.hasOwnProperty('attr:allowfullscreen'));

            assert.instanceOf(attributes.attributes['attr:allowfullscreen'], Ast.AttributeNode);
            const attributeNode = <Ast.AttributeNode>attributes.attributes['attr:allowfullscreen'];
            assert.strictEqual(attributeNode.__$ws_name, 'allowfullscreen');
            assert.strictEqual(attributeNode.__$ws_value.length, 1);
         });
         it('Failure! Attribute boolean (without prefix)', () => {
            // TODO: сейчас определяется пустая строка. Есть предложение поддержать
            //  boolean-атрибуты (когда 'true' по умолчанию). Пока на рассмотрении!
            const attributes = processAttributes('attribute', true);
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

            assert.instanceOf(attributes.attributes['attr:attribute'], Ast.AttributeNode);
            const attributeNode = <Ast.AttributeNode>attributes.attributes['attr:attribute'];
            assert.strictEqual(attributeNode.__$ws_name, 'attribute');
            assert.strictEqual(attributeNode.__$ws_value.length, 1);
         });
         it('Failure! Attribute boolean (with prefix)', () => {
            // TODO: сейчас определяется пустая строка. Есть предложение поддержать
            //  boolean-атрибуты (когда 'true' по умолчанию). Пока на рассмотрении!
            const attributes = processAttributes('attr:attribute', true);
            assert.strictEqual(Object.keys(attributes.attributes).length, 1);
            assert.strictEqual(Object.keys(attributes.options).length, 0);
            assert.strictEqual(Object.keys(attributes.events).length, 0);
            assert.isTrue(attributes.attributes.hasOwnProperty('attr:attribute'));
         });
         it('Attribute boolean (with prefix)', () => {
            const attributes = processAttributes('attr:allowfullscreen', true);
            assert.strictEqual(Object.keys(attributes.attributes).length, 1);
            assert.strictEqual(Object.keys(attributes.options).length, 0);
            assert.strictEqual(Object.keys(attributes.events).length, 0);
            assert.isTrue(attributes.attributes.hasOwnProperty('attr:allowfullscreen'));

            assert.instanceOf(attributes.attributes['attr:allowfullscreen'], Ast.AttributeNode);
            const attributeNode = <Ast.AttributeNode>attributes.attributes['attr:allowfullscreen'];
            assert.strictEqual(attributeNode.__$ws_name, 'allowfullscreen');
            assert.strictEqual(attributeNode.__$ws_value.length, 1);
         });
         it('Duplicate attributes', () => {
            const attributes = processAttributes('attr:value="1" value="2"', true);
            assert.strictEqual(Object.keys(attributes.attributes).length, 1);
            assert.strictEqual(Object.keys(attributes.options).length, 0);
            assert.strictEqual(Object.keys(attributes.events).length, 0);
            assert.isTrue(attributes.attributes.hasOwnProperty('attr:value'));
         });
         it('Bind', () => {
            const attributes = processAttributes('bind:attribute="value"', true);
            assert.strictEqual(Object.keys(attributes.attributes).length, 0);
            assert.strictEqual(Object.keys(attributes.options).length, 0);
            assert.strictEqual(Object.keys(attributes.events).length, 1);
            assert.isTrue(attributes.events.hasOwnProperty('bind:attribute'));

            assert.instanceOf(attributes.events['bind:attribute'], Ast.BindNode);
            const bindNode = <Ast.BindNode>attributes.events['bind:attribute'];
            assert.strictEqual(bindNode.__$ws_property, 'attribute');
         });
         it('Failure! Bind boolean', () => {
            const attributes = processAttributes('bind:attribute', true);
            assert.strictEqual(Object.keys(attributes.attributes).length, 0);
            assert.strictEqual(Object.keys(attributes.options).length, 0);
            assert.strictEqual(Object.keys(attributes.events).length, 0);
         });
         it('Bind (invalid - expression)', () => {
            const attributes = processAttributes('bind:attribute="{{ value }}"', true);
            assert.strictEqual(Object.keys(attributes.attributes).length, 0);
            assert.strictEqual(Object.keys(attributes.options).length, 0);
            assert.strictEqual(Object.keys(attributes.events).length, 0);
         });
         it('Bind (invalid - translation)', () => {
            const attributes = processAttributes('bind:attribute="{[ Text ]}"', true);
            assert.strictEqual(Object.keys(attributes.attributes).length, 0);
            assert.strictEqual(Object.keys(attributes.options).length, 0);
            assert.strictEqual(Object.keys(attributes.events).length, 0);
         });
         it('Event handler', () => {
            const attributes = processAttributes('on:event="handler()"', true);
            assert.strictEqual(Object.keys(attributes.attributes).length, 0);
            assert.strictEqual(Object.keys(attributes.options).length, 0);
            assert.strictEqual(Object.keys(attributes.events).length, 1);
            assert.isTrue(attributes.events.hasOwnProperty('on:event'));

            assert.instanceOf(attributes.events['on:event'], Ast.EventNode);
            const eventNode = <Ast.EventNode>attributes.events['on:event'];
            assert.strictEqual(eventNode.__$ws_event, 'event');
         });
         it('Event handler (invalid - expression)', () => {
            const attributes = processAttributes('on:event="{{ handler() }}"', true);
            assert.strictEqual(Object.keys(attributes.attributes).length, 0);
            assert.strictEqual(Object.keys(attributes.options).length, 0);
            assert.strictEqual(Object.keys(attributes.events).length, 0);
         });
         it('Event handler (invalid - translation)', () => {
            const attributes = processAttributes('on:event="{[ Text ]}"', true);
            assert.strictEqual(Object.keys(attributes.attributes).length, 0);
            assert.strictEqual(Object.keys(attributes.options).length, 0);
            assert.strictEqual(Object.keys(attributes.events).length, 0);
         });
         it('Failure! Event handler boolean', () => {
            const attributes = processAttributes('on:event', true);
            assert.strictEqual(Object.keys(attributes.attributes).length, 0);
            assert.strictEqual(Object.keys(attributes.options).length, 0);
            assert.strictEqual(Object.keys(attributes.events).length, 0);
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
