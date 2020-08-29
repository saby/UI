/// <amd-module name="UI/_builder/Tmpl/core/PatchVisitor" />

/**
 * @author Крылов М.А.
 *
 * Данный посетитель выполняет плохой патч дерева wasaby
 * для поддержания совместимости между wasaby-парсерами.
 * Удалить после реализации остальных фаз анализа и синтеза.
 */

import * as Ast from './Ast';

interface INavigationContext {
   parent: Ast.Ast | null;
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
      // @ts-ignore
      node.key = node.__$ws_key;
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
      node.key = node.__$ws_key;
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
      node.key = node.__$ws_key;
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
         ? `${node.__$ws_index}, ${node.__$ws_iterator} in ${node.__$ws_collection.string}`
         : `${node.__$ws_iterator} in ${node.__$ws_collection.string}`;
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
         key: node.__$ws_index,
         value: node.__$ws_iterator,
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
      node.key = node.__$ws_key;
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
      node.key = node.__$ws_key;
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
      node.key = node.__$ws_key;
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
      node.children = node.__$ws_content;
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.name = 'ws:template';
      // @ts-ignore
      node.originName = 'ws:template';
      // @ts-ignore
      node.type = 'tag';
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
      // @ts-ignore
      node.children = node.__$ws_content;
      const attribs = this.collectAttributes(node, context);
      // @ts-ignore
      node.attribs = Object.keys(attribs).length === 0 ? undefined : attribs;
      this.visitAll(node.__$ws_content, context);
   }

   // done.
   visitAttribute(node: Ast.AttributeNode, context: INavigationContext): any {
      const attributeContext = {
         isBind: false,
         isEvent: false,
         localized: false,
         noEscape: false,
         ...(context || { })
      };
      node.__$ws_value.forEach((n) => {
         n.accept(this, attributeContext);
      });
      // @ts-ignore
      node.data = node.__$ws_value;
      // @ts-ignore
      node.key = undefined;
      // @ts-ignore
      node.type = 'text';
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
      node.attribs = { };
      // @ts-ignore
      node.children = [
         node.__$ws_value
      ];
      node.__$ws_value.accept(this, context);
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.name = `ws:${node.__$ws_name}`;
      // @ts-ignore
      node.originName = `ws:${node.__$ws_name}`;
      // @ts-ignore
      node.type = 'tag';
   }

   // done.
   visitContentOption(node: Ast.ContentOptionNode, context: INavigationContext): any {
      // @ts-ignore
      node.attribs = { };
      // @ts-ignore
      node.children = node.__$ws_content;
      this.visitAll(node.__$ws_content, context);
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.name = `ws:${node.__$ws_name}`;
      // @ts-ignore
      node.originName = `ws:${node.__$ws_name}`;
      // @ts-ignore
      node.type = 'tag';
   }

   // done.
   visitComponent(node: Ast.ComponentNode, context: INavigationContext): any {
      let name;
      let originName;
      const attribs = this.collectAttributes(node, context);
      // @ts-ignore
      node.attribs = Object.keys(attribs).length === 0 ? undefined : attribs;
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
         node.attribs._wstemplatename = '';
         name = `ws:${constructor}`;
         originName = node.__$ws_physicalPath.join('.');
      }
      // @ts-ignore
      node.injectedData = this.collectContents(node, context);
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.name = name;
      // @ts-ignore
      node.originName = originName;
      // @ts-ignore
      node.type = 'tag';
   }

   // done.
   visitArray(node: Ast.ArrayNode, context: INavigationContext): any {
      // @ts-ignore
      node.attribs = { };
      // @ts-ignore
      node.children = node.__$ws_elements;
      this.visitAll(node.__$ws_elements, context);
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.name = `ws:Array`;
      // @ts-ignore
      node.originName = `ws:Array`;
      // @ts-ignore
      node.type = 'tag';
   }

   // done.
   visitBoolean(node: Ast.BooleanNode, context: INavigationContext): any {
      // @ts-ignore
      node.attribs = { };
      // @ts-ignore
      node.children = node.__$ws_data;
      this.visitAll(node.__$ws_data, context);
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.name = `ws:Boolean`;
      // @ts-ignore
      node.originName = `ws:Boolean`;
      // @ts-ignore
      node.type = 'tag';
   }

   // done.
   visitNumber(node: Ast.NumberNode, context: INavigationContext): any {
      // @ts-ignore
      node.attribs = { };
      // @ts-ignore
      node.children = node.__$ws_data;
      this.visitAll(node.__$ws_data, context);
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.name = `ws:Number`;
      // @ts-ignore
      node.originName = `ws:Number`;
      // @ts-ignore
      node.type = 'tag';
   }

   // done.
   visitString(node: Ast.StringNode, context: INavigationContext): any {
      // @ts-ignore
      node.attribs = { };
      // @ts-ignore
      node.children = node.__$ws_data;
      this.visitAll(node.__$ws_data, context);
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.name = `ws:String`;
      // @ts-ignore
      node.originName = `ws:String`;
      // @ts-ignore
      node.type = 'tag';
   }

   // done.
   visitValue(node: Ast.ValueNode, context: INavigationContext): any {
      // @ts-ignore
      node.attribs = { };
      // @ts-ignore
      node.children = node.__$ws_data;
      this.visitAll(node.__$ws_data, context);
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.name = `ws:Value`;
      // @ts-ignore
      node.originName = `ws:Value`;
      // @ts-ignore
      node.type = 'tag';
   }

   // done.
   visitObject(node: Ast.ObjectNode, context: INavigationContext): any {
      // @ts-ignore
      node.attribs = { };
      // @ts-ignore
      node.children = this.collectObjectProperties(node, context);
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.name = `ws:Object`;
      // @ts-ignore
      node.originName = `ws:Object`;
      // @ts-ignore
      node.type = 'tag';
   }

   visitPartial(node: Ast.PartialNode, context: INavigationContext): any {
      // @ts-ignore
      node.attribs = { };
      // @ts-ignore
      node.children = [];
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.name = `ws:partial`;
      // @ts-ignore
      node.originName = `ws:partial`;
      // @ts-ignore
      node.type = 'tag';
   }

   visitFunction(node: Ast.FunctionNode, context: INavigationContext): any {
      // @ts-ignore
      node.attribs = { };
      // @ts-ignore
      node.children = [];
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.name = `ws:Function`;
      // @ts-ignore
      node.originName = `ws:Function`;
      // @ts-ignore
      node.type = 'tag';
   }

   // done.
   private collectAttributes(node: Ast.BaseHtmlElement, context: INavigationContext): any {
      const attributes = { };
      for (const attributeName in node.__$ws_attributes) {
         node.__$ws_attributes[attributeName].accept(this, context);
         attributes[attributeName] = node.__$ws_attributes[attributeName];
      }
      for (const eventName in node.__$ws_events) {
         node.__$ws_events[eventName].accept(this, context);
         attributes[eventName] = node.__$ws_events[eventName];
      }
      return attributes;
   }

   // done.
   private collectContents(node: Ast.BaseWasabyElement, context: INavigationContext): any {
      const injectedData = [];
      for (const optionName in node.__$ws_options) {
         node.__$ws_options[optionName].accept(this, context);
         injectedData.push(node.__$ws_options[optionName]);
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

export default function patch(nodes: Ast.Ast[]): Ast.Ast[] {
   const visitor = new PatchVisitor();
   const context = { };
   return nodes.map(
      (node: Ast.Ast) => node.accept(visitor, context)
   );
}
