/// <amd-module name="UI/_builder/Tmpl/core/PatchVisitor" />

/**
 * @deprecated
 * @description Prepares abstract syntax tree for generating code (bad patch!)
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/PatchVisitor.ts
 *
 * FIXME: Данный посетитель выполняет плохой патч дерева Wasaby
 *   для поддержания совместимости между Wasaby-парсерами.
 *   Удалить после реализации остальных фаз анализа и синтеза.
 */

import Scope from 'UI/_builder/Tmpl/core/Scope';
import * as Ast from 'UI/_builder/Tmpl/core/Ast';

// This module can only be referenced with ECMAScript imports/exports
// by turning on the 'esModuleInterop' flag and referencing its default export.
// @ts-ignore
import { FunctionUtils } from 'UI/Utils';

interface INavigationContext {
   scope: Scope;
   currentKey: string;
   isBind?: boolean;
   isEvent?: boolean;
   localized?: boolean;
   noEscape?: boolean;
}

function isTemplateType(fullPath: string): boolean {
   const hasTemplatePlugin = /^wml!/gi.test(fullPath) ||
      /^(optional!)?tmpl!/gi.test(fullPath) ||
      /^html!/gi.test(fullPath);
   const hasOptionalPlugin = /^optional!/gi.test(fullPath);
   const hasSlashes = fullPath.indexOf('/') > -1;
   return hasTemplatePlugin || !hasTemplatePlugin && hasOptionalPlugin && !hasSlashes;
}

class PatchVisitor implements Ast.IAstVisitor {
   // done.
   visitDoctype(node: Ast.DoctypeNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'directive';
      // @ts-ignore
      node.name = '!DOCTYPE';
      // @ts-ignore
      node.data = node.__$ws_data;
      // @ts-ignore
      node.isRootTag = node.__$ws_isRootNode;
      return node;
   }

   // done.
   visitCData(node: Ast.CDataNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'directive';
      // @ts-ignore
      node.name = '![CDATA[';
      // @ts-ignore
      node.data = node.__$ws_data;
      // @ts-ignore
      node.isRootTag = node.__$ws_isRootNode;
      return node;
   }

   // done.
   visitInstruction(node: Ast.InstructionNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'directive';
      // @ts-ignore
      node.name = '?';
      // @ts-ignore
      node.data = node.__$ws_data;
      // @ts-ignore
      node.isRootTag = node.__$ws_isRootNode;
      return node;
   }

   // done.
   visitComment(node: Ast.CommentNode, context: INavigationContext): any {
      return null;
   }

   // done.
   visitFor(node: Ast.ForNode, context: INavigationContext): any {
      const innerContext: INavigationContext = {
         ...context,
         currentKey: ''
      };
      // @ts-ignore
      node.children = this.visitAll(node.__$ws_content, innerContext);
      // @ts-ignore
      node.name = 'ws:for';
      // @ts-ignore
      node.originName = 'ws:for';
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.key = context.currentKey;
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
      // @ts-ignore
      node.isRootTag = node.__$ws_isRootNode;
      if (node.__$ws_internal) {
         // @ts-ignore
         node.internal = this.copyInternal(node.__$ws_internal, context);
      }
      return node;
   }

   // done.
   visitForeach(node: Ast.ForeachNode, context: INavigationContext): any {
      const innerContext: INavigationContext = {
         ...context,
         currentKey: ''
      };
      // @ts-ignore
      node.children = this.visitAll(node.__$ws_content, innerContext);
      // @ts-ignore
      node.name = 'ws:for';
      // @ts-ignore
      node.originName = 'ws:for';
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.key = context.currentKey;
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
      // @ts-ignore
      node.isRootTag = node.__$ws_isRootNode;
      if (node.__$ws_internal) {
         // @ts-ignore
         node.internal = this.copyInternal(node.__$ws_internal, context);
      }
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
      node.data = (node.__$ws_content.length === 1 && node.__$ws_content[0] instanceof Ast.TextDataNode) ? content[0] : content;
      // @ts-ignore
      node.type = 'text';
      // @ts-ignore
      node.key = context.currentKey;
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
            currentKey: context.currentKey + nodes[i].__$ws_key + '_'
         };
         const child = nodes[i].accept(this, childContext);
         if (nodes[i].__$ws_internal) {
            // @ts-ignore
            child.internal = this.copyInternal(nodes[i].__$ws_internal, context);
         }
         if (child) {
            children.splice(nodes[i].__$ws_key, child, child);
         }
      }
      return children;
   }

   // done.
   visitTemplate(node: Ast.TemplateNode, context: INavigationContext): any {
      // @ts-ignore
      node.children = this.visitAll(node.__$ws_content, context);
      // @ts-ignore
      node.attribs = {
         name: node.__$ws_name
      };
      // @ts-ignore
      node.key = context.currentKey;
      // @ts-ignore
      node.name = 'ws:template';
      // @ts-ignore
      node.originName = 'ws:template';
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.isRootTag = node.__$ws_isRootNode;
      if (node.__$ws_internal) {
         // @ts-ignore
         node.internal = this.copyInternal(node.__$ws_internal, context);
      }
      return node;
   }

   // done.
   visitElement(node: Ast.ElementNode, context: INavigationContext): any {
      // @ts-ignore
      node.children = this.visitAll(node.__$ws_content, context);
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.name = node.__$ws_name;
      // @ts-ignore
      node.originName = node.__$ws_name;
      // @ts-ignore
      node.key = context.currentKey;
      const attribs = this.getElementAttributesCollection(node, context);
      // @ts-ignore
      node.attribs = Object.keys(attribs).length === 0 ? undefined : attribs;
      // @ts-ignore
      node.isRootTag = node.__$ws_isRootNode;
      if (node.__$ws_internal) {
         // @ts-ignore
         node.internal = this.copyInternal(node.__$ws_internal, context);
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
         // FIXME: legacy behaviour = always false for property 'isBind'
         isBind: false,
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
      node.key = context.currentKey;
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.isRootTag = node.__$ws_isRootNode;
      if (node.__$ws_internal) {
         // @ts-ignore
         node.internal = this.copyInternal(node.__$ws_internal, context);
      }
      return node;
   }

   // done.
   visitElse(node: Ast.ElseNode, context: INavigationContext): any {
      // @ts-ignore
      node.children = this.visitAll(node.__$ws_consequent, context);
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
      node.key = context.currentKey;
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.isRootTag = node.__$ws_isRootNode;
      if (node.__$ws_internal) {
         // @ts-ignore
         node.internal = this.copyInternal(node.__$ws_internal, context);
      }
      return node;
   }

   // done.
   visitOption(node: Ast.OptionNode, context: INavigationContext): any {
      // @ts-ignore
      node.key = context.currentKey;
      // @ts-ignore
      node.name = `ws:${node.__$ws_name}`;
      // @ts-ignore
      node.originName = `ws:${node.__$ws_name}`;
      // @ts-ignore
      node.type = 'tag';
      const optionValue = node.__$ws_value;
      if (optionValue.hasFlag(Ast.Flags.TYPE_CASTED)) {
         const patchedOptionValue = optionValue.accept(this, context);
         // @ts-ignore
         node.attribs = patchedOptionValue.attribs;
         // @ts-ignore
         node.children = patchedOptionValue.children;
         // @ts-ignore
         node.isRootTag = node.__$ws_isRootNode;
         return node;
      }
      // @ts-ignore
      node.children = this.visitAll([ node.__$ws_value ], context);
      // @ts-ignore
      node.attribs = undefined;
      // @ts-ignore
      node.isRootTag = node.__$ws_isRootNode;
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
      node.attribs = attributes;
      // @ts-ignore
      node.key = context.currentKey;
      // @ts-ignore
      node.name = `ws:${node.__$ws_name}`;
      // @ts-ignore
      node.originName = `ws:${node.__$ws_name}`;
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.isRootTag = node.__$ws_isRootNode;
      if (node.__$ws_internal) {
         // @ts-ignore
         node.internal = this.copyInternal(node.__$ws_internal, context);
      }
      // @ts-ignore
      node.isContentOption = true;
      return node;
   }

   // done.
   visitComponent(node: Ast.ComponentNode, context: INavigationContext): any {
      // @ts-ignore
      node.attribs = this.getComponentAttributesCollection(node, context);
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
      node.key = context.currentKey;
      // @ts-ignore
      node.name = `ws:${node.__$ws_path.getFullPath()}`;
      // @ts-ignore
      node.originName = node.__$ws_path.getFullPath().replace('/', '.');
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.injectedData = this.collectContents(node, context);
      // @ts-ignore
      node.isRootTag = node.__$ws_isRootNode;
      if (node.__$ws_internal) {
         // @ts-ignore
         node.internal = this.copyInternal(node.__$ws_internal, context);
      }
      return node;
   }

   // done.
   visitArray(node: Ast.ArrayNode, context: INavigationContext): any {
      // @ts-ignore
      node.attribs = undefined;
      if (node.hasFlag(Ast.Flags.TARGET_TYPE_CASTED)) {
         // @ts-ignore
         node.attribs = {
            type: {
               data: {
                  type: 'text',
                  value: 'array'
               },
               key: undefined,
               type: 'text'
            }
         };
      }
      // @ts-ignore
      node.key = context.currentKey;
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
      if (node.hasFlag(Ast.Flags.TARGET_TYPE_CASTED)) {
         // @ts-ignore
         node.attribs = {
            type: {
               data: {
                  type: 'text',
                  value: 'boolean'
               },
               key: undefined,
               type: 'text'
            }
         };
      }
      // @ts-ignore
      node.key = context.currentKey;
      // @ts-ignore
      node.name = `ws:Boolean`;
      // @ts-ignore
      node.originName = `ws:Boolean`;
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.children = [{
         data: this.visitAll(node.__$ws_data, context),
         key: context.currentKey + '0_',
         type: 'text'
      }];
      return node;
   }

   // done.
   visitFunction(node: Ast.FunctionNode, context: INavigationContext): any {
      const chain = [];
      if (node.hasFlag(Ast.Flags.TARGET_TYPE_CASTED)) {
         chain.push({
            node: {
               data: {
                  type: 'text',
                  value: 'function'
               },
               key: undefined,
               type: 'text'
            },
            name: 'type'
         });
      }
      for (const optionName in node.__$ws_options) {
         const option = node.__$ws_options[optionName];
         const optionValue = (<Ast.ValueNode>option.__$ws_value).accept(this, context);
         const content = optionValue.__$ws_data;
         const hasTextOnly = (content.length === 1 && content[0] instanceof Ast.TextDataNode);
         const processedNode = {
            node: {
               data: hasTextOnly ? content[0] : content,
               key: undefined,
               type: 'text'
            },
            name: optionName
         };
         chain.splice(option.__$ws_key, 0, processedNode);
      }
      // @ts-ignore
      node.attribs = undefined;
      if (chain.length > 0) {
         // @ts-ignore
         node.attribs = { };
         for (let index = 0; index < chain.length; ++index) {
            const item = chain[index];
            // @ts-ignore
            node.attribs[item.name] = item.node;
         }
      }
      // @ts-ignore
      node.key = context.currentKey;
      // @ts-ignore
      node.name = `ws:Function`;
      // @ts-ignore
      node.originName = `ws:Function`;
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.children = [{
         data: this.visitAll(node.__$ws_functionExpression, context),
         key: context.currentKey + '0_',
         type: 'text'
      }];
      return node;
   }

   // done.
   visitNumber(node: Ast.NumberNode, context: INavigationContext): any {
      // @ts-ignore
      node.attribs = undefined;
      if (node.hasFlag(Ast.Flags.TARGET_TYPE_CASTED)) {
         // @ts-ignore
         node.attribs = {
            type: {
               data: {
                  type: 'text',
                  value: 'number'
               },
               key: undefined,
               type: 'text'
            }
         };
      }
      // @ts-ignore
      node.key = context.currentKey;
      // @ts-ignore
      node.name = `ws:Number`;
      // @ts-ignore
      node.originName = `ws:Number`;
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.children = [{
         data: this.visitAll(node.__$ws_data, context),
         key: context.currentKey + '0_',
         type: 'text'
      }];
      return node;
   }

   // done.
   visitObject(node: Ast.ObjectNode, context: INavigationContext): any {
      const initChain = [];
      if (node.hasFlag(Ast.Flags.TARGET_TYPE_CASTED)) {
         initChain.push({
            node: {
               data: {
                  type: 'text',
                  value: 'object'
               },
               key: undefined,
               type: 'text'
            },
            name: 'type'
         });
      }
      // @ts-ignore
      node.attribs = this.collectObjectAttributeProperties(node, context, initChain);
      // @ts-ignore
      node.key = context.currentKey;
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
      if (node.hasFlag(Ast.Flags.TARGET_TYPE_CASTED)) {
         // @ts-ignore
         node.attribs = {
            type: {
               data: {
                  type: 'text',
                  value: 'string'
               },
               key: undefined,
               type: 'text'
            }
         };
      }
      // @ts-ignore
      node.key = context.currentKey;
      // @ts-ignore
      node.name = `ws:String`;
      // @ts-ignore
      node.originName = `ws:String`;
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.children = [{
         data: this.visitAll(node.__$ws_data, context),
         key: context.currentKey + '0_',
         type: 'text'
      }];
      return node;
   }

   // done.
   visitValue(node: Ast.ValueNode, context: INavigationContext): any {
      // @ts-ignore
      node.attribs = undefined;
      if (node.hasFlag(Ast.Flags.TARGET_TYPE_CASTED)) {
         // @ts-ignore
         node.attribs = {
            type: {
               data: {
                  type: 'text',
                  value: 'value'
               },
               key: undefined,
               type: 'text'
            }
         };
      }
      // @ts-ignore
      node.key = context.currentKey;
      // @ts-ignore
      node.name = `ws:Value`;
      // @ts-ignore
      node.originName = `ws:Value`;
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.children = [{
         data: this.visitAll(node.__$ws_data, context),
         key: context.currentKey + '0_',
         type: 'text'
      }];
      return node;
   }

   // done.
   visitInlineTemplate(node: Ast.InlineTemplateNode, context: INavigationContext): any {
      const initChain = [{
         node: {
            data: {
               type: 'text',
               value: node.__$ws_name
            },
            key: undefined,
            type: 'text'
         },
         name: 'template'
      }];
      // @ts-ignore
      node.attribs = this.getComponentAttributesCollection(node, context, initChain);
      // @ts-ignore
      node.attribs._wstemplatename = {
         data: {
            type: 'text',
            value: node.__$ws_name
         },
         key: undefined,
         type: 'text'
      };
      // @ts-ignore
      node.key = context.currentKey;
      // @ts-ignore
      node.name = `ws:partial`;
      // @ts-ignore
      node.originName = `ws:partial`;
      // @ts-ignore
      node.type = 'tag';
      const inlineTemplate = context.scope.getTemplate(node.__$ws_name);
      // @ts-ignore
      node.children = inlineTemplate.__$ws_content;
      const innerContext: INavigationContext = {
         ...context,
         currentKey: ''
      };
      const injectedData = this.collectContents(node, innerContext);
      if (injectedData.length > 0) {
         // @ts-ignore
         node.injectedData = injectedData;
      }
      // @ts-ignore
      node.isRootTag = node.__$ws_isRootNode;
      if (node.__$ws_internal) {
         // @ts-ignore
         node.internal = this.copyInternal(node.__$ws_internal, context);
      }
      return node;
   }

   // done.
   visitStaticPartial(node: Ast.StaticPartialNode, context: INavigationContext): any {
      const initChain = [{
         node: {
            data: {
               type: 'text',
               value: node.__$ws_path.getFullPath()
            },
            key: undefined,
            type: 'text'
         },
         name: 'template'
      }];
      // @ts-ignore
      node.attribs = this.getComponentAttributesCollection(node, context, initChain);
      if (isTemplateType(node.__$ws_path.getFullPath())) {
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
      node.key = context.currentKey;
      // @ts-ignore
      node.name = `ws:partial`;
      // @ts-ignore
      node.originName = `ws:partial`;
      // @ts-ignore
      node.type = 'tag';
      const innerContext: INavigationContext = {
         ...context,
         currentKey: ''
      };
      // @ts-ignore
      node.injectedData = this.collectContents(node, innerContext);
      // @ts-ignore
      node.isRootTag = node.__$ws_isRootNode;
      if (node.__$ws_internal) {
         // @ts-ignore
         node.internal = this.copyInternal(node.__$ws_internal, context);
      }
      return node;
   }

   // done.
   visitDynamicPartial(node: Ast.DynamicPartialNode, context: INavigationContext): any {
      const injectedTemplate = {
         isBind: false,
         isEvent: false,
         localized: false,
         name: node.__$ws_expression,
         noEscape: false,
         type: 'var',
         value: ''
      };
      const initChain = [{
         node: {
            data: [injectedTemplate],
            key: undefined,
            type: 'text'
         },
         name: 'template'
      }];
      // @ts-ignore
      node.attribs = this.getComponentAttributesCollection(node, context, initChain);
      // @ts-ignore
      node.attribs._wstemplatename = {
         data: [injectedTemplate],
         key: undefined,
         type: 'text'
      };
      // @ts-ignore
      node.injectedTemplate = injectedTemplate;
      // @ts-ignore
      node.key = context.currentKey;
      // @ts-ignore
      node.name = `ws:partial`;
      // @ts-ignore
      node.originName = `ws:partial`;
      // @ts-ignore
      node.type = 'tag';
      const innerContext: INavigationContext = {
         ...context,
         currentKey: ''
      };
      const children = this.collectContents(node, innerContext);
      // @ts-ignore
      node.children = children;
      // @ts-ignore
      node.injectedData = children;
      // @ts-ignore
      node.isRootTag = node.__$ws_isRootNode;
      if (node.__$ws_internal) {
         // @ts-ignore
         node.internal = this.copyInternal(node.__$ws_internal, context);
      }
      return node;
   }

   // done.
   private getElementAttributesCollection(node: Ast.BaseHtmlElement, context: INavigationContext): any {
      const attributes = { };
      const chain = [];
      for (const attributeName in node.__$ws_attributes) {
         const attribute = node.__$ws_attributes[attributeName];
         // rm prefix for elements only
         const cleanName = attributeName.replace('attr:', '');
         const name = !attribute.__$ws_hasAttributePrefix ? cleanName : attributeName;
         const processedAttribute = {
            node: attribute.accept(this, context),
            key: attribute.__$ws_key,
            name
         };
         chain.push(processedAttribute);
      }
      for (const name in node.__$ws_events) {
         const event = node.__$ws_events[name];
         const processedEvent = {
            node: event.accept(this, context),
            key: event.__$ws_key,
            name
         };
         chain.push(processedEvent);
      }
      chain.sort((prev: any, next: any) => prev.key - next.key);
      chain.forEach((element: any) => {
         attributes[element.name] = element.node;
      });
      return attributes;
   }

   // done.
   private getComponentAttributesCollection(node: Ast.BaseWasabyElement, context: INavigationContext, initChain?: any[]): any {
      const attributes = { };
      const chain = [];
      for (const attributeName in node.__$ws_attributes) {
         const attribute = node.__$ws_attributes[attributeName];
         // rm prefix for elements only
         const cleanName = attributeName.replace('attr:', '');
         const name = !attribute.__$ws_hasAttributePrefix ? cleanName : attributeName;
         const processedAttribute = {
            node: attribute.accept(this, context),
            key: attribute.__$ws_key,
            name
         };
         chain.push(processedAttribute);
      }
      for (const name in node.__$ws_events) {
         const event = node.__$ws_events[name];
         const processedEvent = {
            node: event.accept(this, context),
            key: event.__$ws_key,
            name
         };
         chain.push(processedEvent);
      }
      for (const name in node.__$ws_options) {
         const option = node.__$ws_options[name];
         if (!option.hasFlag(Ast.Flags.UNPACKED)) {
            continue;
         }
         const optionValue = (<Ast.ValueNode>option.__$ws_value).__$ws_data;
         const isTextOnly = optionValue.length === 1 && (optionValue[0] instanceof Ast.TextDataNode);
         const dataArray = this.visitAll(optionValue, context);
         const processedOption = {
            node: {
               data: isTextOnly ? dataArray[0] : dataArray,
               key: undefined,
               type: 'text'
            },
            key: option.__$ws_key,
            name
         };
         chain.push(processedOption);
      }
      if (Array.isArray(initChain)) {
         initChain.forEach((element: any) => {
            attributes[element.name] = element.node;
         });
      }
      chain.sort((prev: any, next: any) => prev.key - next.key);
      chain.forEach((element: any) => {
         attributes[element.name] = element.node;
      });
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
            currentKey: context.currentKey + option.__$ws_key + '_'
         };
         const injectedNode = option.accept(this, childContext);
         if (injectedNode) {
            injectedData.splice(option.__$ws_key, 0, injectedNode);
         }
      }
      for (const optionName in node.__$ws_contents) {
         const content = node.__$ws_contents[optionName];
         const childContext: INavigationContext = {
            ...context,
            currentKey: context.currentKey + content.__$ws_key + '_'
         };
         const contentNode = content.accept(this, childContext);
         if (contentNode) {
            injectedData.splice(content.__$ws_key, 0, contentNode);
         }
      }
      return injectedData;
   }

   // done.
   private collectObjectAttributeProperties(node: Ast.ObjectNode, context: INavigationContext, initChain: any): any {
      const chain = initChain;
      for (const optionName in node.__$ws_properties) {
         const originProperty = node.__$ws_properties[optionName];
         if (!originProperty.hasFlag(Ast.Flags.UNPACKED)) {
            continue;
         }
         const property = <Ast.OptionNode>originProperty;
         const propertyValue = (<Ast.ValueNode>property.__$ws_value).__$ws_data;
         const isTextOnly = propertyValue.length === 1 && (propertyValue[0] instanceof Ast.TextDataNode);
         const dataArray = this.visitAll(propertyValue, context);
         const processedOption = {
            node: {
               data: isTextOnly ? dataArray[0] : dataArray,
               key: undefined,
               type: 'text'
            },
            name: optionName
         };
         chain.splice(property.__$ws_key, 0, processedOption);
      }
      if (chain.length === 0) {
         return undefined;
      }
      const properties = { };
      for (let index = 0; index < chain.length; ++index) {
         const item = chain[index];
         properties[item.name] = item.node;
      }
      return properties;
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
            currentKey: context.currentKey + originProperty.__$ws_key + '_'
         };
         const property = originProperty.accept(this, childContext);
         if (property) {
            injectedData.splice(originProperty.__$ws_key, 0, property);
         }
      }
      return injectedData;
   }

   // done.
   private copyInternal(internal: Ast.IInternal, context: INavigationContext): any {
      const copy = { };
      for (const property in internal) {
         internal[property].data.forEach((expression: Ast.ExpressionNode) => {
            expression.accept(this, context);
         });
         copy[property] = FunctionUtils.shallowClone(internal[property]);
      }
      return copy;
   }
}

export default function patch(nodes: Ast.Ast[], scope: Scope): Ast.Ast[] {
   const visitor = new PatchVisitor();
   const context: INavigationContext = {
      scope,
      currentKey: ''
   };
   return visitor.visitAll(nodes, context);
}
