/// <amd-module name="UI/_builder/Tmpl/core/Traverse" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Traverse.ts
 */

import * as Nodes from 'UI/_builder/Tmpl/html/Nodes';
import * as Ast from 'UI/_builder/Tmpl/core/Ast';
import { isElementNode } from 'UI/_builder/Tmpl/core/Html';
import { IParser } from 'UI/_builder/Tmpl/expressions/_private/Parser';
import { ProgramNode } from 'UI/_builder/Tmpl/expressions/_private/Nodes';
import { IKeysGenerator, createKeysGenerator } from 'UI/_builder/Tmpl/core/KeysGenerator';
import { IErrorHandler } from 'UI/_builder/Tmpl/utils/ErrorHandler';
import { IAttributeProcessor, createAttributeProcessor } from 'UI/_builder/Tmpl/core/Attributes';
import { ITextProcessor, cleanMustacheExpression, createTextProcessor, TextContentFlags } from 'UI/_builder/Tmpl/core/Text';
import Scope from 'UI/_builder/Tmpl/core/Scope';
import { IResolver } from 'UI/_builder/Tmpl/core/Resolvers';

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

export interface ITraverseConfig {
   expressionParser: IParser;
   hierarchicalKeys: boolean;
   errorHandler: IErrorHandler;
   allowComments: boolean;
   resolver: IResolver;
}

export interface ITraverseOptions {
   fileName: string;
   scope: Scope;
}

interface ITraverseContext {
   scope: Scope;
   fileName: string;
   prev: Ast.Ast | null;
   state: TraverseState;
   contentComponentState?: ContentTraverseState;
   textContent?: TextContentFlags;
}

function validateElseNode(prev: Ast.Ast | null) {
   if (prev instanceof Ast.IfNode) {
      return;
   }
   if (prev instanceof Ast.ElseNode) {
      if (!prev.isElif()) {
         throw new Error(
            'Ожидалось, что директива ws:else следует за директивной ws:else, на котором задан атрибут data'
         );
      }
      return;
   }
   throw new Error('Ожидалось, что директива ws:else следует за директивной ws:if или ws:else с атрибутом data');
}

function validateBoolean(children: Ast.TextNode[]): void {
   if (children.length === 0) {
      throw new Error('не задано значение');
   }
   if (children.length !== 1) {
      throw new Error('данные некорректного типа');
   }
   const data = children[0].__$ws_content;
   for (let index = 0; index < data.length; ++index) {
      const child = data[index];
      if (child instanceof Ast.TextDataNode) {
         if (child.__$ws_content !== 'true' && child.__$ws_content !== 'false') {
            throw new Error('ожидалось одно из значений - true/false');
         }
      }
      if (child instanceof Ast.TranslationNode) {
         throw new Error('использование локализации недопустимо');
      }
   }
}

function validateNumber(children: Ast.TextNode[]): void {
   if (children.length === 0) {
      throw new Error('не задано значение');
   }
   if (children.length !== 1) {
      throw new Error('данные некорректного типа');
   }
   const data = children[0].__$ws_content;
   for (let index = 0; index < data.length; ++index) {
      const child = data[index];
      if (child instanceof Ast.TextDataNode) {
         if (Number.isNaN(+child.__$ws_content)) {
            throw new Error(`получено нечисловое значение -"${child.__$ws_content}"`);
         }
      }
      if (child instanceof Ast.TranslationNode) {
         throw new Error('использование локализации недопустимо');
      }
   }
}

class Traverse implements Nodes.INodeVisitor {
   private readonly expressionParser: IParser;
   private readonly keysGenerator: IKeysGenerator;
   private readonly errorHandler: IErrorHandler;
   private readonly allowComments: boolean;
   private readonly attributeProcessor: IAttributeProcessor;
   private readonly textProcessor: ITextProcessor;
   private readonly resolver: IResolver;

   constructor(config: ITraverseConfig) {
      this.expressionParser = config.expressionParser;
      this.keysGenerator = createKeysGenerator(config.hierarchicalKeys);
      this.errorHandler = config.errorHandler;
      this.allowComments = config.allowComments;
      this.resolver = config.resolver;
      this.textProcessor = createTextProcessor({
         expressionParser: config.expressionParser
      });
      this.attributeProcessor = createAttributeProcessor({
         expressionParser: config.expressionParser,
         errorHandler: config.errorHandler,
         textProcessor: this.textProcessor
      });
   }

   visitComment(node: Nodes.Comment, context: ITraverseContext): Ast.CommentNode {
      if (this.allowComments) {
         return new Ast.CommentNode(node.data);
      }
      return null;
   }

   visitCData(node: Nodes.CData, context: ITraverseContext): Ast.CDataNode {
      switch (context.state) {
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
      switch (context.state) {
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
      switch (context.state) {
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
      switch (context.state) {
         case TraverseState.MARKUP:
            return this.processTagInMarkup(node, context);
         case TraverseState.COMPONENT:
            return this.processTagInComponent(node, context);
         case TraverseState.COMPONENT_OPTION:
            return this.processTagInComponentOption(node, context);
         case TraverseState.ARRAY_DATA:
            return this.processTagInArrayData(node, context);
         case TraverseState.PRIMITIVE_DATA:
            this.errorHandler.error(
               `Обнаружен тег "${node.name}", когда ожидалось текстовое содержимое. Тег будет отброшен`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
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
         const content = this.textProcessor.process(node.data, {
            fileName: context.fileName,
            allowedContent: context.textContent || TextContentFlags.FULL_TEXT
         }, node.position);
         this.keysGenerator.openChildren();
         for (let index = 0; index < content.length; ++index) {
            content[index].__$ws_key = this.keysGenerator.generate();
         }
         this.keysGenerator.closeChildren();
         return new Ast.TextNode(content);
      } catch (error) {
         this.errorHandler.error(
            `Ошибка обработки текста: ${error.message}. Текс будет отброшен`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   transform(nodes: Nodes.Node[], options: ITraverseOptions): Ast.Ast[] {
      const context: ITraverseContext = {
         prev: null,
         state: TraverseState.MARKUP,
         fileName: options.fileName,
         scope: options.scope
      };
      const tree = this.visitAll(nodes, context);
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
      const templates = context.scope.getTemplateNames();
      for (let index = 0; index < templates.length; ++index) {
         const name = templates[index];
         const template = context.scope.getTemplate(name);
         if (template.usages === 0) {
            this.errorHandler.warn(
               `Шаблон с именем ${name} определен, но не был использован. Шаблон будет отброшен`,
               {
                  fileName: context.fileName
               }
            );
            context.scope.removeTemplate(name);
         }
      }
   }

   private processTagInMarkup(node: Nodes.Tag, context: ITraverseContext): Ast.TContent {
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
               `Использование директивы "${node.name}" вне описания опции запрещено. Директива будет отброшена`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
         default:
            if (this.resolver.isComponentOptionName(node.name)) {
               this.errorHandler.error(
                  `Обнаружена неизвестная директива "${node.name}". Директива будет отброшена`,
                  {
                     fileName: context.fileName,
                     position: node.position
                  }
               );
               return null;
            }
            if (this.resolver.isComponentName(node.name)) {
               return this.processComponent(node, context);
            }
            if (isElementNode(node.name)) {
               return this.processElement(node, context);
            }
            this.errorHandler.error(
               `Обнаружен неизвестный HTML тег "${node.name}". Тег будет отброшен`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
      }
   }

   private processTagInComponent(node: Nodes.Tag, context: ITraverseContext): Ast.TContent | Ast.ContentOptionNode | Ast.OptionNode {
      switch (node.name) {
         case 'ws:if':
         case 'ws:else':
         case 'ws:for':
         case 'ws:partial':
            return this.processContentOption(node, context);
         case 'ws:template':
            return this.processOption(node, context);
         case 'ws:Array':
         case 'ws:Boolean':
         case 'ws:Function':
         case 'ws:Number':
         case 'ws:Object':
         case 'ws:String':
         case 'ws:Value':
            this.errorHandler.error(
               `Использование директивы "${node.name}" вне описания опции запрещено. Директива будет отброшена`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
         default:
            if (this.resolver.isComponentOptionName(node.name)) {
               return this.processOption(node, context);
            }
            if (this.resolver.isComponentName(node.name) || isElementNode(node.name)) {
               return this.processContentOption(node, context);
            }
            this.errorHandler.error(
               `Обнаружен неизвестный HTML тег "${node.name}". Тег будет отброшен`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
      }
   }

   private processTagInComponentOption(node: Nodes.Tag, context: ITraverseContext): Ast.TData | Ast.TContent | Ast.ContentOptionNode | Ast.OptionNode {
      switch (node.name) {
         case 'ws:if':
         case 'ws:else':
         case 'ws:for':
         case 'ws:partial':
            return this.processContentOption(node, context);
         case 'ws:template':
            return this.castAndProcessObjectProperty(node, context);
         case 'ws:Array':
            return this.processArray(node, context);
         case 'ws:Boolean':
            return this.processBoolean(node, context);
         case 'ws:Function':
            return this.processFunction(node, context);
         case 'ws:Number':
            return this.processNumber(node, context);
         case 'ws:Object':
            return this.processObject(node, context);
         case 'ws:String':
            return this.processString(node, context);
         case 'ws:Value':
            return this.processValue(node, context);
         default:
            if (this.resolver.isComponentOptionName(node.name)) {
               return this.castAndProcessObjectProperty(node, context);
            }
            if (this.resolver.isComponentName(node.name) || isElementNode(node.name)) {
               return this.processContentOption(node, context);
            }
            this.errorHandler.error(
               `Обнаружен неизвестный HTML тег "${node.name}". Тег будет отброшен`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
      }
   }

   private processTagInArrayData(node: Nodes.Tag, context: ITraverseContext): Ast.TData {
      switch (node.name) {
         case 'ws:Array':
            return this.processArray(node, context);
         case 'ws:Boolean':
            return this.processBoolean(node, context);
         case 'ws:Function':
            return this.processFunction(node, context);
         case 'ws:Number':
            return this.processNumber(node, context);
         case 'ws:Object':
            return this.processObject(node, context);
         case 'ws:String':
            return this.processString(node, context);
         case 'ws:Value':
            return this.processValue(node, context);
         default:
            this.errorHandler.error(
               `Обнаружен тег "${node.name}" вместо ожидаемой директивы данных. Тег будет отброшен`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
      }
   }

   private processTagInObjectData(node: Nodes.Tag, context: ITraverseContext): Ast.ContentOptionNode | Ast.OptionNode {
      if (this.resolver.isComponentOptionName(node.name)) {
         const optionContext: ITraverseContext = {
            ...context,
            contentComponentState: ContentTraverseState.UNKNOWN
         };
         return this.processOption(node, optionContext);
      }
      this.errorHandler.error(
         `Обнаружен тег "${node.name}" вместо ожидаемого тега с префиксом ws: в имени, служащий свойством ws:Object`,
         {
            fileName: context.fileName,
            position: node.position
         }
      );
      return null;
   }

   private processArray(node: Nodes.Tag, context: ITraverseContext): Ast.ArrayNode {
      try {
         const childrenContext = {
            ...context,
            state: TraverseState.ARRAY_DATA
         };
         this.warnUnexpectedAttributes(node, context);
         const elements = <Ast.TData[]>this.visitAll(node.children, childrenContext);
         return new Ast.ArrayNode(elements);
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора директивы данных ws:Array: ${error.message}. Директива будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   private processBoolean(node: Nodes.Tag, context: ITraverseContext): Ast.BooleanNode {
      try {
         const childrenContext = {
            ...context,
            state: TraverseState.PRIMITIVE_DATA,
            textContent: TextContentFlags.TEXT_AND_EXPRESSION,
            textStrictMode: true
         };
         this.warnUnexpectedAttributes(node, context);
         const children = <Ast.TextNode[]>this.visitAll(node.children, childrenContext);
         validateBoolean(children);
         return new Ast.BooleanNode(children[0].__$ws_content);
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора директивы данных ws:Boolean: ${error.message}. Директива будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   private processFunction(node: Nodes.Tag, context: ITraverseContext): Ast.FunctionNode {
      try {
         const childrenContext = {
            ...context,
            state: TraverseState.PRIMITIVE_DATA,
            textContent: TextContentFlags.TEXT,
            textStrictMode: true
         };
         const children = this.visitAll(node.children, childrenContext);
         if (children.length !== 1) {
            throw new Error('полученые некорректные данные');
         }
         const textContent = (<Ast.TextNode>children[0]).__$ws_content;
         if (textContent.length !== 1) {
            throw new Error('полученые некорректные данные');
         }
         const text = (<Ast.TextDataNode>textContent[0]).__$ws_content;
         const { physicalPath, logicalPath }  = this.resolver.resolveFunction(text);
         const ast = new Ast.FunctionNode(physicalPath, logicalPath);
         const options = this.attributeProcessor.process(
            node.attributes,
            {
               fileName: context.fileName,
               hasAttributesOnly: false,
               parentTagName: node.name
            }
         );
         this.warnIncorrectProperties(options.attributes, node, context);
         this.warnIncorrectProperties(options.events, node, context);
         ast.__ws_options = options.options;
         return ast;
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора директивы данных ws:Function: ${error.message}. Директива будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   private processNumber(node: Nodes.Tag, context: ITraverseContext): Ast.NumberNode {
      try {
         const childrenContext = {
            ...context,
            state: TraverseState.PRIMITIVE_DATA,
            textContent: TextContentFlags.TEXT_AND_EXPRESSION,
            textStrictMode: true
         };
         this.warnUnexpectedAttributes(node, context);
         const children = <Ast.TextNode[]>this.visitAll(node.children, childrenContext);
         validateNumber(children);
         return new Ast.NumberNode(children[0].__$ws_content);
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора директивы данных ws:Number: ${error.message}. Директива будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   private warnIncorrectProperties(collection: Ast.IAttributes | Ast.IEvents, parent: Nodes.Tag, context: ITraverseContext): void {
      for (const name in collection) {
         this.errorHandler.warn(
            `Обнаружен непредусмотренный атрибут "${name}" на теге "${parent.name}". Атрибут будет отброшен`,
            {
               fileName: context.fileName,
               position: parent.position
            }
         );
      }
   }

   private processObject(node: Nodes.Tag, context: ITraverseContext): Ast.ObjectNode {
      try {
         const childrenContext = {
            ...context,
            state: TraverseState.OBJECT_DATA
         };
         const attributes = this.attributeProcessor.process(node.attributes, {
            fileName: context.fileName,
            hasAttributesOnly: false,
            parentTagName: node.name
         });
         this.warnIncorrectProperties(attributes.attributes, node, context);
         this.warnIncorrectProperties(attributes.events, node, context);
         const properties: Ast.IObjectProperties = attributes.options;
         const children = this.visitAll(node.children, childrenContext);
         for (let index = 0; index < children.length; ++index) {
            const child = children[index];
            if (child instanceof Ast.OptionNode || child instanceof Ast.ContentOptionNode) {
               if (properties.hasOwnProperty(child.__$ws_name)) {
                  this.errorHandler.critical(
                     `Опция "${child.__$ws_name}" уже определена на директиве ws:Object. Полученная опция будет отброшена`,
                     {
                        fileName: context.fileName,
                        position: node.position
                     }
                  );
                  continue;
               }
               properties[child.__$ws_name] = child;
               continue;
            }
            this.errorHandler.critical(
               `Получен некорректный узел (!=Option|ContentOption) внутри компонента "${node.name}"`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
         }
         return new Ast.ObjectNode(properties);
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора директивы данных ws:Object: ${error.message}. Директива будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   private processString(node: Nodes.Tag, context: ITraverseContext): Ast.StringNode {
      try {
         const childrenContext = {
            ...context,
            state: TraverseState.PRIMITIVE_DATA,
            textStrictMode: true
         };
         this.warnUnexpectedAttributes(node, context);
         const children = <Ast.TText[]>this.visitAll(node.children, childrenContext);
         return new Ast.StringNode(children);
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора директивы данных ws:String: ${error.message}. Директива будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   private processValue(node: Nodes.Tag, context: ITraverseContext): Ast.ValueNode {
      try {
         const childrenContext = {
            ...context,
            state: TraverseState.PRIMITIVE_DATA,
            textStrictMode: true
         };
         this.warnUnexpectedAttributes(node, context);
         const children = <Ast.TText[]>this.visitAll(node.children, childrenContext);
         return new Ast.ValueNode(children);
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора директивы данных ws:Value: ${error.message}. Директива будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   private processIf(node: Nodes.Tag, context: ITraverseContext): Ast.IfNode {
      try {
         const childrenContext = {
            ...context,
            state: TraverseState.MARKUP
         };
         const dataValue = this.attributeProcessor.validateValue(node.attributes, 'data', {
            fileName: context.fileName,
            hasAttributesOnly: true,
            parentTagName: node.name
         });
         const data = cleanMustacheExpression(dataValue);
         // TODO: prepare text only content
         const test = this.expressionParser.parse(data);
         const ast = new Ast.IfNode(test);
         ast.__$ws_consequent = <Ast.TContent[]>this.visitAll(node.children, childrenContext);
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
      }
   }

   private processElse(node: Nodes.Tag, context: ITraverseContext): Ast.ElseNode {
      try {
         const childrenContext = {
            ...context,
            state: TraverseState.MARKUP
         };
         const ast = new Ast.ElseNode();
         if (node.attributes.hasOwnProperty('data')) {
            const dataStr = cleanMustacheExpression(node.attributes.data.value);
            // TODO: prepare text only content
            ast.__$ws_test = this.expressionParser.parse(dataStr);
         }
         ast.__$ws_consequent = <Ast.TContent[]>this.visitAll(node.children, childrenContext);
         validateElseNode(childrenContext.prev);
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
      }
   }

   private processCycle(node: Nodes.Tag, context: ITraverseContext): Ast.ForNode | Ast.ForeachNode {
      try {
         const data = this.attributeProcessor.validateValue(node.attributes, 'data', {
            fileName: context.fileName,
            hasAttributesOnly: true,
            parentTagName: node.name
         });
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

   private parseForData(data: string): { init: ProgramNode | null; test: ProgramNode; update: ProgramNode | null; } {
      const parameters = data.split(';').map(s => s.trim());
      if (parameters.length !== 3) {
         throw new Error(
            `цикл задан некорректно. Ожидалось соответствие шаблону "init; test; update". Получено: "${data}"`
         );
      }
      try {
         // TODO: prepare text only content
         const [initStr, testStr, updateStr] = parameters;
         const init = initStr ? this.expressionParser.parse(initStr) : null;
         const test = this.expressionParser.parse(testStr);
         const update = updateStr ? this.expressionParser.parse(updateStr) : null;
         return {
            init,
            test,
            update
         };
      } catch (error) {
         throw new Error(
            `цикл задан некорректно. Ожидалось соответствие шаблону "init; test; update". Получено: "${data}"`
         );
      }
   }

   private processFor(node: Nodes.Tag, context: ITraverseContext, data: string): Ast.ForNode {
      try {
         const childrenContext = {
            ...context,
            state: TraverseState.MARKUP
         };
         const content = <Ast.TContent[]>this.visitAll(node.children, childrenContext);
         const { init, test, update } = this.parseForData(data);
         const ast = new Ast.ForNode(init, test, update);
         ast.__$ws_content = content;
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
      }
   }

   private parseForeachData(data: string): { iterator: string; index: string | null; collection: ProgramNode; } {
      // TODO: prepare text only content
      const [left, right] = data.split(' in ');
      if (!left || !right) {
         throw new Error(
            `цикл задан некорректно. Ожидалось соответствие шаблону "[index, ] iterator in collection". Получено: "${data}"`
         );
      }
      const variables = left.split(',').map(s => s.trim());
      if (variables.length < 1 ||variables.length > 2) {
         throw new Error(
            `цикл задан некорректно. Ожидалось соответствие шаблону "[index, ] iterator in collection". Получено: "${data}"`
         );
      }
      try {
         const iterator = variables.pop();
         const index = variables.length == 1 ? variables.pop() : null;
         const collection = this.expressionParser.parse(right);
         return {
            iterator,
            index,
            collection
         };
      } catch (error) {
         throw new Error(
            `цикл задан некорректно. Ожидалось соответствие шаблону "[index, ] iterator in collection". Получено: "${data}"`
         );
      }
   }

   private processForeach(node: Nodes.Tag, context: ITraverseContext, data: string): Ast.ForeachNode {
      try {
         const childrenContext = {
            ...context,
            state: TraverseState.MARKUP
         };
         const content = <Ast.TContent[]>this.visitAll(node.children, childrenContext);
         const { index, iterator, collection } = this.parseForeachData(data);
         const ast = new Ast.ForeachNode(index, iterator, collection);
         ast.__$ws_content = content;
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
      }
   }

   private processTemplate(node: Nodes.Tag, context: ITraverseContext): Ast.TemplateNode {
      try {
         const childrenContext = {
            ...context,
            state: TraverseState.MARKUP
         };
         const content = <Ast.TContent[]>this.visitAll(node.children, childrenContext);
         const templateName = this.attributeProcessor.validateValue(node.attributes, 'name', {
            fileName: context.fileName,
            hasAttributesOnly: true,
            parentTagName: node.name
         });
         this.resolver.resolveTemplate(templateName);
         const ast = new Ast.TemplateNode(templateName);
         if (content.length === 0) {
            this.errorHandler.error(
               `Содержимое директивы ws:template не должно быть пустым`,
               {
                  fileName: childrenContext.fileName,
                  position: node.position
               }
            );
         }
         ast.__$ws_content = content;
         context.scope.registerTemplate(templateName, ast);
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
      }
   }

   private processPartial(node: Nodes.Tag, context: ITraverseContext): Ast.PartialNode {
      // TODO: в атрибутах есть обязательный template
      //  Создаем узел, парсим данные, переходим к детям
      this.errorHandler.error(
         'Not implemented @ processPartial',
         {
            fileName: context.fileName,
            position: node.position
         }
      );
      return null;
   }

   private warnUnexpectedAttributes(node: Nodes.Tag, context: ITraverseContext): void {
      for (const name in node.attributes) {
         this.errorHandler.warn(
            `Обнаружен непредусмотренный атрибут "${name}" на теге "${node.name}". Атрибут будет отброшен`,
            {
               fileName: context.fileName,
               position: node.attributes[name].position
            }
         );
      }
   }

   private processContentOption(node: Nodes.Tag, context: ITraverseContext): Ast.TContent {
      if (context.contentComponentState === ContentTraverseState.UNKNOWN) {
         context.contentComponentState = ContentTraverseState.CONTENT;
      }
      if (context.contentComponentState !== ContentTraverseState.CONTENT) {
         this.errorHandler.error(
            `Запрещено смешивать контент по умолчанию с опциями - обнаружен тег "${node.name}". Тег будет отброшен. ` +
            'Необходимо явно задать контент в ws:content',
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
      return this.processTagInMarkup(node, context);
   }

   private castAndProcessObjectProperty(node: Nodes.Tag, context: ITraverseContext): Ast.ObjectNode {
      try {
         const properties = { };
         const childrenContext: ITraverseContext = {
            ...context
         };
         const optionName = this.resolver.getComponentOptionName(node.name);
         const content = this.visitAll(node.children, childrenContext);
         if (content.length !== 1) {
            this.errorHandler.critical(
               'Ожидался единственый узел в packAndProcessObjectProperty',
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
         }
         const value = <Ast.TData>content[0];
         if (value.hasFlag(Ast.Flags.TYPE_CASTED) && value instanceof Ast.ObjectNode) {
            for (const attributeName in node.attributes) {
               try {
                  const processedValue = this.textProcessor.process(
                     node.attributes[attributeName].value,
                     {
                        fileName: context.fileName,
                        allowedContent: TextContentFlags.FULL_TEXT
                     },
                     node.attributes[attributeName].position
                  );
                  const valueNode = new Ast.ValueNode(processedValue);
                  value.__$ws_properties[attributeName] = new Ast.OptionNode(
                     attributeName,
                     valueNode
                  );
               } catch (error) {
                  this.errorHandler.error(
                     `Ошибка обработки атрибута "${attributeName}": ${error.message}. Атрибут будет отброшен`,
                     {
                        fileName: context.fileName,
                        position: node.attributes[attributeName].position
                     }
                  );
               }
            }
         } else {
            this.warnUnexpectedAttributes(node, context);
         }
         properties[optionName] = content[0];
         const ast = new Ast.ObjectNode(properties);
         ast.setFlag(Ast.Flags.TYPE_CASTED);
         return ast;
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора опции "${node.name}": ${error.message}. Опция будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   private processOption(node: Nodes.Tag, context: ITraverseContext): Ast.ContentOptionNode | Ast.OptionNode {
      if (context.contentComponentState === ContentTraverseState.UNKNOWN) {
         context.contentComponentState = ContentTraverseState.OPTION;
      }
      if (context.contentComponentState !== ContentTraverseState.OPTION) {
         this.errorHandler.error(
            `Запрещено смешивать контент по умолчанию с опциями - обнаружена опция "${node.name}". ` +
            'Необходимо явно задать контент в ws:content',
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
      try {
         const optionContext: ITraverseContext = {
            ...context,
            contentComponentState: ContentTraverseState.UNKNOWN,
            state: TraverseState.COMPONENT_OPTION
         };
         const optionName = this.resolver.getComponentOptionName(node.name);
         if (node.isSelfClosing || node.children.length === 0) {
            const properties = { };
            for (const attributeName in node.attributes) {
               try {
                  const processedValue = this.textProcessor.process(
                     node.attributes[attributeName].value,
                     {
                        fileName: context.fileName,
                        allowedContent: TextContentFlags.FULL_TEXT
                     },
                     node.attributes[attributeName].position
                  );
                  const valueNode = new Ast.ValueNode(processedValue);
                  properties[attributeName] = new Ast.OptionNode(
                     attributeName,
                     valueNode
                  );
               } catch (error) {
                  this.errorHandler.error(
                     `Ошибка обработки опции "${node.name}": ${error.message}. Опция будет отброшен`,
                     {
                        fileName: context.fileName,
                        position: node.attributes[attributeName].position
                     }
                  );
               }
            }
            return new Ast.OptionNode(optionName, new Ast.ObjectNode(properties));
         }
         // результат: контентная опция, узел с данными (возможно type casted)
         const children = this.visitAll(node.children, optionContext);
         if (children.length !== 1) {
            this.errorHandler.error(
               `Содержимое опции "${node.name}" некорректно. Опция будет отброшена`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
         }
         const data = children[0];
         if (data instanceof Ast.ContentOptionNode) {
            this.warnUnexpectedAttributes(node, context);
            return new Ast.ContentOptionNode(optionName, <Ast.TContent[]>children);
         }
         if (Ast.isTypeofData(data)) {
            if (data instanceof Ast.ObjectNode) {
               for (const attributeName in node.attributes) {
                  try {
                     const processedValue = this.textProcessor.process(
                        node.attributes[attributeName].value,
                        {
                           fileName: context.fileName,
                           allowedContent: TextContentFlags.FULL_TEXT
                        },
                        node.attributes[attributeName].position
                     );
                     const valueNode = new Ast.ValueNode(processedValue);
                     (<Ast.ObjectNode>data).__$ws_properties[attributeName] = new Ast.OptionNode(
                        attributeName,
                        valueNode
                     );
                  } catch (error) {
                     this.errorHandler.error(
                        `Ошибка обработки опции "${node.name}": ${error.message}. Опция будет отброшен`,
                        {
                           fileName: context.fileName,
                           position: node.attributes[attributeName].position
                        }
                     );
                  }
               }
            }
            return new Ast.OptionNode(optionName, <Ast.TData>data);
         }
         this.errorHandler.critical(
            `Результат разбора опции "${node.name}" - неизвестного типа`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора опции "${node.name}": ${error.message}. Опция будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   private processComponent(node: Nodes.Tag, context: ITraverseContext): Ast.ComponentNode {
      try {
         const childrenContext: ITraverseContext = {
            ...context,
            contentComponentState: ContentTraverseState.UNKNOWN,
            state: TraverseState.COMPONENT
         };
         const children = this.visitAll(node.children, childrenContext);
         const { physicalPath, logicalPath } = this.resolver.resolveComponent(node.name);
         const ast = new Ast.ComponentNode(physicalPath, logicalPath);
         const attributes = this.attributeProcessor.process(node.attributes, {
            fileName: context.fileName,
            hasAttributesOnly: false,
            parentTagName: node.name
         });
         ast.__$ws_attributes = attributes.attributes;
         ast.__$ws_events = attributes.events;
         ast.__$ws_options = attributes.options;
         for (let index = 0; index < children.length; ++index) {
            const child = children[index];
            if (child instanceof Ast.OptionNode || child instanceof Ast.ContentOptionNode) {
               if (ast.hasOption(child.__$ws_name)) {
                  this.errorHandler.critical(
                     `Опция "${child.__$ws_name}" уже определена на компоненте "${node.name}". Полученная опция будет отброшена`,
                     {
                        fileName: context.fileName,
                        position: node.position
                     }
                  );
                  continue;
               }
               ast.setOption(child);
               continue;
            }
            this.errorHandler.critical(
               `Получен некорректный узел (!=Option|ContentOption) внутри компонента "${node.name}"`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
         }
         return ast;
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора компонента "${node.name}": ${error.message}. Компонент будет отброшен`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   private processElement(node: Nodes.Tag, context: ITraverseContext): Ast.ElementNode {
      try {
         const childrenContext = {
            ...context,
            state: TraverseState.MARKUP
         };
         const content = <Ast.TContent[]>this.visitAll(node.children, childrenContext);
         const attributes = this.attributeProcessor.process(node.attributes, {
            fileName: context.fileName,
            hasAttributesOnly: true,
            parentTagName: node.name
         });
         const ast = new Ast.ElementNode(node.name);
         ast.__$ws_attributes = attributes.attributes;
         ast.__$ws_events = attributes.events;
         ast.__$ws_content = content;
         return ast;
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора HTML-элемента: ${error.message}. Тег будет отброшен`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }
}

export default function traverse(nodes: Nodes.Node[], config: ITraverseConfig, options: ITraverseOptions) {
   return new Traverse(config).transform(
      nodes,
      options
   );
}
