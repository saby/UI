import * as Ast from './Ast';
import Scope from './Scope';
import { IResultTree, InternalVisitor } from './internal/Annotate';

/**
 * Флаг включения/выключения нового механизма формирования internal-выражений для dirty checking проверок.
 */
const USE_INTERNAL_MECHANISM = true;

export function canUseNewInternalMechanism(): boolean {
   return USE_INTERNAL_MECHANISM;
}

export function process(nodes: Ast.Ast[], scope: Scope): IResultTree {
   return new InternalVisitor().process(nodes, scope);
}
