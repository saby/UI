import traverse from 'Compiler/core/Traverse';
import { Parser } from 'Compiler/expressions/_private/Parser';
import createErrorHandler from '../NullLogger';
import Scope from 'Compiler/core/Scope';
import { parse } from 'Compiler/html/Parser';
import getWasabyTagDescription from 'Compiler/core/Tags';
import * as Ast from 'Compiler/core/Ast';
import { createTextTranslator } from 'Compiler/i18n/Translator';
import { assert } from 'chai';

const traverseConfig = {
   allowComments: false,
   expressionParser: new Parser(),
   hierarchicalKeys: true,
   errorHandler: createErrorHandler(),
   textTranslator: createTextTranslator({}),
   generateTranslations: true
};

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

function createTraverseOptions() {
   return {
      fileName: 'Compiler/core/Traverse/TestTemplate.wml',
      scope: new Scope(),
      translateText: false
   };
}

function traverseTemplate(text: string): Ast.Ast[] {
   const options = createTraverseOptions();
   const html = parse(text, options.fileName, parseConfig);
   return traverse(html, traverseConfig, options);
}

function traversePropertyOnComponent(optionTemplate: string): Ast.ComponentNode {
   const template = `
   <UIModule.Control>
       ${optionTemplate}
   </UIModule.Control>
   `;
   const tree = traverseTemplate(template);
   assert.strictEqual(tree.length, 1);
   assert.instanceOf(tree[0], Ast.ComponentNode);
   return <Ast.ComponentNode>tree[0];
}

describe('Compiler/core/Traverse', () => {
   it('DoctypeNode', () => {
      const html = '<!DOCTYPE html>';
      const tree = traverseTemplate(html);
      assert.strictEqual(tree.length, 1);
      assert.instanceOf(tree[0], Ast.DoctypeNode);
   });
   it('CDataNode', () => {
      const html = '<![CDATA[ value ]]>';
      const tree = traverseTemplate(html);
      assert.strictEqual(tree.length, 1);
      assert.instanceOf(tree[0], Ast.CDataNode);
   });
   it('InstructionNode', () => {
      const html = '<? instruction ?>';
      const tree = traverseTemplate(html);
      assert.strictEqual(tree.length, 1);
      assert.instanceOf(tree[0], Ast.InstructionNode);
   });
   describe('ElementNode', () => {
      it('Node', () => {
         const html = '<div attr:class="div-class" id="content" on:click="handler()"></div>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.instanceOf(tree[0], Ast.ElementNode);
         const elementNode = <Ast.ElementNode>tree[0];
         assert.strictEqual(elementNode.__$ws_name, 'div');
      });
      it('Unpack for attribute', () => {
         const html = '<div for="; it.test();"></div>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.instanceOf(tree[0], Ast.ForNode);
         const cycleNode = <Ast.ForNode>tree[0];
         assert.strictEqual(cycleNode.__$ws_content.length, 1);
         const elementNode = <Ast.ElementNode>cycleNode.__$ws_content[0];
         assert.strictEqual(elementNode.__$ws_name, 'div');
      });
      it('Failure! Unpack for attribute', () => {
         const html = '<div for="; it.te st();"></div>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.instanceOf(tree[0], Ast.ElementNode);
         const elementNode = <Ast.ElementNode>tree[0];
         assert.strictEqual(elementNode.__$ws_name, 'div');
      });
      it('Unpack foreach attribute', () => {
         const html = '<div for="index, item in items"></div>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.instanceOf(tree[0], Ast.ForeachNode);
         const cycleNode = <Ast.ForeachNode>tree[0];
         assert.strictEqual(cycleNode.__$ws_content.length, 1);
         const elementNode = <Ast.ElementNode>cycleNode.__$ws_content[0];
         assert.strictEqual(elementNode.__$ws_name, 'div');
      });
      it('Failure! Unpack foreach attribute', () => {
         const html = '<div for="in dex, it em in ite ms"></div>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.instanceOf(tree[0], Ast.ElementNode);
      });
      it('Attributes', () => {
         const html = '<div attr:class="div-class" id="content" on:click="handler()"></div>';
         const tree = traverseTemplate(html);
         const elementNode = <Ast.ElementNode>tree[0];
         assert.strictEqual(Object.keys(elementNode.__$ws_attributes).length, 2);
         assert.strictEqual(Object.keys(elementNode.__$ws_events).length, 1);

         assert.isTrue(elementNode.__$ws_attributes.hasOwnProperty('attr:class'));
         assert.isTrue(elementNode.__$ws_attributes.hasOwnProperty('attr:id'));
         assert.isTrue(elementNode.__$ws_events.hasOwnProperty('on:click'));

         assert.instanceOf(elementNode.__$ws_attributes['attr:class'], Ast.AttributeNode);
         assert.instanceOf(elementNode.__$ws_attributes['attr:id'], Ast.AttributeNode);
         assert.instanceOf(elementNode.__$ws_events['on:click'], Ast.EventNode);
      });
      it('Failure! Attributes', () => {
         const html = '<div attr:class="{{ 1 2 3 }}" on:click="{{ handler() }}"></div>';
         const tree = traverseTemplate(html);
         const elementNode = <Ast.ElementNode>tree[0];
         assert.strictEqual(Object.keys(elementNode.__$ws_attributes).length, 0);
         assert.strictEqual(Object.keys(elementNode.__$ws_events).length, 0);
      });
   });
   describe('ComponentNode', () => {
      it('Node', () => {
         const html = '<UIModule.Component />';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.instanceOf(tree[0], Ast.ComponentNode);
      });
      it('Unpack cycle attribute', () => {
         const html = '<UIModule.Component for="index, item in items" />';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.instanceOf(tree[0], Ast.ForeachNode);
         const cycleNode = <Ast.ForeachNode>tree[0];
         assert.strictEqual(cycleNode.__$ws_content.length, 1);
         assert.instanceOf(cycleNode.__$ws_content[0], Ast.ComponentNode);
      });
      it('Component attributes and options', () => {
         const html = '<UIModule.DirModule.Component attr:class="div-class" id="content" />';
         const tree = traverseTemplate(html);
         const componentNode = <Ast.ComponentNode>tree[0];
         assert.strictEqual(Object.keys(componentNode.__$ws_attributes).length, 1);
         assert.strictEqual(Object.keys(componentNode.__$ws_options).length, 1);
         assert.strictEqual(Object.keys(componentNode.__$ws_events).length, 0);
         assert.strictEqual(Object.keys(componentNode.__$ws_contents).length, 0);
         assert.isTrue(componentNode.__$ws_attributes.hasOwnProperty('attr:class'));
         assert.isTrue(componentNode.__$ws_options.hasOwnProperty('id'));
      });
      it('Component event handlers', () => {
         const html = '<UIModule.DirModule.Component on:click="handler()" />';
         const tree = traverseTemplate(html);
         const componentNode = <Ast.ComponentNode>tree[0];
         assert.strictEqual(Object.keys(componentNode.__$ws_attributes).length, 0);
         assert.strictEqual(Object.keys(componentNode.__$ws_options).length, 0);
         assert.strictEqual(Object.keys(componentNode.__$ws_events).length, 1);
         assert.strictEqual(Object.keys(componentNode.__$ws_contents).length, 0);
         assert.isTrue(componentNode.__$ws_events.hasOwnProperty('on:click'));
      });
      it('Component contents', () => {
         const html = `
         <UIModule.Component>
             <ws:content>
                <div>123</div>
            </ws:content>
             <ws:contentOption>
                <div>456</div>
            </ws:contentOption>
         </UIModule.Component>
         `;
         const tree = traverseTemplate(html);
         const componentNode = <Ast.ComponentNode>tree[0];
         assert.strictEqual(Object.keys(componentNode.__$ws_attributes).length, 0);
         assert.strictEqual(Object.keys(componentNode.__$ws_options).length, 0);
         assert.strictEqual(Object.keys(componentNode.__$ws_events).length, 0);
         assert.strictEqual(Object.keys(componentNode.__$ws_contents).length, 2);
         assert.isTrue(componentNode.__$ws_contents.hasOwnProperty('content'));
         assert.isTrue(componentNode.__$ws_contents.hasOwnProperty('contentOption'));
      });
      it('Doctype in Component 1', () => {
         const html = `
         <UIModule.Component>
             <!DOCTYPE html>
             <ws:content>
                <div>123</div>
            </ws:content>
             <ws:contentOption>
                <div>456</div>
            </ws:contentOption>
         </UIModule.Component>
         `;
         const tree = traverseTemplate(html);
         const componentNode = <Ast.ComponentNode>tree[0];
         assert.strictEqual(Object.keys(componentNode.__$ws_attributes).length, 0);
         assert.strictEqual(Object.keys(componentNode.__$ws_options).length, 0);
         assert.strictEqual(Object.keys(componentNode.__$ws_events).length, 0);
         assert.strictEqual(Object.keys(componentNode.__$ws_contents).length, 1);
         assert.isTrue(componentNode.__$ws_contents.hasOwnProperty('content'));
      });
      it('Doctype in Component 2', () => {
         const html = `
         <UIModule.Component>
             <ws:content>
                <div>123</div>
            </ws:content>
             <!DOCTYPE html>
             <ws:contentOption>
                <div>456</div>
            </ws:contentOption>
         </UIModule.Component>
         `;
         const tree = traverseTemplate(html);
         const componentNode = <Ast.ComponentNode>tree[0];
         assert.strictEqual(Object.keys(componentNode.__$ws_attributes).length, 0);
         assert.strictEqual(Object.keys(componentNode.__$ws_options).length, 0);
         assert.strictEqual(Object.keys(componentNode.__$ws_events).length, 0);
         assert.strictEqual(Object.keys(componentNode.__$ws_contents).length, 2);
         assert.isTrue(componentNode.__$ws_contents.hasOwnProperty('content'));
         assert.isTrue(componentNode.__$ws_contents.hasOwnProperty('contentOption'));
      });
   });
   describe('PartialNode', () => {
      it('Inline template', () => {
         const html = '<ws:template name="tmpl"><div></div></ws:template><ws:partial template="tmpl" />';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 2);
         assert.instanceOf(tree[0], Ast.TemplateNode);
         assert.instanceOf(tree[1], Ast.InlineTemplateNode);
         const inlineTemplateNode = <Ast.InlineTemplateNode>tree[1];
         assert.strictEqual(inlineTemplateNode.__$ws_name, 'tmpl');
      });
      it('Dynamic partial', () => {
         const html = '<ws:partial template="{{ tmpl }}" />';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.instanceOf(tree[0], Ast.DynamicPartialNode);
      });
      it('Static partial 1', () => {
         const html = '<ws:partial template="UIModule/Library:Template" />';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.instanceOf(tree[0], Ast.StaticPartialNode);
      });
      it('Static partial 2', () => {
         const html = '<ws:partial template="UIModule/Library" />';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.instanceOf(tree[0], Ast.StaticPartialNode);
      });
      it('Static partial 3', () => {
         const html = '<ws:partial template="wml!UIModule/Library/template" />';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.instanceOf(tree[0], Ast.StaticPartialNode);
      });
   });
   it('TemplateNode', () => {
      const html = '<ws:template name="tmpl"><div></div></ws:template>';
      const tree = traverseTemplate(html);
      assert.strictEqual(tree.length, 1);
      assert.instanceOf(tree[0], Ast.TemplateNode);
      const templateNode = <Ast.TemplateNode>tree[0];
      assert.strictEqual(templateNode.__$ws_name, 'tmpl');
   });
   describe('Conditionals', () => {
      it('IfNode (if only)', () => {
         const html = '<ws:if data="{{ condition }}">Text</ws:if>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.instanceOf(tree[0], Ast.IfNode);
      });
      it('Failure! IfNode (if only - no data)', () => {
         const html = '<ws:if>Text</ws:if>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.instanceOf(tree[0], Ast.IfNode);
         const ast = <Ast.IfNode>tree[0];
         assert.isTrue(ast.hasFlag(Ast.Flags.BROKEN));
      });
      it('ElseNode (if-else)', () => {
         const html = '<ws:if data="{{ condition }}">Text</ws:if><ws:else>Text</ws:else>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 2);
         assert.instanceOf(tree[0], Ast.IfNode);
         assert.instanceOf(tree[1], Ast.ElseNode);
      });
      it('Failure! ElseNode (if-else - no data)', () => {
         const html = '<ws:if>Text</ws:if><ws:else data="{{ otherCondition }}">Text</ws:else>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 2);
         assert.instanceOf(tree[0], Ast.IfNode);
         assert.instanceOf(tree[1], Ast.ElseNode);
         const ifNode = <Ast.IfNode>tree[0];
         assert.isTrue(ifNode.hasFlag(Ast.Flags.BROKEN));
         const elseNode = <Ast.ElseNode>tree[1];
         assert.isFalse(elseNode.hasFlag(Ast.Flags.BROKEN));
      });
      it('Failure! ElseNode (if-elif-else)', () => {
         const html = '<ws:if data="{{ otherCondition }}">Text</ws:if><ws:else>Text</ws:else><ws:else data="{{ otherCondition }}">Text</ws:else>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 3);
         assert.instanceOf(tree[0], Ast.IfNode);
         assert.instanceOf(tree[1], Ast.ElseNode);
         assert.instanceOf(tree[2], Ast.ElseNode);
         const firstElseIfNode = <Ast.ElseNode>tree[1];
         assert.isFalse(firstElseIfNode.hasFlag(Ast.Flags.BROKEN));
         const secondElseIfNode = <Ast.ElseNode>tree[2];
         assert.isTrue(secondElseIfNode.hasFlag(Ast.Flags.BROKEN));
      });
   });
   describe('Cycles', () => {
      it('ForNode (init;test;update)', () => {
         const html = '<ws:for data="it.init(); it.test(); it.update()">Content</ws:for>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.instanceOf(tree[0], Ast.ForNode);
      });
      it('ForNode (init;test;)', () => {
         const html = '<ws:for data="it.init(); it.test();">Content</ws:for>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.instanceOf(tree[0], Ast.ForNode);
      });
      it('ForNode (;test;update)', () => {
         const html = '<ws:for data="; it.test(); it.update()">Content</ws:for>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.instanceOf(tree[0], Ast.ForNode);
      });
      it('ForNode (;test;)', () => {
         const html = '<ws:for data="; it.test();">Content</ws:for>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.instanceOf(tree[0], Ast.ForNode);
      });
      it('Failure! ForNode (;;)', () => {
         const html = '<ws:for data=";;">Content</ws:for>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 0);
      });
      it('ForeachNode (iterator)', () => {
         const html = '<ws:for data="iterator in collection">Content</ws:for>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.instanceOf(tree[0], Ast.ForeachNode);
      });
      it('ForeachNode (index, iterator)', () => {
         const html = '<ws:for data="index, iterator in collection">Content</ws:for>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.instanceOf(tree[0], Ast.ForeachNode);
      });
      it('Failure! ForeachNode (no iterator)', () => {
         const html = '<ws:for data="in collection">Content</ws:for>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 0);
      });
      it('Failure! ForeachNode (no collection)', () => {
         const html = '<ws:for data="collection">Content</ws:for>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 0);
      });
   });
   describe('TextNode', () => {
      it('with text', () => {
         const html = 'Text';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.instanceOf(tree[0], Ast.TextNode);
      });
      it('without text', () => {
         const html = '';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 0);
      });
      it('Failure! TextNode', () => {
         const html = '{{ 1 2 3 }}';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 0);
      });
   });
   describe('Data types', () => {
      describe('Data type directive', () => {
         it('Array', () => {
            const optionTemplate = `
            <ws:option>
                <ws:Array>
                   <ws:Array></ws:Array>
                   <ws:Boolean>true</ws:Boolean>
                   <ws:Function>UIModule/Module:library.handler</ws:Function>
                   <ws:Number>123</ws:Number>
                   <ws:Object></ws:Object>
                   <ws:String>text</ws:String>
                   <ws:Value>value</ws:Value>
                </ws:Array>
            </ws:option>
            `;
            const ast = traversePropertyOnComponent(optionTemplate);
            const option = ast.__$ws_options.option;
            assert.instanceOf(option, Ast.OptionNode);
            assert.instanceOf(option.__$ws_value, Ast.ArrayNode);
            const array = <Ast.ArrayNode>option.__$ws_value;
            assert.strictEqual(array.__$ws_elements.length, 7);
         });
         it('Boolean', () => {
            const optionTemplate = `
            <ws:option>
                <ws:Boolean>true</ws:Boolean>
            </ws:option>
            `;
            const ast = traversePropertyOnComponent(optionTemplate);
            const option = ast.__$ws_options.option;
            assert.instanceOf(option, Ast.OptionNode);
            assert.instanceOf(option.__$ws_value, Ast.BooleanNode);
         });
         it('Function', () => {
            const optionTemplate = `
            <ws:option>
                <ws:Function arg1='1' arg2='2'>UIModule/Module:library.handler</ws:Function>
            </ws:option>
            `;
            const ast = traversePropertyOnComponent(optionTemplate);
            const option = ast.__$ws_options.option;
            assert.instanceOf(option, Ast.OptionNode);
            assert.instanceOf(option.__$ws_value, Ast.FunctionNode);
            const functionNode = <Ast.FunctionNode>option.__$ws_value;
            assert.isTrue(functionNode.__$ws_options.hasOwnProperty('arg1'));
            assert.isTrue(functionNode.__$ws_options.hasOwnProperty('arg2'));
         });
         it('Number', () => {
            const optionTemplate = `
            <ws:option>
                <ws:Number>123</ws:Number>
            </ws:option>
            `;
            const ast = traversePropertyOnComponent(optionTemplate);
            const option = ast.__$ws_options.option;
            assert.instanceOf(option, Ast.OptionNode);
            assert.instanceOf(option.__$ws_value, Ast.NumberNode);
         });
         it('Object', () => {
            const optionTemplate = `
            <ws:option>
                <ws:Object attributeOption="value">
                    <ws:arrayProperty>
                        <ws:Array></ws:Array>
                    </ws:arrayProperty>
                    <ws:booleanProperty>
                        <ws:Boolean>true</ws:Boolean>
                    </ws:booleanProperty>
                    <ws:functionProperty>
                        <ws:Function>UIModule/Module:library.handler</ws:Function>
                    </ws:functionProperty>
                    <ws:numberProperty>
                        <ws:Number>123</ws:Number>
                    </ws:numberProperty>
                    <ws:objectProperty>
                       <ws:Object></ws:Object>
                    </ws:objectProperty>
                    <ws:stringProperty>
                        <ws:String>text</ws:String>
                    </ws:stringProperty>
                    <ws:valueProperty>
                        <ws:Value>value</ws:Value>
                    </ws:valueProperty>
                </ws:Object>
            </ws:option>
            `;
            const ast = traversePropertyOnComponent(optionTemplate);
            const option = ast.__$ws_options.option;
            assert.instanceOf(option, Ast.OptionNode);
            assert.instanceOf(option.__$ws_value, Ast.ObjectNode);
            const properties = (<Ast.ObjectNode>option.__$ws_value).__$ws_properties;
            assert.isTrue(properties.hasOwnProperty('attributeOption'));
            assert.isTrue(properties.hasOwnProperty('arrayProperty'));
            assert.isTrue(properties.hasOwnProperty('booleanProperty'));
            assert.isTrue(properties.hasOwnProperty('functionProperty'));
            assert.isTrue(properties.hasOwnProperty('numberProperty'));
            assert.isTrue(properties.hasOwnProperty('objectProperty'));
            assert.isTrue(properties.hasOwnProperty('stringProperty'));
            assert.isTrue(properties.hasOwnProperty('valueProperty'));
         });
         it('String', () => {
            const optionTemplate = `
            <ws:option>
                <ws:String>text</ws:String>
            </ws:option>
            `;
            const ast = traversePropertyOnComponent(optionTemplate);
            const option = ast.__$ws_options.option;
            assert.instanceOf(option, Ast.OptionNode);
            assert.instanceOf(option.__$ws_value, Ast.StringNode);
         });
         it('Value', () => {
            const optionTemplate = `
            <ws:option>
                <ws:Value>value</ws:Value>
            </ws:option>
            `;
            const ast = traversePropertyOnComponent(optionTemplate);
            const option = ast.__$ws_options.option;
            assert.instanceOf(option, Ast.OptionNode);
            assert.instanceOf(option.__$ws_value, Ast.ValueNode);
         });
         it('Ignore attribute on "option" tag', () => {
            const optionTemplate = `
            <ws:option attribute='value'>
                <ws:Value>value</ws:Value>
            </ws:option>
            `;
            const ast = traversePropertyOnComponent(optionTemplate);
            const option = ast.__$ws_options.option;
            assert.instanceOf(option, Ast.OptionNode);
            assert.instanceOf(option.__$ws_value, Ast.ValueNode);
         });
      });
      describe('Explicit type casting', () => {
         it('Array', () => {
            const optionTemplate = `
            <ws:option type="array">
                <ws:Array></ws:Array>
                <ws:Boolean>true</ws:Boolean>
                <ws:Function>UIModule/Module:library.handler</ws:Function>
                <ws:Number>123</ws:Number>
                <ws:Object></ws:Object>
                <ws:String>text</ws:String>
                <ws:Value>value</ws:Value>
            </ws:option>
            `;
            const ast = traversePropertyOnComponent(optionTemplate);
            const option = ast.__$ws_options.option;
            assert.instanceOf(option, Ast.OptionNode);
            assert.instanceOf(option.__$ws_value, Ast.ArrayNode);
            const array = <Ast.ArrayNode>option.__$ws_value;
            assert.strictEqual(array.__$ws_elements.length, 7);
         });
         it('Boolean', () => {
            const optionTemplate = `<ws:option type='boolean'>true</ws:option>`;
            const ast = traversePropertyOnComponent(optionTemplate);
            const option = ast.__$ws_options.option;
            assert.instanceOf(option, Ast.OptionNode);
            assert.instanceOf(option.__$ws_value, Ast.BooleanNode);
         });
         it('Function', () => {
            const optionTemplate = `<ws:option type='function' arg1='1' arg2='2'>UIModule/Module:library.handler</ws:option>`;
            const ast = traversePropertyOnComponent(optionTemplate);
            const option = ast.__$ws_options.option;
            assert.instanceOf(option, Ast.OptionNode);
            assert.instanceOf(option.__$ws_value, Ast.FunctionNode);
         });
         it('Number', () => {
            const optionTemplate = `<ws:option type='number'>123</ws:option>`;
            const ast = traversePropertyOnComponent(optionTemplate);
            const option = ast.__$ws_options.option;
            assert.instanceOf(option, Ast.OptionNode);
            assert.instanceOf(option.__$ws_value, Ast.NumberNode);
         });
         it('Object', () => {
            const optionTemplate = `
            <ws:option type="object">
                 <ws:arrayProperty>
                     <ws:Array></ws:Array>
                 </ws:arrayProperty>
                 <ws:booleanProperty>
                     <ws:Boolean>true</ws:Boolean>
                 </ws:booleanProperty>
                 <ws:functionProperty>
                     <ws:Function>UIModule/Module:library.handler</ws:Function>
                 </ws:functionProperty>
                 <ws:numberProperty>
                     <ws:Number>123</ws:Number>
                 </ws:numberProperty>
                 <ws:objectProperty>
                    <ws:Object></ws:Object>
                 </ws:objectProperty>
                 <ws:stringProperty>
                     <ws:String>text</ws:String>
                 </ws:stringProperty>
                 <ws:valueProperty>
                     <ws:Value>value</ws:Value>
                 </ws:valueProperty>
            </ws:option>
            `;
            const ast = traversePropertyOnComponent(optionTemplate);
            const option = ast.__$ws_options.option;
            assert.instanceOf(option, Ast.OptionNode);
            assert.instanceOf(option.__$ws_value, Ast.ObjectNode);
            const properties = (<Ast.ObjectNode>option.__$ws_value).__$ws_properties;
            assert.isTrue(!properties.hasOwnProperty('type'));
            assert.isTrue(properties.hasOwnProperty('arrayProperty'));
            assert.isTrue(properties.hasOwnProperty('booleanProperty'));
            assert.isTrue(properties.hasOwnProperty('functionProperty'));
            assert.isTrue(properties.hasOwnProperty('numberProperty'));
            assert.isTrue(properties.hasOwnProperty('objectProperty'));
            assert.isTrue(properties.hasOwnProperty('stringProperty'));
            assert.isTrue(properties.hasOwnProperty('valueProperty'));
         });
         it('Object with option in tag attributes', () => {
            const optionTemplate = `
            <ws:option type="object" attributeOption="value">
                 <ws:tagOption>
                     <ws:Value>value</ws:Value>
                 </ws:tagOption>
            </ws:option>
            `;
            const ast = traversePropertyOnComponent(optionTemplate);
            const option = ast.__$ws_options.option;
            assert.instanceOf(option, Ast.OptionNode);
            assert.instanceOf(option.__$ws_value, Ast.ObjectNode);
            const properties = (<Ast.ObjectNode>option.__$ws_value).__$ws_properties;
            assert.isTrue(!properties.hasOwnProperty('type'));
            assert.isTrue(properties.hasOwnProperty('attributeOption'));
            assert.isTrue(properties.hasOwnProperty('tagOption'));
         });
         it('String', () => {
            const optionTemplate = `<ws:option type='string'>text</ws:option>`;
            const ast = traversePropertyOnComponent(optionTemplate);
            const option = ast.__$ws_options.option;
            assert.instanceOf(option, Ast.OptionNode);
            assert.instanceOf(option.__$ws_value, Ast.StringNode);
         });
         it('Value', () => {
            const optionTemplate = `<ws:option type='value'>value</ws:option>`;
            const ast = traversePropertyOnComponent(optionTemplate);
            const option = ast.__$ws_options.option;
            assert.instanceOf(option, Ast.OptionNode);
            assert.instanceOf(option.__$ws_value, Ast.ValueNode);
         });
         it('Ignore attribute on "option" tag', () => {
            const optionTemplate = `<ws:option type='value' attribute='value'>value</ws:option>`;
            const ast = traversePropertyOnComponent(optionTemplate);
            const option = ast.__$ws_options.option;
            assert.instanceOf(option, Ast.OptionNode);
            assert.instanceOf(option.__$ws_value, Ast.ValueNode);
         });
      });
      describe('Implicit type casting', () => {
         it('Array', () => {
            const optionTemplate = `
            <ws:option>
                 <ws:Array></ws:Array>
                 <ws:Boolean>true</ws:Boolean>
                 <ws:Function>UIModule/Module:library.handler</ws:Function>
                 <ws:Number>123</ws:Number>
                 <ws:Object></ws:Object>
                 <ws:String>text</ws:String>
                 <ws:Value>value</ws:Value>
            </ws:option>
            `;
            const ast = traversePropertyOnComponent(optionTemplate);
            const option = ast.__$ws_options.option;
            assert.instanceOf(option, Ast.OptionNode);
            assert.instanceOf(option.__$ws_value, Ast.ArrayNode);
            const array = <Ast.ArrayNode>option.__$ws_value;
            assert.strictEqual(array.__$ws_elements.length, 7);
         });
         it('Object', () => {
            const optionTemplate = `
            <ws:option>
                 <ws:arrayProperty>
                     <ws:Array></ws:Array>
                 </ws:arrayProperty>
                 <ws:booleanProperty>
                     <ws:Boolean>true</ws:Boolean>
                 </ws:booleanProperty>
                 <ws:functionProperty>
                     <ws:Function>UIModule/Module:library.handler</ws:Function>
                 </ws:functionProperty>
                 <ws:numberProperty>
                     <ws:Number>123</ws:Number>
                 </ws:numberProperty>
                 <ws:objectProperty>
                    <ws:Object></ws:Object>
                 </ws:objectProperty>
                 <ws:stringProperty>
                     <ws:String>text</ws:String>
                 </ws:stringProperty>
                 <ws:valueProperty>
                     <ws:Value>value</ws:Value>
                 </ws:valueProperty>
            </ws:option>
            `;
            const ast = traversePropertyOnComponent(optionTemplate);
            const option = ast.__$ws_options.option;
            assert.instanceOf(option, Ast.OptionNode);
            assert.instanceOf(option.__$ws_value, Ast.ObjectNode);
         });
         it('Object with option in tag attributes', () => {
            const optionTemplate = `
            <ws:option attributeOption="value">
                 <ws:tagOption>
                     <ws:Value>value</ws:Value>
                 </ws:tagOption>
            </ws:option>
            `;
            const ast = traversePropertyOnComponent(optionTemplate);
            const option = ast.__$ws_options.option;
            assert.instanceOf(option, Ast.OptionNode);
            assert.instanceOf(option.__$ws_value, Ast.ObjectNode);
            const properties = (<Ast.ObjectNode>option.__$ws_value).__$ws_properties;
            assert.isTrue(properties.hasOwnProperty('attributeOption'));
            assert.isTrue(properties.hasOwnProperty('tagOption'));
         });
      });
   });
});
