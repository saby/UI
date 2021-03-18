/**
 * @description Module for annotation of abstract syntax tree:
 * 1) Collecting trees of internal nodes for components;
 * 2) Checking for translations.
 * @author Крылов М.А.
 */

import * as Ast from 'Compiler/core/Ast';
import Scope from 'Compiler/core/Scope';
import { Container, ContainerType } from 'Compiler/core/internal/Container';
import { IProgramMeta, ProgramType } from './Storage';
import { ProgramNode } from 'Compiler/expressions/Nodes';
import * as Walkers from 'Compiler/expressions/Walkers';
import { ITranslationKey } from 'Compiler/i18n/Dictionary';
import { IContext as ILexicalContext } from 'Compiler/core/Context';

/**
 * Prefix for internal mustache expressions.
 */
const INTERNAL_PROGRAM_PREFIX = '__dirtyCheckingVars_';

/**
 * Hidden file name.
 * @todo Use real template file name.
 */
const FILE_NAME = '[[Compiler/core/internal/Annotate]]';

export interface ITranslationUnit {
    tree: Ast.Ast[];
    fileName: string;
    localizedDictionary: ITranslationKey[];
    container: Container | null;
    lexicalContext: ILexicalContext | null;
    childrenStorage: string[];
    reactiveProps: string[];
    templateNames: string[];
    dependencies: string[];
    hasTranslations: boolean;
    scope: Scope;
    __newVersion: boolean;
}

/**
 * Abstract node types.
 */
enum AbstractNodeType {

    /**
     * Flag for root node which can be node of any type.
     */
    ROOT,

    /**
     * Flag for component, ws:template, ws:partial nodes.
     */
    COMPONENT,

    /**
     * Flag for content option nodes.
     */
    COMPONENT_OPTION,

    /**
     * Flag for element nodes.
     */
    ELEMENT,

    /**
     * Flag for data type nodes.
     */
    DATA_TYPE_DIRECTIVE,

    /**
     * Flag for directive nodes.
     */
    DIRECTIVE,

    /**
     * Flag for attribute nodes.
     */
    ATTRIBUTE,

    /**
     * Flag for option nodes.
     */
    OPTION,

    /**
     * Flag for text nodes.
     */
    TEXT
}

/**
 * Annotation counters.
 */
class Counters {

    /**
     * Counter for cycle nodes (ws:for aka for/foreach).
     * @private
     */
    private cycle: number;

    /**
     * Initialize new instance of annotation counter.
     */
    constructor() {
        this.cycle = 0;
    }

    /**
     * Allocate new cycle index.
     */
    allocateCycleIndex(): number {
        return this.cycle++;
    }
}

/**
 * Interface for annotation context.
 */
interface IContext {

    /**
     * Current processing attribute name.
     */
    attributeName?: string;

    /**
     * Collection of child names for processing abstract syntax tree.
     */
    childrenStorage: string[];

    /**
     * Actual container for internal expressions.
     */
    container: Container;

    /**
     * Scope object for processing abstract syntax tree.
     */
    scope: Scope;

    /**
     * Actual annotation counter for processing abstract syntax tree.
     */
    counters: Counters;
}

/**
 * Wrap mustache expression programs into special codegen structure and generate object with internal expressions.
 * @param programs {IProgramMeta[]} Collection of meta of mustache expression programs.
 * @returns {*} Object with internal expressions.
 */
function wrapInternalExpressions(programs: IProgramMeta[]): any {
    const internal = { };
    for (let index = 0; index < programs.length; ++index) {
        const program = programs[index];
        internal[INTERNAL_PROGRAM_PREFIX + index] = {
            data: [
                new Ast.ExpressionNode(program.node)
            ],
            type: 'text'
        };
    }
    return internal;
}

/**
 * Object-like type of abstract syntax nodes.
 */
declare type IProperties = Ast.IAttributes | Ast.IEvents | Ast.IOptions | Ast.IContents | Ast.IObjectProperties;

/**
 * Visit collection of abstract syntax nodes.
 * @param nodes {Ast[]} Collection of abstract syntax nodes.
 * @param visitor {IAstVisitor} Concrete abstract syntax node visitor.
 * @param context {IContext} Current context for visitor.
 */
function visitAll(nodes: Ast.Ast[], visitor: Ast.IAstVisitor, context: IContext): void {
    for (let index = 0; index < nodes.length; ++index) {
        nodes[index].accept(visitor, context);
    }
}

/**
 * Visit object-like collection of abstract syntax nodes.
 * @param properties {IProperties} Collection of abstract syntax nodes.
 * @param visitor {IAstVisitor} Concrete abstract syntax node visitor.
 * @param context {IContext} Current context for visitor.
 */
function visitAllProperties(properties: IProperties, visitor: Ast.IAstVisitor, context: IContext): void {
    for (const name in properties) {
        properties[name].accept(visitor, context);
    }
}

/**
 * Collect name of identifiers in inline template node from options which names equal to values.
 * @param node {InlineTemplateNode} Inline template node.
 * @returns {string[]} Collection of identifiers.
 */
function collectInlineTemplateIdentifiers(node: Ast.InlineTemplateNode): string[] {
    const identifiers = [];
    for (const name in node.__$ws_events) {
        const event = node.__$ws_events[name];
        if (event instanceof Ast.BindNode) {
            // bind:option="option" is simple alias and deep usages exist in current scope
            if (event.__$ws_property !== event.__$ws_value.string) {
                identifiers.push(event.__$ws_property);
            }
        }
    }
    for (const name in node.__$ws_options) {
        const option = node.__$ws_options[name];
        if (option.hasFlag(Ast.Flags.TYPE_CASTED | Ast.Flags.UNPACKED) && option.__$ws_value instanceof Ast.ValueNode) {
            const value = option.__$ws_value;
            const valuePart = value.__$ws_data[0];
            if (value.__$ws_data.length === 1 && valuePart instanceof Ast.ExpressionNode) {
                if (option.__$ws_name === valuePart.__$ws_program.string) {
                    // Skip only case option="{{ option }}"
                    continue;
                }
            }
        }
        identifiers.push(option.__$ws_name);
    }
    return identifiers;
}

/**
 * Get processing program type that depends on type of processing abstract syntax node.
 * @param stack {AbstractNodeType[]} Stack of types of processing abstract syntax node.
 * @returns {ProgramType} Actual type of processing mustache expression.
 */
function getProgramType(stack: AbstractNodeType[]): ProgramType {
    let isInComponent = false;
    let isInAttribute = false;
    let isInOption = false;
    for (let index = stack.length - 1; index > -1; --index) {
        if (stack[index] === AbstractNodeType.DATA_TYPE_DIRECTIVE) {
            continue;
        } else if (stack[index] === AbstractNodeType.COMPONENT) {
            isInComponent = true;
        } else if (stack[index] === AbstractNodeType.ATTRIBUTE) {
            isInAttribute = true;
            continue;
        } else if (stack[index] === AbstractNodeType.OPTION) {
            isInOption = true;
            continue;
        }
        break;
    }
    if (isInComponent) {
        if (isInAttribute) {
            return ProgramType.ATTRIBUTE;
        } else if (isInOption) {
            return ProgramType.OPTION;
        }
    }
    return ProgramType.SIMPLE;
}

/**
 * Check if current processing is in attribute of component.
 * @param stack {AbstractNodeType[]} Stack of types of processing abstract syntax node.
 * @returns {boolean} True in case of processing attribute of component.
 */
function isInComponentAttributes(stack: AbstractNodeType[]): boolean {
    for (let index = stack.length - 1; index > -1; --index) {
        if (stack[index] === AbstractNodeType.DATA_TYPE_DIRECTIVE) {
            continue;
        }
        if (stack[index] === AbstractNodeType.COMPONENT) {
            return true;
        }
        break;
    }
    return false;
}

/**
 * Check if current processing is in data type node.
 * @param stack {AbstractNodeType[]} Stack of types of processing abstract syntax node.
 * @returns {boolean} True in case of processing data type node.
 */
function isInDataTypeDirective(stack: AbstractNodeType[]): boolean {
    for (let index = stack.length - 1; index > -1; --index) {
        if (stack[index] === AbstractNodeType.DATA_TYPE_DIRECTIVE) {
            return true;
        }
        if (
            stack[index] === AbstractNodeType.COMPONENT ||
            stack[index] === AbstractNodeType.COMPONENT_OPTION ||
            stack[index] === AbstractNodeType.ELEMENT ||
            stack[index] === AbstractNodeType.DIRECTIVE ||
            stack[index] === AbstractNodeType.ATTRIBUTE ||
            stack[index] === AbstractNodeType.OPTION ||
            stack[index] === AbstractNodeType.TEXT
        ) {
            return false;
        }
    }
    return false;
}

/**
 * Get string value from text.
 * @param value {TText[]} Collection of text nodes.
 * @return {string | null} Returns string in case of collection has single text node.
 */
function getStringValueFromText(value: Ast.TText[]): string | null {
    if (value.length !== 1) {
        return null;
    }
    const valueNode = value[0];
    if (!(valueNode instanceof Ast.TextDataNode)) {
        return null;
    }
    return valueNode.__$ws_content;
}

/**
 * Get element name.
 * @param element {BaseHtmlElement} Element node.
 * @return {string | null} Returns element name if it exists.
 */
function getElementName(element: Ast.BaseHtmlElement): string | null {
    if (element.__$ws_attributes.hasOwnProperty('attr:name')) {
        return getStringValueFromText(element.__$ws_attributes['attr:name'].__$ws_value);
    }
    if (element.__$ws_attributes.hasOwnProperty('name')) {
        return getStringValueFromText(element.__$ws_attributes.name.__$ws_value);
    }
    return null;
}

/**
 * Get string value from string or value node.
 * @param value {TData} Data node.
 * @return {string | null} Returns string value for string or value node.
 */
function getStringValueFromData(value: Ast.TData): string | null {
    if (value instanceof Ast.ValueNode) {
        return getStringValueFromText(value.__$ws_data);
    }
    if (value instanceof Ast.StringNode) {
        return getStringValueFromText(value.__$ws_data);
    }
    return null;
}

/**
 * Get component name.
 * @param component {BaseWasabyElement} Component node.
 * @return {string | null} Returns component name if it exists.
 */
function getComponentName(component: Ast.BaseWasabyElement): string | null {
    const elementName = getElementName(component);
    if (elementName !== null) {
        return elementName;
    }
    if (component.__$ws_options.hasOwnProperty('attr:name')) {
        return getStringValueFromData(component.__$ws_options['attr:name'].__$ws_value);
    }
    if (component.__$ws_options.hasOwnProperty('name')) {
        return getStringValueFromData(component.__$ws_options.name.__$ws_value);
    }
    return null;
}

/**
 * Set root node flag.
 * @param nodes {Ast[]} Collection of nodes of abstract syntax tree.
 */
function setRootNodeFlags(nodes: Ast.Ast[]): void {
    nodes.forEach((node) => {
        if (node instanceof Ast.IfNode) {
            setRootNodeFlags(node.__$ws_consequent);
            return;
        }
        if (node instanceof Ast.ElseNode) {
            setRootNodeFlags(node.__$ws_consequent);
            return;
        }
        if (node instanceof Ast.ForNode) {
            setRootNodeFlags(node.__$ws_content);
            return;
        }
        if (node instanceof Ast.ForeachNode) {
            setRootNodeFlags(node.__$ws_content);
            return;
        }
        node.__$ws_isRootNode = true;
    });
}

/**
 * Check for translations in mustache expression node.
 * @param scope {Scope} Scope object for processing abstract syntax tree.
 * @param program {ProgramNode} Mustache expression node.
 */
function checkForTranslations(scope: Scope, program: ProgramNode | null): void {
    if (!program) {
        return;
    }
    if (Walkers.containsTranslationFunction(program, FILE_NAME)) {
        scope.setDetectedTranslation();
    }
}

/**
 * Abstract syntax tree annotator.
 */
export class InternalVisitor implements Ast.IAstVisitor {

    /**
     * Stack of processing node types.
     */
    readonly stack: AbstractNodeType[];

    /**
     * Initialize new instance of abstract syntax tree annotator.
     */
    constructor() {
        this.stack = [];
    }

    /**
     * Annotate abstract syntax tree.
     * @param nodes {Ast[]} Collection of nodes of abstract syntax tree.
     * @param scope {Scope} Scope object for processing abstract syntax tree.
     */
    process(nodes: Ast.Ast[], scope: Scope): ITranslationUnit {
        const container = new Container(null, ContainerType.GLOBAL);
        const childrenStorage: string[] = [];
        const context: IContext = {
            childrenStorage,
            container,
            scope,
            counters: new Counters()
        };
        this.stack.push(AbstractNodeType.ROOT);
        for (let index = 0; index < nodes.length; ++index) {
            nodes[index].accept(this, context);
            if (!nodes[index].__$ws_container) {
                nodes[index].__$ws_container = container;
            }
            if (!nodes[index].__$ws_internalTree) {
                nodes[index].__$ws_internalTree = nodes[index].__$ws_container.getInternalStructure();
                nodes[index].__$ws_internal = wrapInternalExpressions(nodes[index].__$ws_internalTree.flatten());
            }
        }
        this.stack.pop();
        return {
            tree: nodes,
            fileName: 'unknown',
            localizedDictionary: scope.getTranslationKeys(),
            lexicalContext: null,
            container,
            childrenStorage,
            reactiveProps: container.getOwnIdentifiers(),
            templateNames: scope.getTemplateNames(),
            dependencies: scope.getDependencies(),
            hasTranslations: scope.hasDetectedTranslations(),
            scope,
            __newVersion: true
        };
    }

    /**
     * Visit attribute node.
     * @param node {AttributeNode} Concrete attribute node.
     * @param context {IContext} Visitor context.
     */
    visitAttribute(node: Ast.AttributeNode, context: IContext): void {
        const childContext: IContext = {
            childrenStorage: context.childrenStorage,
            container: context.container,
            scope: context.scope,
            attributeName: node.__$ws_name,
            counters: context.counters
        };
        this.stack.push(AbstractNodeType.ATTRIBUTE);
        visitAll(node.__$ws_value, this, childContext);
        this.stack.pop();
    }

    /**
     * Visit option node.
     * @param node {OptionNode} Concrete option node.
     * @param context {IContext} Visitor context.
     */
    visitOption(node: Ast.OptionNode, context: IContext): void {
        const childContext: IContext = {
            childrenStorage: context.childrenStorage,
            container: context.container,
            scope: context.scope,
            attributeName: node.__$ws_name,
            counters: context.counters
        };
        this.stack.push(AbstractNodeType.OPTION);
        node.__$ws_value.accept(this, childContext);
        this.stack.pop();
    }

    /**
     * Visit content option node.
     * @param node {ContentOptionNode} Concrete content option node.
     * @param context {IContext} Visitor context.
     */
    visitContentOption(node: Ast.ContentOptionNode, context: IContext): void {
        const container = context.container.createContainer(ContainerType.CONTENT_OPTION);
        container.addIdentifier(node.__$ws_name);
        container.desc = node.__$ws_name;
        container.isInDataType = isInDataTypeDirective(this.stack);
        const childContext: IContext = {
            childrenStorage: context.childrenStorage,
            container,
            scope: context.scope,
            counters: context.counters
        };
        this.stack.push(AbstractNodeType.COMPONENT_OPTION);
        visitAll(node.__$ws_content, this, childContext);
        setRootNodeFlags(node.__$ws_content);
        this.stack.pop();

        node.__$ws_container = container;
        node.__$ws_internalTree = container.getInternalStructure();
        node.__$ws_internal = wrapInternalExpressions(node.__$ws_internalTree.flatten());
    }

    /**
     * Visit bind node.
     * @param node {BindNode} Concrete bind node.
     * @param context {IContext} Visitor context.
     */
    visitBind(node: Ast.BindNode, context: IContext): void {
        const isInComponent = isInComponentAttributes(this.stack);
        const programName = isInComponent ? node.__$ws_property : null;
        context.container.registerProgram(node.__$ws_value, ProgramType.BIND, programName);
        checkForTranslations(context.scope, node.__$ws_value);
    }

    /**
     * Visit event handler node.
     * @param node {EventNode} Concrete event handler node.
     * @param context {IContext} Visitor context.
     */
    visitEvent(node: Ast.EventNode, context: IContext): void {
        const isInComponent = isInComponentAttributes(this.stack);
        const programName = isInComponent ? node.__$ws_event : null;
        context.container.registerProgram(node.__$ws_handler, ProgramType.EVENT, programName);
        checkForTranslations(context.scope, node.__$ws_handler);
    }

    /**
     * Visit element node.
     * @param node {ElementNode} Concrete element node.
     * @param context {IContext} Visitor context.
     */
    visitElement(node: Ast.ElementNode, context: IContext): void {
        const name = getElementName(node);
        if (name !== null) {
            context.childrenStorage.push(name);
        }
        this.stack.push(AbstractNodeType.ELEMENT);
        visitAll(node.__$ws_content, this, context);
        visitAllProperties(node.__$ws_attributes, this, context);
        visitAllProperties(node.__$ws_events, this, context);
        this.stack.pop();
    }

    /**
     * Visit doctype node.
     * @param node {DoctypeNode} Concrete doctype node.
     * @param context {IContext} Visitor context.
     */
    visitDoctype(node: Ast.DoctypeNode, context: IContext): void { }

    /**
     * Visit CData section node.
     * @param node {CDataNode} Concrete CData section node.
     * @param context {IContext} Visitor context.
     */
    visitCData(node: Ast.CDataNode, context: IContext): void { }

    /**
     * Visit instruction node.
     * @param node {InstructionNode} Concrete instruction node.
     * @param context {IContext} Visitor context.
     */
    visitInstruction(node: Ast.InstructionNode, context: IContext): void { }

    /**
     * Visit comment node.
     * @param node {CommentNode} Concrete comment node.
     * @param context {IContext} Visitor context.
     */
    visitComment(node: Ast.CommentNode, context: IContext): void { }

    /**
     * Visit component node.
     * @param node {ComponentNode} Concrete component node.
     * @param context {IContext} Visitor context.
     */
    visitComponent(node: Ast.ComponentNode, context: IContext): void {
        const childContainer = this.processComponent(node, context);
        childContainer.desc = `<${node.__$ws_path.getFullPath()}>`;
        node.__$ws_internalTree = childContainer.getInternalStructure();
        node.__$ws_internal = wrapInternalExpressions(node.__$ws_internalTree.flatten());
    }

    /**
     * Visit inline template node.
     * @param node {InlineTemplateNode} Concrete inline template node.
     * @param context {IContext} Visitor context.
     */
    visitInlineTemplate(node: Ast.InlineTemplateNode, context: IContext): void {
        const childContainer = this.processComponent(node, context);
        const template = context.scope.getTemplate(node.__$ws_name);
        const identifiers = collectInlineTemplateIdentifiers(node);
        childContainer.joinContainer(template.__$ws_container, identifiers);
        childContainer.desc = `<ws:partial> @@ inline "${node.__$ws_name}"`;
        node.__$ws_internalTree = childContainer.getInternalStructure();
        node.__$ws_internal = wrapInternalExpressions(node.__$ws_internalTree.flatten());
    }

    /**
     * Visit static template node.
     * @param node {StaticPartialNode} Concrete static template node.
     * @param context {IContext} Visitor context.
     */
    visitStaticPartial(node: Ast.StaticPartialNode, context: IContext): void {
        const childContainer = this.processComponent(node, context);
        childContainer.desc = `<ws:partial> @@ static "${node.__$ws_path.getFullPath()}"`;
        node.__$ws_internalTree = childContainer.getInternalStructure();
        node.__$ws_internal = wrapInternalExpressions(node.__$ws_internalTree.flatten());
    }

    /**
     * Visit dynamic partial node.
     * @param node {DynamicPartialNode} Concrete dynamic partial node.
     * @param context {IContext} Visitor context.
     */
    visitDynamicPartial(node: Ast.DynamicPartialNode, context: IContext): void {
        const childContainer = this.processComponent(node, context);
        childContainer.registerProgram(node.__$ws_expression, ProgramType.OPTION, 'template');
        childContainer.desc = `<ws:partial> @@ dynamic "${node.__$ws_expression.string}"`;
        node.__$ws_internalTree = childContainer.getInternalStructure();
        node.__$ws_internal = wrapInternalExpressions(node.__$ws_internalTree.flatten());
        checkForTranslations(context.scope, node.__$ws_expression);
    }

    /**
     * Visit template node.
     * @param node {TemplateNode} Concrete template node.
     * @param context {IContext} Visitor context.
     */
    visitTemplate(node: Ast.TemplateNode, context: IContext): void {
        const container = context.container.createContainer(ContainerType.TEMPLATE);
        container.desc = `<ws:template> @@ "${node.__$ws_name}"`;
        const childContext: IContext = {
            childrenStorage: context.childrenStorage,
            scope: context.scope,
            container,
            counters: context.counters
        };
        this.stack.push(AbstractNodeType.DIRECTIVE);
        visitAll(node.__$ws_content, this, childContext);
        this.stack.pop();
        setRootNodeFlags(node.__$ws_content);
        node.__$ws_container = container;
        node.__$ws_internalTree = container.getInternalStructure();
        node.__$ws_internal = wrapInternalExpressions(node.__$ws_internalTree.flatten());
    }

    /**
     * Visit conditional "if" node.
     * @param node {IfNode} Concrete conditional "if" node.
     * @param context {IContext} Visitor context.
     */
    visitIf(node: Ast.IfNode, context: IContext): void {
        const container = context.container.createContainer(ContainerType.CONDITIONAL);
        container.desc = `<ws:if> "${node.__$ws_test.string}"`;
        container.registerTestProgram(node.__$ws_test);
        const childContext: IContext = {
            childrenStorage: context.childrenStorage,
            scope: context.scope,
            container,
            counters: context.counters
        };
        this.stack.push(AbstractNodeType.DIRECTIVE);
        visitAll(node.__$ws_consequent, this, childContext);
        this.stack.pop();
        node.__$ws_container = container;
        checkForTranslations(context.scope, node.__$ws_test);
    }

    /**
     * Visit conditional "else" node.
     * @param node {ElseNode} Concrete conditional "else" node.
     * @param context {IContext} Visitor context.
     */
    visitElse(node: Ast.ElseNode, context: IContext): void {
        const container = context.container.createContainer(ContainerType.CONDITIONAL);
        container.desc = '<ws:else>';
        container.isElse = true;
        if (node.__$ws_test !== null) {
            container.desc = `<ws:else> "${node.__$ws_test.string}"`;
            container.registerTestProgram(node.__$ws_test);
        }
        const childContext: IContext = {
            childrenStorage: context.childrenStorage,
            scope: context.scope,
            container,
            counters: context.counters
        };
        this.stack.push(AbstractNodeType.DIRECTIVE);
        visitAll(node.__$ws_consequent, this, childContext);
        this.stack.pop();
        node.__$ws_container = container;
        checkForTranslations(context.scope, node.__$ws_test);
    }

    /**
     * Visit "for" cycle node.
     * @param node {ForNode} Concrete "for" cycle node.
     * @param context {IContext} Visitor context.
     */
    visitFor(node: Ast.ForNode, context: IContext): void {
        const container = context.container.createContainer(ContainerType.CYCLE);
        container.desc = '<ws:for> aka for';
        const childContext: IContext = {
            childrenStorage: context.childrenStorage,
            scope: context.scope,
            container,
            counters: context.counters
        };
        if (node.__$ws_init) {
            container.registerProgram(node.__$ws_init, ProgramType.FLOAT, 'data');
        }
        container.registerProgram(node.__$ws_test, ProgramType.FLOAT, 'data');
        if (node.__$ws_update) {
            container.registerProgram(node.__$ws_update, ProgramType.FLOAT, 'data');
        }
        this.stack.push(AbstractNodeType.DIRECTIVE);
        visitAll(node.__$ws_content, this, childContext);
        this.stack.pop();
        node.__$ws_container = container;
        node.__$ws_uniqueIndex = context.counters.allocateCycleIndex();
        checkForTranslations(context.scope, node.__$ws_init);
        checkForTranslations(context.scope, node.__$ws_test);
        checkForTranslations(context.scope, node.__$ws_update);
    }

    /**
     * Visit "foreach" cycle node.
     * @param node {ForeachNode} Concrete "foreach" cycle node.
     * @param context {IContext} Visitor context.
     */
    visitForeach(node: Ast.ForeachNode, context: IContext): void {
        const container = context.container.createContainer(ContainerType.CYCLE);
        container.desc = '<ws:for> aka foreach';
        const childContext: IContext = {
            childrenStorage: context.childrenStorage,
            scope: context.scope,
            container,
            counters: context.counters
        };
        if (node.__$ws_index) {
            container.addIdentifier(node.__$ws_index.string);
        }
        container.addIdentifier(node.__$ws_iterator.string);
        container.registerProgram(node.__$ws_collection, ProgramType.SIMPLE, 'data');
        this.stack.push(AbstractNodeType.DIRECTIVE);
        visitAll(node.__$ws_content, this, childContext);
        this.stack.pop();
        node.__$ws_container = container;
        node.__$ws_uniqueIndex = context.counters.allocateCycleIndex();
        checkForTranslations(context.scope, node.__$ws_collection);
    }

    /**
     * Visit array data node.
     * @param node {ArrayNode} Concrete array data node.
     * @param context {IContext} Visitor context.
     */
    visitArray(node: Ast.ArrayNode, context: IContext): void {
        this.stack.push(AbstractNodeType.DATA_TYPE_DIRECTIVE);
        visitAll(node.__$ws_elements, this, context);
        this.stack.pop();
    }

    /**
     * Visit boolean data node.
     * @param node {BooleanNode} Concrete boolean data node.
     * @param context {IContext} Visitor context.
     */
    visitBoolean(node: Ast.BooleanNode, context: IContext): void {
        this.stack.push(AbstractNodeType.DATA_TYPE_DIRECTIVE);
        visitAll(node.__$ws_data, this, context);
        this.stack.pop();
    }

    /**
     * Visit function data node.
     * @param node {FunctionNode} Concrete function data node.
     * @param context {IContext} Visitor context.
     */
    visitFunction(node: Ast.FunctionNode, context: IContext): void {
        this.stack.push(AbstractNodeType.DATA_TYPE_DIRECTIVE);
        visitAllProperties(node.__$ws_options, this, context);
        visitAll(node.__$ws_functionExpression, this, context);
        this.stack.pop();
    }

    /**
     * Visit number data node.
     * @param node {NumberNode} Concrete number data node.
     * @param context {IContext} Visitor context.
     */
    visitNumber(node: Ast.NumberNode, context: IContext): void {
        this.stack.push(AbstractNodeType.DATA_TYPE_DIRECTIVE);
        visitAll(node.__$ws_data, this, context);
        this.stack.pop();
    }

    /**
     * Visit object data node.
     * @param node {ObjectNode} Concrete object data node.
     * @param context {IContext} Visitor context.
     */
    visitObject(node: Ast.ObjectNode, context: IContext): void {
        this.stack.push(AbstractNodeType.DATA_TYPE_DIRECTIVE);
        visitAllProperties(node.__$ws_properties, this, context);
        this.stack.pop();
    }

    /**
     * Visit string data node.
     * @param node {StringNode} Concrete string data node.
     * @param context {IContext} Visitor context.
     */
    visitString(node: Ast.StringNode, context: IContext): void {
        this.stack.push(AbstractNodeType.DATA_TYPE_DIRECTIVE);
        visitAll(node.__$ws_data, this, context);
        this.stack.pop();
    }

    /**
     * Visit value data node.
     * @param node {ValueNode} Concrete value data node.
     * @param context {IContext} Visitor context.
     */
    visitValue(node: Ast.ValueNode, context: IContext): void {
        this.stack.push(AbstractNodeType.DATA_TYPE_DIRECTIVE);
        visitAll(node.__$ws_data, this, context);
        this.stack.pop();
    }

    /**
     * Visit shared text node.
     * @param node {TextNode} Concrete shared text node.
     * @param context {IContext} Visitor context.
     */
    visitText(node: Ast.TextNode, context: IContext): void {
        this.stack.push(AbstractNodeType.TEXT);
        visitAll(node.__$ws_content, this, context);
        this.stack.pop();
    }

    /**
     * Visit text data node.
     * @param node {TextDataNode} Concrete text data node.
     * @param context {IContext} Visitor context.
     */
    visitTextData(node: Ast.TextDataNode, context: IContext): void { }

    /**
     * Visit mustache expression node.
     * @param node {ExpressionNode} Concrete mustache expression node.
     * @param context {IContext} Visitor context.
     */
    visitExpression(node: Ast.ExpressionNode, context: IContext): void {
        const programType = getProgramType(this.stack);
        const programName = programType === ProgramType.SIMPLE ? null : context.attributeName;
        context.container.registerProgram(node.__$ws_program, programType, programName);
        checkForTranslations(context.scope, node.__$ws_program);
    }

    /**
     * Visit translation node.
     * @param node {TranslationNode} Concrete translation node.
     * @param context {IContext} Visitor context.
     */
    visitTranslation(node: Ast.TranslationNode, context: IContext): void {
        // TODO: Collect translation keys on annotation stage.
        context.scope.setDetectedTranslation();
    }

    /**
     * Process component and ws:partial node.
     * @param node {BaseWasabyElement} Component and ws:partial node.
     * @param context {IContext} Visitor context.
     * @returns {Container} Container instance for processing node.
     * @private
     */
    private processComponent(node: Ast.BaseWasabyElement, context: IContext): Container {
        const name = getComponentName(node);
        if (name !== null) {
            context.childrenStorage.push(name);
        }
        const container = context.container.createContainer(ContainerType.COMPONENT);
        const childContext: IContext = {
            childrenStorage: context.childrenStorage,
            scope: context.scope,
            container,
            counters: context.counters
        };
        this.stack.push(AbstractNodeType.COMPONENT);
        visitAllProperties(node.__$ws_attributes, this, childContext);
        visitAllProperties(node.__$ws_events, this, childContext);
        visitAllProperties(node.__$ws_options, this, childContext);
        visitAllProperties(node.__$ws_contents, this, childContext);
        this.stack.pop();
        node.__$ws_container = container;
        return container;
    }
}