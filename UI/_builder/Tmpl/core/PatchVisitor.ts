/// <amd-module name="UI/_builder/Tmpl/core/PatchVisitor" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/PatchVisitor.ts
 *
 * FIXME: Данный посетитель выполняет плохой патч дерева Wasaby
 *   для поддержания совместимости между Wasaby-парсерами.
 *   Удалить после реализации остальных фаз анализа и синтеза.
 */

import Scope from 'UI/_builder/Tmpl/core/Scope';
import * as Ast from 'UI/_builder/Tmpl/core/Ast';

interface INavigationContext {
   scope: Scope;
   parent: Ast.Ast | null;
   key: string;
   isBind?: boolean;
   isEvent?: boolean;
   localized?: boolean;
   noEscape?: boolean;
}

function getTagType(name: string): string {
   if (name === 'script') {
      return name;
   }
   if (name === 'style') {
      return name;
   }
   return 'tag';
}

function getDataTypeName(ast: Ast.Ast): string {
   if (ast instanceof Ast.ArrayNode) {
      return 'array';
   }
   if (ast instanceof Ast.BooleanNode) {
      return 'boolean';
   }
   if (ast instanceof Ast.FunctionNode) {
      return 'function';
   }
   if (ast instanceof Ast.NumberNode) {
      return 'number';
   }
   if (ast instanceof Ast.ObjectNode) {
      return 'object';
   }
   if (ast instanceof Ast.StringNode) {
      return 'string';
   }
   if (ast instanceof Ast.ValueNode) {
      return 'value';
   }
}

class PatchVisitor implements Ast.IAstVisitor {
   // done.
   visitDoctype(node: Ast.DoctypeNode, context: INavigationContext): any {
      // @ts-ignore
      node.key = context.key;
      // @ts-ignore
      node.type = 'directive';
      // @ts-ignore
      node.name = '!DOCTYPE';
      // @ts-ignore
      node.data = node.__$ws_data;
      return node;
   }

   // done.
   visitCData(node: Ast.CDataNode, context: INavigationContext): any {
      // @ts-ignore
      node.key = context.key;
      // @ts-ignore
      node.type = 'directive';
      // @ts-ignore
      node.name = '![CDATA[';
      // @ts-ignore
      node.data = node.__$ws_data;
      return node;
   }

   // done.
   visitInstruction(node: Ast.InstructionNode, context: INavigationContext): any {
      // @ts-ignore
      node.key = context.key;
      // @ts-ignore
      node.type = 'directive';
      // @ts-ignore
      node.name = '?';
      // @ts-ignore
      node.data = node.__$ws_data;
      return node;
   }

   // done.
   visitComment(node: Ast.CommentNode, context: INavigationContext): any {
      return null;
   }

   // done.
   visitFor(node: Ast.ForNode, context: INavigationContext): any {
      // @ts-ignore
      node.children = this.visitAll(node.__$ws_content, context);
      // @ts-ignore
      node.key = context.key;
      // @ts-ignore
      node.name = 'ws:for';
      // @ts-ignore
      node.originName = 'ws:for';
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.attribs = {
         CUSTOM_CONDITION: {
            data: node.__$ws_test ? [{
               isBind: false,
               isEvent: false,
               localized: false,
               name: node.__$ws_test,
               noEscape: false,
               type: 'var',
               value: ''
            }] : {
               type: 'text',
               value: ''
            },
            key: undefined,
            type: 'text'
         },
         CUSTOM_ITERATOR: {
            data: node.__$ws_update ? [{
               isBind: false,
               isEvent: false,
               localized: false,
               name: node.__$ws_update,
               noEscape: false,
               type: 'var',
               value: ''
            }] : {
               type: 'text',
               value: ''
            },
            key: undefined,
            type: 'text'
         },
         START_FROM: {
            data: node.__$ws_init ? [{
               isBind: false,
               isEvent: false,
               localized: false,
               name: node.__$ws_init,
               noEscape: false,
               type: 'var',
               value: ''
            }] : {
               type: 'text',
               value: ''
            },
            key: undefined,
            type: 'text'
         },
      };
      return node;
   }

   // done.
   visitForeach(node: Ast.ForeachNode, context: INavigationContext): any {
      // @ts-ignore
      node.children = this.visitAll(node.__$ws_content, context);
      // @ts-ignore
      node.key = context.key;
      // @ts-ignore
      node.name = 'ws:for';
      // @ts-ignore
      node.originName = 'ws:for';
      // @ts-ignore
      node.type = 'tag';
      const forSource = node.__$ws_index
         ? `${node.__$ws_index.string}, ${node.__$ws_iterator.string} in ${node.__$ws_collection.string}`
         : `${node.__$ws_iterator.string} in ${node.__$ws_collection.string}`;
      // @ts-ignore
      node.attribs = {
         data: {
            data: {
               type: 'text',
               value: forSource
            },
            key: undefined,
            type: 'text'
         }
      };
      // @ts-ignore
      node.forSource = {
         key: node.__$ws_index ? node.__$ws_index.string : undefined,
         value: node.__$ws_iterator.string,
         main: node.__$ws_collection
      };
      return node;
   }

   // done.
   visitText(node: Ast.TextNode, context: INavigationContext): any {
      const textContext = {
         isBind: false,
         isEvent: false,
         localized: false,
         noEscape: false,
         ...context
      };
      const content = this.visitAll(node.__$ws_content, textContext);
      // @ts-ignore
      node.key = context.key;
      // @ts-ignore
      node.data = (node.__$ws_content.length === 1 && node.__$ws_content[0] instanceof Ast.TextDataNode) ? content[0] : content;
      // @ts-ignore
      node.type = 'text';
      return node;
   }

   // done.
   visitTextData(node: Ast.TextDataNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'text';
      // @ts-ignore
      node.value = node.__$ws_content;
      return node;
   }

   // done.
   visitExpression(node: Ast.ExpressionNode, context: INavigationContext): any {
      // @ts-ignore
      node.isBind = !!context.isBind;
      // @ts-ignore
      node.isEvent = !!context.isEvent;
      // @ts-ignore
      node.localized = !!context.localized;
      // @ts-ignore
      node.noEscape = !!context.noEscape;
      // @ts-ignore
      node.name = node.__$ws_program;
      // @ts-ignore
      node.value = '';
      // @ts-ignore
      node.type = 'var';
      return node;
   }

   // done.
   visitTranslation(node: Ast.TranslationNode, context: INavigationContext): any {
      // @ts-ignore
      node.localized = true;
      // @ts-ignore
      node.name = node.__$ws_context
         ? `${node.__$ws_context} @@ ${node.__$ws_text}`
         : node.__$ws_text;
      // @ts-ignore
      node.type = 'var';
      // @ts-ignore
      node.value = undefined;
      return node;
   }

   // done.
   visitAll(nodes: Ast.Ast[], context: INavigationContext): any {
      const children = [];
      for (let i = 0; i < nodes.length; ++i) {
         const childContext: INavigationContext = {
            ...context,
            key: context.key + children.length + '_'
         };
         const child = nodes[i].accept(this, childContext);
         if (child) {
            children.push(child);
         }
      }
      return children;
   }

   // done.
   visitTemplate(node: Ast.TemplateNode, context: INavigationContext): any {
      // @ts-ignore
      node.key = context.key;
      // @ts-ignore
      node.children = this.visitAll(node.__$ws_content, context);
      // @ts-ignore
      node.attribs = {
         name: node.__$ws_name
      };
      // @ts-ignore
      node.name = 'ws:template';
      // @ts-ignore
      node.originName = 'ws:template';
      // @ts-ignore
      node.type = 'tag';
      return node;
   }

   // done.
   visitElement(node: Ast.ElementNode, context: INavigationContext): any {
      // @ts-ignore
      node.key = context.key;
      // @ts-ignore
      node.children = this.visitAll(node.__$ws_content, context);
      // @ts-ignore
      node.type = getTagType(node.__$ws_name);
      // @ts-ignore
      node.name = node.__$ws_name;
      // @ts-ignore
      node.originName = node.__$ws_name;
      const attribs = this.collectAttributes(node, context, true);
      // @ts-ignore
      node.attribs = Object.keys(attribs).length === 0 ? undefined : attribs;
      if (node.__$ws_unpackedCycle) {
         // @ts-ignore
         if (!node.attribs) {
            // @ts-ignore
            node.attribs = { };
         }
         if (node.__$ws_unpackedCycle instanceof Ast.ForNode) {
            const initStr = node.__$ws_unpackedCycle.__$ws_init ? node.__$ws_unpackedCycle.__$ws_init.string : '';
            const testStr = node.__$ws_unpackedCycle.__$ws_test.string;
            const updateStr = node.__$ws_unpackedCycle.__$ws_update ? node.__$ws_unpackedCycle.__$ws_update.string : '';
            const forData = `${initStr}; ${testStr}; ${updateStr}`;
            // @ts-ignore
            node.attribs.for = {
               data: {
                  type: 'text',
                  value: forData
               },
               key: undefined,
               type: 'text'
            };
            // @ts-ignore
            node.attribs.CUSTOM_CONDITION = {
               data: [{
                  isBind: false,
                  isEvent: false,
                  localized: false,
                  name: node.__$ws_unpackedCycle.__$ws_test,
                  noEscape: false,
                  type: 'var',
                  value: ''
               }],
                  key: undefined,
                  type: 'text'
            };
            // @ts-ignore
            node.attribs.CUSTOM_ITERATOR = {
               data: node.__$ws_unpackedCycle.__$ws_update ? [{
                  isBind: false,
                  isEvent: false,
                  localized: false,
                  name: node.__$ws_unpackedCycle.__$ws_update,
                  noEscape: false,
                  type: 'var',
                  value: ''
               }] : {
                  type: 'text',
                  value: ''
               },
               key: undefined,
               type: 'text'
            };
            // @ts-ignore
            node.attribs.START_FROM = {
               data: node.__$ws_unpackedCycle.__$ws_init ? [{
                  isBind: false,
                  isEvent: false,
                  localized: false,
                  name: node.__$ws_unpackedCycle.__$ws_init,
                  noEscape: false,
                  type: 'var',
                  value: ''
               }] : {
                  type: 'text',
                  value: ''
               },
               key: undefined,
               type: 'text'
            };
            return node;
         }
         const forSource = node.__$ws_unpackedCycle.__$ws_index
            ? `${node.__$ws_unpackedCycle.__$ws_index.string}, ${node.__$ws_unpackedCycle.__$ws_iterator.string} in ${node.__$ws_unpackedCycle.__$ws_collection.string}`
            : `${node.__$ws_unpackedCycle.__$ws_iterator.string} in ${node.__$ws_unpackedCycle.__$ws_collection.string}`;
         // @ts-ignore
         node.attribs.for = {
            data: {
               type: 'text',
               value: forSource
            },
            key: undefined,
            type: 'text'
         };
         // @ts-ignore
         node.forSource = {
            key: node.__$ws_unpackedCycle.__$ws_index ? node.__$ws_unpackedCycle.__$ws_index.string : undefined,
            value: node.__$ws_unpackedCycle.__$ws_iterator.string,
            main: node.__$ws_unpackedCycle.__$ws_collection
         };
      }
      return node;
   }

   // done.
   visitAttribute(node: Ast.AttributeNode, context: INavigationContext): any {
      const attributeContext: INavigationContext = {
         ...context,
         isBind: false,
         isEvent: false,
         localized: false,
         noEscape: false
      };
      const attributeValue = this.visitAll(node.__$ws_value, attributeContext);
      // @ts-ignore
      node.data = node.__$ws_value.length === 1 && node.__$ws_value[0] instanceof Ast.TextDataNode
         ? attributeValue[0]
         : attributeValue;
      // @ts-ignore
      node.key = undefined;
      // @ts-ignore
      node.type = 'text';
      return node;
   }

   // done.
   visitBind(node: Ast.BindNode, context: INavigationContext): any {
      // @ts-ignore
      node.data = [{
         isBind: true,
         isEvent: false,
         localized: false,
         name: node.__$ws_value,
         noEscape: false,
         type: 'var',
         value: ''
      }];
      // @ts-ignore
      node.property = true;
      // @ts-ignore
      node.type = 'text';
      return node;
   }

   // done.
   visitEvent(node: Ast.EventNode, context: INavigationContext): any {
      // @ts-ignore
      node.data = [{
         isBind: false,
         isEvent: true,
         localized: false,
         name: node.__$ws_handler,
         noEscape: false,
         type: 'var',
         value: ''
      }];
      // @ts-ignore
      node.property = true;
      // @ts-ignore
      node.type = 'text';
      return node;
   }

   // done.
   visitIf(node: Ast.IfNode, context: INavigationContext): any {
      // @ts-ignore
      node.children = this.visitAll(node.__$ws_consequent, context);
      // @ts-ignore
      node.key = context.key;
      // @ts-ignore
      node.attribs = {
         data: {
            data: [{
               isBind: false,
               isEvent: false,
               localized: false,
               name: node.__$ws_test,
               noEscape: false,
               type: 'var',
               value: ''
            }],
            key: undefined,
            type: 'text'
         }
      };
      // @ts-ignore
      node.name = 'ws:if';
      // @ts-ignore
      node.originName = 'ws:if';
      // @ts-ignore
      node.type = 'tag';
      return node;
   }

   // done.
   visitElse(node: Ast.ElseNode, context: INavigationContext): any {
      // @ts-ignore
      node.children = this.visitAll(node.__$ws_consequent, context);
      // @ts-ignore
      node.key = context.key;
      // @ts-ignore
      node.attribs = node.__$ws_test ? {
         data: {
            data: [{
               isBind: false,
               isEvent: false,
               localized: false,
               name: node.__$ws_test,
               noEscape: false,
               type: 'var',
               value: ''
            }],
            key: undefined,
            type: 'text'
         }
      } : undefined;
      // @ts-ignore
      node.name = 'ws:else';
      // @ts-ignore
      node.originName = 'ws:else';
      // @ts-ignore
      node.type = 'tag';
      return node;
   }

   // done.
   visitOption(node: Ast.OptionNode, context: INavigationContext): any {
      // @ts-ignore
      node.key = context.key;
      // @ts-ignore
      node.name = `ws:${node.__$ws_name}`;
      // @ts-ignore
      node.originName = `ws:${node.__$ws_name}`;
      // @ts-ignore
      node.type = 'tag';
      const optionValue = node.__$ws_value;
      if (optionValue.hasFlag(Ast.Flags.TYPE_CASTED)) {
         const isArrayOrObject = optionValue instanceof Ast.ArrayNode && optionValue.__$ws_elements.length > 1
            || optionValue instanceof Ast.ObjectNode;
         const patchedOptionValue = optionValue.accept(this, context);
         // @ts-ignore
         node.attribs = patchedOptionValue.attribs;
         // @ts-ignore
         node.children = patchedOptionValue.children;
         if (!isArrayOrObject) {
            // @ts-ignore
            if (!node.attribs) {
               // @ts-ignore
               node.attribs = { };
            }
            // @ts-ignore
            node.attribs.type = {
               data: {
                  type: 'text',
                  value: getDataTypeName(node.__$ws_value)
               },
               key: undefined,
               type: 'text'
            };
         }
         return node;
      }

      // @ts-ignore
      node.children = this.visitAll([node.__$ws_value], context);
      // @ts-ignore
      node.attribs = undefined;
      return node;
   }

   // done.
   visitContentOption(node: Ast.ContentOptionNode, context: INavigationContext): any {
      let attributes = undefined;
      if (node.__$ws_isStringType) {
         attributes = {
            type: {
               data: {
                  value: 'string',
                  type: 'text'
               },
               key: undefined,
               type: 'text'
            }
         };
      }
      // @ts-ignore
      node.children = this.visitAll(node.__$ws_content, context);
      // @ts-ignore
      node.key = context.key;
      // @ts-ignore
      node.attribs = attributes;
      // @ts-ignore
      node.name = `ws:${node.__$ws_name}`;
      // @ts-ignore
      node.originName = `ws:${node.__$ws_name}`;
      // @ts-ignore
      node.type = 'tag';
      return node;
   }

   // done.
   visitComponent(node: Ast.ComponentNode, context: INavigationContext): any {
      // @ts-ignore
      node.key = context.key;
      // @ts-ignore
      node.attribs = this.collectComponentAttributes(node, context);
      if (node.__$ws_path.hasLogicalPath()) {
         // @ts-ignore
         node.children = [{
            constructor: node.__$ws_path.getFullPath(),
            key: undefined,
            library: node.__$ws_path.getFullPhysicalPath(),
            module: node.__$ws_path.getLogicalPath(),
            type: 'module'
         }];
         // @ts-ignore
         node.attribs._wstemplatename = node.__$ws_path.getFullPath();
      } else {
         // @ts-ignore
         node.children = [{
            constructor: node.__$ws_path.getFullPath(),
            fn: node.__$ws_path.getFullPath(),
            key: undefined,
            optional: undefined,
            type: 'control'
         }];
         // @ts-ignore
         node.attribs._wstemplatename = node.__$ws_path.getFullPath();
      }
      // @ts-ignore
      node.name = `ws:${node.__$ws_path.getFullPath()}`;
      // @ts-ignore
      node.originName = node.__$ws_path.getFullPath().replace('/', '.');
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.injectedData = this.collectContents(node, context);
      return node;
   }

   // done.
   visitArray(node: Ast.ArrayNode, context: INavigationContext): any {
      // @ts-ignore
      node.attribs = undefined;
      // @ts-ignore
      node.key = context.key;
      // @ts-ignore
      node.name = `ws:Array`;
      // @ts-ignore
      node.originName = `ws:Array`;
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.children = this.visitAll(node.__$ws_elements, context);
      return node;
   }

   // done.
   visitBoolean(node: Ast.BooleanNode, context: INavigationContext): any {
      // @ts-ignore
      node.attribs = undefined;
      // @ts-ignore
      node.key = context.key;
      // @ts-ignore
      node.name = `ws:Boolean`;
      // @ts-ignore
      node.originName = `ws:Boolean`;
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.children = [{
         data: this.visitAll(node.__$ws_data, context),
         key: undefined,
         type: 'text'
      }];
      return node;
   }

   // done.
   visitFunction(node: Ast.FunctionNode, context: INavigationContext): any {
      const options = { };
      for (const optionName in node.__$ws_options) {
         const option = node.__$ws_options[optionName];
         const optionValue = (<Ast.ValueNode>option.__$ws_value).accept(this, context);
         options[optionName] = {
            data: optionValue.__$ws_data,
            key: undefined,
            type: 'text'
         };
      }
      // @ts-ignore
      node.attribs = Object.keys(options).length > 0 ? options : undefined;
      // @ts-ignore
      node.key = context.key;
      // @ts-ignore
      node.name = `ws:Function`;
      // @ts-ignore
      node.originName = `ws:Function`;
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.children = [{
         data: this.visitAll(node.__$ws_functionExpression, context),
         key: undefined,
         type: 'text'
      }];
      return node;
   }

   // done.
   visitNumber(node: Ast.NumberNode, context: INavigationContext): any {
      // @ts-ignore
      node.attribs = undefined;
      // @ts-ignore
      node.key = context.key;
      // @ts-ignore
      node.name = `ws:Number`;
      // @ts-ignore
      node.originName = `ws:Number`;
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.children = [{
         data: this.visitAll(node.__$ws_data, context),
         key: undefined,
         type: 'text'
      }];
      return node;
   }

   // done.
   visitObject(node: Ast.ObjectNode, context: INavigationContext): any {
      // @ts-ignore
      node.attribs = this.collectObjectAttributeProperties(node, context);
      // @ts-ignore
      node.key = context.key;
      // @ts-ignore
      node.name = `ws:Object`;
      // @ts-ignore
      node.originName = `ws:Object`;
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.children = this.collectObjectProperties(node, context);
      return node;
   }

   // done.
   visitString(node: Ast.StringNode, context: INavigationContext): any {
      // @ts-ignore
      node.attribs = undefined;
      // @ts-ignore
      node.key = context.key;
      // @ts-ignore
      node.name = `ws:String`;
      // @ts-ignore
      node.originName = `ws:String`;
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.children = [{
         data: this.visitAll(node.__$ws_data, context),
         key: undefined,
         type: 'text'
      }];
      return node;
   }

   // done.
   visitValue(node: Ast.ValueNode, context: INavigationContext): any {
      // @ts-ignore
      node.attribs = undefined;
      // @ts-ignore
      node.key = context.key;
      // @ts-ignore
      node.name = `ws:Value`;
      // @ts-ignore
      node.originName = `ws:Value`;
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.children = [{
         data: this.visitAll(node.__$ws_data, context),
         key: undefined,
         type: 'text'
      }];
      return node;
   }

   // done.
   visitInlineTemplate(node: Ast.InlineTemplateNode, context: INavigationContext): any {
      const attributes = this.collectComponentAttributes(node, context);
      // @ts-ignore
      node.key = context.key;
      // @ts-ignore
      node.attribs = {
         ...attributes,
         template: {
            data: {
               type: 'text',
               value: node.__$ws_name
            },
            key: undefined,
            type: 'text'
         },
         _wstemplatename: {
            data: {
               type: 'text',
               value: node.__$ws_name
            },
            key: undefined,
            type: 'text'
         }
      };
      // @ts-ignore
      node.name = `ws:partial`;
      // @ts-ignore
      node.originName = `ws:partial`;
      // @ts-ignore
      node.type = 'tag';
      const inlineTemplate = context.scope.getTemplate(node.__$ws_name);
      // @ts-ignore
      node.children = inlineTemplate.__$ws_content;
      const injectedData = this.collectContents(node, context);
      if (injectedData.length > 0) {
         // @ts-ignore
         node.injectedData = injectedData;
      }
      return node;
   }

   // done.
   visitStaticPartial(node: Ast.StaticPartialNode, context: INavigationContext): any {
      const attributes = this.collectComponentAttributes(node, context);
      // @ts-ignore
      node.key = context.key;
      // @ts-ignore
      node.attribs = {
         ...attributes,
         template: {
            data: {
               type: 'text',
               value: node.__$ws_path.getFullPath()
            },
            key: undefined,
            type: 'text'
         }
      };
      if (node.__$ws_path.hasPlugins()) {
         // @ts-ignore
         node.attribs._wstemplatename = {
            data: {
               type: 'text',
               value: node.__$ws_path.getFullPath()
            },
            key: undefined,
            type: 'text'
         };
         // @ts-ignore
         node.children = [{
            fn: node.__$ws_path.getFullPath(),
            key: undefined,
            optional: undefined,
            type: 'template'
         }];
      } else if (node.__$ws_path.hasLogicalPath()) {
         // @ts-ignore
         node.attribs._wstemplatename = node.__$ws_path.getFullPath();
         // @ts-ignore
         node.children = [{
            constructor: node.__$ws_path.getFullPath(),
            key: undefined,
            library: node.__$ws_path.getFullPhysicalPath(),
            module: node.__$ws_path.getLogicalPath(),
            type: 'module'
         }];
      } else {
         // @ts-ignore
         node.attribs._wstemplatename = node.__$ws_path.getFullPath();
         // @ts-ignore
         node.children = [{
            constructor: node.__$ws_path.getFullPath(),
            fn: node.__$ws_path.getFullPath(),
            key: undefined,
            optional: undefined,
            type: 'control'
         }];
      }
      // @ts-ignore
      node.name = `ws:partial`;
      // @ts-ignore
      node.originName = `ws:partial`;
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.injectedData = this.collectContents(node, context);
      return node;
   }

   // done.
   visitDynamicPartial(node: Ast.DynamicPartialNode, context: INavigationContext): any {
      const attributes = this.collectComponentAttributes(node, context);
      const injectedTemplate = {
         isBind: false,
         isEvent: false,
         localized: false,
         name: node.__$ws_expression,
         noEscape: false,
         type: 'var',
         value: ''
      };
      // @ts-ignore
      node.key = context.key;
      // @ts-ignore
      node.attribs = {
         ...attributes,
         template: {
            data: [injectedTemplate],
            key: undefined,
            type: 'text'
         },
         _wstemplatename: {
            data: [injectedTemplate],
            key: undefined,
            type: 'text'
         }
      };
      // @ts-ignore
      node.injectedTemplate = injectedTemplate;
      // @ts-ignore
      node.name = `ws:partial`;
      // @ts-ignore
      node.originName = `ws:partial`;
      // @ts-ignore
      node.type = 'tag';
      const children = this.collectContents(node, context);
      // @ts-ignore
      node.children = children;
      // @ts-ignore
      node.injectedData = children;
      return node;
   }

   // done.
   private collectAttributes(node: Ast.BaseHtmlElement, context: INavigationContext, removePrefix: boolean = false): any {
      const attributes = { };
      for (const attributeName in node.__$ws_attributes) {
         // rm prefix for elements only
         const cleanName = attributeName.replace('attr:', '');
         const name = removePrefix ? cleanName : attributeName;
         attributes[name] = node.__$ws_attributes[attributeName].accept(this, context);
      }
      for (const eventName in node.__$ws_events) {
         attributes[eventName] = node.__$ws_events[eventName].accept(this, context);
      }
      return attributes;
   }

   // done.
   private collectComponentAttributes(node: Ast.BaseWasabyElement, context: INavigationContext): any {
      const attributes = this.collectAttributes(node, context);
      for (const optionName in node.__$ws_options) {
         const option = node.__$ws_options[optionName];
         if (!option.hasFlag(Ast.Flags.UNPACKED)) {
            continue;
         }
         const optionValue = (<Ast.ValueNode>option.__$ws_value).__$ws_data;
         const isTextOnly = optionValue.length === 1 && (optionValue[0] instanceof Ast.TextDataNode);
         const dataArray = this.visitAll(optionValue, context);
         attributes[optionName] = {
            data: isTextOnly ? dataArray[0] : dataArray,
            key: undefined,
            type: 'text'
         };
      }
      return attributes;
   }

   // done.
   private collectContents(node: Ast.BaseWasabyElement, context: INavigationContext): any[] {
      const injectedData = [];
      for (const optionName in node.__$ws_options) {
         const option = node.__$ws_options[optionName];
         if (option.hasFlag(Ast.Flags.UNPACKED)) {
            continue;
         }
         const childContext: INavigationContext = {
            ...context,
            key: context.key + injectedData.length + '_'
         };
         const injectedNode = option.accept(this, childContext);
         if (injectedNode) {
            injectedData.push(injectedNode);
         }
      }
      for (const optionName in node.__$ws_contents) {
         const originContent = node.__$ws_contents[optionName];
         if (originContent.hasFlag(Ast.Flags.NEST_CASTED)) {
            return this.visitAll(originContent.__$ws_content, context);
         }
         const childContext: INavigationContext = {
            ...context,
            key: context.key + injectedData.length + '_'
         };
         const contentNode = node.__$ws_contents[optionName].accept(this, childContext);
         if (contentNode) {
            injectedData.push(contentNode);
         }
      }
      return injectedData;
   }

   // done.
   private collectObjectAttributeProperties(node: Ast.ObjectNode, context: INavigationContext): any {
      const properties = { };
      for (const optionName in node.__$ws_properties) {
         const originProperty = node.__$ws_properties[optionName];
         if (!originProperty.hasFlag(Ast.Flags.UNPACKED)) {
            continue;
         }
         const property = <Ast.OptionNode>originProperty;
         const propertyValue = (<Ast.ValueNode>property.__$ws_value).__$ws_data;
         const isTextOnly = propertyValue.length === 1 && (propertyValue[0] instanceof Ast.TextDataNode);
         const dataArray = this.visitAll(propertyValue, context);
         properties[optionName] = {
            data: isTextOnly ? dataArray[0] : dataArray,
            key: undefined,
            type: 'text'
         };
      }
      return Object.keys(properties).length > 0 ? properties : undefined;
   }

   // done.
   private collectObjectProperties(node: Ast.ObjectNode, context: INavigationContext): any {
      const injectedData = [];
      for (const optionName in node.__$ws_properties) {
         const originProperty = node.__$ws_properties[optionName];
         if (originProperty.hasFlag(Ast.Flags.UNPACKED)) {
            continue;
         }
         const childContext: INavigationContext = {
            ...context,
            key: context.key + injectedData.length + '_'
         };
         const property = originProperty.accept(this, childContext);
         if (property) {
            injectedData.push(property);
         }
      }
      return injectedData;
   }
}

export default function patch(nodes: Ast.Ast[], scope: Scope): Ast.Ast[] {
   const visitor = new PatchVisitor();
   const context: INavigationContext = {
      scope,
      parent: null,
      key: ''
   };
   return visitor.visitAll(nodes, context);
}
