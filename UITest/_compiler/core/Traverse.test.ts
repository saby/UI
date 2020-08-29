import traverse from 'UI/_builder/Tmpl/core/Traverse';
import { Parser } from 'UI/_builder/Tmpl/expressions/_private/Parser';
import ErrorHandler from 'UI/_builder/Tmpl/utils/ErrorHandler';
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
   errorHandler: new ErrorHandler()
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
   errorHandler: new ErrorHandler()
};

function createTraverseOptions() {
   return {
      fileName: 'Compiler/core/Traverse/TestTemplate.wml',
      scope: new Scope()
   };
}

function traverseTemplate(text: string) {
   const options = createTraverseOptions();
   const html = parse(text, options.fileName, parseConfig);
   return traverse(html, traverseConfig, options);
}

describe('Compiler/core/Traverse', () => {
   it('DoctypeNode', function() {
      const html = '<!DOCTYPE html>';
      const tree = traverseTemplate(html);
      assert.strictEqual(tree.length, 1);
      assert.isTrue(tree[0] instanceof Ast.DoctypeNode);
   });
   it('CDataNode', function() {
      const html = '<![CDATA[ value ]]>';
      const tree = traverseTemplate(html);
      assert.strictEqual(tree.length, 1);
      assert.isTrue(tree[0] instanceof Ast.CDataNode);
   });
   it('InstructionNode', function() {
      const html = '<? instruction ?>';
      const tree = traverseTemplate(html);
      assert.strictEqual(tree.length, 1);
      assert.isTrue(tree[0] instanceof Ast.InstructionNode);
   });
   describe('ElementNode', function () {
      it('Base', function() {
         const html = '<div></div>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.isTrue(tree[0] instanceof Ast.ElementNode);
         const elementNode = <Ast.ElementNode>tree[0];
         assert.strictEqual(elementNode.__$ws_name, 'div');
      });
      it('Element attributes', function() {
         const html = '<div attr:class="div-class" id="content""></div>';
         const tree = traverseTemplate(html);
         const elementNode = <Ast.ElementNode>tree[0];
         assert.strictEqual(Object.keys(elementNode.__$ws_attributes).length, 2);
         assert.strictEqual(Object.keys(elementNode.__$ws_events).length, 0);
         assert.isTrue(elementNode.__$ws_attributes.hasOwnProperty('attr:class'));
         assert.isTrue(elementNode.__$ws_attributes.hasOwnProperty('attr:id'));
      });
      it('Element event handlers', function() {
         const html = '<div on:click="handler()"></div>';
         const tree = traverseTemplate(html);
         const elementNode = <Ast.ElementNode>tree[0];
         assert.strictEqual(Object.keys(elementNode.__$ws_attributes).length, 0);
         assert.strictEqual(Object.keys(elementNode.__$ws_events).length, 1);
         assert.isTrue(elementNode.__$ws_events.hasOwnProperty('on:click'));
      });
   });
   describe('ComponentNode', () => {
      it('Base', function() {
         const html = '<UIModule.Component />';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.isTrue(tree[0] instanceof Ast.ComponentNode);
      });
      it('Simple component', function() {
         const html = '<UIModule.DirModule.Component />';
         const tree = traverseTemplate(html);
         const componentNode = <Ast.ComponentNode>tree[0];
         assert.strictEqual(componentNode.__$ws_library.length, 3);
         assert.strictEqual(componentNode.__$ws_library[0], 'UIModule');
         assert.strictEqual(componentNode.__$ws_library[1], 'DirModule');
         assert.strictEqual(componentNode.__$ws_library[2], 'Component');
         assert.strictEqual(componentNode.__$ws_module.length, 0);
      });
      it('Library component', function() {
         const html = '<UIModule.Library:Space.Component />';
         const tree = traverseTemplate(html);
         const componentNode = <Ast.ComponentNode>tree[0];
         assert.strictEqual(componentNode.__$ws_library.length, 2);
         assert.strictEqual(componentNode.__$ws_library[0], 'UIModule');
         assert.strictEqual(componentNode.__$ws_library[1], 'Library');
         assert.strictEqual(componentNode.__$ws_module.length, 2);
         assert.strictEqual(componentNode.__$ws_module[0], 'Space');
         assert.strictEqual(componentNode.__$ws_module[1], 'Component');
      });
      it('Component attributes and options', function() {
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
      it('Component event handlers', function() {
         const html = '<UIModule.DirModule.Component on:click="handler()" />';
         const tree = traverseTemplate(html);
         const componentNode = <Ast.ComponentNode>tree[0];
         assert.strictEqual(Object.keys(componentNode.__$ws_attributes).length, 0);
         assert.strictEqual(Object.keys(componentNode.__$ws_options).length, 0);
         assert.strictEqual(Object.keys(componentNode.__$ws_events).length, 1);
         assert.strictEqual(Object.keys(componentNode.__$ws_contents).length, 0);
         assert.isTrue(componentNode.__$ws_events.hasOwnProperty('on:click'));
      });
      it('Component contents', function() {
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
      it('Base', function() {
         // TODO: In development...
         // const html = `<ws:partial template="...">`;
         // const tree = traverseTemplate(html);
         // assert.strictEqual(tree.length, 1);
         // assert.isTrue(tree[0] instanceof Ast.PartialNode);
      });
   });
   it('TemplateNode', function() {
      const html = '<ws:template name="tmpl"><div></div></ws:template>';
      const tree = traverseTemplate(html);
      assert.strictEqual(tree.length, 1);
      assert.isTrue(tree[0] instanceof Ast.TemplateNode);
      const templateNode = <Ast.TemplateNode>tree[0];
      assert.strictEqual(templateNode.__$ws_name, 'tmpl');
   });
   describe('Conditionals', () => {
      it('IfNode (if only)', function() {
         const html = '<ws:if data="{{ condition }}">Text</ws:if>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.isTrue(tree[0] instanceof Ast.IfNode);
      });
      it('ElseNode (if-else)', function() {
         const html = '<ws:if data="{{ condition }}">Text</ws:if><ws:else>Text</ws:else>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 2);
         assert.isTrue(tree[0] instanceof Ast.IfNode);
         assert.isTrue(tree[1] instanceof Ast.ElseNode);
      });
      it('ElseNode (if-elif-else)', function() {
         const html = '<ws:if data="{{ condition }}">Text</ws:if><ws:else data="{{ otherCondition }}">Text</ws:else><ws:else>Text</ws:else>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 3);
         assert.isTrue(tree[0] instanceof Ast.IfNode);
         assert.isTrue(tree[1] instanceof Ast.ElseNode);
         assert.isTrue(tree[2] instanceof Ast.ElseNode);
      });
   });
   describe('Cycles', () => {
      it('ForNode (init;test;update)', function() {
         const html = '<ws:for data="it.init(); it.test(); it.update()">Content</ws:for>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.isTrue(tree[0] instanceof Ast.ForNode);
      });
      it('ForNode (init;test;)', function() {
         const html = '<ws:for data="it.init(); it.test();">Content</ws:for>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.isTrue(tree[0] instanceof Ast.ForNode);
      });
      it('ForNode (;test;update)', function() {
         const html = '<ws:for data="; it.test(); it.update()">Content</ws:for>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.isTrue(tree[0] instanceof Ast.ForNode);
      });
      it('ForNode (;test;)', function() {
         const html = '<ws:for data="; it.test();">Content</ws:for>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.isTrue(tree[0] instanceof Ast.ForNode);
      });
      it('ForeachNode (iterator)', function() {
         const html = '<ws:for data="iterator in collection">Content</ws:for>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.isTrue(tree[0] instanceof Ast.ForeachNode);
      });
      it('ForeachNode (index, iterator)', function() {
         const html = '<ws:for data="index, iterator in collection">Content</ws:for>';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.isTrue(tree[0] instanceof Ast.ForeachNode);
      });
   });
   describe('TextNode', () => {
      it('Base', function() {
         const html = 'Text';
         const tree = traverseTemplate(html);
         assert.strictEqual(tree.length, 1);
         assert.isTrue(tree[0] instanceof Ast.TextNode);
      });
      it('TextDataNode', function() {
         const html = 'Text';
         const tree = traverseTemplate(html);
         const textContent = (<Ast.TextNode>tree[0]).__$ws_content;
         assert.strictEqual(textContent.length, 1);
         const textDataNode = textContent[0];
         assert.isTrue(textDataNode instanceof Ast.TextDataNode);
         const textDataValue = (<Ast.TextDataNode>textDataNode).__$ws_content;
         assert.strictEqual(textDataValue, 'Text');
      });
      it('ExpressionNode', function() {
         const html = '{{ identifier }}';
         const tree = traverseTemplate(html);
         const textContent = (<Ast.TextNode>tree[0]).__$ws_content;
         assert.strictEqual(textContent.length, 1);
         const expressionNode = textContent[0];
         assert.isTrue(expressionNode instanceof Ast.ExpressionNode);
      });
      it('TranslationNode (text and context)', function() {
         const html = '{[ Context @@ Text ]}';
         const tree = traverseTemplate(html);
         const textContent = (<Ast.TextNode>tree[0]).__$ws_content;
         assert.strictEqual(textContent.length, 1);
         const translationNode = textContent[0];
         assert.isTrue(translationNode instanceof Ast.TranslationNode);
         const text = (<Ast.TranslationNode>translationNode).__$ws_text;
         const context = (<Ast.TranslationNode>translationNode).__$ws_context;
         assert.strictEqual(text, 'Text');
         assert.strictEqual(context, 'Context');
      });
      it('TranslationNode (text only)', function() {
         const html = '{[ Text ]}';
         const tree = traverseTemplate(html);
         const textContent = (<Ast.TextNode>tree[0]).__$ws_content;
         assert.strictEqual(textContent.length, 1);
         const translationNode = textContent[0];
         assert.isTrue(translationNode instanceof Ast.TranslationNode);
         const text = (<Ast.TranslationNode>translationNode).__$ws_text;
         const context = (<Ast.TranslationNode>translationNode).__$ws_context;
         assert.strictEqual(text, 'Text');
         assert.strictEqual(context, '');
      });
   });
});
