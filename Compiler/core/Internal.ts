import * as Ast from './Ast';
import Scope from './Scope';
import { IResultTree, InternalVisitor } from './internal/Annotate';

export function process(nodes: Ast.Ast[], scope: Scope): IResultTree {
   return new InternalVisitor().process(nodes, scope);
}
