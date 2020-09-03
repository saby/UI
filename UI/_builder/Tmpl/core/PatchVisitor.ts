/// <amd-module name="UI/_builder/Tmpl/core/PatchVisitor" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/PatchVisitor.ts
 *
 * FIXME: Данный посетитель выполняет плохой патч дерева Wasaby
 *   для поддержания совместимости между Wasaby-парсерами.
 *   Удалить после реализации остальных фаз анализа и синтеза.
 */

import Scope from './Scope';

import * as Ast from './Ast';

interface INavigationContext {
   scope: Scope;
   parent: Ast.Ast | null;
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

class PatchVisitor implements Ast.IAstVisitor {
   // done.
   visitDoctype(node: Ast.DoctypeNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'directive';
      // @ts-ignore
      node.name = '!DOCTYPE';
      // @ts-ignore
      node.data = node.__$ws_data;
   }

   // done.
   visitCData(node: Ast.CDataNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'directive';
      // @ts-ignore
      node.name = '![CDATA[';
      // @ts-ignore
      node.data = node.__$ws_data;
   }

   // done.
   visitInstruction(node: Ast.InstructionNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'directive';
      // @ts-ignore
      node.name = '?';
      // @ts-ignore
      node.data = node.__$ws_data;
   }

   // done.
   visitComment(node: Ast.CommentNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'comment';
      // @ts-ignore
      node.key = node.__$ws_key;
   }

   // done.
   visitFor(node: Ast.ForNode, context: INavigationContext): any {
      // @ts-ignore
      node.name = 'ws:for';
      // @ts-ignore
      node.originName = 'ws:for';
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.key = node.__$ws_key;
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
      node.children = node.__$ws_content;
      this.visitAll(node.__$ws_content, context);
   }

   // done.
   visitForeach(node: Ast.ForeachNode, context: INavigationContext): any {
      // @ts-ignore
      node.name = 'ws:for';
      // @ts-ignore
      node.originName = 'ws:for';
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.key = node.__$ws_key;
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
      node.children = node.__$ws_content;
      this.visitAll(node.__$ws_content, context);
   }

   // done.
   visitText(node: Ast.TextNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'text';
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.data = node.__$ws_content;
      const textContext = {
         isBind: false,
         isEvent: false,
         localized: false,
         noEscape: false,
         ...(context || { })
      };
      // @ts-ignore
      this.visitAll(node.__$ws_content, textContext);
   }

   // done.
   visitTextData(node: Ast.TextDataNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'text';
      // @ts-ignore
      node.value = node.__$ws_content;
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
   }

   // done.
   visitTranslation(node: Ast.TranslationNode, context: INavigationContext): any {
      // @ts-ignore
      node.localized = true;
      // @ts-ignore
      node.name = `${node.__$ws_context} @@ ${node.__$ws_text}`;
      // @ts-ignore
      node.type = 'var';
      // @ts-ignore
      node.value = undefined;
   }

   // done.
   visitAll(nodes: Ast.Ast[], context?: INavigationContext): any {
      for (let i = 0; i < nodes.length; ++i) {
         nodes[i].accept(this, context);
      }
      return nodes;
   }

   // done.
   visitTemplate(node: Ast.TemplateNode, context: INavigationContext): any {
      // @ts-ignore
      node.attribs = {
         name: node.__$ws_name
      };
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.name = 'ws:template';
      // @ts-ignore
      node.originName = 'ws:template';
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.children = node.__$ws_content;
      this.visitAll(node.__$ws_content, context);
   }

   // done.
   visitElement(node: Ast.ElementNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = getTagType(node.__$ws_name);
      // @ts-ignore
      node.name = node.__$ws_name;
      // @ts-ignore
      node.originName = node.__$ws_name;
      // @ts-ignore
      node.key = node.__$ws_key;
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
            node.attribs = {
               'for': {
                  data: {
                     type: 'text',
                     value: forData
                  },
                  key: undefined,
                  type: 'text'
               },
               CUSTOM_CONDITION: {
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
               },
               CUSTOM_ITERATOR: {
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
               },
               START_FROM: {
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
               },
            };
            return;
         }
         const forSource = node.__$ws_unpackedCycle.__$ws_index
            ? `${node.__$ws_unpackedCycle.__$ws_index.string}, ${node.__$ws_unpackedCycle.__$ws_iterator.string} in ${node.__$ws_unpackedCycle.__$ws_collection.string}`
            : `${node.__$ws_unpackedCycle.__$ws_iterator.string} in ${node.__$ws_unpackedCycle.__$ws_collection.string}`;
         // @ts-ignore
         node.attribs = {
            'for': {
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
            key: node.__$ws_unpackedCycle.__$ws_index ? node.__$ws_unpackedCycle.__$ws_index.string : undefined,
            value: node.__$ws_unpackedCycle.__$ws_iterator.string,
            main: node.__$ws_unpackedCycle.__$ws_collection
         };
      }
      // @ts-ignore
      node.children = node.__$ws_content;
      this.visitAll(node.__$ws_content, context);
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
      // @ts-ignore
      node.data = node.__$ws_value;
      // @ts-ignore
      node.key = undefined;
      // @ts-ignore
      node.type = 'text';
      this.visitAll(node.__$ws_value, attributeContext);
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
   }

   // done.
   visitIf(node: Ast.IfNode, context: INavigationContext): any {
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
      node.children = node.__$ws_consequent;
      // @ts-ignore
      node.name = 'ws:if';
      // @ts-ignore
      node.originName = 'ws:if';
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.type = 'tag';
      this.visitAll(node.__$ws_consequent, context);
   }

   // done.
   visitElse(node: Ast.ElseNode, context: INavigationContext): any {
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
      node.children = node.__$ws_consequent;
      // @ts-ignore
      node.name = 'ws:else';
      // @ts-ignore
      node.originName = 'ws:else';
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.type = 'tag';
      this.visitAll(node.__$ws_consequent, context);
   }

   // done.
   visitOption(node: Ast.OptionNode, context: INavigationContext): any {
      // @ts-ignore
      node.attribs = undefined;
      // @ts-ignore
      node.children = [
         node.__$ws_value
      ];
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.name = `ws:${node.__$ws_name}`;
      // @ts-ignore
      node.originName = `ws:${node.__$ws_name}`;
      // @ts-ignore
      node.type = 'tag';
      node.__$ws_value.accept(this, context);
   }

   // done.
   visitContentOption(node: Ast.ContentOptionNode, context: INavigationContext): any {
      // @ts-ignore
      node.attribs = undefined;
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.name = `ws:${node.__$ws_name}`;
      // @ts-ignore
      node.originName = `ws:${node.__$ws_name}`;
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.children = node.__$ws_content;
      this.visitAll(node.__$ws_content, context);
   }

   // done.
   visitComponent(node: Ast.ComponentNode, context: INavigationContext): any {
      let name;
      let originName;
      // @ts-ignore
      node.attribs = this.collectComponentAttributes(node, context);
      if (node.__$ws_logicalPath.length > 0) {
         // module
         const library = node.__$ws_physicalPath.join('/');
         const module = node.__$ws_logicalPath.join('.');
         const constructor = [library, module].join(':');
         // @ts-ignore
         node.children = [{
            constructor,
            key: undefined,
            library,
            module: node.__$ws_logicalPath,
            type: 'module'
         }];
         // @ts-ignore
         node.attribs._wstemplatename = constructor;
         name = `ws:${constructor}`;
         originName = [node.__$ws_physicalPath.join('.'), module].join(':');
      } else {
         // control
         const constructor = node.__$ws_physicalPath.join('/');
         // @ts-ignore
         node.children = [{
            constructor,
            fn: constructor,
            key: undefined,
            optional: undefined,
            type: 'control'
         }];
         // @ts-ignore
         node.attribs._wstemplatename = constructor;
         name = `ws:${constructor}`;
         originName = node.__$ws_physicalPath.join('.');
      }
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.name = name;
      // @ts-ignore
      node.originName = originName;
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.injectedData = this.collectContents(node, context);
   }

   // done.
   visitArray(node: Ast.ArrayNode, context: INavigationContext): any {
      // @ts-ignore
      node.attribs = undefined;
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.name = `ws:Array`;
      // @ts-ignore
      node.originName = `ws:Array`;
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.children = node.__$ws_elements;
      this.visitAll(node.__$ws_elements, context);
   }

   // done.
   visitBoolean(node: Ast.BooleanNode, context: INavigationContext): any {
      // @ts-ignore
      node.attribs = undefined;
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.name = `ws:Boolean`;
      // @ts-ignore
      node.originName = `ws:Boolean`;
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.children = node.__$ws_data;
      this.visitAll(node.__$ws_data, context);
   }

   // done.
   visitNumber(node: Ast.NumberNode, context: INavigationContext): any {
      // @ts-ignore
      node.attribs = undefined;
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.name = `ws:Number`;
      // @ts-ignore
      node.originName = `ws:Number`;
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.children = node.__$ws_data;
      this.visitAll(node.__$ws_data, context);
   }

   // done.
   visitString(node: Ast.StringNode, context: INavigationContext): any {
      // @ts-ignore
      node.attribs = undefined;
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.name = `ws:String`;
      // @ts-ignore
      node.originName = `ws:String`;
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.children = node.__$ws_data;
      this.visitAll(node.__$ws_data, context);
   }

   // done.
   visitValue(node: Ast.ValueNode, context: INavigationContext): any {
      // @ts-ignore
      node.attribs = undefined;
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.name = `ws:Value`;
      // @ts-ignore
      node.originName = `ws:Value`;
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.children = node.__$ws_data;
      this.visitAll(node.__$ws_data, context);
   }

   // done.
   visitObject(node: Ast.ObjectNode, context: INavigationContext): any {
      // @ts-ignore
      node.attribs = undefined;
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.name = `ws:Object`;
      // @ts-ignore
      node.originName = `ws:Object`;
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.children = this.collectObjectProperties(node, context);
   }

   // done.
   visitInlineTemplate(node: Ast.InlineTemplateNode, context: INavigationContext): any {
      const attributes = this.collectComponentAttributes(node, context);
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
      node.key = node.__$ws_key;
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
   }

   visitStaticPartial(node: Ast.StaticPartialNode, context: INavigationContext): any {
      const attributes = this.collectComponentAttributes(node, context);
      // @ts-ignore
      node.attribs = {
         ...attributes
      };
      // @ts-ignore
      node.children = [{

      }];
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.name = `ws:partial`;
      // @ts-ignore
      node.originName = `ws:partial`;
      // @ts-ignore
      node.type = 'tag';
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
      node.key = node.__$ws_key;
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
   }

   // done.
   visitFunction(node: Ast.FunctionNode, context: INavigationContext): any {
      const options = { };
      for (const optionName in node.__$ws_options) {
         (<Ast.ValueNode>node.__$ws_options[optionName].__$ws_value).accept(this, context);
         options[optionName] = {
            data: (<Ast.ValueNode>node.__$ws_options[optionName].__$ws_value).__$ws_data,
            key: undefined,
            type: 'text'
         };
      }
      const path = node.__$ws_physicalPath.join('/') + ':' + node.__$ws_logicalPath.join('.');
      // @ts-ignore
      node.attribs = Object.keys(options).length > 0 ? options : undefined;
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.name = `ws:Function`;
      // @ts-ignore
      node.originName = `ws:Function`;
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.children = [{
         data: {
            type: 'text',
            value: path
         },
         key: node.__$ws_key + '0_',
         type: 'text'
      }];
   }

   // done.
   private collectAttributes(node: Ast.BaseHtmlElement, context: INavigationContext, removePrefix: boolean = false): any {
      const attributes = { };
      for (const attributeName in node.__$ws_attributes) {
         // rm prefix for elements only
         const cleanName = attributeName.replace('attr:', '');
         const name = removePrefix ? cleanName : attributeName;
         node.__$ws_attributes[attributeName].accept(this, context);
         attributes[name] = node.__$ws_attributes[attributeName];
      }
      for (const eventName in node.__$ws_events) {
         node.__$ws_events[eventName].accept(this, context);
         attributes[eventName] = node.__$ws_events[eventName];
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
         node.__$ws_options[optionName].accept(this, context);
         const dataArray = (<Ast.ValueNode>node.__$ws_options[optionName].__$ws_value).__$ws_data;
         const isTextOnly = dataArray.length === 1 && (dataArray[0] instanceof Ast.TextDataNode);
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
         option.accept(this, context);
         injectedData.push(option);
      }
      for (const optionName in node.__$ws_contents) {
         node.__$ws_contents[optionName].accept(this, context);
         injectedData.push(node.__$ws_contents[optionName]);
      }
      return injectedData;
   }

   // done.
   private collectObjectProperties(node: Ast.ObjectNode): any {
      const injectedData = [];
      for (const optionName in node.__$ws_properties) {
         node.__$ws_properties[optionName].accept(this, context);
         injectedData.push(node.__$ws_properties[optionName]);
      }
      return injectedData;
   }
}

export default function patch(nodes: Ast.Ast[], scope: Scope): Ast.Ast[] {
   const visitor = new PatchVisitor();
   const context: INavigationContext = {
      scope,
      parent: null
   };
   return visitor.visitAll(nodes, context);
}
