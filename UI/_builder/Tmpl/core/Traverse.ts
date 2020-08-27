/// <amd-module name="UI/_builder/Tmpl/core/Traverse" />

/**
 * @author Крылов М.А.
 */

import * as Nodes from 'UI/_builder/Tmpl/html/Nodes';
import * as Ast from 'UI/_builder/Tmpl/core/Ast';
import * as Names from 'UI/_builder/Tmpl/core/Names';
import { isElementNode } from 'UI/_builder/Tmpl/core/Html';
import { IParser } from '../expressions/_private/Parser';
import { processTextData, cleanMustacheExpression } from './TextProcessor';
import { IKeysGenerator, createKeysGenerator } from './KeysGenerator';
import { resolveComponent } from 'UI/_builder/Tmpl/core/Resolvers';
import { IErrorHandler } from '../utils/ErrorHandler';
import Scope from './Scope';

const enum TraverseState {
   MARKUP,
   COMPONENT,
   COMPONENT_OPTION,
   ARRAY_DATA,
   PRIMITIVE_DATA,
   OBJECT_DATA
}

const enum ContentTraverseState {
   UNKNOWN,
   CONTENT,
   OPTION
}

export interface ITraverseOptions {
   expressionParser: IParser;
   hierarchicalKeys: boolean;
   errorHandler: IErrorHandler;
   allowComments: boolean;
   scope: Scope;
}

interface IAttributesCollection {
   attributes: Ast.IAttributes;
   options: Ast.IOptions;
   events: Ast.IEvents;
}

interface IFilteredAttributes {
   [name: string]: Nodes.Attribute;
}

interface ITraverseContext {
   componentOptionName?: string;
   component?: Ast.ComponentNode | null;
   contentComponentState?: ContentTraverseState;
   prev: Ast.Ast | null;
   fileName: string;
}

function validateElseNode(prev: Ast.Ast | null) {
   if (prev instanceof Ast.IfNode) {
      return;
   }
   if (prev instanceof Ast.ElseNode) {
      if (prev.__$ws_test === null) {
         throw new Error(
            'Ожидалось, что директива ws:else следует за директивной ws:else, на котором задан атрибут data'
         );
      }
      return;
   }
   throw new Error('Ожидалось, что директива ws:else следует за директивной ws:if или ws:else с атрибутом data');
}

class Traverse implements Nodes.INodeVisitor {
   private readonly stateStack: TraverseState[];
   private readonly expressionParser: IParser;
   private readonly keysGenerator: IKeysGenerator;
   private readonly errorHandler: IErrorHandler;
   private readonly allowComments: boolean;
   private readonly scope: Scope;

   constructor(options: ITraverseOptions) {
      this.stateStack = [];
      this.expressionParser = options.expressionParser;
      this.keysGenerator = createKeysGenerator(options.hierarchicalKeys);
      this.errorHandler = options.errorHandler;
      this.allowComments = options.allowComments;
      this.scope = options.scope;
   }

   visitComment(node: Nodes.Comment, context: ITraverseContext): Ast.CommentNode {
      if (this.allowComments) {
         return new Ast.CommentNode(node.data);
      }
      return null;
   }

   visitCData(node: Nodes.CData, context: ITraverseContext): Ast.CDataNode {
      const state = this.getCurrentState();
      switch (state) {
         case TraverseState.MARKUP:
         case TraverseState.COMPONENT:
         case TraverseState.COMPONENT_OPTION:
            return new Ast.CDataNode(node.data);
         default:
            this.errorHandler.error('Использование тега CData запрещено в данном контексте', {
               fileName: context.fileName,
               position: node.position
            });
            return null;
      }
   }

   visitDoctype(node: Nodes.Doctype, context: ITraverseContext): Ast.DoctypeNode {
      const state = this.getCurrentState();
      switch (state) {
         case TraverseState.MARKUP:
         case TraverseState.COMPONENT:
         case TraverseState.COMPONENT_OPTION:
            return new Ast.DoctypeNode(node.data);
         default:
            this.errorHandler.error('Использование тега Doctype запрещено в данном контексте', {
               fileName: context.fileName,
               position: node.position
            });
            return null;
      }
   }

   visitInstruction(node: Nodes.Instruction, context: ITraverseContext): Ast.InstructionNode {
      const state = this.getCurrentState();
      switch (state) {
         case TraverseState.MARKUP:
         case TraverseState.COMPONENT:
         case TraverseState.COMPONENT_OPTION:
            return new Ast.InstructionNode(node.data);
         default:
            this.errorHandler.error('Использование тега Instruction запрещено в данном контексте', {
               fileName: context.fileName,
               position: node.position
            });
            return null;
      }
   }

   visitTag(node: Nodes.Tag, context: ITraverseContext): Ast.Ast {
      const state = this.getCurrentState();
      switch (state) {
         case TraverseState.MARKUP:
            return this.processTagInMarkup(node, context);
         case TraverseState.COMPONENT:
            return this.processTagInComponent(node, context);
         case TraverseState.COMPONENT_OPTION:
            return this.processTagInComponentOption(node, context);
         case TraverseState.ARRAY_DATA:
            return this.processTagInArrayData(node, context);
         case TraverseState.PRIMITIVE_DATA:
            return this.processTagInPrimitiveData(node, context);
         case TraverseState.OBJECT_DATA:
            return this.processTagInObjectData(node, context);
         default:
            this.errorHandler.critical('Конечный автомат traverse находится в неизвестном состоянии', {
               fileName: context.fileName,
               position: node.position
            });
            return null;
      }
   }

   visitText(node: Nodes.Text, context: ITraverseContext): Ast.TextNode {
      try {
         const content = processTextData(node.data, this.expressionParser);
         this.keysGenerator.openChildren();
         for (let index = 0; index < content.length; ++index) {
            content[index].__$ws_key = this.keysGenerator.generate();
         }
         this.keysGenerator.closeChildren();
         return new Ast.TextNode(content);
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора текста "${node.data}": ${error.message}. Текст будет отброшен`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   transform(nodes: Nodes.Node[], fileName: string): Ast.Ast[] {
      const context: ITraverseContext = {
         prev: null,
         fileName
      };
      this.stateStack.push(TraverseState.MARKUP);
      const tree = this.visitAll(nodes, context);
      this.stateStack.pop();
      if (this.stateStack.length !== 0) {
         this.errorHandler.critical('Конечный автомат traverse не вернулся в начальное состояние', {
            fileName
         });
      }
      this.removeUnusedTemplates(context);
      return tree;
   }

   visitAll(nodes: Nodes.Node[], context: ITraverseContext): Ast.Ast[] {
      const children: Ast.Ast[] = [];
      const childContext: ITraverseContext = {
         ...context
      };
      this.keysGenerator.openChildren();
      for (let index = 0; index < nodes.length; ++index) {
         childContext.prev = children[children.length - 1] || null;
         const child = <Ast.Ast>nodes[index].accept(this, childContext);
         if (child) {
            child.__$ws_key = this.keysGenerator.generate();
            children.push(child);
         }
      }
      this.keysGenerator.closeChildren();
      return children;
   }

   private removeUnusedTemplates(context: ITraverseContext): void {
      const templates = this.scope.getTemplateNames();
      for (let index = 0; index < templates.length; ++index) {
         const name = templates[index];
         const template = this.scope.getTemplate(name);
         if (template.usages === 0) {
            this.errorHandler.warn(
               `Шаблон с именем ${name} определен, но не был использован. Шаблон будет отброшен`,
               {
                  fileName: context.fileName
               }
            );
            this.scope.removeTemplate(name);
         }
      }
   }

   private getCurrentState(): TraverseState {
      return this.stateStack[this.stateStack.length - 1];
   }

   private processTagInMarkup(node: Nodes.Tag, context: ITraverseContext): any {
      switch (node.name) {
         case 'ws:if':
            return this.processIf(node, context);
         case 'ws:else':
            return this.processElse(node, context);
         case 'ws:for':
            return this.processCycle(node, context);
         case 'ws:template':
            return this.processTemplate(node, context);
         case 'ws:partial':
            return this.processPartial(node, context);
         case 'ws:Array':
         case 'ws:Boolean':
         case 'ws:Function':
         case 'ws:Number':
         case 'ws:Object':
         case 'ws:String':
         case 'ws:Value':
            this.errorHandler.error(
               `Использование директивы ${node.name} вне описания опции запрещено. Директива будет отброшена`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
         default:
            if (Names.isComponentOptionName(node.name)) {
               this.errorHandler.error(
                  `Обнаружена неизвестная директива ${node.name}. Директива будет отброшена`,
                  {
                     fileName: context.fileName,
                     position: node.position
                  }
               );
               return null;
            }
            if (Names.isComponentName(node.name)) {
               return this.processComponent(node, context);
            }
            if (isElementNode(node.name)) {
               return this.processElement(node, context);
            }
            this.errorHandler.error(
               `Обнаружен неизвестный HTML тег ${node.name}. Тег будет отброшен`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
      }
   }

   private processTagInComponent(node: Nodes.Tag, context: ITraverseContext): any {
      switch (node.name) {
         case 'ws:if':
         case 'ws:else':
         case 'ws:for':
         case 'ws:partial':
            return this.processComponentContent(node, context);
         case 'ws:template':
            return this.processComponentOption(node, context);
         case 'ws:Array':
         case 'ws:Boolean':
         case 'ws:Function':
         case 'ws:Number':
         case 'ws:Object':
         case 'ws:String':
         case 'ws:Value':
            this.errorHandler.error(
               `Использование директивы ${node.name} вне описания опции запрещено. Директива будет отброшена`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
         default:
            if (Names.isComponentOptionName(node.name)) {
               return this.processComponentOption(node, context);
            }
            if (Names.isComponentName(node.name) || isElementNode(node.name)) {
               return this.processComponentContent(node, context);
            }
            this.errorHandler.error(
               `Обнаружен неизвестный HTML тег ${node.name}. Тег будет отброшен`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
      }
   }

   private processComponentContent(node: Nodes.Tag, context: ITraverseContext, contentName: string = 'content'): any {
      if (context.contentComponentState === ContentTraverseState.UNKNOWN) {
         context.contentComponentState = ContentTraverseState.CONTENT;
      }
      if (context.contentComponentState !== ContentTraverseState.CONTENT) {
         this.errorHandler.error(
            `Запрещено смешивать контент по умолчанию с опциями - обнаружен тег ${node.name}. Тег будет отброшен. ` +
            'Необходимо явно задать контент в ws:content',
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
      const ast = this.processTagInMarkup(node, context);
      if (ast instanceof Ast.OptionNode || ast instanceof Ast.ContentOptionNode) {
         this.errorHandler.critical(
            `Получен некорректный тип узла (Option|ContentOption) при обработке узла ${node.name}`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
      }
      // TODO: убрать, делать возврат и обработку
      context.component.appendToContent(contentName, ast);
      return ast;
   }

   private processTagInComponentOption(node: Nodes.Tag, context: ITraverseContext): any {
      switch (node.name) {
         case 'ws:if':
         case 'ws:else':
         case 'ws:for':
         case 'ws:partial':
            return this.processComponentContent(node, context, context.componentOptionName);
         case 'ws:template':
            // TODO: object property
         case 'ws:Array':
         case 'ws:Boolean':
         case 'ws:Function':
         case 'ws:Number':
         case 'ws:Object':
         case 'ws:String':
         case 'ws:Value':
            // TODO: data types
         default:
            if (Names.isComponentOptionName(node.name)) {
               // TODO: object property
               throw new Error('Not implemented');
            }
            if (Names.isComponentName(node.name) || isElementNode(node.name)) {
               return this.processComponentContent(node, context, context.componentOptionName);
            }
            this.errorHandler.error(
               `Обнаружен неизвестный HTML тег ${node.name}. Тег будет отброшен`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
      }
   }

   private processTagInArrayData(node: Nodes.Tag, context: ITraverseContext): any {
      switch (node.name) {
         case 'ws:if':
         case 'ws:else':
         case 'ws:for':
         case 'ws:template':
         case 'ws:partial':
         case 'ws:Array':
         case 'ws:Boolean':
         case 'ws:Function':
         case 'ws:Number':
         case 'ws:Object':
         case 'ws:String':
         case 'ws:Value':
         default:
            if (Names.isComponentOptionName(node.name)) {
               // ws:*
               throw new Error('Not implemented');
            }
            if (Names.isComponentName(node.name)) {
               throw new Error('Not implemented');
            }
            if (isElementNode(node.name)) {
               throw new Error('Not implemented');
            }
            // unknown node
            throw new Error('Unknown node');
      }
   }

   private processTagInPrimitiveData(node: Nodes.Tag, context: ITraverseContext): any {
      switch (node.name) {
         case 'ws:if':
         case 'ws:else':
         case 'ws:for':
         case 'ws:template':
         case 'ws:partial':
         case 'ws:Array':
         case 'ws:Boolean':
         case 'ws:Function':
         case 'ws:Number':
         case 'ws:Object':
         case 'ws:String':
         case 'ws:Value':
         default:
            if (Names.isComponentOptionName(node.name)) {
               // ws:*
               throw new Error('Not implemented');
            }
            if (Names.isComponentName(node.name)) {
               throw new Error('Not implemented');
            }
            if (isElementNode(node.name)) {
               throw new Error('Not implemented');
            }
            // unknown node
            throw new Error('Unknown node');
      }
   }

   private processTagInObjectData(node: Nodes.Tag, context: ITraverseContext): any {
      switch (node.name) {
         case 'ws:if':
         case 'ws:else':
         case 'ws:for':
         case 'ws:template':
         case 'ws:partial':
         case 'ws:Array':
         case 'ws:Boolean':
         case 'ws:Function':
         case 'ws:Number':
         case 'ws:Object':
         case 'ws:String':
         case 'ws:Value':
         default:
            if (Names.isComponentOptionName(node.name)) {
               // ws:*
               throw new Error('Not implemented');
            }
            if (Names.isComponentName(node.name)) {
               throw new Error('Not implemented');
            }
            if (isElementNode(node.name)) {
               throw new Error('Not implemented');
            }
            // unknown node
            throw new Error('Unknown node');
      }
   }

   private processIf(node: Nodes.Tag, context: ITraverseContext): any {
      try {
         this.stateStack.push(TraverseState.MARKUP);
         const data = cleanMustacheExpression(this.getDataNode(node, 'data', context));
         const test = this.expressionParser.parse(data);
         const ast = new Ast.IfNode(test);
         ast.__$ws_consequent = <Ast.TContent[]>this.visitAll(node.children, context);
         return ast;
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора директивы ws:if: ${error.message}. Директива будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      } finally {
         this.stateStack.pop();
      }
   }

   private processElse(node: Nodes.Tag, context: ITraverseContext): any {
      try {
         this.stateStack.push(TraverseState.MARKUP);
         const ast = new Ast.ElseNode();
         validateElseNode(context.prev);
         if (node.attributes.hasOwnProperty('data')) {
            const dataStr = cleanMustacheExpression(node.attributes.data.value);
            ast.__$ws_test = this.expressionParser.parse(dataStr);
         }
         ast.__$ws_consequent = <Ast.TContent[]>this.visitAll(node.children, context);
         return ast;
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора директивы ws:else: ${error.message}. Директива будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      } finally {
         this.stateStack.pop();
      }
   }

   private processCycle(node: Nodes.Tag, context: ITraverseContext): any {
      try {
         const data = this.getDataNode(node, 'data', context);
         if (data.indexOf(';') > -1) {
            return this.processFor(node, context, data);
         }
         return this.processForeach(node, context, data);
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора директивы ws:for: ${error.message}. Директива будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   private processFor(node: Nodes.Tag, context: ITraverseContext, data: string): any {
      try {
         this.stateStack.push(TraverseState.MARKUP);
         const [initStr, testStr, updateStr] = data.split(';').map(s => s.trim());
         const init = initStr ? this.expressionParser.parse(initStr) : null;
         const test = this.expressionParser.parse(testStr);
         const update = updateStr ? this.expressionParser.parse(updateStr) : null;
         const ast = new Ast.ForNode(init, test, update);
         ast.__$ws_content = <Ast.TContent[]>this.visitAll(node.children, context);
         return ast;
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора директивы ws:for: ${error.message}. Директива будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      } finally {
         this.stateStack.pop();
      }
   }

   private processForeach(node: Nodes.Tag, context: ITraverseContext, data: string): any {
      try {
         this.stateStack.push(TraverseState.MARKUP);
         const [left, right] = data.split(' in ');
         const collection = this.expressionParser.parse(right);
         const variables = left.split(',').map(s => s.trim());
         const iterator = variables.pop();
         const index = variables.length == 1 ? variables.pop() : null;
         const ast = new Ast.ForeachNode(index, iterator, collection);
         ast.__$ws_content = <Ast.TContent[]>this.visitAll(node.children, context);
         return ast;
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора директивы ws:for: ${error.message}. Директива будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      } finally {
         this.stateStack.pop();
      }
   }

   private processTemplate(node: Nodes.Tag, context: ITraverseContext): any {
      try {
         this.stateStack.push(TraverseState.MARKUP);
         const templateName = this.getDataNode(node, 'name', context);
         Names.validateTemplateName(templateName);
         const ast = new Ast.TemplateNode(templateName);
         const content = <Ast.TContent[]>this.visitAll(node.children, context);
         if (content.length === 0) {
            this.errorHandler.error(
               `Содержимое директивы ws:template не должно быть пустым`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
         }
         ast.__$ws_content = content;
         this.scope.registerTemplate(templateName, ast);
         return ast;
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора директивы ws:template: ${error.message}. Директива будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      } finally {
         this.stateStack.pop();
      }
   }

   private processPartial(node: Nodes.Tag, context: ITraverseContext): any {
      throw new Error('Not implemented');
      // TODO: в атрибутах есть обязательный template
      //  Создаем узел, парсим данные, переходим к детям
   }

   private processComponentOption(node: Nodes.Tag, context: ITraverseContext): any {
      if (context.contentComponentState === ContentTraverseState.UNKNOWN) {
         context.contentComponentState = ContentTraverseState.OPTION;
      }
      if (context.contentComponentState !== ContentTraverseState.OPTION) {
         this.errorHandler.error(
            `Запрещено смешивать контент по умолчанию с опциями - встречена опция ${node.name}. ` +
            'Необходимо явно задать контент в ws:content',
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
      try {
         this.stateStack.push(TraverseState.COMPONENT_OPTION);
         const optionContext: ITraverseContext = {
            ...context,
            componentOptionName: Names.getComponentOptionName(node.name),
            contentComponentState: ContentTraverseState.UNKNOWN
         };
         for (const name in node.attributes) {
            this.errorHandler.warn(
               `Обнаружен непредусмотренный атрибут ${name} на контентной опции. Атрибут будет отброшен`,
               {
                  fileName: context.fileName,
                  position: node.attributes[name].position
               }
            )
         }
         // TODO: добавить обработку полученных узлов
         const children = this.visitAll(node.children, optionContext);
         if (Ast.isTypeofContent(children[0])) {
            return new Ast.ContentOptionNode(node.name, <Ast.TContent[]>children);
         }
         return null;
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора опции ${node.name}: ${error.message}. Опция будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      } finally {
         this.stateStack.pop();
      }
   }

   private processComponent(node: Nodes.Tag, context: ITraverseContext): any {
      try {
         this.stateStack.push(TraverseState.COMPONENT);
         const { library, module } = resolveComponent(node.name);
         const ast = new Ast.ComponentNode(library, module);
         const attributes = this.visitAttributes(node.attributes, false);
         ast.__$ws_attributes = attributes.attributes;
         ast.__$ws_events = attributes.events;
         ast.__$ws_options = attributes.options;
         const childrenContext: ITraverseContext = {
            ...context,
            component: ast,
            contentComponentState: ContentTraverseState.UNKNOWN
         };
         const children = this.visitAll(node.children, childrenContext);
         for (let index = 0; index < children.length; ++index) {
            const child = children[index];
            if (child instanceof Ast.OptionNode) {
               // TODO: 111
            } else if (child instanceof Ast.ContentOptionNode) {
               // TODO: 222
            } else {
               this.errorHandler.critical(
                  `Получен некорректный узел (!=Option|ContentOption) внутри компонента ${node.name}`,
                  {
                     fileName: context.fileName,
                     position: node.position
                  }
               );
            }
         }
         return ast;
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора компонента: ${error.message}. Компонент будет отброшен`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      } finally {
         this.stateStack.pop();
      }
   }

   private processElement(node: Nodes.Tag, context: ITraverseContext): any {
      try {
         this.stateStack.push(TraverseState.MARKUP);
         const attributes = this.visitAttributes(node.attributes, true);
         const ast = new Ast.ElementNode(node.name);
         ast.__$ws_attributes = attributes.attributes;
         ast.__$ws_events = attributes.events;
         ast.__$ws_content = <Ast.TContent[]>this.visitAll(node.children, context);
         return ast;
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора HTML тега: ${error.message}. Тег будет отброшен`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      } finally {
         this.stateStack.pop();
      }
   }

   private visitAttributes(attributes: Nodes.IAttributes, hasAttributesOnly: boolean): IAttributesCollection {
      const collection: IAttributesCollection = {
         attributes: { },
         options: { },
         events: { }
      };
      for (const attributeName in attributes) {
         if (attributes.hasOwnProperty(attributeName)) {
            const value = attributes[attributeName].value as string;
            if (Names.isBind(attributeName)) {
               const property = Names.getBindName(attributeName);
               collection.events[attributeName] = new Ast.BindNode(property, this.expressionParser.parse(value));
            } else if (Names.isEvent(attributeName)) {
               const event = Names.getEventName(attributeName);
               collection.events[attributeName] = new Ast.EventNode(event, this.expressionParser.parse(value));
            } else if (Names.isAttribute(attributeName) || hasAttributesOnly) {
               const attribute = Names.getAttributeName(attributeName);
               const processedValue = processTextData(value, this.expressionParser);
               collection.attributes[`attr:${attribute}`] = new Ast.AttributeNode(attribute, processedValue);
            } else {
               const processedValue = processTextData(value, this.expressionParser);
               const valueNode = new Ast.ValueNode(processedValue);
               collection.options[attributeName] = new Ast.OptionNode(
                  attributeName,
                  valueNode
               );
            }
         }
      }
      return collection;
   }

   private filterAttributes(node: Nodes.Tag, expected: string[], context: ITraverseContext): IFilteredAttributes {
      const collection: IFilteredAttributes = { };
      for (const attributeName in node.attributes) {
         if (node.attributes.hasOwnProperty(attributeName)) {
            if (expected.indexOf(attributeName) > -1) {
               collection[attributeName] = node.attributes[attributeName];
            } else {
               this.errorHandler.warn(
                  `Обнаружен непредусмотренный тегом "${node.name}" атрибут "${attributeName}". ` +
                  'Данный атрибут будет отброшен',
                  {
                     fileName: context.fileName,
                     position: node.position
                  }
               );
            }
         }
      }
      return collection;
   }

   private getDataNode(node: Nodes.Tag, name: string, context: ITraverseContext): string {
      const attributes = this.filterAttributes(node, [name], context);
      const data = attributes[name];
      if (data === undefined) {
         throw new Error(`Ожидался обязательный атрибут "${name}" на теге "${node.name}"`);
      }
      if (data.value === null) {
         throw new Error(`Ожидался обязательный атрибут "${name}" со значением на теге "${node.name}"`);
      }
      return data.value;
   }
}

export default function traverse(nodes: Nodes.Node[], options: ITraverseOptions, fileName: string) {
   return new Traverse(options).transform(
      nodes,
      fileName
   );
}
