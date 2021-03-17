/// <amd-module name="UI/_builder/Tmpl/expressions/_private/Parser" />

/**
 * @description Represents mustache expression parser.
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/expressions/_private/Parser.ts
 *
 * @todo Разделить парсер на tmpl и wml - они разные
 */

import { Parser as RawParser } from '../third-party/parser';
import * as Nodes from './Nodes';

interface IParserMeta {
   text: string;
   token: string;
   line: number;
   loc: Nodes.ISourceLocation;
   expected: string | string[];
   recoverable: boolean;
}

const ParserMixin = {
   nodes: {
      ProgramNode: Nodes.ProgramNode,
      EmptyStatementNode: Nodes.EmptyStatementNode,
      ExpressionStatementNode: Nodes.ExpressionStatementNode,
      ThisExpressionNode: Nodes.ThisExpressionNode,
      ArrayExpressionNode: Nodes.ArrayExpressionNode,
      ObjectExpressionNode: Nodes.ObjectExpressionNode,
      SequenceExpressionNode: Nodes.SequenceExpressionNode,
      UnaryExpressionNode: Nodes.UnaryExpressionNode,
      BinaryExpressionNode: Nodes.BinaryExpressionNode,
      LogicalExpressionNode: Nodes.LogicalExpressionNode,
      ConditionalExpressionNode: Nodes.ConditionalExpressionNode,
      CallExpressionNode: Nodes.CallExpressionNode,
      MemberExpressionNode: Nodes.MemberExpressionNode,
      IdentifierNode: Nodes.IdentifierNode,
      LiteralNode: Nodes.LiteralNode,
      DecoratorChainCallNode: Nodes.DecoratorChainCallNode,
      DecoratorChainContext: Nodes.DecoratorChainContext,
      ExpressionBrace: Nodes.ExpressionBrace,
      DecoratorCallNode: Nodes.DecoratorCallNode
   },
   newLine: false,
   wasNewLine: false,
   restricted: false,
   parseError(message: string, meta: IParserMeta): void {
      if (!((meta.expected && meta.expected.indexOf("';'") >= 0) && (
         meta.token === '}' ||
         meta.token === 'EOF' ||
         meta.token === 'BR++' ||
         meta.token === 'BR--' ||
         this.newLine ||
         this.wasNewLine
      ))) {
         throw new SyntaxError(message);
      }
   }
};

export interface IParser {
   parse(data: string): Nodes.ProgramNode;
}

Object.assign(RawParser.prototype, ParserMixin);
export const Parser: new (...args: any[]) => IParser = RawParser;
