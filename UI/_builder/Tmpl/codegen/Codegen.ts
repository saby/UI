/// <amd-module name="UI/_builder/Tmpl/codegen/Processor" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/codegen/Processor.ts
 */

import * as Ast from 'UI/_builder/Tmpl/core/Ast';
import * as TClosureGenerator from 'UI/_builder/Tmpl/codegen/TClosure';
// import * as MarkupGenerator from 'UI/_builder/Tmpl/codegen/Generator';

export interface IConfiguration {
   // TODO: Release
}

export interface IOptions {
   // TODO: Release
}

export interface IProcessor {
   generate(nodes: Ast.Ast, options: IOptions): string;
}

interface IContext extends IOptions {
   // TODO: Release
}

class Processor implements Ast.IAstVisitor, IProcessor {

   // @ts-ignore: Release IConfiguration
   constructor(config: IConfiguration) {
      // TODO: Release
   }

   generate(nodes: Ast.Ast, options: IOptions): string {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   // <editor-fold desc="Data types">

   visitArray(node: Ast.ArrayNode, context: IContext): string {
      const elements: string = this.enumerateNodes(node.__$ws_elements, context);
      return `[${elements}]`;
   }

   visitBoolean(node: Ast.BooleanNode, context: IContext): string {
      const value: string = this.concatDataNodes(node.__$ws_data, context);
      return `Boolean(${value})`;
   }

   visitFunction(node: Ast.FunctionNode, context: IContext): string {
      const options: string = this.processCollection(node.__$ws_options, context);
      const handler: string = this.concatDataNodes(node.__$ws_functionExpression, context);
      return TClosureGenerator.genGetTypeFunc(handler, options);
   }

   visitNumber(node: Ast.NumberNode, context: IContext): string {
      const value: string = this.concatDataNodes(node.__$ws_data, context);
      return `Number(${value})`;
   }

   visitObject(node: Ast.ObjectNode, context: IContext): string {
      return this.processCollection(node.__$ws_properties, context);
   }

   visitString(node: Ast.StringNode, context: IContext): string {
      return this.concatDataNodes(node.__$ws_data, context);
   }

   visitValue(node: Ast.ValueNode, context: IContext): string {
      return this.concatDataNodes(node.__$ws_data, context);
   }

   // </editor-fold>

   // <editor-fold desc="Attributes and options">

   visitAttribute(node: Ast.AttributeNode, context: IContext): void {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitBind(node: Ast.BindNode, context: IContext): void {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitEvent(node: Ast.EventNode, context: IContext): void {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitOption(node: Ast.OptionNode, context: IContext): void {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitContentOption(node: Ast.ContentOptionNode, context: IContext): string {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   // </editor-fold>

   // <editor-fold desc="HTML nodes">

   visitCData(node: Ast.CDataNode, context: IContext): string {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitComment(node: Ast.CommentNode, context: IContext): string {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitDoctype(node: Ast.DoctypeNode, context: IContext): string {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitElement(node: Ast.ElementNode, context: IContext): string {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitInstruction(node: Ast.InstructionNode, context: IContext): string {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   // </editor-fold>

   // <editor-fold desc="Directives">

   visitElse(node: Ast.ElseNode, context: IContext): string {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitFor(node: Ast.ForNode, context: IContext): string {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitForeach(node: Ast.ForeachNode, context: IContext): string {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitIf(node: Ast.IfNode, context: IContext): string {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitTemplate(node: Ast.TemplateNode, context: IContext): string {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   // </editor-fold>

   // <editor-fold desc="Extended text">

   visitExpression(node: Ast.ExpressionNode, context: IContext): string {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitText(node: Ast.TextNode, context: IContext): string {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitTextData(node: Ast.TextDataNode, context: IContext): string {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitTranslation(node: Ast.TranslationNode, context: IContext): string {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   // </editor-fold>

   // <editor-fold desc="Components and templates">

   visitComponent(node: Ast.ComponentNode, context: IContext): string {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitDynamicPartial(node: Ast.DynamicPartialNode, context: IContext): string {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitInlineTemplate(node: Ast.InlineTemplateNode, context: IContext): string {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitStaticPartial(node: Ast.StaticPartialNode, context: IContext): string {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   // </editor-fold>

   private concatDataNodes(nodes: Ast.Ast[], context: IContext): string {
      return nodes.map((node: Ast.Ast) => node.accept(this, context)).join(' + ');
   }

   private enumerateNodes(nodes: Ast.Ast[], context: IContext): string {
      return nodes.map((node: Ast.Ast) => node.accept(this, context)).join(',');
   }

   private processCollection(options: Ast.IOptions | Ast.IObjectProperties, context: IContext): string {
      const processed: string[] = [];
      for (const name in options) {
         const option = options[name];
         const value = option.accept(this, context);
         processed.push(`"${option.__$ws_name}":${value}`);
      }
      return `{${processed.join(',')}}`;
   }
}

export default function process(nodes: Ast.Ast, options: IOptions, config: IConfiguration): string {
   return new Processor(config).generate(nodes, options);
}
