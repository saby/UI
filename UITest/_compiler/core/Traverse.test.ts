import traverse from 'UI/_builder/Tmpl/core/Traverse';
import { Parser } from 'UI/_builder/Tmpl/expressions/_private/Parser';
import createErrorHandler from '../NullLogger';
import Scope from 'UI/_builder/Tmpl/core/Scope';
import { parse } from 'UI/_builder/Tmpl/html/Parser';
import getWasabyTagDescription from 'UI/_builder/Tmpl/core/Tags';
import * as Ast from 'UI/_builder/Tmpl/core/Ast';
import { assert } from 'chai';

// TODO: UI/_builder/Tmpl/* -> Compiler/*

const traverseConfig = {
   allowComments: false,
   expressionParser: new Parser(),
   hierarchicalKeys: true,
   errorHandler: createErrorHandler()
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
      scope: new Scope()
   };
}

function traverseTemplate(text: string): Ast.Ast[] {
   const options = createTraverseOptions();
   const html = parse(text, options.fileName, parseConfig);
   return traverse(html, traverseConfig, options);
}

function traversePropertyOnComponent(optionTemplate: string): Ast.ComponentNode {
   const template = `<UIModule.Control>
    ${optionTemplate}
</UIModule.Control>`;
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
      it('Failure! Node', () => {
         const html = '<unknown attr:class="div-class" id="content" on:click="handler()"></unknown>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 0);
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
      it('Simple component', () => {
         const html = '<UIModule.DirModule.Component />';
         const tree = traverseTemplate(html);
         const componentNode = <Ast.ComponentNode>tree[0];
         assert.strictEqual(componentNode.__$ws_physicalPath.length, 3);
         assert.strictEqual(componentNode.__$ws_physicalPath[0], 'UIModule');
         assert.strictEqual(componentNode.__$ws_physicalPath[1], 'DirModule');
         assert.strictEqual(componentNode.__$ws_physicalPath[2], 'Component');
         assert.strictEqual(componentNode.__$ws_logicalPath.length, 0);
      });
      it('Library component', () => {
         const html = '<UIModule.Library:Space.Component />';
         const tree = traverseTemplate(html);
         const componentNode = <Ast.ComponentNode>tree[0];
         assert.strictEqual(componentNode.__$ws_physicalPath.length, 2);
         assert.strictEqual(componentNode.__$ws_physicalPath[0], 'UIModule');
         assert.strictEqual(componentNode.__$ws_physicalPath[1], 'Library');
         assert.strictEqual(componentNode.__$ws_logicalPath.length, 2);
         assert.strictEqual(componentNode.__$ws_logicalPath[0], 'Space');
         assert.strictEqual(componentNode.__$ws_logicalPath[1], 'Component');
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
// TODO: In development
//          const html = `
// <UIModule.Component>
//     <ws:content>
//        <div>123</div>
//    </ws:content>
//     <ws:contentOption>
//        <div>456</div>
//    </ws:contentOption>
// </UIModule.Component>`;
//          const tree = traverseTemplate(html);
//          const componentNode = <Ast.ComponentNode>tree[0];
//          assert.strictEqual(Object.keys(componentNode.__$ws_attributes).length, 0);
//          assert.strictEqual(Object.keys(componentNode.__$ws_options).length, 0);
//          assert.strictEqual(Object.keys(componentNode.__$ws_events).length, 0);
//          assert.strictEqual(Object.keys(componentNode.__$ws_contents).length, 2);
//          assert.isTrue(componentNode.__$ws_contents.hasOwnProperty('content'));
//          assert.isTrue(componentNode.__$ws_contents.hasOwnProperty('contentOption'));
      });
   });
   describe('PartialNode', () => {
      it('Base', () => {
         // TODO: In development...
         // const html = `<ws:partial template="...">`;
         // const tree = traverseTemplate(html);
         // assert.strictEqual(tree.length, 1);
         // assert.instanceOf(tree[0], Ast.PartialNode);
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
         assert.strictEqual(tree.length, 0);
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
         assert.strictEqual(tree.length, 0);
      });
      it('Failure! ElseNode (if-elif-else)', () => {
         const html = '<ws:if data="{{ otherCondition }}">Text</ws:if><ws:else>Text</ws:else><ws:else data="{{ otherCondition }}">Text</ws:else>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 2);
         assert.instanceOf(tree[0], Ast.IfNode);
         assert.instanceOf(tree[1], Ast.ElseNode);
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
                <ws:Function>UIModule/Module:library.handler</ws:Function>
            </ws:option>
            `;
            const ast = traversePropertyOnComponent(optionTemplate);
            const option = ast.__$ws_options.option;
            assert.instanceOf(option, Ast.OptionNode);
            assert.instanceOf(option.__$ws_value, Ast.FunctionNode);
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
            // TODO: dev
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
      });
      describe('Explicit type casting', () => {
         it('Array', () => {
            // TODO: dev
         });
         it('Boolean', () => {
            const optionTemplate = `<ws:option type='boolean'>true</ws:option>`;
            const ast = traversePropertyOnComponent(optionTemplate);
            const option = ast.__$ws_options.option;
            assert.instanceOf(option, Ast.OptionNode);
            assert.instanceOf(option.__$ws_value, Ast.BooleanNode);
         });
         it('Function', () => {
            const optionTemplate = `<ws:option type='function'>UIModule/Module:library.handler</ws:option>`;
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
            // TODO: dev
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
      });
      describe('Implicit type casting', () => {
         it('Array', () => {
            // TODO: dev
         });
         it('Boolean', () => {
            // TODO: dev
         });
         it('Function', () => {
            // TODO: dev
         });
         it('Number', () => {
            // TODO: dev
         });
         it('Object', () => {
            // TODO: dev
         });
         it('String', () => {
            // TODO: dev
         });
         it('Value', () => {
            // TODO: dev
         });
      });
   });
});
