/* global describe, it, assert */
define([
   'Compiler/html/Parser',
   'Compiler/core/Tags',
   'Compiler/utils/ErrorHandler',
   'Compiler/core/Traverse',
   'Compiler/core/PatchVisitor',
   'Compiler/core/Scope',
   'Compiler/i18n/Translator',
   'Compiler/expressions/_private/Parser'
], function(
   Parser,
   Tags,
   ErrorHandler,
   Traverse,
   PatchVisitor,
   Scope,
   Translator,
   ExpressionsParser
) {
   'use strict';

   /**
    * Testing template attributes for ws:partial directive.
    *
       <!--[0]--><ws:template name="tmpl"><div></div></ws:template>
       <!--[1]--><ws:partial template="tmpl" />
       <!--[2]--><ws:partial template="{{ tmplFunction }}" />

       <!-- DOES NOT WORK
       <ws:partial template="UIModule.Component" />
       <ws:partial template="UIModule.library:Component" />
       -->

       <!--[3]--><ws:partial template="UIModule/Component" />
       <!--                  type: control -->
       <!--[4]--><ws:partial template="UIModule/library:Component" />
       <!--                  type: module -->

       <!--[5]--><ws:partial template="wml!UIModule/directory/file" />
       <!--                  type: template -->
       <!--[6]--><ws:partial template="optional!wml!UIModule/directory/file" />
       <!--                  type: control -->
       <!--[7]--><ws:partial template="wml!UIModule/library:tmplFunction" />
       <!--                  type: template -->
       <!--[8]--><ws:partial template="optional!wml!UIModule/library:tmplFunction" />
       <!--                  type: module -->

       <!--[9]--><ws:partial template="tmpl!UIModule/directory/file" />
       <!--                  type: template -->
       <!--[10]--><ws:partial template="optional!tmpl!UIModule/directory/file" />
       <!--                  type: template -->
       <!--[11]--><ws:partial template="tmpl!UIModule/library:tmplFunction" />
       <!--                  type: template -->
       <!--[12]--><ws:partial template="optional!tmpl!UIModule/library:tmplFunction" />
       <!--                  type: template -->

       <!--[13]--><ws:partial template="js!UIModule/directory/file" />
       <!--                  type: control -->
       <!--[14]--><ws:partial template="optional!js!UIModule/directory/file" />
       <!--                  type: control -->
       <!--[15]--><ws:partial template="js!UIModule/library:tmplFunction" />
       <!--                  type: module -->
       <!--[16]--><ws:partial template="optional!js!UIModule/library:tmplFunction" />
       <!--                  type: module -->

       <!--[17]--><ws:partial template="html!UIModule/directory/file" />
       <!--                  type: template -->
       <!--[18]--><ws:partial template="optional!html!UIModule/directory/file" />
       <!--                  type: control -->
       <!--[19]--><ws:partial template="html!UIModule/library:tmplFunction" />
       <!--                  type: template -->
       <!--[20]--><ws:partial template="optional!html!UIModule/library:tmplFunction" />
       <!--                  type: module -->

       <!--[21]--><ws:partial template="optional!UIModule.Component" />
       <!--                  type: template -->
       <!--[22]--><ws:partial template="optional!UIModule.library:Component" />
       <!--                  type: template -->
    */

   var FILE_NAME = 'Compiler/core/PatchVisitor/TestTemplate.wml';

   function isProgramNode(node) {
      return node instanceof ExpressionsParser.Parser.prototype.nodes.ProgramNode;
   }

   function process(html) {
      let errorHandler = ErrorHandler.createErrorHandler(true);
      let scope = new Scope.default();
      let parsed = Parser.parse(html, FILE_NAME, {
         xml: true,
         allowComments: true,
         allowCDATA: true,
         compatibleTreeStructure: true,
         rudeWhiteSpaceCleaning: true,
         normalizeLineFeed: true,
         cleanWhiteSpaces: true,
         needPreprocess: true,
         tagDescriptor: Tags.default,
         errorHandler: errorHandler
      });

      let config = {
         expressionParser: new ExpressionsParser.Parser(),
         hierarchicalKeys: true,
         errorHandler: errorHandler,
         allowComments: false,
         textTranslator: Translator.createTextTranslator({}),
         generateTranslations: true
      };
      let options = {
         fileName: FILE_NAME,
         scope: scope,
         translateText: true
      };
      let tree = Traverse.default(parsed, config, options);
      PatchVisitor.default(tree, scope);
      return tree;
   }

   describe('Compiler/core/PatchVisitor', function() {
      describe('Text', function() {
         it('text', function() {
            var html = 'Simple text';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].type, 'text');
            assert.strictEqual(tree[0].data.length, 1);
            assert.isTrue(tree[0].data[0].localized);
            assert.strictEqual(tree[0].data[0].name, 'Simple text');
            assert.strictEqual(tree[0].data[0].type, 'var');
         });
         it('text 2', function() {
            var html = 'Simple<!-- comment -->text';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].type, 'text');
            assert.strictEqual(tree[0].data.length, 2);

            assert.isTrue(tree[0].data[0].localized);
            assert.strictEqual(tree[0].data[0].name, 'Simple');
            assert.strictEqual(tree[0].data[0].type, 'var');

            assert.isTrue(tree[0].data[1].localized);
            assert.strictEqual(tree[0].data[1].name, 'text');
            assert.strictEqual(tree[0].data[1].type, 'var');
         });
         it('translation', function() {
            var html = '{[ Context @@ Hello ]}';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].type, 'text');
            assert.strictEqual(tree[0].data.length, 1);
            assert.isTrue(tree[0].data[0].localized);
            assert.strictEqual(tree[0].data[0].name, 'Context @@ Hello');
            assert.strictEqual(tree[0].data[0].type, 'var');
         });
         it('expression', function() {
            var html = '{{ name2 }}';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].type, 'text');
            assert.strictEqual(tree[0].data.length, 1);
            assert.isFalse(tree[0].data[0].isBind);
            assert.isFalse(tree[0].data[0].isEvent);
            assert.isFalse(tree[0].data[0].localized);
            assert.isTrue(isProgramNode(tree[0].data[0].name));
            assert.strictEqual(tree[0].data[0].name.string, 'name2');
            assert.isFalse(tree[0].data[0].noEscape);
            assert.strictEqual(tree[0].data[0].type, 'var');
         });
         it('mix', function() {
            var html = '{[ Context @@ Hello ]}, {{ name2 }}!';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].type, 'text');
            assert.strictEqual(tree[0].data.length, 4);

            assert.isTrue(tree[0].data[0].localized);
            assert.strictEqual(tree[0].data[0].name, 'Context @@ Hello');
            assert.strictEqual(tree[0].data[0].type, 'var');

            assert.strictEqual(tree[0].data[1].value, ', ');
            assert.strictEqual(tree[0].data[1].type, 'text');

            assert.isFalse(tree[0].data[2].isBind);
            assert.isFalse(tree[0].data[2].isEvent);
            assert.isFalse(tree[0].data[2].localized);
            assert.isTrue(isProgramNode(tree[0].data[2].name));
            assert.strictEqual(tree[0].data[2].name.string, 'name2');
            assert.isFalse(tree[0].data[2].noEscape);
            assert.strictEqual(tree[0].data[2].type, 'var');

            assert.strictEqual(tree[0].data[3].value, '!');
            assert.strictEqual(tree[0].data[3].type, 'text');
         });
      });
      describe('Text in tag', function() {
         it('text', function() {
            var html = '<div>Simple text</div>';
            var tree = process(html);
            var children = tree[0].children;
            assert.strictEqual(children.length, 1);
            assert.strictEqual(children[0].key, '0_0_');
            assert.strictEqual(children[0].type, 'text');
            assert.strictEqual(children[0].data.length, 1);
            assert.isTrue(children[0].data[0].localized);
            assert.strictEqual(children[0].data[0].name, 'Simple text');
            assert.strictEqual(children[0].data[0].type, 'var');
         });
         it('text 2', function() {
            var html = '<div>Simple<!-- comment -->text</div>';
            var tree = process(html);
            var children = tree[0].children;
            assert.strictEqual(children.length, 1);
            assert.strictEqual(children[0].key, '0_0_');
            assert.strictEqual(children[0].type, 'text');
            assert.strictEqual(children[0].data.length, 2);

            assert.isTrue(children[0].data[0].localized);
            assert.strictEqual(children[0].data[0].name, 'Simple');
            assert.strictEqual(children[0].data[0].type, 'var');

            assert.isTrue(children[0].data[1].localized);
            assert.strictEqual(children[0].data[1].name, 'text');
            assert.strictEqual(children[0].data[1].type, 'var');
         });
         it('translation', function() {
            var html = '<div>{[ Context @@ Hello ]}</div>';
            var tree = process(html);
            var children = tree[0].children;
            assert.strictEqual(children.length, 1);
            assert.strictEqual(children[0].key, '0_0_');
            assert.strictEqual(children[0].type, 'text');
            assert.strictEqual(children[0].data.length, 1);
            assert.isTrue(children[0].data[0].localized);
            assert.strictEqual(children[0].data[0].name, 'Context @@ Hello');
            assert.strictEqual(children[0].data[0].type, 'var');
         });
         it('expression', function() {
            var html = '<div>{{ name2 }}</div>';
            var tree = process(html);
            var children = tree[0].children;
            assert.strictEqual(children.length, 1);
            assert.strictEqual(children[0].key, '0_0_');
            assert.strictEqual(children[0].type, 'text');
            assert.strictEqual(children[0].data.length, 1);
            assert.isFalse(children[0].data[0].isBind);
            assert.isFalse(children[0].data[0].isEvent);
            assert.isFalse(children[0].data[0].localized);
            assert.isTrue(isProgramNode(children[0].data[0].name));
            assert.strictEqual(children[0].data[0].name.string, 'name2');
            assert.isFalse(children[0].data[0].noEscape);
            assert.strictEqual(children[0].data[0].type, 'var');
         });
         it('mix', function() {
            var html = '<div>{[ Context @@ Hello ]}, {{ name2 }}!</div>';
            var tree = process(html);
            var children = tree[0].children;
            assert.strictEqual(children.length, 1);
            assert.strictEqual(children[0].key, '0_0_');
            assert.strictEqual(children[0].type, 'text');
            assert.strictEqual(children[0].data.length, 4);

            assert.isTrue(children[0].data[0].localized);
            assert.strictEqual(children[0].data[0].name, 'Context @@ Hello');
            assert.strictEqual(children[0].data[0].type, 'var');

            assert.strictEqual(children[0].data[1].value, ', ');
            assert.strictEqual(children[0].data[1].type, 'text');

            assert.isFalse(children[0].data[2].isBind);
            assert.isFalse(children[0].data[2].isEvent);
            assert.isFalse(children[0].data[2].localized);
            assert.isTrue(isProgramNode(children[0].data[2].name));
            assert.strictEqual(children[0].data[2].name.string, 'name2');
            assert.isFalse(children[0].data[2].noEscape);
            assert.strictEqual(children[0].data[2].type, 'var');

            assert.strictEqual(children[0].data[3].value, '!');
            assert.strictEqual(children[0].data[3].type, 'text');
         });
      });
      describe('Html elements', function() {
         it('doctype', function() {
            var html = '<!doctype html>';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].data, '!DOCTYPE html');
            assert.strictEqual(tree[0].name, '!DOCTYPE');
            assert.strictEqual(tree[0].type, 'directive');
         });
         it('instruction', function() {
            var html = '<? instruction ?>';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].data, '? instruction ?');
            assert.strictEqual(tree[0].name, '?');
            assert.strictEqual(tree[0].type, 'directive');
         });
         it('cdata', function() {
            var html = '<![CDATA[ value ]]>';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].data, '![CDATA[ value ]]');
            assert.strictEqual(tree[0].name, '![CDATA[');
            assert.strictEqual(tree[0].type, 'directive');
         });
         it('element', function() {
            var html = '<div></div>';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].children.length, 0);
            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'div');
            assert.strictEqual(tree[0].type, 'tag');
         });
         it('script', function() {
            var html = '<script>program</script>';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'script');
            assert.strictEqual(tree[0].type, 'tag');
            assert.strictEqual(tree[0].children.length, 1);

            assert.strictEqual(tree[0].children[0].key, '0_0_');
            assert.strictEqual(tree[0].children[0].type, 'text');
            assert.strictEqual(tree[0].children[0].data.type, 'text');
            assert.strictEqual(tree[0].children[0].data.value, 'program');
         });
         it('style', function() {
            var html = '<style>description</style>';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'style');
            assert.strictEqual(tree[0].type, 'tag');
            assert.strictEqual(tree[0].children.length, 1);

            assert.strictEqual(tree[0].children[0].key, '0_0_');
            assert.strictEqual(tree[0].children[0].type, 'text');
            assert.strictEqual(tree[0].children[0].data.type, 'text');
            assert.strictEqual(tree[0].children[0].data.value, 'description');
         });
         it('element with comment', function() {
            var html = '<!-- --><div></div>';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].children.length, 0);
            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'div');
            assert.strictEqual(tree[0].type, 'tag');
         });
         it('elements tree', function() {
            var html = '<!-- --><div><!-- --><div><!-- --><!-- --><div><!-- --><!-- --><!-- --></div></div></div>';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].children.length, 1);
            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'div');
            assert.strictEqual(tree[0].type, 'tag');

            tree = tree[0].children;
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].children.length, 1);
            assert.strictEqual(tree[0].key, '0_0_');
            assert.strictEqual(tree[0].name, 'div');
            assert.strictEqual(tree[0].type, 'tag');

            tree = tree[0].children;
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].children.length, 0);
            assert.strictEqual(tree[0].key, '0_0_0_');
            assert.strictEqual(tree[0].name, 'div');
            assert.strictEqual(tree[0].type, 'tag');
         });
         it('element attributes', function() {
            var html = '<div attr:class="class" style="style" on:click="handler()"></div>';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);

            assert.isTrue(tree[0].attribs.hasOwnProperty('attr:class'));
            assert.strictEqual(tree[0].attribs['attr:class'].type, 'text');
            assert.strictEqual(tree[0].attribs['attr:class'].data.type, 'text');
            assert.strictEqual(tree[0].attribs['attr:class'].data.value, 'class');

            assert.isTrue(tree[0].attribs.hasOwnProperty('style'));
            assert.strictEqual(tree[0].attribs.style.type, 'text');
            assert.strictEqual(tree[0].attribs.style.data.type, 'text');
            assert.strictEqual(tree[0].attribs.style.data.value, 'style');

            assert.isTrue(tree[0].attribs.hasOwnProperty('on:click'));
            assert.strictEqual(tree[0].attribs['on:click'].type, 'text');
            assert.isTrue(tree[0].attribs['on:click'].property);
            assert.strictEqual(tree[0].attribs['on:click'].data.length, 1);
            assert.isFalse(tree[0].attribs['on:click'].data[0].isBind);
            assert.isTrue(tree[0].attribs['on:click'].data[0].isEvent);
            assert.isFalse(tree[0].attribs['on:click'].data[0].localized);
            assert.isTrue(isProgramNode(tree[0].attribs['on:click'].data[0].name));
            assert.strictEqual(tree[0].attribs['on:click'].data[0].name.string, 'handler()');
            assert.isFalse(tree[0].attribs['on:click'].data[0].noEscape);
            assert.strictEqual(tree[0].attribs['on:click'].data[0].type, 'var');
         });
         it('element attributes 2', function() {
            var html = '<div a1="{{ i }}" a2="a-{{ i }}-b" a3="{[ loc-text ]}"></div>';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);

            assert.isTrue(tree[0].attribs.hasOwnProperty('a1'));
            assert.strictEqual(tree[0].attribs.a1.type, 'text');
            assert.strictEqual(tree[0].attribs.a1.data.length, 1);
            assert.isFalse(tree[0].attribs.a1.data[0].isBind);
            assert.isFalse(tree[0].attribs.a1.data[0].isEvent);
            assert.isFalse(tree[0].attribs.a1.data[0].localized);
            assert.isTrue(isProgramNode(tree[0].attribs.a1.data[0].name));
            assert.strictEqual(tree[0].attribs.a1.data[0].name.string, 'i');
            assert.isFalse(tree[0].attribs.a1.data[0].noEscape);
            assert.strictEqual(tree[0].attribs.a1.data[0].type, 'var');

            assert.isTrue(tree[0].attribs.hasOwnProperty('a2'));
            assert.strictEqual(tree[0].attribs.a2.type, 'text');
            assert.strictEqual(tree[0].attribs.a2.data.length, 3);

            assert.strictEqual(tree[0].attribs.a2.data[0].type, 'text');
            assert.strictEqual(tree[0].attribs.a2.data[0].value, 'a-');

            assert.strictEqual(tree[0].attribs.a2.data[1].type, 'var');
            assert.isFalse(tree[0].attribs.a2.data[1].isBind);
            assert.isFalse(tree[0].attribs.a2.data[1].isEvent);
            assert.isFalse(tree[0].attribs.a2.data[1].localized);
            assert.isTrue(isProgramNode(tree[0].attribs.a2.data[1].name));
            assert.strictEqual(tree[0].attribs.a2.data[1].name.string, 'i');
            assert.isFalse(tree[0].attribs.a2.data[1].noEscape);

            assert.strictEqual(tree[0].attribs.a2.data[2].type, 'text');
            assert.strictEqual(tree[0].attribs.a2.data[2].value, '-b');

            assert.isTrue(tree[0].attribs.hasOwnProperty('a3'));
            assert.strictEqual(tree[0].attribs.a3.type, 'text');
            assert.strictEqual(tree[0].attribs.a3.data.length, 1);
            assert.isTrue(tree[0].attribs.a3.data[0].localized);
            assert.strictEqual(tree[0].attribs.a3.data[0].name, 'loc-text');
            assert.strictEqual(tree[0].attribs.a3.data[0].type, 'var');
         });
      });
      describe('Components', function() {
         it('control', function() {
            var html = '<UIModule.Component />';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.isTrue(tree[0].attribs.hasOwnProperty('_wstemplatename'));
            assert.strictEqual(tree[0].attribs._wstemplatename, 'UIModule/Component');

            assert.strictEqual(tree[0].children.length, 1);
            assert.strictEqual(tree[0].children[0].constructor, 'UIModule/Component');
            assert.strictEqual(tree[0].children[0].fn, 'UIModule/Component');
            assert.strictEqual(tree[0].children[0].key, undefined);
            assert.strictEqual(tree[0].children[0].optional, undefined);
            assert.strictEqual(tree[0].children[0].type, 'control');

            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'ws:UIModule/Component');
            assert.strictEqual(tree[0].type, 'tag');
         });
         it('control (duplicate option)', function() {
            var html = `
            <UIModule.Component option="1">
                <ws:option><ws:String>2</ws:String></ws:option>
                <ws:option><ws:String>3</ws:String></ws:option>
            </UIModule.Component>
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.isTrue(tree[0].attribs.hasOwnProperty('option'));
            assert.strictEqual(tree[0].attribs.option.type, 'text');
            assert.strictEqual(tree[0].attribs.option.data.type, 'text');
            assert.strictEqual(tree[0].attribs.option.data.value, '1');
            assert.strictEqual(tree[0].injectedData.length, 0);
         });
         it('control (duplicate option) 2', function() {
            var html = `
            <UIModule.Component>
                <ws:option><ws:String>2</ws:String></ws:option>
                <ws:option><ws:String>3</ws:String></ws:option>
            </UIModule.Component>
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.isFalse(tree[0].attribs.hasOwnProperty('option'));
            assert.strictEqual(tree[0].injectedData.length, 1);
            var option = tree[0].injectedData[0];

            assert.strictEqual(option.key, '0_0_');
            assert.strictEqual(option.name, 'ws:option');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            option = option.children[0];
            assert.strictEqual(option.key, '0_0_0_');
            assert.strictEqual(option.name, 'ws:String');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            var value = option.children[0];
            assert.strictEqual(value.key, '0_0_0_0_');
            assert.strictEqual(value.type, 'text');
            assert.strictEqual(value.data.length, 1);
            assert.strictEqual(value.data[0].value, '2');
            assert.strictEqual(value.data[0].type, 'text');
         });
         it('module', function() {
            var html = '<UIModule.Library:Component />';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.isTrue(tree[0].attribs.hasOwnProperty('_wstemplatename'));
            assert.strictEqual(tree[0].attribs._wstemplatename, 'UIModule/Library:Component');

            assert.strictEqual(tree[0].children.length, 1);
            assert.strictEqual(tree[0].children[0].constructor, 'UIModule/Library:Component');
            assert.strictEqual(tree[0].children[0].key, undefined);
            assert.strictEqual(tree[0].children[0].library, 'UIModule/Library');
            assert.strictEqual(tree[0].children[0].module.length, 1);
            assert.strictEqual(tree[0].children[0].module[0], 'Component');
            assert.strictEqual(tree[0].children[0].type, 'module');

            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'ws:UIModule/Library:Component');
            assert.strictEqual(tree[0].type, 'tag');
         });
         it('control attributes', function() {
            var html = `
            <UIModule.Component
                name="myTemplate"
                attr:class="a-{{ b }}-c-{[ text ]}"
                style="align-content: baseline"
                on:click="handler()"
                bind:value="value" />
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);

            assert.isTrue(tree[0].attribs.hasOwnProperty('name'));
            assert.strictEqual(tree[0].attribs.name.type, 'text');
            assert.strictEqual(tree[0].attribs.name.data.type, 'text');
            assert.strictEqual(tree[0].attribs.name.data.value, 'myTemplate');

            assert.isTrue(tree[0].attribs.hasOwnProperty('attr:class'));
            assert.strictEqual(tree[0].attribs['attr:class'].type, 'text');
            assert.strictEqual(tree[0].attribs['attr:class'].data.length, 4);
            assert.strictEqual(tree[0].attribs['attr:class'].data[0].type, 'text');
            assert.strictEqual(tree[0].attribs['attr:class'].data[0].value, 'a-');
            assert.strictEqual(tree[0].attribs['attr:class'].data[1].type, 'var');
            assert.isFalse(tree[0].attribs['attr:class'].data[1].isBind);
            assert.isFalse(tree[0].attribs['attr:class'].data[1].isEvent);
            assert.isFalse(tree[0].attribs['attr:class'].data[1].localized);
            assert.isTrue(isProgramNode(tree[0].attribs['attr:class'].data[1].name));
            assert.strictEqual(tree[0].attribs['attr:class'].data[1].name.string, 'b');
            assert.isFalse(tree[0].attribs['attr:class'].data[1].noEscape);
            assert.strictEqual(tree[0].attribs['attr:class'].data[2].type, 'text');
            assert.strictEqual(tree[0].attribs['attr:class'].data[2].value, '-c-');
            assert.isTrue(tree[0].attribs['attr:class'].data[3].localized);
            assert.strictEqual(tree[0].attribs['attr:class'].data[3].type, 'var');
            assert.strictEqual(tree[0].attribs['attr:class'].data[3].name, 'text');

            assert.isTrue(tree[0].attribs.hasOwnProperty('style'));
            assert.strictEqual(tree[0].attribs.style.type, 'text');
            assert.strictEqual(tree[0].attribs.style.data.type, 'text');
            assert.strictEqual(tree[0].attribs.style.data.value, 'align-content: baseline');

            assert.isTrue(tree[0].attribs.hasOwnProperty('on:click'));
            assert.strictEqual(tree[0].attribs['on:click'].type, 'text');
            assert.isTrue(tree[0].attribs['on:click'].property);
            assert.strictEqual(tree[0].attribs['on:click'].data.length, 1);
            assert.isFalse(tree[0].attribs['on:click'].data[0].isBind);
            assert.isTrue(tree[0].attribs['on:click'].data[0].isEvent);
            assert.isFalse(tree[0].attribs['on:click'].data[0].localized);
            assert.isTrue(isProgramNode(tree[0].attribs['on:click'].data[0].name));
            assert.strictEqual(tree[0].attribs['on:click'].data[0].name.string, 'handler()');
            assert.isFalse(tree[0].attribs['on:click'].data[0].noEscape);
            assert.strictEqual(tree[0].attribs['on:click'].data[0].type, 'var');

            assert.isTrue(tree[0].attribs.hasOwnProperty('bind:value'));
            assert.strictEqual(tree[0].attribs['bind:value'].type, 'text');
            assert.isTrue(tree[0].attribs['bind:value'].property);
            assert.strictEqual(tree[0].attribs['bind:value'].data.length, 1);
            assert.isFalse(tree[0].attribs['bind:value'].data[0].isBind);
            assert.isFalse(tree[0].attribs['bind:value'].data[0].isEvent);
            assert.isFalse(tree[0].attribs['bind:value'].data[0].localized);
            assert.isTrue(isProgramNode(tree[0].attribs['bind:value'].data[0].name));
            assert.strictEqual(tree[0].attribs['bind:value'].data[0].name.string, 'value');
            assert.isFalse(tree[0].attribs['bind:value'].data[0].noEscape);
            assert.strictEqual(tree[0].attribs['bind:value'].data[0].type, 'var');
         });
         it('module attributes', function() {
            var html = `
            <UIModule.Library:Component
                name="myTemplate"
                attr:class="a-{{ b }}-c-{[ text ]}"
                style="align-content: baseline"
                on:click="handler()"
                bind:value="value" />
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);

            assert.isTrue(tree[0].attribs.hasOwnProperty('name'));
            assert.strictEqual(tree[0].attribs.name.type, 'text');
            assert.strictEqual(tree[0].attribs.name.data.type, 'text');
            assert.strictEqual(tree[0].attribs.name.data.value, 'myTemplate');

            assert.isTrue(tree[0].attribs.hasOwnProperty('attr:class'));
            assert.strictEqual(tree[0].attribs['attr:class'].type, 'text');
            assert.strictEqual(tree[0].attribs['attr:class'].data.length, 4);
            assert.strictEqual(tree[0].attribs['attr:class'].data[0].type, 'text');
            assert.strictEqual(tree[0].attribs['attr:class'].data[0].value, 'a-');
            assert.strictEqual(tree[0].attribs['attr:class'].data[1].type, 'var');
            assert.isFalse(tree[0].attribs['attr:class'].data[1].isBind);
            assert.isFalse(tree[0].attribs['attr:class'].data[1].isEvent);
            assert.isFalse(tree[0].attribs['attr:class'].data[1].localized);
            assert.isTrue(isProgramNode(tree[0].attribs['attr:class'].data[1].name));
            assert.strictEqual(tree[0].attribs['attr:class'].data[1].name.string, 'b');
            assert.isFalse(tree[0].attribs['attr:class'].data[1].noEscape);
            assert.strictEqual(tree[0].attribs['attr:class'].data[2].type, 'text');
            assert.strictEqual(tree[0].attribs['attr:class'].data[2].value, '-c-');
            assert.isTrue(tree[0].attribs['attr:class'].data[3].localized);
            assert.strictEqual(tree[0].attribs['attr:class'].data[3].type, 'var');
            assert.strictEqual(tree[0].attribs['attr:class'].data[3].name, 'text');

            assert.isTrue(tree[0].attribs.hasOwnProperty('style'));
            assert.strictEqual(tree[0].attribs.style.type, 'text');
            assert.strictEqual(tree[0].attribs.style.data.type, 'text');
            assert.strictEqual(tree[0].attribs.style.data.value, 'align-content: baseline');

            assert.isTrue(tree[0].attribs.hasOwnProperty('on:click'));
            assert.strictEqual(tree[0].attribs['on:click'].type, 'text');
            assert.isTrue(tree[0].attribs['on:click'].property);
            assert.strictEqual(tree[0].attribs['on:click'].data.length, 1);
            assert.isFalse(tree[0].attribs['on:click'].data[0].isBind);
            assert.isTrue(tree[0].attribs['on:click'].data[0].isEvent);
            assert.isFalse(tree[0].attribs['on:click'].data[0].localized);
            assert.isTrue(isProgramNode(tree[0].attribs['on:click'].data[0].name));
            assert.strictEqual(tree[0].attribs['on:click'].data[0].name.string, 'handler()');
            assert.isFalse(tree[0].attribs['on:click'].data[0].noEscape);
            assert.strictEqual(tree[0].attribs['on:click'].data[0].type, 'var');

            assert.isTrue(tree[0].attribs.hasOwnProperty('bind:value'));
            assert.strictEqual(tree[0].attribs['bind:value'].type, 'text');
            assert.isTrue(tree[0].attribs['bind:value'].property);
            assert.strictEqual(tree[0].attribs['bind:value'].data.length, 1);
            assert.isFalse(tree[0].attribs['bind:value'].data[0].isBind);
            assert.isFalse(tree[0].attribs['bind:value'].data[0].isEvent);
            assert.isFalse(tree[0].attribs['bind:value'].data[0].localized);
            assert.isTrue(isProgramNode(tree[0].attribs['bind:value'].data[0].name));
            assert.strictEqual(tree[0].attribs['bind:value'].data[0].name.string, 'value');
            assert.isFalse(tree[0].attribs['bind:value'].data[0].noEscape);
            assert.strictEqual(tree[0].attribs['bind:value'].data[0].type, 'var');
         });
      });
      describe('Data type directives', function() {
         it('Array', function() {
            var html = `
            <UIModule.Component>
               <ws:option>
                    <ws:Array>
                        <ws:Object></ws:Object>
                    </ws:Array>
                </ws:option>
            </UIModule.Component>
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].injectedData.length, 1);
            var option = tree[0].injectedData[0];

            assert.strictEqual(option.key, '0_0_');
            assert.strictEqual(option.name, 'ws:option');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            option = option.children[0];
            assert.strictEqual(option.key, '0_0_0_');
            assert.strictEqual(option.name, 'ws:Array');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            option = option.children[0];
            assert.strictEqual(option.key, '0_0_0_0_');
            assert.strictEqual(option.name, 'ws:Object');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 0);
         });
         it('Array type', function() {
            var html = `
            <UIModule.Component>
               <ws:option type="array">
                    <ws:Object></ws:Object>
                </ws:option>
            </UIModule.Component>
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].injectedData.length, 1);
            var option = tree[0].injectedData[0];

            assert.isTrue(option.attribs.hasOwnProperty('type'));
            assert.strictEqual(option.attribs.type.type, 'text');
            assert.strictEqual(option.attribs.type.data.type, 'text');
            assert.strictEqual(option.attribs.type.data.value, 'array');

            assert.strictEqual(option.key, '0_0_');
            assert.strictEqual(option.name, 'ws:option');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            option = option.children[0];
            assert.strictEqual(option.key, '0_0_0_');
            assert.strictEqual(option.name, 'ws:Object');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 0);
         });
         it('Array type 2', function() {
            var html = `
            <UIModule.Component>
               <ws:option>
                    <ws:Object></ws:Object>
                    <ws:Object></ws:Object>
                    <ws:Object></ws:Object>
                </ws:option>
            </UIModule.Component>
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].injectedData.length, 1);
            var option = tree[0].injectedData[0];

            assert.strictEqual(option.key, '0_0_');
            assert.strictEqual(option.name, 'ws:option');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 3);

            var options = option.children;
            assert.strictEqual(options[0].key, '0_0_0_');
            assert.strictEqual(options[0].name, 'ws:Object');
            assert.strictEqual(options[0].type, 'tag');
            assert.strictEqual(options[0].children.length, 0);

            assert.strictEqual(options[1].key, '0_0_1_');
            assert.strictEqual(options[1].name, 'ws:Object');
            assert.strictEqual(options[1].type, 'tag');
            assert.strictEqual(options[1].children.length, 0);

            assert.strictEqual(options[2].key, '0_0_2_');
            assert.strictEqual(options[2].name, 'ws:Object');
            assert.strictEqual(options[2].type, 'tag');
            assert.strictEqual(options[2].children.length, 0);
         });
         it('Boolean', function() {
            var html = `
            <UIModule.Component>
               <ws:option>
                    <ws:Boolean>true</ws:Boolean>
                </ws:option>
            </UIModule.Component>
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].injectedData.length, 1);
            var option = tree[0].injectedData[0];

            assert.strictEqual(option.key, '0_0_');
            assert.strictEqual(option.name, 'ws:option');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            option = option.children[0];
            assert.strictEqual(option.key, '0_0_0_');
            assert.strictEqual(option.name, 'ws:Boolean');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            var value = option.children[0];
            assert.strictEqual(value.key, '0_0_0_0_');
            assert.strictEqual(value.type, 'text');
            assert.strictEqual(value.data.length, 1);
            assert.strictEqual(value.data[0].value, 'true');
            assert.strictEqual(value.data[0].type, 'text');
         });
         it('Boolean type', function() {
            var html = `
            <UIModule.Component>
               <ws:option type="boolean">
                    true
                </ws:option>
            </UIModule.Component>
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].injectedData.length, 1);
            var option = tree[0].injectedData[0];

            assert.strictEqual(option.key, '0_0_');
            assert.strictEqual(option.name, 'ws:option');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            assert.isTrue(option.attribs.hasOwnProperty('type'));
            assert.strictEqual(option.attribs.type.type, 'text');
            assert.strictEqual(option.attribs.type.data.type, 'text');
            assert.strictEqual(option.attribs.type.data.value, 'boolean');

            var value = option.children[0];
            assert.strictEqual(value.key, '0_0_0_');
            assert.strictEqual(value.type, 'text');
            assert.strictEqual(value.data.length, 1);
            assert.strictEqual(value.data[0].value, 'true');
            assert.strictEqual(value.data[0].type, 'text');
         });
         it('Function', function() {
            var html = `
            <UIModule.Component>
               <ws:option>
                    <ws:Function attributeOption="value">UIModule/module:func</ws:Function>
                </ws:option>
            </UIModule.Component>
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].injectedData.length, 1);
            var option = tree[0].injectedData[0];

            assert.strictEqual(option.key, '0_0_');
            assert.strictEqual(option.name, 'ws:option');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            option = option.children[0];
            assert.strictEqual(option.key, '0_0_0_');
            assert.strictEqual(option.name, 'ws:Function');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            assert.isTrue(option.attribs.hasOwnProperty('attributeOption'));
            assert.strictEqual(option.attribs.attributeOption.type, 'text');
            assert.strictEqual(option.attribs.attributeOption.data.type, 'text');
            assert.strictEqual(option.attribs.attributeOption.data.value, 'value');

            var value = option.children[0];
            assert.strictEqual(value.key, '0_0_0_0_');
            assert.strictEqual(value.type, 'text');
            assert.strictEqual(value.data.length, 1);
            assert.strictEqual(value.data[0].value, 'UIModule/module:func');
            assert.strictEqual(value.data[0].type, 'text');
         });
         it('Function type', function() {
            var html = `
            <UIModule.Component>
               <ws:option type="function" attributeOption="value">
                    UIModule/module:func
                </ws:option>
            </UIModule.Component>
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].injectedData.length, 1);
            var option = tree[0].injectedData[0];

            assert.strictEqual(option.key, '0_0_');
            assert.strictEqual(option.name, 'ws:option');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            assert.isTrue(option.attribs.hasOwnProperty('type'));
            assert.strictEqual(option.attribs.type.type, 'text');
            assert.strictEqual(option.attribs.type.data.type, 'text');
            assert.strictEqual(option.attribs.type.data.value, 'function');

            assert.isTrue(option.attribs.hasOwnProperty('attributeOption'));
            assert.strictEqual(option.attribs.attributeOption.type, 'text');
            assert.strictEqual(option.attribs.attributeOption.data.type, 'text');
            assert.strictEqual(option.attribs.attributeOption.data.value, 'value');

            var value = option.children[0];
            assert.strictEqual(value.key, '0_0_0_');
            assert.strictEqual(value.type, 'text');
            assert.strictEqual(value.data.length, 1);
            assert.strictEqual(value.data[0].value, 'UIModule/module:func');
            assert.strictEqual(value.data[0].type, 'text');
         });
         it('Number', function() {
            var html = `
            <UIModule.Component>
               <ws:option>
                    <ws:Number>123</ws:Number>
                </ws:option>
            </UIModule.Component>
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].injectedData.length, 1);
            var option = tree[0].injectedData[0];

            assert.strictEqual(option.key, '0_0_');
            assert.strictEqual(option.name, 'ws:option');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            option = option.children[0];
            assert.strictEqual(option.key, '0_0_0_');
            assert.strictEqual(option.name, 'ws:Number');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            var value = option.children[0];
            assert.strictEqual(value.key, '0_0_0_0_');
            assert.strictEqual(value.type, 'text');
            assert.strictEqual(value.data.length, 1);
            assert.strictEqual(value.data[0].value, '123');
            assert.strictEqual(value.data[0].type, 'text');
         });
         it('Number type', function() {
            var html = `
            <UIModule.Component>
               <ws:option type="number">
                    123
                </ws:option>
            </UIModule.Component>
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].injectedData.length, 1);
            var option = tree[0].injectedData[0];

            assert.strictEqual(option.key, '0_0_');
            assert.strictEqual(option.name, 'ws:option');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            assert.isTrue(option.attribs.hasOwnProperty('type'));
            assert.strictEqual(option.attribs.type.type, 'text');
            assert.strictEqual(option.attribs.type.data.type, 'text');
            assert.strictEqual(option.attribs.type.data.value, 'number');

            var value = option.children[0];
            assert.strictEqual(value.key, '0_0_0_');
            assert.strictEqual(value.type, 'text');
            assert.strictEqual(value.data.length, 1);
            assert.strictEqual(value.data[0].value, '123');
            assert.strictEqual(value.data[0].type, 'text');
         });
         it('Object', function() {
            var html = `
            <UIModule.Component>
               <ws:option>
                    <ws:Object></ws:Object>
                </ws:option>
            </UIModule.Component>
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].injectedData.length, 1);
            var option = tree[0].injectedData[0];

            assert.strictEqual(option.key, '0_0_');
            assert.strictEqual(option.name, 'ws:option');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            option = option.children[0];
            assert.strictEqual(option.key, '0_0_0_');
            assert.strictEqual(option.name, 'ws:Object');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 0);
         });
         it('Object 2', function() {
            var html = `
            <UIModule.Component>
               <!-- comment # 1 -->
               <ws:option>
                    <!-- comment # 2 -->
                    <ws:Object attributeProperty="value">
                         <!-- comment # 3 -->
                         <ws:booleanProperty>
                              <!-- comment # 4 -->
                              <ws:Boolean>true</ws:Boolean>
                         </ws:booleanProperty>
                         <ws:numberProperty>
                              <ws:Number>123</ws:Number>
                         </ws:numberProperty>
                         <ws:stringProperty>
                              <ws:String>string</ws:String>
                         </ws:stringProperty>
                    </ws:Object>
                </ws:option>
            </UIModule.Component>
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].injectedData.length, 1);
            var option = tree[0].injectedData[0];

            assert.strictEqual(option.key, '0_0_');
            assert.strictEqual(option.name, 'ws:option');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            option = option.children[0];
            assert.strictEqual(option.key, '0_0_0_');
            assert.strictEqual(option.name, 'ws:Object');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 3);

            assert.isTrue(option.attribs.hasOwnProperty('attributeProperty'));
            assert.strictEqual(option.attribs.attributeProperty.type, 'text');
            assert.strictEqual(option.attribs.attributeProperty.data.type, 'text');
            assert.strictEqual(option.attribs.attributeProperty.data.value, 'value');

            var value;
            var booleanProperty = option.children[0];
            var numberProperty = option.children[1];
            var stringProperty = option.children[2];

            option = booleanProperty;
            assert.strictEqual(option.key, '0_0_0_0_');
            assert.strictEqual(option.name, 'ws:booleanProperty');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            option = option.children[0];
            assert.strictEqual(option.key, '0_0_0_0_0_');
            assert.strictEqual(option.name, 'ws:Boolean');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            value = option.children[0];
            assert.strictEqual(value.key, '0_0_0_0_0_0_');
            assert.strictEqual(value.type, 'text');
            assert.strictEqual(value.data.length, 1);
            assert.strictEqual(value.data[0].value, 'true');
            assert.strictEqual(value.data[0].type, 'text');

            option = numberProperty;
            assert.strictEqual(option.key, '0_0_0_1_');
            assert.strictEqual(option.name, 'ws:numberProperty');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            option = option.children[0];
            assert.strictEqual(option.key, '0_0_0_1_0_');
            assert.strictEqual(option.name, 'ws:Number');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            value = option.children[0];
            assert.strictEqual(value.key, '0_0_0_1_0_0_');
            assert.strictEqual(value.type, 'text');
            assert.strictEqual(value.data.length, 1);
            assert.strictEqual(value.data[0].value, '123');
            assert.strictEqual(value.data[0].type, 'text');

            option = stringProperty;
            assert.strictEqual(option.key, '0_0_0_2_');
            assert.strictEqual(option.name, 'ws:stringProperty');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            option = option.children[0];
            assert.strictEqual(option.key, '0_0_0_2_0_');
            assert.strictEqual(option.name, 'ws:String');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            value = option.children[0];
            assert.strictEqual(value.key, '0_0_0_2_0_0_');
            assert.strictEqual(value.type, 'text');
            assert.strictEqual(value.data.length, 1);
            assert.strictEqual(value.data[0].value, 'string');
            assert.strictEqual(value.data[0].type, 'text');
         });
         it('Object 3', function() {
            var html = `
            <UIModule.Component>
               <!-- comment # 1 -->
               <ws:option attributeProperty="value">
                    <!-- comment # 2 -->
                    <ws:property attributeProperty="value2">
                         <!-- comment # 3 -->
                         <ws:booleanProperty>
                              <!-- comment # 4 -->
                              <ws:Boolean>true</ws:Boolean>
                         </ws:booleanProperty>
                         <ws:numberProperty>
                              <ws:Number>123</ws:Number>
                         </ws:numberProperty>
                         <ws:stringProperty>
                              <ws:String>string</ws:String>
                         </ws:stringProperty>
                    </ws:property>
                </ws:option>
            </UIModule.Component>
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].injectedData.length, 1);
            var option = tree[0].injectedData[0];

            assert.strictEqual(option.key, '0_0_');
            assert.strictEqual(option.name, 'ws:option');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            assert.isTrue(option.attribs.hasOwnProperty('attributeProperty'));
            assert.strictEqual(option.attribs.attributeProperty.type, 'text');
            assert.strictEqual(option.attribs.attributeProperty.data.type, 'text');
            assert.strictEqual(option.attribs.attributeProperty.data.value, 'value');

            option = option.children[0];
            assert.strictEqual(option.key, '0_0_0_');
            assert.strictEqual(option.name, 'ws:property');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 3);

            assert.isTrue(option.attribs.hasOwnProperty('attributeProperty'));
            assert.strictEqual(option.attribs.attributeProperty.type, 'text');
            assert.strictEqual(option.attribs.attributeProperty.data.type, 'text');
            assert.strictEqual(option.attribs.attributeProperty.data.value, 'value2');

            var value;
            var booleanProperty = option.children[0];
            var numberProperty = option.children[1];
            var stringProperty = option.children[2];

            option = booleanProperty;
            assert.strictEqual(option.key, '0_0_0_0_');
            assert.strictEqual(option.name, 'ws:booleanProperty');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            option = option.children[0];
            assert.strictEqual(option.key, '0_0_0_0_0_');
            assert.strictEqual(option.name, 'ws:Boolean');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            value = option.children[0];
            assert.strictEqual(value.key, '0_0_0_0_0_0_');
            assert.strictEqual(value.type, 'text');
            assert.strictEqual(value.data.length, 1);
            assert.strictEqual(value.data[0].value, 'true');
            assert.strictEqual(value.data[0].type, 'text');

            option = numberProperty;
            assert.strictEqual(option.key, '0_0_0_1_');
            assert.strictEqual(option.name, 'ws:numberProperty');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            option = option.children[0];
            assert.strictEqual(option.key, '0_0_0_1_0_');
            assert.strictEqual(option.name, 'ws:Number');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            value = option.children[0];
            assert.strictEqual(value.key, '0_0_0_1_0_0_');
            assert.strictEqual(value.type, 'text');
            assert.strictEqual(value.data.length, 1);
            assert.strictEqual(value.data[0].value, '123');
            assert.strictEqual(value.data[0].type, 'text');

            option = stringProperty;
            assert.strictEqual(option.key, '0_0_0_2_');
            assert.strictEqual(option.name, 'ws:stringProperty');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            option = option.children[0];
            assert.strictEqual(option.key, '0_0_0_2_0_');
            assert.strictEqual(option.name, 'ws:String');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            value = option.children[0];
            assert.strictEqual(value.key, '0_0_0_2_0_0_');
            assert.strictEqual(value.type, 'text');
            assert.strictEqual(value.data.length, 1);
            assert.strictEqual(value.data[0].value, 'string');
            assert.strictEqual(value.data[0].type, 'text');
         });
         it('Object (duplicate option)', function() {
            var html = `
            <UIModule.Component>
               <ws:option property="1">
                    <ws:property>
                        <ws:String>2</ws:String>
                    </ws:property>
                    <ws:property>
                        <ws:String>3</ws:String>
                    </ws:property>
                </ws:option>
            </UIModule.Component>
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].injectedData.length, 1);
            var option = tree[0].injectedData[0];

            assert.isTrue(option.attribs.hasOwnProperty('property'));
            assert.strictEqual(option.attribs.property.type, 'text');
            assert.strictEqual(option.attribs.property.data.type, 'text');
            assert.strictEqual(option.attribs.property.data.value, '1');

            assert.strictEqual(option.key, '0_0_');
            assert.strictEqual(option.name, 'ws:option');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 0);
         });
         it('Object (duplicate option) 2', function() {
            var html = `
            <UIModule.Component>
               <ws:option>
                    <ws:property>
                        <ws:String>2</ws:String>
                    </ws:property>
                    <ws:property>
                        <ws:String>3</ws:String>
                    </ws:property>
                </ws:option>
            </UIModule.Component>
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].injectedData.length, 1);
            var option = tree[0].injectedData[0];

            assert.strictEqual(option.key, '0_0_');
            assert.strictEqual(option.name, 'ws:option');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            option = option.children[0];
            assert.strictEqual(option.key, '0_0_0_');
            assert.strictEqual(option.name, 'ws:property');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            option = option.children[0];
            assert.strictEqual(option.key, '0_0_0_0_');
            assert.strictEqual(option.name, 'ws:String');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            var value = option.children[0];
            assert.strictEqual(value.key, '0_0_0_0_0_');
            assert.strictEqual(value.type, 'text');
            assert.strictEqual(value.data.length, 1);
            assert.strictEqual(value.data[0].value, '2');
            assert.strictEqual(value.data[0].type, 'text');
         });
         it('Object type', function() {
            var html = `
            <UIModule.Component>
               <ws:option type="object">
                  <ws:booleanProperty>
                    <ws:Boolean>true</ws:Boolean>
                  </ws:booleanProperty>
                  <ws:numberProperty>
                    <ws:Number>123</ws:Number>
                  </ws:numberProperty>
                  <ws:stringProperty>
                    <ws:String>string</ws:String>
                  </ws:stringProperty>
               </ws:option>
            </UIModule.Component>
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].injectedData.length, 1);
            var option = tree[0].injectedData[0];

            assert.strictEqual(option.key, '0_0_');
            assert.strictEqual(option.name, 'ws:option');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 3);

            assert.isTrue(option.attribs.hasOwnProperty('type'));
            assert.strictEqual(option.attribs.type.type, 'text');
            assert.strictEqual(option.attribs.type.data.type, 'text');
            assert.strictEqual(option.attribs.type.data.value, 'object');

            var value;
            var booleanProperty = option.children[0];
            var numberProperty = option.children[1];
            var stringProperty = option.children[2];

            option = booleanProperty;
            assert.strictEqual(option.key, '0_0_0_');
            assert.strictEqual(option.name, 'ws:booleanProperty');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            option = option.children[0];
            assert.strictEqual(option.key, '0_0_0_0_');
            assert.strictEqual(option.name, 'ws:Boolean');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            value = option.children[0];
            assert.strictEqual(value.key, '0_0_0_0_0_');
            assert.strictEqual(value.type, 'text');
            assert.strictEqual(value.data.length, 1);
            assert.strictEqual(value.data[0].value, 'true');
            assert.strictEqual(value.data[0].type, 'text');

            option = numberProperty;
            assert.strictEqual(option.key, '0_0_1_');
            assert.strictEqual(option.name, 'ws:numberProperty');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            option = option.children[0];
            assert.strictEqual(option.key, '0_0_1_0_');
            assert.strictEqual(option.name, 'ws:Number');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            value = option.children[0];
            assert.strictEqual(value.key, '0_0_1_0_0_');
            assert.strictEqual(value.type, 'text');
            assert.strictEqual(value.data.length, 1);
            assert.strictEqual(value.data[0].value, '123');
            assert.strictEqual(value.data[0].type, 'text');

            option = stringProperty;
            assert.strictEqual(option.key, '0_0_2_');
            assert.strictEqual(option.name, 'ws:stringProperty');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            option = option.children[0];
            assert.strictEqual(option.key, '0_0_2_0_');
            assert.strictEqual(option.name, 'ws:String');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            value = option.children[0];
            assert.strictEqual(value.key, '0_0_2_0_0_');
            assert.strictEqual(value.type, 'text');
            assert.strictEqual(value.data.length, 1);
            assert.strictEqual(value.data[0].value, 'string');
            assert.strictEqual(value.data[0].type, 'text');
         });
         it('Object type 2', function() {
            var html = `
            <UIModule.Component>
               <ws:option type="object" attributeProperty="value">
                  <ws:booleanProperty type="boolean">
                    true
                  </ws:booleanProperty>
                  <ws:numberProperty type="number">
                    123
                  </ws:numberProperty>
                  <ws:stringProperty type="string">
                    string
                  </ws:stringProperty>
               </ws:option>
            </UIModule.Component>
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].injectedData.length, 1);
            var option = tree[0].injectedData[0];

            assert.strictEqual(option.key, '0_0_');
            assert.strictEqual(option.name, 'ws:option');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 3);

            assert.isTrue(option.attribs.hasOwnProperty('type'));
            assert.strictEqual(option.attribs.type.type, 'text');
            assert.strictEqual(option.attribs.type.data.type, 'text');
            assert.strictEqual(option.attribs.type.data.value, 'object');

            assert.isTrue(option.attribs.hasOwnProperty('attributeProperty'));
            assert.strictEqual(option.attribs.attributeProperty.type, 'text');
            assert.strictEqual(option.attribs.attributeProperty.data.type, 'text');
            assert.strictEqual(option.attribs.attributeProperty.data.value, 'value');

            var value;
            var booleanProperty = option.children[0];
            var numberProperty = option.children[1];
            var stringProperty = option.children[2];

            option = booleanProperty;
            assert.strictEqual(option.key, '0_0_0_');
            assert.strictEqual(option.name, 'ws:booleanProperty');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            assert.isTrue(option.attribs.hasOwnProperty('type'));
            assert.strictEqual(option.attribs.type.type, 'text');
            assert.strictEqual(option.attribs.type.data.type, 'text');
            assert.strictEqual(option.attribs.type.data.value, 'boolean');

            value = option.children[0];
            assert.strictEqual(value.key, '0_0_0_0_');
            assert.strictEqual(value.type, 'text');
            assert.strictEqual(value.data.length, 1);
            assert.strictEqual(value.data[0].value, 'true');
            assert.strictEqual(value.data[0].type, 'text');

            option = numberProperty;
            assert.strictEqual(option.key, '0_0_1_');
            assert.strictEqual(option.name, 'ws:numberProperty');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            assert.isTrue(option.attribs.hasOwnProperty('type'));
            assert.strictEqual(option.attribs.type.type, 'text');
            assert.strictEqual(option.attribs.type.data.type, 'text');
            assert.strictEqual(option.attribs.type.data.value, 'number');

            value = option.children[0];
            assert.strictEqual(value.key, '0_0_1_0_');
            assert.strictEqual(value.type, 'text');
            assert.strictEqual(value.data.length, 1);
            assert.strictEqual(value.data[0].value, '123');
            assert.strictEqual(value.data[0].type, 'text');

            option = stringProperty;
            assert.strictEqual(option.key, '0_0_2_');
            assert.strictEqual(option.name, 'ws:stringProperty');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            assert.isTrue(option.attribs.hasOwnProperty('type'));
            assert.strictEqual(option.attribs.type.type, 'text');
            assert.strictEqual(option.attribs.type.data.type, 'text');
            assert.strictEqual(option.attribs.type.data.value, 'string');

            value = option.children[0];
            assert.strictEqual(value.key, '0_0_2_0_');
            assert.strictEqual(value.type, 'text');
            assert.strictEqual(value.data.length, 1);
            assert.strictEqual(value.data[0].value, 'string');
            assert.strictEqual(value.data[0].type, 'text');
         });
         it('String', function() {
            var html = `
            <UIModule.Component>
               <ws:option>
                    <ws:String>string</ws:String>
                </ws:option>
            </UIModule.Component>
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].injectedData.length, 1);
            var option = tree[0].injectedData[0];

            assert.strictEqual(option.key, '0_0_');
            assert.strictEqual(option.name, 'ws:option');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            option = option.children[0];
            assert.strictEqual(option.key, '0_0_0_');
            assert.strictEqual(option.name, 'ws:String');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            var value = option.children[0];
            assert.strictEqual(value.key, '0_0_0_0_');
            assert.strictEqual(value.type, 'text');
            assert.strictEqual(value.data.length, 1);
            assert.strictEqual(value.data[0].value, 'string');
            assert.strictEqual(value.data[0].type, 'text');
         });
         it('String type', function() {
            var html = `
            <UIModule.Component>
               <ws:option type="string">
                    string
                </ws:option>
            </UIModule.Component>
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].injectedData.length, 1);
            var option = tree[0].injectedData[0];

            assert.strictEqual(option.key, '0_0_');
            assert.strictEqual(option.name, 'ws:option');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            assert.isTrue(option.attribs.hasOwnProperty('type'));
            assert.strictEqual(option.attribs.type.type, 'text');
            assert.strictEqual(option.attribs.type.data.type, 'text');
            assert.strictEqual(option.attribs.type.data.value, 'string');

            var value = option.children[0];
            assert.strictEqual(value.key, '0_0_0_');
            assert.strictEqual(value.type, 'text');
            assert.strictEqual(value.data.length, 1);
            assert.strictEqual(value.data[0].value, 'string');
            assert.strictEqual(value.data[0].type, 'text');
         });
         it('Value', function() {
            var html = `
            <UIModule.Component>
               <ws:option>
                    <ws:Value>value</ws:Value>
                </ws:option>
            </UIModule.Component>
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].injectedData.length, 1);
            var option = tree[0].injectedData[0];

            assert.strictEqual(option.key, '0_0_');
            assert.strictEqual(option.name, 'ws:option');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            option = option.children[0];
            assert.strictEqual(option.key, '0_0_0_');
            assert.strictEqual(option.name, 'ws:Value');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            var value = option.children[0];
            assert.strictEqual(value.key, '0_0_0_0_');
            assert.strictEqual(value.type, 'text');
            assert.strictEqual(value.data.length, 1);
            assert.strictEqual(value.data[0].value, 'value');
            assert.strictEqual(value.data[0].type, 'text');
         });
         it('Value type', function() {
            var html = `
            <UIModule.Component>
               <ws:option type="value">
                    value
                </ws:option>
            </UIModule.Component>
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].injectedData.length, 1);
            var option = tree[0].injectedData[0];

            assert.strictEqual(option.key, '0_0_');
            assert.strictEqual(option.name, 'ws:option');
            assert.strictEqual(option.type, 'tag');
            assert.strictEqual(option.children.length, 1);

            assert.isTrue(option.attribs.hasOwnProperty('type'));
            assert.strictEqual(option.attribs.type.type, 'text');
            assert.strictEqual(option.attribs.type.data.type, 'text');
            assert.strictEqual(option.attribs.type.data.value, 'value');

            var value = option.children[0];
            assert.strictEqual(value.key, '0_0_0_');
            assert.strictEqual(value.type, 'text');
            assert.strictEqual(value.data.length, 1);
            assert.strictEqual(value.data[0].value, 'value');
            assert.strictEqual(value.data[0].type, 'text');
         });
      });
      describe('Templates', function() {
         it('[1] tmpl', function() {
            var html = `
            <ws:template name="tmpl">
                <div></div>
            </ws:template>
            <ws:partial template="tmpl" />
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 2);

            assert.isTrue(tree[0].attribs.hasOwnProperty('name'));
            assert.strictEqual(tree[0].attribs.name, 'tmpl');

            assert.strictEqual(tree[0].children.length, 1);
            assert.strictEqual(tree[0].children[0].children.length, 0);
            assert.strictEqual(tree[0].children[0].key, '0_0_');
            assert.strictEqual(tree[0].children[0].name, 'div');
            assert.strictEqual(tree[0].children[0].type, 'tag');

            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'ws:template');
            assert.strictEqual(tree[0].type, 'tag');

            assert.isTrue(tree[1].attribs.hasOwnProperty('template'));
            assert.strictEqual(tree[1].attribs.template.type, 'text');
            assert.strictEqual(tree[1].attribs.template.data.type, 'text');
            assert.strictEqual(tree[1].attribs.template.data.value, 'tmpl');

            assert.isTrue(tree[1].attribs.hasOwnProperty('_wstemplatename'));
            assert.strictEqual(tree[1].attribs._wstemplatename.type, 'text');
            assert.strictEqual(tree[1].attribs._wstemplatename.data.type, 'text');
            assert.strictEqual(tree[1].attribs._wstemplatename.data.value, 'tmpl');

            assert.strictEqual(tree[1].children.length, 1);
            assert.strictEqual(tree[1].children[0].children.length, 0);
            assert.strictEqual(tree[1].children[0].key, '0_0_');
            assert.strictEqual(tree[1].children[0].name, 'div');
            assert.strictEqual(tree[1].children[0].type, 'tag');

            assert.strictEqual(tree[1].key, '1_');
            assert.strictEqual(tree[1].name, 'ws:partial');
            assert.strictEqual(tree[1].type, 'tag');
         });
         it('[2] {{ tmplFunction }}', function() {
            var html = '<ws:partial template="{{ tmplFunction }}" />';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);

            assert.isTrue(tree[0].attribs.hasOwnProperty('template'));
            assert.strictEqual(tree[0].attribs.template.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.length, 1);
            assert.isFalse(tree[0].attribs.template.data[0].isBind);
            assert.isFalse(tree[0].attribs.template.data[0].isEvent);
            assert.isFalse(tree[0].attribs.template.data[0].localized);
            assert.isTrue(isProgramNode(tree[0].attribs.template.data[0].name));
            assert.strictEqual(tree[0].attribs.template.data[0].name.string, 'tmplFunction');
            assert.isFalse(tree[0].attribs.template.data[0].noEscape);
            assert.strictEqual(tree[0].attribs.template.data[0].type, 'var');

            assert.isTrue(tree[0].attribs.hasOwnProperty('_wstemplatename'));
            assert.strictEqual(tree[0].attribs._wstemplatename.type, 'text');
            assert.strictEqual(tree[0].attribs._wstemplatename.data.length, 1);
            assert.isFalse(tree[0].attribs._wstemplatename.data[0].isBind);
            assert.isFalse(tree[0].attribs._wstemplatename.data[0].isEvent);
            assert.isFalse(tree[0].attribs._wstemplatename.data[0].localized);
            assert.isTrue(isProgramNode(tree[0].attribs._wstemplatename.data[0].name));
            assert.strictEqual(tree[0].attribs._wstemplatename.data[0].name.string, 'tmplFunction');
            assert.isFalse(tree[0].attribs._wstemplatename.data[0].noEscape);
            assert.strictEqual(tree[0].attribs._wstemplatename.data[0].type, 'var');

            assert.strictEqual(tree[0].children.length, 0);

            assert.isFalse(tree[0].injectedTemplate.isBind);
            assert.isFalse(tree[0].injectedTemplate.isEvent);
            assert.isFalse(tree[0].injectedTemplate.localized);
            assert.isTrue(isProgramNode(tree[0].injectedTemplate.name));
            assert.strictEqual(tree[0].injectedTemplate.name.string, 'tmplFunction');
            assert.isFalse(tree[0].injectedTemplate.noEscape);
            assert.strictEqual(tree[0].injectedTemplate.type, 'var');

            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'ws:partial');
            assert.strictEqual(tree[0].type, 'tag');
         });
         it('[3] UIModule/Component', function() {
            var html = '<ws:partial template="UIModule/Component" />';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);

            assert.isTrue(tree[0].attribs.hasOwnProperty('_wstemplatename'));
            assert.strictEqual(tree[0].attribs._wstemplatename, 'UIModule/Component');

            assert.isTrue(tree[0].attribs.hasOwnProperty('template'));
            assert.strictEqual(tree[0].attribs.template.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.value, 'UIModule/Component');

            assert.strictEqual(tree[0].children.length, 1);
            assert.strictEqual(tree[0].children[0].constructor, 'UIModule/Component');
            assert.strictEqual(tree[0].children[0].fn, 'UIModule/Component');
            assert.strictEqual(tree[0].children[0].key, undefined);
            assert.strictEqual(tree[0].children[0].optional, undefined);
            assert.strictEqual(tree[0].children[0].type, 'control');

            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'ws:partial');
            assert.strictEqual(tree[0].type, 'tag');
         });
         it('[4] UIModule/Library:Component', function() {
            var html = '<ws:partial template="UIModule/library:Component" />';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);

            assert.isTrue(tree[0].attribs.hasOwnProperty('template'));
            assert.strictEqual(tree[0].attribs.template.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.value, 'UIModule/library:Component');

            assert.isTrue(tree[0].attribs.hasOwnProperty('_wstemplatename'));
            assert.strictEqual(tree[0].attribs._wstemplatename, 'UIModule/library:Component');

            assert.strictEqual(tree[0].children.length, 1);
            assert.strictEqual(tree[0].children[0].constructor, 'UIModule/library:Component');
            assert.strictEqual(tree[0].children[0].key, undefined);
            assert.strictEqual(tree[0].children[0].library, 'UIModule/library');
            assert.strictEqual(tree[0].children[0].module.length, 1);
            assert.strictEqual(tree[0].children[0].module[0], 'Component');
            assert.strictEqual(tree[0].children[0].type, 'module');

            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'ws:partial');
            assert.strictEqual(tree[0].type, 'tag');
         });
         it('[5] wml!UIModule/directory/file', function() {
            var html = '<ws:partial template="wml!UIModule/directory/file" />';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);

            assert.isTrue(tree[0].attribs.hasOwnProperty('template'));
            assert.strictEqual(tree[0].attribs.template.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.value, 'wml!UIModule/directory/file');

            assert.isTrue(tree[0].attribs.hasOwnProperty('_wstemplatename'));
            assert.strictEqual(tree[0].attribs._wstemplatename.type, 'text');
            assert.strictEqual(tree[0].attribs._wstemplatename.data.type, 'text');
            assert.strictEqual(tree[0].attribs._wstemplatename.data.value, 'wml!UIModule/directory/file');

            assert.strictEqual(tree[0].children.length, 1);
            assert.strictEqual(tree[0].children[0].fn, 'wml!UIModule/directory/file');
            assert.strictEqual(tree[0].children[0].key, undefined);
            assert.strictEqual(tree[0].children[0].optional, undefined);
            assert.strictEqual(tree[0].children[0].type, 'template');

            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'ws:partial');
            assert.strictEqual(tree[0].type, 'tag');
         });
         it('[6] optional!wml!UIModule/directory/file', function() {
            var html = '<ws:partial template="optional!wml!UIModule/directory/file" />';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);

            assert.isTrue(tree[0].attribs.hasOwnProperty('template'));
            assert.strictEqual(tree[0].attribs.template.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.value, 'optional!wml!UIModule/directory/file');

            assert.isTrue(tree[0].attribs.hasOwnProperty('_wstemplatename'));
            assert.strictEqual(tree[0].attribs._wstemplatename, 'optional!wml!UIModule/directory/file');

            assert.strictEqual(tree[0].children.length, 1);
            assert.strictEqual(tree[0].children[0].constructor, 'optional!wml!UIModule/directory/file');
            assert.strictEqual(tree[0].children[0].fn, 'optional!wml!UIModule/directory/file');
            assert.strictEqual(tree[0].children[0].key, undefined);
            assert.strictEqual(tree[0].children[0].optional, undefined);
            assert.strictEqual(tree[0].children[0].type, 'control');

            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'ws:partial');
            assert.strictEqual(tree[0].type, 'tag');
         });
         it('[7] wml!UIModule/library:tmplFunction', function() {
            var html = '<ws:partial template="wml!UIModule/library:tmplFunction" />';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);

            assert.isTrue(tree[0].attribs.hasOwnProperty('template'));
            assert.strictEqual(tree[0].attribs.template.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.value, 'wml!UIModule/library:tmplFunction');

            assert.isTrue(tree[0].attribs.hasOwnProperty('_wstemplatename'));
            assert.strictEqual(tree[0].attribs._wstemplatename.type, 'text');
            assert.strictEqual(tree[0].attribs._wstemplatename.data.type, 'text');
            assert.strictEqual(tree[0].attribs._wstemplatename.data.value, 'wml!UIModule/library:tmplFunction');

            assert.strictEqual(tree[0].children.length, 1);
            assert.strictEqual(tree[0].children[0].fn, 'wml!UIModule/library:tmplFunction');
            assert.strictEqual(tree[0].children[0].key, undefined);
            assert.strictEqual(tree[0].children[0].optional, undefined);
            assert.strictEqual(tree[0].children[0].type, 'template');

            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'ws:partial');
            assert.strictEqual(tree[0].type, 'tag');
         });
         it('[8] optional!wml!UIModule/library:tmplFunction', function() {
            var html = '<ws:partial template="optional!wml!UIModule/library:tmplFunction" />';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);

            assert.isTrue(tree[0].attribs.hasOwnProperty('template'));
            assert.strictEqual(tree[0].attribs.template.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.value, 'optional!wml!UIModule/library:tmplFunction');

            assert.isTrue(tree[0].attribs.hasOwnProperty('_wstemplatename'));
            assert.strictEqual(tree[0].attribs._wstemplatename, 'optional!wml!UIModule/library:tmplFunction');

            assert.strictEqual(tree[0].children.length, 1);
            assert.strictEqual(tree[0].children[0].constructor, 'optional!wml!UIModule/library:tmplFunction');
            assert.strictEqual(tree[0].children[0].key, undefined);
            assert.strictEqual(tree[0].children[0].library, 'optional!wml!UIModule/library');
            assert.strictEqual(tree[0].children[0].module.length, 1);
            assert.strictEqual(tree[0].children[0].module[0], 'tmplFunction');
            assert.strictEqual(tree[0].children[0].type, 'module');

            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'ws:partial');
            assert.strictEqual(tree[0].type, 'tag');
         });
         it('[9] tmpl!UIModule/directory/file', function() {
            var html = '<ws:partial template="tmpl!UIModule/directory/file" />';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);

            assert.isTrue(tree[0].attribs.hasOwnProperty('template'));
            assert.strictEqual(tree[0].attribs.template.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.value, 'tmpl!UIModule/directory/file');

            assert.isTrue(tree[0].attribs.hasOwnProperty('_wstemplatename'));
            assert.strictEqual(tree[0].attribs._wstemplatename.type, 'text');
            assert.strictEqual(tree[0].attribs._wstemplatename.data.type, 'text');
            assert.strictEqual(tree[0].attribs._wstemplatename.data.value, 'tmpl!UIModule/directory/file');

            assert.strictEqual(tree[0].children.length, 1);
            assert.strictEqual(tree[0].children[0].fn, 'tmpl!UIModule/directory/file');
            assert.strictEqual(tree[0].children[0].key, undefined);
            assert.strictEqual(tree[0].children[0].optional, undefined);
            assert.strictEqual(tree[0].children[0].type, 'template');

            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'ws:partial');
            assert.strictEqual(tree[0].type, 'tag');
         });
         it('[10] optional!tmpl!UIModule/directory/file', function() {
            var html = '<ws:partial template="optional!tmpl!UIModule/directory/file" />';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);

            assert.isTrue(tree[0].attribs.hasOwnProperty('template'));
            assert.strictEqual(tree[0].attribs.template.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.value, 'optional!tmpl!UIModule/directory/file');

            assert.isTrue(tree[0].attribs.hasOwnProperty('_wstemplatename'));
            assert.strictEqual(tree[0].attribs._wstemplatename.type, 'text');
            assert.strictEqual(tree[0].attribs._wstemplatename.data.type, 'text');
            assert.strictEqual(tree[0].attribs._wstemplatename.data.value, 'optional!tmpl!UIModule/directory/file');

            assert.strictEqual(tree[0].children.length, 1);
            assert.strictEqual(tree[0].children[0].fn, 'optional!tmpl!UIModule/directory/file');
            assert.strictEqual(tree[0].children[0].key, undefined);
            assert.strictEqual(tree[0].children[0].optional, undefined);
            assert.strictEqual(tree[0].children[0].type, 'template');

            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'ws:partial');
            assert.strictEqual(tree[0].type, 'tag');
         });
         it('[11] tmpl!UIModule/library:tmplFunction', function() {
            var html = '<ws:partial template="tmpl!UIModule/library:tmplFunction" />';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);

            assert.isTrue(tree[0].attribs.hasOwnProperty('template'));
            assert.strictEqual(tree[0].attribs.template.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.value, 'tmpl!UIModule/library:tmplFunction');

            assert.isTrue(tree[0].attribs.hasOwnProperty('_wstemplatename'));
            assert.strictEqual(tree[0].attribs._wstemplatename.type, 'text');
            assert.strictEqual(tree[0].attribs._wstemplatename.data.type, 'text');
            assert.strictEqual(tree[0].attribs._wstemplatename.data.value, 'tmpl!UIModule/library:tmplFunction');

            assert.strictEqual(tree[0].children.length, 1);
            assert.strictEqual(tree[0].children[0].fn, 'tmpl!UIModule/library:tmplFunction');
            assert.strictEqual(tree[0].children[0].key, undefined);
            assert.strictEqual(tree[0].children[0].optional, undefined);
            assert.strictEqual(tree[0].children[0].type, 'template');

            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'ws:partial');
            assert.strictEqual(tree[0].type, 'tag');
         });
         it('[12] optional!tmpl!UIModule/library:tmplFunction', function() {
            var html = '<ws:partial template="optional!tmpl!UIModule/library:tmplFunction" />';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);

            assert.isTrue(tree[0].attribs.hasOwnProperty('template'));
            assert.strictEqual(tree[0].attribs.template.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.value, 'optional!tmpl!UIModule/library:tmplFunction');

            assert.isTrue(tree[0].attribs.hasOwnProperty('_wstemplatename'));
            assert.strictEqual(tree[0].attribs._wstemplatename.type, 'text');
            assert.strictEqual(tree[0].attribs._wstemplatename.data.type, 'text');
            assert.strictEqual(tree[0].attribs._wstemplatename.data.value, 'optional!tmpl!UIModule/library:tmplFunction');

            assert.strictEqual(tree[0].children.length, 1);
            assert.strictEqual(tree[0].children[0].fn, 'optional!tmpl!UIModule/library:tmplFunction');
            assert.strictEqual(tree[0].children[0].key, undefined);
            assert.strictEqual(tree[0].children[0].optional, undefined);
            assert.strictEqual(tree[0].children[0].type, 'template');

            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'ws:partial');
            assert.strictEqual(tree[0].type, 'tag');
         });
         it('[13] js!UIModule/directory/file', function() {
            var html = '<ws:partial template="js!UIModule/directory/file" />';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);

            assert.isTrue(tree[0].attribs.hasOwnProperty('template'));
            assert.strictEqual(tree[0].attribs.template.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.value, 'js!UIModule/directory/file');

            assert.isTrue(tree[0].attribs.hasOwnProperty('_wstemplatename'));
            assert.strictEqual(tree[0].attribs._wstemplatename, 'js!UIModule/directory/file');

            assert.strictEqual(tree[0].children.length, 1);
            assert.strictEqual(tree[0].children[0].constructor, 'js!UIModule/directory/file');
            assert.strictEqual(tree[0].children[0].fn, 'js!UIModule/directory/file');
            assert.strictEqual(tree[0].children[0].key, undefined);
            assert.strictEqual(tree[0].children[0].optional, undefined);
            assert.strictEqual(tree[0].children[0].type, 'control');

            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'ws:partial');
            assert.strictEqual(tree[0].type, 'tag');
         });
         it('[14] optional!js!UIModule/directory/file', function() {
            var html = '<ws:partial template="optional!js!UIModule/directory/file" />';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);

            assert.isTrue(tree[0].attribs.hasOwnProperty('template'));
            assert.strictEqual(tree[0].attribs.template.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.value, 'optional!js!UIModule/directory/file');

            assert.isTrue(tree[0].attribs.hasOwnProperty('_wstemplatename'));
            assert.strictEqual(tree[0].attribs._wstemplatename, 'optional!js!UIModule/directory/file');

            assert.strictEqual(tree[0].children.length, 1);
            assert.strictEqual(tree[0].children[0].constructor, 'optional!js!UIModule/directory/file');
            assert.strictEqual(tree[0].children[0].fn, 'optional!js!UIModule/directory/file');
            assert.strictEqual(tree[0].children[0].key, undefined);
            assert.strictEqual(tree[0].children[0].optional, undefined);
            assert.strictEqual(tree[0].children[0].type, 'control');

            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'ws:partial');
            assert.strictEqual(tree[0].type, 'tag');
         });
         it('[15] js!UIModule/library:tmplFunction', function() {
            var html = '<ws:partial template="js!UIModule/library:tmplFunction" />';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);

            assert.isTrue(tree[0].attribs.hasOwnProperty('template'));
            assert.strictEqual(tree[0].attribs.template.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.value, 'js!UIModule/library:tmplFunction');

            assert.isTrue(tree[0].attribs.hasOwnProperty('_wstemplatename'));
            assert.strictEqual(tree[0].attribs._wstemplatename, 'js!UIModule/library:tmplFunction');

            assert.strictEqual(tree[0].children.length, 1);
            assert.strictEqual(tree[0].children[0].constructor, 'js!UIModule/library:tmplFunction');
            assert.strictEqual(tree[0].children[0].key, undefined);
            assert.strictEqual(tree[0].children[0].library, 'js!UIModule/library');
            assert.strictEqual(tree[0].children[0].module.length, 1);
            assert.strictEqual(tree[0].children[0].module[0], 'tmplFunction');
            assert.strictEqual(tree[0].children[0].type, 'module');

            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'ws:partial');
            assert.strictEqual(tree[0].type, 'tag');
         });
         it('[16] optional!js!UIModule/library:tmplFunction', function() {
            var html = '<ws:partial template="optional!js!UIModule/library:tmplFunction" />';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);

            assert.isTrue(tree[0].attribs.hasOwnProperty('template'));
            assert.strictEqual(tree[0].attribs.template.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.value, 'optional!js!UIModule/library:tmplFunction');

            assert.isTrue(tree[0].attribs.hasOwnProperty('_wstemplatename'));
            assert.strictEqual(tree[0].attribs._wstemplatename, 'optional!js!UIModule/library:tmplFunction');

            assert.strictEqual(tree[0].children.length, 1);
            assert.strictEqual(tree[0].children[0].constructor, 'optional!js!UIModule/library:tmplFunction');
            assert.strictEqual(tree[0].children[0].key, undefined);
            assert.strictEqual(tree[0].children[0].library, 'optional!js!UIModule/library');
            assert.strictEqual(tree[0].children[0].module.length, 1);
            assert.strictEqual(tree[0].children[0].module[0], 'tmplFunction');
            assert.strictEqual(tree[0].children[0].type, 'module');

            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'ws:partial');
            assert.strictEqual(tree[0].type, 'tag');
         });
         it('[17] html!UIModule/directory/file', function() {
            var html = '<ws:partial template="html!UIModule/directory/file" />';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);

            assert.isTrue(tree[0].attribs.hasOwnProperty('template'));
            assert.strictEqual(tree[0].attribs.template.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.value, 'html!UIModule/directory/file');

            assert.isTrue(tree[0].attribs.hasOwnProperty('_wstemplatename'));
            assert.strictEqual(tree[0].attribs._wstemplatename.type, 'text');
            assert.strictEqual(tree[0].attribs._wstemplatename.data.type, 'text');
            assert.strictEqual(tree[0].attribs._wstemplatename.data.value, 'html!UIModule/directory/file');

            assert.strictEqual(tree[0].children.length, 1);
            assert.strictEqual(tree[0].children[0].fn, 'html!UIModule/directory/file');
            assert.strictEqual(tree[0].children[0].key, undefined);
            assert.strictEqual(tree[0].children[0].optional, undefined);
            assert.strictEqual(tree[0].children[0].type, 'template');

            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'ws:partial');
            assert.strictEqual(tree[0].type, 'tag');
         });
         it('[18] optional!html!UIModule/directory/file', function() {
            var html = '<ws:partial template="optional!html!UIModule/directory/file" />';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);

            assert.isTrue(tree[0].attribs.hasOwnProperty('template'));
            assert.strictEqual(tree[0].attribs.template.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.value, 'optional!html!UIModule/directory/file');

            assert.isTrue(tree[0].attribs.hasOwnProperty('_wstemplatename'));
            assert.strictEqual(tree[0].attribs._wstemplatename, 'optional!html!UIModule/directory/file');

            assert.strictEqual(tree[0].children.length, 1);
            assert.strictEqual(tree[0].children[0].constructor, 'optional!html!UIModule/directory/file');
            assert.strictEqual(tree[0].children[0].fn, 'optional!html!UIModule/directory/file');
            assert.strictEqual(tree[0].children[0].key, undefined);
            assert.strictEqual(tree[0].children[0].optional, undefined);
            assert.strictEqual(tree[0].children[0].type, 'control');

            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'ws:partial');
            assert.strictEqual(tree[0].type, 'tag');
         });
         it('[19] html!UIModule/library:tmplFunction', function() {
            var html = '<ws:partial template="html!UIModule/library:tmplFunction" />';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);

            assert.isTrue(tree[0].attribs.hasOwnProperty('template'));
            assert.strictEqual(tree[0].attribs.template.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.value, 'html!UIModule/library:tmplFunction');

            assert.isTrue(tree[0].attribs.hasOwnProperty('_wstemplatename'));
            assert.strictEqual(tree[0].attribs._wstemplatename.type, 'text');
            assert.strictEqual(tree[0].attribs._wstemplatename.data.type, 'text');
            assert.strictEqual(tree[0].attribs._wstemplatename.data.value, 'html!UIModule/library:tmplFunction');

            assert.strictEqual(tree[0].children.length, 1);
            assert.strictEqual(tree[0].children[0].fn, 'html!UIModule/library:tmplFunction');
            assert.strictEqual(tree[0].children[0].key, undefined);
            assert.strictEqual(tree[0].children[0].optional, undefined);
            assert.strictEqual(tree[0].children[0].type, 'template');

            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'ws:partial');
            assert.strictEqual(tree[0].type, 'tag');
         });
         it('[20] optional!html!UIModule/library:tmplFunction', function() {
            var html = '<ws:partial template="optional!html!UIModule/library:tmplFunction" />';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);

            assert.isTrue(tree[0].attribs.hasOwnProperty('template'));
            assert.strictEqual(tree[0].attribs.template.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.value, 'optional!html!UIModule/library:tmplFunction');

            assert.isTrue(tree[0].attribs.hasOwnProperty('_wstemplatename'));
            assert.strictEqual(tree[0].attribs._wstemplatename, 'optional!html!UIModule/library:tmplFunction');

            assert.strictEqual(tree[0].children.length, 1);
            assert.strictEqual(tree[0].children[0].constructor, 'optional!html!UIModule/library:tmplFunction');
            assert.strictEqual(tree[0].children[0].key, undefined);
            assert.strictEqual(tree[0].children[0].library, 'optional!html!UIModule/library');
            assert.strictEqual(tree[0].children[0].module.length, 1);
            assert.strictEqual(tree[0].children[0].module[0], 'tmplFunction');
            assert.strictEqual(tree[0].children[0].type, 'module');

            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'ws:partial');
            assert.strictEqual(tree[0].type, 'tag');
         });
         it('[21] optional!UIModule.Component', function() {
            var html = '<ws:partial template="optional!UIModule.Component" />';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);

            assert.isTrue(tree[0].attribs.hasOwnProperty('template'));
            assert.strictEqual(tree[0].attribs.template.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.value, 'optional!UIModule.Component');

            assert.isTrue(tree[0].attribs.hasOwnProperty('_wstemplatename'));
            assert.strictEqual(tree[0].attribs._wstemplatename.type, 'text');
            assert.strictEqual(tree[0].attribs._wstemplatename.data.type, 'text');
            assert.strictEqual(tree[0].attribs._wstemplatename.data.value, 'optional!UIModule.Component');

            assert.strictEqual(tree[0].children.length, 1);
            assert.strictEqual(tree[0].children[0].fn, 'optional!UIModule.Component');
            assert.strictEqual(tree[0].children[0].key, undefined);
            assert.strictEqual(tree[0].children[0].optional, undefined);
            assert.strictEqual(tree[0].children[0].type, 'template');

            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'ws:partial');
            assert.strictEqual(tree[0].type, 'tag');
         });
         it('[22] optional!UIModule.library:Component', function() {
            var html = '<ws:partial template="optional!UIModule.library:Component" />';
            var tree = process(html);
            assert.strictEqual(tree.length, 1);

            assert.isTrue(tree[0].attribs.hasOwnProperty('template'));
            assert.strictEqual(tree[0].attribs.template.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.type, 'text');
            assert.strictEqual(tree[0].attribs.template.data.value, 'optional!UIModule.library:Component');

            assert.isTrue(tree[0].attribs.hasOwnProperty('_wstemplatename'));
            assert.strictEqual(tree[0].attribs._wstemplatename.type, 'text');
            assert.strictEqual(tree[0].attribs._wstemplatename.data.type, 'text');
            assert.strictEqual(tree[0].attribs._wstemplatename.data.value, 'optional!UIModule.library:Component');

            assert.strictEqual(tree[0].children.length, 1);
            assert.strictEqual(tree[0].children[0].fn, 'optional!UIModule.library:Component');
            assert.strictEqual(tree[0].children[0].key, undefined);
            assert.strictEqual(tree[0].children[0].optional, undefined);
            assert.strictEqual(tree[0].children[0].type, 'template');

            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'ws:partial');
            assert.strictEqual(tree[0].type, 'tag');
         });
      });
      describe('Cycle directive', function() {
         it('foreach', function() {
            var html = `
            <ws:for data="index, item in items">
               <div></div>
            </ws:for>
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);

            assert.isTrue(tree[0].attribs.hasOwnProperty('data'));
            assert.strictEqual(tree[0].attribs.data.type, 'text');
            assert.strictEqual(tree[0].attribs.data.data.type, 'text');
            assert.strictEqual(tree[0].attribs.data.data.value, 'index, item in items');

            assert.strictEqual(tree[0].children.length, 1);
            assert.strictEqual(tree[0].children[0].children.length, 0);
            assert.strictEqual(tree[0].children[0].key, '0_');
            assert.strictEqual(tree[0].children[0].name, 'div');
            assert.strictEqual(tree[0].children[0].type, 'tag');

            assert.strictEqual(tree[0].forSource.key, 'index');
            assert.isTrue(isProgramNode(tree[0].forSource.main));
            assert.strictEqual(tree[0].forSource.main.string, 'items');
            assert.strictEqual(tree[0].forSource.value, 'item');

            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'ws:for');
            assert.strictEqual(tree[0].type, 'tag');
         });
         it('foreach 2', function() {
            var html = `
            <ws:for data="index as item in items">
               <div></div>
            </ws:for>
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);

            assert.isTrue(tree[0].attribs.hasOwnProperty('data'));
            assert.strictEqual(tree[0].attribs.data.type, 'text');
            assert.strictEqual(tree[0].attribs.data.data.type, 'text');
            assert.strictEqual(tree[0].attribs.data.data.value, 'index, item in items');

            assert.strictEqual(tree[0].children.length, 1);
            assert.strictEqual(tree[0].children[0].children.length, 0);
            assert.strictEqual(tree[0].children[0].key, '0_');
            assert.strictEqual(tree[0].children[0].name, 'div');
            assert.strictEqual(tree[0].children[0].type, 'tag');

            assert.strictEqual(tree[0].forSource.key, 'index');
            assert.isTrue(isProgramNode(tree[0].forSource.main));
            assert.strictEqual(tree[0].forSource.main.string, 'items');
            assert.strictEqual(tree[0].forSource.value, 'item');

            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'ws:for');
            assert.strictEqual(tree[0].type, 'tag');
         });
         it('for', function() {
            var html = `
            <ws:for data="i.init(); i.test(); i.update()">
               <div></div>
            </ws:for>
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);

            assert.isTrue(tree[0].attribs.hasOwnProperty('CUSTOM_CONDITION'));
            assert.strictEqual(tree[0].attribs.CUSTOM_CONDITION.type, 'text');
            assert.strictEqual(tree[0].attribs.CUSTOM_CONDITION.data.length, 1);
            assert.isFalse(tree[0].attribs.CUSTOM_CONDITION.data[0].isBind);
            assert.isFalse(tree[0].attribs.CUSTOM_CONDITION.data[0].isEvent);
            assert.isFalse(tree[0].attribs.CUSTOM_CONDITION.data[0].localized);
            assert.isTrue(isProgramNode(tree[0].attribs.CUSTOM_CONDITION.data[0].name));
            assert.strictEqual(tree[0].attribs.CUSTOM_CONDITION.data[0].name.string, 'i.test()');
            assert.isFalse(tree[0].attribs.CUSTOM_CONDITION.data[0].noEscape);
            assert.strictEqual(tree[0].attribs.CUSTOM_CONDITION.data[0].type, 'var');

            assert.isTrue(tree[0].attribs.hasOwnProperty('CUSTOM_ITERATOR'));
            assert.strictEqual(tree[0].attribs.CUSTOM_ITERATOR.type, 'text');
            assert.strictEqual(tree[0].attribs.CUSTOM_ITERATOR.data.length, 1);
            assert.isFalse(tree[0].attribs.CUSTOM_ITERATOR.data[0].isBind);
            assert.isFalse(tree[0].attribs.CUSTOM_ITERATOR.data[0].isEvent);
            assert.isFalse(tree[0].attribs.CUSTOM_ITERATOR.data[0].localized);
            assert.isTrue(isProgramNode(tree[0].attribs.CUSTOM_ITERATOR.data[0].name));
            assert.strictEqual(tree[0].attribs.CUSTOM_ITERATOR.data[0].name.string, 'i.update()');
            assert.isFalse(tree[0].attribs.CUSTOM_ITERATOR.data[0].noEscape);
            assert.strictEqual(tree[0].attribs.CUSTOM_ITERATOR.data[0].type, 'var');

            assert.isTrue(tree[0].attribs.hasOwnProperty('START_FROM'));
            assert.strictEqual(tree[0].attribs.START_FROM.type, 'text');
            assert.strictEqual(tree[0].attribs.START_FROM.data.length, 1);
            assert.isFalse(tree[0].attribs.START_FROM.data[0].isBind);
            assert.isFalse(tree[0].attribs.START_FROM.data[0].isEvent);
            assert.isFalse(tree[0].attribs.START_FROM.data[0].localized);
            assert.isTrue(isProgramNode(tree[0].attribs.START_FROM.data[0].name));
            assert.strictEqual(tree[0].attribs.START_FROM.data[0].name.string, 'i.init()');
            assert.isFalse(tree[0].attribs.START_FROM.data[0].noEscape);
            assert.strictEqual(tree[0].attribs.START_FROM.data[0].type, 'var');

            assert.strictEqual(tree[0].children.length, 1);
            assert.strictEqual(tree[0].children[0].children.length, 0);
            assert.strictEqual(tree[0].children[0].key, '0_');
            assert.strictEqual(tree[0].children[0].name, 'div');
            assert.strictEqual(tree[0].children[0].type, 'tag');

            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'ws:for');
            assert.strictEqual(tree[0].type, 'tag');
         });
      });
      describe('Conditional directive', function() {
         it('chain', function() {
            var html = `
            <ws:if data="{{ condition }}">
               <a></a>
            </ws:if>
            <ws:else data="{{ condition2 }}">
               <div></div>
            </ws:else>
            <ws:else>
               <span></span>
            </ws:else>
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 3);

            assert.isTrue(tree[0].attribs.hasOwnProperty('data'));
            assert.strictEqual(tree[0].attribs.data.type, 'text');
            assert.strictEqual(tree[0].attribs.data.data.length, 1);
            assert.isFalse(tree[0].attribs.data.data[0].isBind);
            assert.isFalse(tree[0].attribs.data.data[0].isEvent);
            assert.isFalse(tree[0].attribs.data.data[0].localized);
            assert.isTrue(isProgramNode(tree[0].attribs.data.data[0].name));
            assert.strictEqual(tree[0].attribs.data.data[0].name.string, 'condition');
            assert.isFalse(tree[0].attribs.data.data[0].noEscape);
            assert.strictEqual(tree[0].attribs.data.data[0].type, 'var');
            assert.strictEqual(tree[0].children.length, 1);
            assert.strictEqual(tree[0].children[0].children.length, 0);
            assert.strictEqual(tree[0].children[0].key, '0_0_');
            assert.strictEqual(tree[0].children[0].name, 'a');
            assert.strictEqual(tree[0].children[0].type, 'tag');
            assert.strictEqual(tree[0].key, '0_');
            assert.strictEqual(tree[0].name, 'ws:if');
            assert.strictEqual(tree[0].type, 'tag');

            assert.isTrue(tree[1].attribs.hasOwnProperty('data'));
            assert.strictEqual(tree[1].attribs.data.type, 'text');
            assert.strictEqual(tree[1].attribs.data.data.length, 1);
            assert.isFalse(tree[1].attribs.data.data[0].isBind);
            assert.isFalse(tree[1].attribs.data.data[0].isEvent);
            assert.isFalse(tree[1].attribs.data.data[0].localized);
            assert.isTrue(isProgramNode(tree[1].attribs.data.data[0].name));
            assert.strictEqual(tree[1].attribs.data.data[0].name.string, 'condition2');
            assert.isFalse(tree[1].attribs.data.data[0].noEscape);
            assert.strictEqual(tree[1].attribs.data.data[0].type, 'var');
            assert.strictEqual(tree[1].children.length, 1);
            assert.strictEqual(tree[1].children[0].children.length, 0);
            assert.strictEqual(tree[1].children[0].key, '1_0_');
            assert.strictEqual(tree[1].children[0].name, 'div');
            assert.strictEqual(tree[1].children[0].type, 'tag');
            assert.strictEqual(tree[1].key, '1_');
            assert.strictEqual(tree[1].name, 'ws:else');
            assert.strictEqual(tree[1].type, 'tag');

            assert.strictEqual(tree[2].attribs, undefined);
            assert.strictEqual(tree[2].children.length, 1);
            assert.strictEqual(tree[2].children[0].children.length, 0);
            assert.strictEqual(tree[2].children[0].key, '2_0_');
            assert.strictEqual(tree[2].children[0].name, 'span');
            assert.strictEqual(tree[2].children[0].type, 'tag');
            assert.strictEqual(tree[2].key, '2_');
            assert.strictEqual(tree[2].name, 'ws:else');
            assert.strictEqual(tree[2].type, 'tag');
         });
      });
      describe('Content properties', function() {
         it('default content', function() {
            var html = `
            <UIModule.Component>
                <div></div>
            </UIModule.Component>
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].injectedData.length, 1);

            var children = tree[0].injectedData;
            assert.strictEqual(children[0].attribs, undefined);
            assert.strictEqual(children[0].key, '0_0_');
            assert.strictEqual(children[0].name, 'ws:content');
            assert.strictEqual(children[0].type, 'tag');
            assert.strictEqual(children[0].children.length, 1);

            children = children[0].children;
            assert.strictEqual(children[0].attribs, undefined);
            assert.strictEqual(children[0].key, '0_0_0_');
            assert.strictEqual(children[0].name, 'div');
            assert.strictEqual(children[0].type, 'tag');
            assert.strictEqual(children[0].children.length, 0);
         });
         it('content', function() {
            var html = `
            <UIModule.Component>
                <ws:content>
                    <div></div>
                </ws:content>
            </UIModule.Component>
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].injectedData.length, 1);

            var children = tree[0].injectedData;
            assert.strictEqual(children[0].attribs, undefined);
            assert.strictEqual(children[0].key, '0_0_');
            assert.strictEqual(children[0].name, 'ws:content');
            assert.strictEqual(children[0].type, 'tag');
            assert.strictEqual(children[0].children.length, 1);

            children = children[0].children;
            assert.strictEqual(children[0].attribs, undefined);
            assert.strictEqual(children[0].key, '0_0_0_');
            assert.strictEqual(children[0].name, 'div');
            assert.strictEqual(children[0].type, 'tag');
            assert.strictEqual(children[0].children.length, 0);
         });
         it('order', function() {
            var html = `
            <!-- comment # 1 -->
            <UIModule.Component>
               <!-- comment # 2 -->
               <ws:firstContent>
                  <div></div>
               </ws:firstContent>
               <!-- comment # 3 -->
               <ws:booleanProperty>
                  <ws:Boolean>true</ws:Boolean>
               </ws:booleanProperty>
               <!-- comment # 4 -->
               <ws:secondContent>
                  <div></div>
               </ws:secondContent>
               <!-- comment # 5 -->
               <ws:numberProperty>
                  <ws:Number>123</ws:Number>
               </ws:numberProperty>
               <!-- comment # 6 -->
               <ws:thirdContent>
                  <div></div>
               </ws:thirdContent>
               <!-- comment # 7 -->
               <ws:stringProperty>
                  <ws:String>string</ws:String>
               </ws:stringProperty>
               <!-- comment # 8 -->
            </UIModule.Component>
            `;
            var tree = process(html);
            assert.strictEqual(tree.length, 1);
            assert.strictEqual(tree[0].injectedData.length, 6);
            var children = tree[0].injectedData;

            assert.strictEqual(children[0].attribs, undefined);
            assert.strictEqual(children[0].key, '0_0_');
            assert.strictEqual(children[0].name, 'ws:firstContent');
            assert.strictEqual(children[0].type, 'tag');
            assert.strictEqual(children[0].children.length, 1);

            assert.strictEqual(children[1].attribs, undefined);
            assert.strictEqual(children[1].key, '0_1_');
            assert.strictEqual(children[1].name, 'ws:booleanProperty');
            assert.strictEqual(children[1].type, 'tag');
            assert.strictEqual(children[1].children.length, 1);

            assert.strictEqual(children[2].attribs, undefined);
            assert.strictEqual(children[2].key, '0_2_');
            assert.strictEqual(children[2].name, 'ws:secondContent');
            assert.strictEqual(children[2].type, 'tag');
            assert.strictEqual(children[2].children.length, 1);

            assert.strictEqual(children[3].attribs, undefined);
            assert.strictEqual(children[3].key, '0_3_');
            assert.strictEqual(children[3].name, 'ws:numberProperty');
            assert.strictEqual(children[3].type, 'tag');
            assert.strictEqual(children[3].children.length, 1);

            assert.strictEqual(children[4].attribs, undefined);
            assert.strictEqual(children[4].key, '0_4_');
            assert.strictEqual(children[4].name, 'ws:thirdContent');
            assert.strictEqual(children[4].type, 'tag');
            assert.strictEqual(children[4].children.length, 1);

            assert.strictEqual(children[5].attribs, undefined);
            assert.strictEqual(children[5].key, '0_5_');
            assert.strictEqual(children[5].name, 'ws:stringProperty');
            assert.strictEqual(children[5].type, 'tag');
            assert.strictEqual(children[5].children.length, 1);

         });
      });
   });
});
