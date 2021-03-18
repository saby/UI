import * as N from 'Compiler/expressions/Nodes';
import { IParser } from 'Compiler/expressions/Parser';

export interface IWalkerHooks {
    [nodeType: string]: (node: N.Node, context: N.IContext) => void;
}

/**
 * Обойти дерево выражения Program Node, выполнив callback-функции на нужных узлах.
 * @param expression Program Node выражение.
 * @param cbs Объект callback-функций.
 */
export class Walker implements N.IExpressionVisitor<N.IContext, void> {
    readonly hooks: IWalkerHooks;

    constructor(hooks: IWalkerHooks) {
        this.hooks = hooks;
    }

    visitArrayExpressionNode(node: N.ArrayExpressionNode, context: N.IContext): void {
        for (let index = 0; index < node.elements.length; ++index) {
            node.elements[index].accept(this, context);
        }
        if (this.hooks[node.type]) {
            this.hooks[node.type](node, context);
        }
    }

    visitBinaryExpressionNode(node: N.BinaryExpressionNode, context: N.IContext): void {
        node.left.accept(this, context);
        node.right.accept(this, context);
        if (this.hooks[node.type]) {
            this.hooks[node.type](node, context);
        }
    }

    visitCallExpressionNode(node: N.CallExpressionNode, context: N.IContext): void {
        node.callee.accept(this, context);
        if (node.arguments) {
            for (let index = 0; index < node.arguments.length; ++index) {
                node.arguments[index].accept(this, context);
            }
        }
        if (this.hooks[node.type]) {
            this.hooks[node.type](node, context);
        }
    }

    visitConditionalExpressionNode(node: N.ConditionalExpressionNode, context: N.IContext): void {
        node.test.accept(this, context);
        if (node.alternate) {
            node.alternate.accept(this, context);
        }
        node.consequent.accept(this, context);
        if (this.hooks[node.type]) {
            this.hooks[node.type](node, context);
        }
    }

    visitDecoratorCallNode(node: N.DecoratorCallNode, context: N.IContext): void {
        node.caller.accept(this, context);
        node.decorator.accept(this, context);
        if (this.hooks[node.type]) {
            this.hooks[node.type](node, context);
        }
    }

    visitDecoratorChainCallNode(node: N.DecoratorChainCallNode, context: N.IContext): void {
        if (node.argumentsDecorator) {
            for (let index = 0; index < node.argumentsDecorator.length; ++index) {
                node.argumentsDecorator[index].accept(this, context);
            }
        }
        if (this.hooks[node.type]) {
            this.hooks[node.type](node, context);
        }
    }

    visitDecoratorChainContext(node: N.DecoratorChainContext, context: N.IContext): void {
        node.fn.accept(this, context);
        if (node.entity) {
            node.entity.accept(this, context);
        }
        if (this.hooks[node.type]) {
            this.hooks[node.type](node, context);
        }
    }

    visitEmptyStatementNode(node: N.EmptyStatementNode, context: N.IContext): void {
        if (this.hooks[node.type]) {
            this.hooks[node.type](node, context);
        }
    }

    visitExpressionBrace(node: N.ExpressionBrace, context: N.IContext): void {
        node.name.accept(this, context);
        if (this.hooks[node.type]) {
            this.hooks[node.type](node, context);
        }
    }

    visitExpressionStatementNode(node: N.ExpressionStatementNode, context: N.IContext): void {
        node.expression.accept(this, context);
        if (this.hooks[node.type]) {
            this.hooks[node.type](node, context);
        }
    }

    visitIdentifierNode(node: N.IdentifierNode, context: N.IContext): void {
        if (this.hooks[node.type]) {
            this.hooks[node.type](node, context);
        }
    }

    visitLiteralNode(node: N.LiteralNode, context: N.IContext): void {
        if (this.hooks[node.type]) {
            this.hooks[node.type](node, context);
        }
    }

    visitLogicalExpressionNode(node: N.LogicalExpressionNode, context: N.IContext): void {
        node.left.accept(this, context);
        node.right.accept(this, context);
        if (this.hooks[node.type]) {
            this.hooks[node.type](node, context);
        }
    }

    visitMemberExpressionNode(node: N.MemberExpressionNode, context: N.IContext): void {
        node.object.accept(this, context);
        if (node.computed) {
            node.property.accept(this, context);
        }
        if (this.hooks[node.type]) {
            this.hooks[node.type](node, context);
        }
    }

    visitObjectExpressionNode(node: N.ObjectExpressionNode, context: N.IContext): void {
        node.properties.forEach((property: N.IObjectProperty) => {
            const key = property.key;
            const value = property.value;
            key.accept(this, context);
            value.accept(this, context);
        });
        if (this.hooks[node.type]) {
            this.hooks[node.type](node, context);
        }
    }

    visitProgramNode(node: N.ProgramNode, context: N.IContext): void {
        for (let index = 0; index < node.body.length; ++index) {
            node.body[index].accept(this, context);
        }
        if (this.hooks[node.type]) {
            this.hooks[node.type](node, context);
        }
    }

    visitSequenceExpressionNode(node: N.SequenceExpressionNode, context: N.IContext): void {
        for (let index = 0; index < node.expressions.length; ++index) {
            node.expressions[index].accept(this, context);
        }
        if (this.hooks[node.type]) {
            this.hooks[node.type](node, context);
        }
    }

    visitThisExpressionNode(node: N.ThisExpressionNode, context: N.IContext): void {
        if (this.hooks[node.type]) {
            this.hooks[node.type](node, context);
        }
    }

    visitUnaryExpressionNode(node: N.UnaryExpressionNode, context: N.IContext): void {
        node.argument.accept(this, context);
        if (this.hooks[node.type]) {
            this.hooks[node.type](node, context);
        }
    }
}

export function collectIdentifiers(node: N.Node, fileName: string): string[] {
    const identifiers: string[] = [];
    const callbacks = {
        Identifier: (identifierNode: N.IdentifierNode): void => {
            const identifier = identifierNode.name;
            // Do not produce duplicates
            if (identifiers.indexOf(identifier) === -1) {
                identifiers.push(identifierNode.name);
            }
        }
    };
    const walker = new Walker(callbacks);
    node.accept(walker, {
        fileName
    });
    return identifiers;
}

export function containsTranslationFunction(node: N.Node, fileName: string): boolean {
    let containsTranslation: boolean = false;
    const callbacks = {
        CallExpression: (callExpressionNode: N.CallExpressionNode): void => {
            const callee = callExpressionNode.callee;
            if (!(callee instanceof N.IdentifierNode)) {
                return;
            }
            if (callee.name === 'rk') {
                containsTranslation = true;
            }
        }
    };
    const walker = new Walker(callbacks);
    node.accept(walker, {
        fileName
    });
    return containsTranslation;
}

const BIND_SUBPROGRAMS_SHIFT: number = -2;

export function dropBindProgram(program: N.ProgramNode, parser: IParser, fileName: string): N.ProgramNode[] {
    const programs: N.ProgramNode[] = [];
    const callbacks = {
        Identifier: (node: N.IdentifierNode): void => {
            programs.push(
                parser.parse(node.name)
            );
        },
        MemberExpression: (node: N.MemberExpressionNode): void => {
            programs.push(
                parser.parse(node.string)
            );
        }
    };
    const walker = new Walker(callbacks);
    program.accept(walker, {
        fileName
    });
    // We need to return value-program and object-program.
    // Ex. for "a.b.c.d.e" we only return "a.b.c.d" and "a.b.c.d.e".
    return programs.slice(BIND_SUBPROGRAMS_SHIFT);
}

export function containsFunctionCall(program: N.Node, fileName: string): boolean {
    let hasFunctionCall = false;
    const callbacks = {
        CallExpression: (): void => {
            hasFunctionCall = true;
        }
    };
    const walker = new Walker(callbacks);
    program.accept(walker, {
        fileName
    });
    return hasFunctionCall;
}

export function containsIdentifiers(node: N.Node, identifiers: string[], fileName: string): boolean {
    let hasLocalIdentifier = false;
    const callbacks = {
        Identifier: (identifierNode: N.IdentifierNode): void => {
            if (identifiers.indexOf(identifierNode.name) > -1) {
                hasLocalIdentifier = true;
            }
        }
    };
    const walker = new Walker(callbacks);
    node.accept(walker, {
        fileName
    });
    return hasLocalIdentifier;
}

export function hasDecorators(node: N.Node, fileName: string): boolean {
    let contains = false;
    const callbacks = {
        DecoratorChainCall: (): void => {
            contains = true;
        },
        DecoratorChainContext: (): void => {
            contains = true;
        },
        DecoratorCall: (): void => {
            contains = true;
        }
    };
    const walker = new Walker(callbacks);
    node.accept(walker, {
        fileName
    });
    return contains;
}
