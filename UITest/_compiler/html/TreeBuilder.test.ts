import { TreeBuilder } from 'UI/_builder/Tmpl/html/TreeBuilder';
import { MarkupVisitor } from 'UI/_builder/Tmpl/html/MarkupVisitor';
import createErrorHandler from '../NullLogger';
import { createSource } from 'UI/_builder/Tmpl/html/Source';
import getTagDescription from 'UI/_builder/Tmpl/html/Tags';
import { assert } from 'chai';

// TODO: UI/_builder/Tmpl/* -> Compiler/*

const FILE_NAME = 'Compiler/html/TreeBuilder/TestTemplate.wml';
const visitor = new MarkupVisitor();

function createTree(html, options?) {
   let builder = new TreeBuilder({
      tagDescriptor: getTagDescription,
      allowComments: !!(options && options.allowComments),
      allowCDATA: !!(options && options.allowCDATA),
      xml: !!(options && options.xml),
      errorHandler: createErrorHandler()
   });
   return builder.build(createSource(html, FILE_NAME));
}

describe('Compiler/html/TreeBuilder', () => {
   it('Tag', () => {
      const html = '<tag my:s="value">Hello!</tag>';
      const tree = createTree(html);
      const markup = visitor.visitAll(tree);
      assert.strictEqual(markup, html);
   });
   it('Self closing tag', () => {
      const html = '<tag my:s="value" />';
      const tree = createTree(html);
      const markup = visitor.visitAll(tree);
      assert.strictEqual(markup, html);
   });
   it('Text', () => {
      const html = 'Hello!';
      const tree = createTree(html);
      const markup = visitor.visitAll(tree);
      assert.strictEqual(markup, html);
   });
   it('Comment', () => {
      const html = '<!-- comment -->';
      const tree = createTree(html, { allowComments: true });
      const markup = visitor.visitAll(tree);
      assert.strictEqual(markup, html);
   });
   it('CDATA', () => {
      const html = '<![CDATA[hello]]>';
      const tree = createTree(html, { allowCDATA: true });
      const markup = visitor.visitAll(tree);
      assert.strictEqual(markup, html);
   });
   it('DOCTYPE', () => {
      const html = '<!DOCTYPE html>';
      const tree = createTree(html);
      const markup = visitor.visitAll(tree);
      assert.strictEqual(markup, html);
   });
   it('Instruction', () => {
      const html = '<?xml version="1.0" encoding="utf-8"?>';
      const tree = createTree(html, { xml: true });
      const markup = visitor.visitAll(tree);
      assert.strictEqual(markup, html);
   });
   it('Tree', () => {
      const html = '<aaa><bbb b="1">e<ccc c="2">f<ddd d="3">g</ddd>h</ccc>i</bbb></aaa>';
      const tree = createTree(html, { allowComments: true });
      const markup = visitor.visitAll(tree);
      assert.strictEqual(markup, html);
   });
   it('Many roots', () => {
      const html = '<a aa="aaa">aaaa</a><b bb="bbb">bbbb</b><c cc="ccc">cccc</c>';
      const tree = createTree(html, { allowComments: true });
      const markup = visitor.visitAll(tree);
      assert.strictEqual(markup, html);
   });
   it('selfClosing ok', () => {
      const html = '<test />';
      const tree = createTree(html);
      const markup = visitor.visitAll(tree);
      assert.strictEqual(markup, html);
   });
   it('selfClosing fail', () => {
      const html = '<input />';
      const standard = '<input>';
      const tree = createTree(html);
      const markup = visitor.visitAll(tree);
      assert.strictEqual(markup, standard);
   });
   it('void fail', () => {
      const html = '<input></input>';
      const standard = '<input>';
      const tree = createTree(html);
      const markup = visitor.visitAll(tree);
      assert.strictEqual(markup, standard);
   });
   // it('closed by children', () => {
   //    const html = '<table><tr><td>1<td>2</table>';
   //    const standard = '<table><tr><td>1</td><td>2</td></tr></table>';
   //    const tree = createTree(html);
   //    const markup = visitor.visitAll(tree, CONTEXT);
   //    assert.strictEqual(markup, standard);
   // });
});
